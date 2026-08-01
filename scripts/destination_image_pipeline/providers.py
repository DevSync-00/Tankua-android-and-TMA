from __future__ import annotations

import hashlib
import json
from html import unescape
from typing import Protocol

from .infrastructure import Http
from .models import Candidate, Destination

COMMONS = "https://commons.wikimedia.org/w/api.php"
WIKIDATA = "https://www.wikidata.org/w/api.php"
WIKIPEDIA = "https://en.wikipedia.org/w/api.php"


class Provider(Protocol):
    name: str
    async def search(self, destination: Destination, aliases: list[str]) -> list[Candidate]: ...


def commons_candidate(page: dict, source: str, query: str) -> Candidate | None:
    info = (page.get("imageinfo") or [{}])[0]; meta = info.get("extmetadata") or {}
    url = info.get("url")
    mime = str(info.get("mime") or "")
    if not url or not mime.startswith("image/") or mime in {"image/svg+xml","image/gif","image/vnd.djvu"}: return None
    clean = lambda x: unescape(meta.get(x, {}).get("value", "")).replace("<br>", " ")
    def number(key):
        try: return float(clean(key))
        except (TypeError,ValueError): return None
    return Candidate(source=source, title=page.get("title", "").removeprefix("File:"), image_url=url,
        original_source_url=info.get("descriptionurl", ""), license=clean("LicenseShortName") or "unknown",
        photographer=clean("Artist"), width=info.get("width"), height=info.get("height"), latitude=number("GPSLatitude"), longitude=number("GPSLongitude"), category_terms=[clean("Categories"),clean("ImageDescription")], query=query,
        source_id=str(page.get("pageid", "")), raw={"pageid": page.get("pageid")})


class WikimediaProvider:
    name = "wikimedia"
    def __init__(self, http: Http, maximum: int): self.http, self.maximum = http, maximum
    async def search(self, d: Destination, aliases: list[str]) -> list[Candidate]:
        result: list[Candidate] = []
        for query in aliases[:3]:
            data = await self.http.json(COMMONS, params={"action":"query","generator":"search","gsrsearch":f"{query} Ethiopia","gsrnamespace":"6","gsrlimit":str(self.maximum),"prop":"imageinfo","iiprop":"url|size|mime|extmetadata","format":"json","origin":"*","maxlag":"5"})
            for page in (data.get("query",{}).get("pages",{}) or {}).values():
                candidate = commons_candidate(page, self.name, query)
                if candidate: result.append(candidate)
        return result


class WikidataProvider:
    name = "wikidata"
    def __init__(self, http: Http, maximum: int): self.http, self.maximum = http, maximum
    async def search(self, d: Destination, aliases: list[str]) -> list[Candidate]:
        found: list[Candidate] = []
        query=min(aliases,key=lambda value:len(value.split()))
        data = await self.http.json(WIKIDATA, params={"action":"wbsearchentities","search":query,"language":"en","limit":str(self.maximum),"format":"json","origin":"*"})
        for entity in data.get("search", []):
            detail = await self.http.json(f"https://www.wikidata.org/wiki/Special:EntityData/{entity['id']}.json")
            claims = detail.get("entities",{}).get(entity["id"],{}).get("claims",{})
            p18 = claims.get("P18") or []
            if not p18: continue
            coordinate = None
            p625 = claims.get("P625") or []
            if p625:
                coordinate = p625[0].get("mainsnak",{}).get("datavalue",{}).get("value")
            filename = p18[0].get("mainsnak",{}).get("datavalue",{}).get("value")
            if not filename: continue
            cdata = await self.http.json(COMMONS, params={"action":"query","titles":f"File:{filename}","prop":"imageinfo","iiprop":"url|size|extmetadata","format":"json","origin":"*"})
            for page in cdata.get("query",{}).get("pages",{}).values():
                c = commons_candidate(page, self.name, query)
                if c:
                    c.title = entity.get("label", c.title)
                    c.category_terms = [entity.get("description", "")]
                    if coordinate:
                        c.latitude=coordinate.get("latitude"); c.longitude=coordinate.get("longitude")
                    found.append(c)
        return found


class WikipediaProvider:
    name = "wikipedia"
    def __init__(self, http: Http, maximum: int): self.http, self.maximum = http, maximum
    async def search(self, d: Destination, aliases: list[str]) -> list[Candidate]:
        query=min(aliases,key=lambda value:len(value.split()))
        data = await self.http.json(WIKIPEDIA, params={"action":"query","generator":"search","gsrsearch":query,"gsrlimit":str(self.maximum),"prop":"pageimages|coordinates|info","piprop":"original","inprop":"url","colimit":"max","format":"json","origin":"*"})
        out=[]
        for page in data.get("query",{}).get("pages",{}).values():
            image=(page.get("original") or {}).get("source")
            if not image: continue
            coord=(page.get("coordinates") or [{}])[0]
            out.append(Candidate(source=self.name,title=page.get("title",""),image_url=image,original_source_url=page.get("fullurl",""),license="see Wikimedia file page",latitude=coord.get("lat"),longitude=coord.get("lon"),query=query,source_id=str(page.get("pageid",""))))
        return out


class GooglePlacesProvider:
    name = "google_places"
    def __init__(self, http: Http, key: str, maximum: int): self.http, self.key, self.maximum = http, key, maximum
    async def search(self, d: Destination, aliases: list[str]) -> list[Candidate]:
        if not self.key: return []
        subject=min(aliases,key=lambda value:len(value.split()))
        context=", ".join(x for x in (d.city,d.region,"Ethiopia") if x)
        payload = {"textQuery": f"{subject}, {context}", "languageCode":"en", "regionCode":"ET", "pageSize":self.maximum}
        cache_key="google-post:"+hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest()
        data=self.http.cache.get(cache_key)
        if data is None:
            await self.http.limiter.wait()
            headers={"X-Goog-Api-Key":self.key,"X-Goog-FieldMask":"places.id,places.displayName,places.formattedAddress,places.location,places.photos,places.googleMapsUri"}
            async with self.http.session.post("https://places.googleapis.com/v1/places:searchText",json=payload,headers=headers) as r:
                if r.status >= 300:
                    raise RuntimeError(f"Google Places HTTP {r.status}: {(await r.text())[:500]}")
                data=await r.json(); self.http.cache.put(cache_key,data,604800)
        out=[]
        for place in data.get("places",[]):
            for photo in (place.get("photos") or [])[:1]:
                media=await self.http.json(f"https://places.googleapis.com/v1/{photo['name']}/media",params={"maxWidthPx":"1600","skipHttpRedirect":"true","key":self.key},ttl=86400)
                if media.get("photoUri"):
                    loc=place.get("location") or {}; attrs=photo.get("authorAttributions") or []
                    out.append(Candidate(source=self.name,title=(place.get("displayName") or {}).get("text",subject),image_url=media["photoUri"],original_source_url=place.get("googleMapsUri",""),license="Google Places terms",photographer=", ".join(x.get("displayName","") for x in attrs),width=photo.get("widthPx"),height=photo.get("heightPx"),latitude=loc.get("latitude"),longitude=loc.get("longitude"),query=subject,source_id=place.get("id","")))
        return out


class OpenStreetMapProvider:
    name = "openstreetmap"
    def __init__(self, http: Http, maximum: int): self.http, self.maximum = http, maximum
    async def search(self, d: Destination, aliases: list[str]) -> list[Candidate]:
        query=min(aliases,key=lambda value:len(value.split()))
        data=await self.http.json("https://nominatim.openstreetmap.org/search",params={"q":f"{query}, Ethiopia","format":"jsonv2","limit":str(self.maximum),"extratags":"1"},ttl=2592000)
        out=[]
        for item in data:
            qid=(item.get("extratags") or {}).get("wikidata")
            if not qid: continue
            wd=WikidataProvider(self.http,1)
            detail=await self.http.json(f"https://www.wikidata.org/wiki/Special:EntityData/{qid}.json")
            claims=detail.get("entities",{}).get(qid,{}).get("claims",{}); p18=claims.get("P18") or []
            if not p18: continue
            filename=p18[0].get("mainsnak",{}).get("datavalue",{}).get("value")
            cdata=await self.http.json(COMMONS,params={"action":"query","titles":f"File:{filename}","prop":"imageinfo","iiprop":"url|size|extmetadata","format":"json","origin":"*"})
            for page in cdata.get("query",{}).get("pages",{}).values():
                c=commons_candidate(page,self.name,query)
                if c: c.title=item.get("display_name",c.title); c.latitude=float(item["lat"]); c.longitude=float(item["lon"]); out.append(c)
        return out


class UnsplashProvider:
    name="unsplash"
    def __init__(self,http:Http,key:str,maximum:int): self.http,self.key,self.maximum=http,key,maximum
    async def search(self,d:Destination,aliases:list[str])->list[Candidate]:
        if not self.key:return []
        query=min(aliases,key=lambda value:len(value.split()))
        data=await self.http.json("https://api.unsplash.com/search/photos",params={"query":query,"per_page":str(self.maximum),"orientation":"landscape"},headers={"Authorization":f"Client-ID {self.key}"},ttl=86400)
        return [Candidate(source=self.name,title=x.get("alt_description") or x.get("description") or query,image_url=x.get("urls",{}).get("full",""),original_source_url=x.get("links",{}).get("html",""),license="Unsplash License",photographer=x.get("user",{}).get("name",""),width=x.get("width"),height=x.get("height"),query=query,source_id=x.get("id","")) for x in data.get("results",[]) if x.get("urls",{}).get("full")]


class FlickrProvider:
    name="flickr"
    def __init__(self,http:Http,key:str,maximum:int): self.http,self.key,self.maximum=http,key,maximum
    async def search(self,d:Destination,aliases:list[str])->list[Candidate]:
        if not self.key:return []
        query=min(aliases,key=lambda value:len(value.split()))
        data=await self.http.json("https://www.flickr.com/services/rest/",params={"method":"flickr.photos.search","api_key":self.key,"text":query,"license":"4,5,6,9,10","content_type":"1","media":"photos","extras":"url_o,url_l,owner_name,license,geo,o_dims","per_page":str(self.maximum),"format":"json","nojsoncallback":"1"},ttl=86400)
        licenses={"4":"CC BY 2.0","5":"CC BY-SA 2.0","6":"CC BY-ND 2.0","9":"CC0","10":"Public Domain"};out=[]
        for x in data.get("photos",{}).get("photo",[]):
            url=x.get("url_o") or x.get("url_l");
            if url: out.append(Candidate(source=self.name,title=x.get("title",""),image_url=url,original_source_url=f"https://www.flickr.com/photos/{x.get('owner')}/{x.get('id')}",license=licenses.get(str(x.get("license")),"unknown"),photographer=x.get("ownername",""),width=int(x.get("width_o") or x.get("width_l") or 0) or None,height=int(x.get("height_o") or x.get("height_l") or 0) or None,latitude=float(x["latitude"]) if x.get("latitude") else None,longitude=float(x["longitude"]) if x.get("longitude") else None,query=query,source_id=x.get("id","")))
        return out

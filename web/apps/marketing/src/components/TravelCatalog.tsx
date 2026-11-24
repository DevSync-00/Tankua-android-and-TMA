"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, CalendarDays, Grid2X2, List, MapPin, Search, Star } from "lucide-react";
import { formatCurrency, formatCurrencyTotals } from "@tankua/ui";
import { getDestinations, getTours } from "@/lib/queries";
import { formatDepartureDate } from "@/lib/departure-date";
import { FieldHero } from "./FieldHero";

const categories = [
  { id: "all", name: "All categories" },
  { id: "adventure", name: "Adventure" },
  { id: "cultural", name: "Culture" },
  { id: "nature", name: "Nature & wildlife" },
  { id: "historical", name: "History" },
  { id: "city", name: "City tours" },
  { id: "beach", name: "Beach & lake" },
];

const regions = ["Amhara", "Tigray", "Oromia", "SNNPR", "Addis Ababa", "Afar", "Harari"];

type Tour = Awaited<ReturnType<typeof getTours>>["tours"][number];
type Destination = Awaited<ReturnType<typeof getDestinations>>["destinations"][number];
type CatalogEntry = Tour | Destination;
type CatalogType = "tours" | "destinations";
type CatalogResults = { items: CatalogEntry[]; total: number; error: boolean };

const settings = {
  tours: {
    title: "Tours in Ethiopia",
    description: "Compare upcoming departures from local operators, from mountain treks to visits to historic towns.",
    image: "/lalibela.jpg",
    imageAlt: "The rock-hewn Church of Saint George in Lalibela, Ethiopia",
    singular: "tour",
  },
  destinations: {
    title: "Places to visit in Ethiopia",
    description: "Find the places you want to see, then check which tours go there.",
    image: "/bale.jpg",
    imageAlt: "Bale Mountains in Ethiopia",
    singular: "destination",
  },
};

function CatalogCard({ entry, listView, catalogHref }: { entry: CatalogEntry; listView: boolean; catalogHref: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const tour = "currency" in entry ? entry : null;
  const destination = "fares" in entry ? entry : null;
  const href = tour ? `/tours/${encodeURIComponent(tour.id)}` : `/tours?q=${encodeURIComponent(entry.name)}`;
  const fares = destination?.fares;
  const price = tour && tour.price !== null
    ? formatCurrency(tour.price, tour.currency)
    : fares && (fares.ETB !== undefined || fares.USD !== undefined)
      ? `From ${formatCurrencyTotals(fares)}`
      : null;
  const category = categories.find(({ id }) => id === entry.category)?.name;
  const tags = entry.tags.filter((tag) => tag.toLowerCase() !== entry.category.toLowerCase());

  return (
    <article className="field-card">
      <Link href={href} prefetch={false} onClick={(event) => {
        if (!tour || event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        try { sessionStorage.setItem("tankua-catalog-return", JSON.stringify([catalogHref, window.scrollY, tour.id])); } catch {}
      }} className="field-card-link">
        <div className="field-card-image">
          {imageFailed ? <MapPin size={28} aria-hidden="true" /> : (
            <Image
              src={entry.image}
              alt=""
              fill
              sizes={listView ? "(max-width: 639px) 100vw, 320px" : "(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 390px"}
              unoptimized={entry.image.startsWith("http")}
              onError={() => setImageFailed(true)}
            />
          )}
        </div>
        <div className="field-card-body">
          <h3>{entry.name}</h3>
          <p className="field-card-meta">
            <span><MapPin size={15} aria-hidden="true" />{entry.location}</span>
            {category && <span>{category}</span>}
          </p>
          {tour?.departureDate && <p className="field-card-meta"><span><CalendarDays size={15} aria-hidden="true" /><time dateTime={tour.departureDate}>{formatDepartureDate(tour.departureDate)}</time></span></p>}
          {entry.description && <p className="field-card-description">{entry.description}</p>}
          {tags.length > 0 && <p className="field-card-tags">{(listView ? tags : tags.slice(0, 2)).join(" · ")}</p>}
          {tour?.providerReviews && (
            <p className="field-card-rating">
              <Star size={15} aria-hidden="true" />
              <strong>{tour.providerReviews.rating.toFixed(1)}</strong>
              <span>({tour.providerReviews.count} provider {tour.providerReviews.count === 1 ? "review" : "reviews"})</span>
            </p>
          )}
          {tour?.interest && (
            <p className="field-card-interest">Planned departure</p>
          )}
          <div className="field-card-end">
            {price && <p><strong>{price}</strong> <span>per person</span></p>}
            <span className="field-card-action">{tour ? "View tour" : "Find tours"}<ArrowRight size={17} aria-hidden="true" /></span>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function TravelCatalog({ type, initialQuery = "", initialCategory = "all", initialRegion = "", initialListView = false, initialResults }: {
  type: CatalogType;
  initialQuery?: string;
  initialCategory?: string;
  initialRegion?: string;
  initialListView?: boolean;
  initialResults?: CatalogResults;
}) {
  const [search, setSearch] = useState(initialQuery);
  const [region, setRegion] = useState(initialRegion);
  const [category, setCategory] = useState(initialCategory);
  const [listView, setListView] = useState(initialListView);
  const [items, setItems] = useState<CatalogEntry[]>(initialResults?.items ?? []);
  const [total, setTotal] = useState(initialResults?.total ?? 0);
  const [pending, setPending] = useState(initialResults === undefined);
  const [failed, setFailed] = useState(initialResults?.error ?? false);
  const [attempt, setAttempt] = useState(0);
  const loadedRequest = useRef(initialResults ? {
    type, search: initialQuery, category: initialCategory, region: initialRegion, attempt: 0,
  } : null);
  const config = settings[type];
  const hasFilters = Boolean(search || region || category !== "all");
  const restored = useRef(false);
  const filters = new URLSearchParams();
  if (search) filters.set("q", search);
  if (category !== "all") filters.set("category", category);
  if (region) filters.set("region", region);
  if (listView) filters.set("view", "list");
  const catalogHref = "/" + type + (filters.size ? "?" + filters : "");

  useEffect(() => {
    if (type !== "tours") return;
    const url = new URL(window.location.href);
    if (url.pathname + url.search !== catalogHref) window.history.replaceState(window.history.state, "", catalogHref + url.hash);
  }, [catalogHref, type]);

  useEffect(() => {
    if (restored.current || pending || failed) return;
    restored.current = true;
    try {
      const [href, scroll]: [string, number] = JSON.parse(sessionStorage.getItem("tankua-catalog-return") || "[]");
      if (href !== catalogHref || !Number.isFinite(scroll)) return;
      sessionStorage.removeItem("tankua-catalog-return");
      requestAnimationFrame(() => window.scrollTo({ top: scroll, behavior: "instant" }));
    } catch {}
  }, [catalogHref, failed, pending]);

  useEffect(() => {
    const loaded = loadedRequest.current;
    if (loaded?.type === type && loaded.search === search && loaded.category === category && loaded.region === region && loaded.attempt === attempt) {
      setPending(false);
      return;
    }

    let ignore = false;
    setPending(true);

    const timeout = window.setTimeout(async () => {
      const options = {
        search: search.trim() || undefined,
        category: category === "all" ? undefined : category,
        region: region || undefined,
        limit: 50,
      };
      const result = type === "tours" ? await getTours(options) : await getDestinations(options);
      if (ignore) return;
      loadedRequest.current = { type, search, category, region, attempt };
      setItems("tours" in result ? result.tours : result.destinations);
      setTotal(result.total);
      setFailed(result.error);
      setPending(false);
    }, 180);

    return () => {
      ignore = true;
      window.clearTimeout(timeout);
    };
  }, [attempt, category, region, search, type]);

  function clearFilters() {
    setSearch("");
    setRegion("");
    setCategory("all");
  }

  const resultLabel = items.length === 1 ? config.singular : type;

  return (
    <main className="field-page">
      <FieldHero {...config}>
        <a href="#catalog" className="field-button field-button--light">Browse {type}<ArrowDown size={17} aria-hidden="true" /></a>
      </FieldHero>
      <section className="field-wrap field-catalog" id="catalog" aria-labelledby="catalog-heading">
        <div className="field-catalog-heading">
          <h2 id="catalog-heading" className="field-display">{type === "tours" ? "Upcoming tours" : "Destination directory"}</h2>
          <Link href={type === "tours" ? "/destinations" : "/tours"} className="field-link">
            {type === "tours" ? "Browse destinations" : "Browse tours"}<ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>

        <div className="field-filters" role="search" aria-label={`Filter ${type}`}>
          <label className="field-search">
            <span>Search {type}</span>
            <span className="field-search-control">
              <Search size={19} aria-hidden="true" />
              <input type="search" placeholder="Enter a place or keyword" value={search} onChange={(event) => setSearch(event.target.value)} />
            </span>
          </label>
          <label>
            <span id={`${type}-region-label`}>Region</span>
            <select aria-labelledby={`${type}-region-label`} value={region} onChange={(event) => setRegion(event.target.value)}>
              <option value="">All regions</option>
              {regions.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label>
            <span id={`${type}-category-label`}>Category</span>
            <select aria-labelledby={`${type}-category-label`} value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              {!categories.some(({ id }) => id === category) && <option value={category}>{category}</option>}
            </select>
          </label>
        </div>

        <div className="field-results-bar">
          <p role="status">
            {pending ? `Loading ${type}…` : failed ? `Couldn’t load ${type}` : total > items.length
              ? `Showing ${items.length} of ${total} ${type}`
              : `${items.length} ${resultLabel}`}
          </p>
          <div className="field-result-actions">
            {hasFilters && <button type="button" className="field-link" onClick={clearFilters}>Clear filters</button>}
            <div className="field-view-toggle" role="group" aria-label="Results layout">
              <button type="button" onClick={() => setListView(false)} aria-label="Grid view" aria-pressed={!listView}><Grid2X2 size={17} aria-hidden="true" /></button>
              <button type="button" onClick={() => setListView(true)} aria-label="List view" aria-pressed={listView}><List size={19} aria-hidden="true" /></button>
            </div>
          </div>
        </div>

        <div aria-busy={pending}>
          {pending && items.length === 0 ? (
            <div className={`field-cards${listView ? " field-cards--list" : ""}`} aria-hidden="true">
              {[0, 1, 2].map((key) => <div key={key} className="field-card-skeleton" />)}
            </div>
          ) : failed && !pending ? (
            <div className="field-empty">
              <p>There was a problem loading the directory. Try again to refresh the results.</p>
              <button type="button" className="field-button" onClick={() => setAttempt((value) => value + 1)}>Try again</button>
            </div>
          ) : items.length === 0 ? (
            <div className="field-empty">
              <p>{hasFilters ? `No ${type} match these filters. Try a different place or category.` : `There are no ${type} to show right now.`}</p>
              {hasFilters && <button type="button" className="field-button" onClick={clearFilters}>Clear filters</button>}
            </div>
          ) : (
            <div className={`field-cards${listView ? " field-cards--list" : ""}`}>
              {items.map((entry) => <CatalogCard key={`${entry.id}-${entry.image}`} entry={entry} listView={listView} catalogHref={catalogHref} />)}
            </div>
          )}
        </div>
      </section>
      <section className="field-band">
        <div className="field-wrap field-band-inner">
          <div>
            <h2 className="field-display">Book on the Tankua app</h2>
            <p>Find a departure, reserve your seat, and keep your ticket on your phone.</p>
          </div>
          <Link href="/download" className="field-button field-button--light">Download the app<ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </section>
    </main>
  );
}

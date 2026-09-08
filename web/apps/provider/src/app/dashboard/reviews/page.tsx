"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, MessageSquare, RefreshCw } from "lucide-react";
import { Header } from "@/components/header";
import { Card, Button, Avatar, InlineBanner } from "@tankua/ui";
import { getProviderReviews, respondToReview, type ProviderReview } from "@/lib/queries";

export default function ReviewsPage() {
  const router = useRouter();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ProviderReview[]>([]);
  const [ratingFilter, setRatingFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState<ProviderReview | null>(null);
  const [response, setResponse] = useState("");
  const [banner, setBanner] = useState<{message:string;variant:"success"|"error"}|null>(null);

  const load = async (id: string) => { setLoading(true); try { setReviews(await getProviderReviews(id)); } catch (error) { setBanner({message:error instanceof Error?error.message:"Could not load reviews.",variant:"error"}); } finally { setLoading(false); } };
  useEffect(() => { try { const stored=JSON.parse(localStorage.getItem("provider_user")||"{}"); const id=stored.provider_id||stored.provider?.id; if(!id)return router.replace("/login"); setProviderId(id); load(id); } catch { router.replace("/login"); } }, [router]);

  const filtered = reviews.filter((review) => ratingFilter === "all" || review.rating === Number(ratingFilter));
  const stats = useMemo(() => ({ average: reviews.length ? reviews.reduce((sum,review)=>sum+review.rating,0)/reviews.length : 0, distribution:[5,4,3,2,1].map(stars=>({stars,count:reviews.filter(review=>review.rating===stars).length})) }), [reviews]);
  const submitResponse = async (event: React.FormEvent) => { event.preventDefault(); if(!replying)return; const result=await respondToReview(replying.id,response.trim()); if(!result.success)return setBanner({message:result.error||"Could not save response.",variant:"error"}); setReplying(null);setResponse("");setBanner({message:"Response published.",variant:"success"});if(providerId)load(providerId); };

  return <div className="min-h-screen"><Header title="Reviews" subtitle={loading?"Loading reviews...":`${reviews.length} customer reviews`} actions={<Button size="sm" variant="outline" isLoading={loading} onClick={()=>providerId&&load(providerId)} leftIcon={<RefreshCw className="h-4 w-4"/>}>Refresh</Button>}/><div className="portal-content">
    {banner&&<InlineBanner message={banner.message} variant={banner.variant} onDismiss={()=>setBanner(null)}/>}
    <div className="grid gap-6 lg:grid-cols-3"><Card className="p-6 text-center"><div className="flex items-center justify-center gap-2"><span className="text-5xl font-bold">{stats.average.toFixed(1)}</span><Star className="h-8 w-8 fill-amber-400 text-amber-400"/></div><p className="mt-2 text-muted-foreground">Based on {reviews.length} reviews</p></Card><Card className="p-6 lg:col-span-2"><h3 className="mb-4 font-semibold">Rating distribution</h3><div className="space-y-3">{stats.distribution.map(item=><div key={item.stars} className="flex items-center gap-3"><span className="w-12 text-sm">{item.stars} ★</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-amber-400" style={{width:`${reviews.length?(item.count/reviews.length)*100:0}%`}}/></div><span className="w-8 text-sm text-muted-foreground">{item.count}</span></div>)}</div></Card></div>
    <select value={ratingFilter} onChange={event=>setRatingFilter(event.target.value)} className="h-10 rounded-xl border bg-background px-4 text-sm"><option value="all">All ratings</option>{[5,4,3,2,1].map(value=><option key={value} value={value}>{value} stars</option>)}</select>
    {!loading&&!filtered.length&&<Card className="p-10 text-center text-muted-foreground">No reviews found.</Card>}
    <div className="space-y-4">{filtered.map(review=><Card key={review.id} className="p-6"><div className="flex items-start gap-4"><Avatar name={review.customer} size="md"/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{review.customer}</p><p className="text-sm text-muted-foreground">{review.trip} · {new Date(review.created_at).toLocaleDateString()}</p></div><div className="flex">{[0,1,2,3,4].map(index=><Star key={index} className={`h-4 w-4 ${index<review.rating?"fill-amber-400 text-amber-400":"text-muted"}`}/>)}</div></div><p className="my-4 text-muted-foreground">{review.comment||"No written comment."}</p>{review.provider_response&&<div className="mb-3 rounded-xl bg-primary/5 p-4 text-sm"><b>Your response</b><p className="mt-1 text-muted-foreground">{review.provider_response}</p></div>}<Button variant="ghost" size="sm" onClick={()=>{setReplying(review);setResponse(review.provider_response||"");}} leftIcon={<MessageSquare className="h-4 w-4"/>}>{review.provider_response?"Edit response":"Reply"}</Button></div></div></Card>)}</div>
  </div>{replying&&<div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4" onClick={()=>setReplying(null)}><Card className="w-full max-w-lg" onClick={event=>event.stopPropagation()}><h2 className="text-xl font-bold">Respond to {replying.customer}</h2><p className="mt-1 text-sm text-muted-foreground">Your response will be visible to travelers.</p><form onSubmit={submitResponse} className="mt-5 space-y-4"><textarea required rows={5} value={response} onChange={event=>setResponse(event.target.value)} className="w-full rounded-xl border p-3 outline-none focus:border-primary"/><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>setReplying(null)}>Cancel</Button><Button type="submit">Publish response</Button></div></form></Card></div>}</div>;
}

"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Building2, Camera, Save } from "lucide-react";
import { Header } from "@/components/header";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@tankua/ui";
import { supabase } from "@/lib/supabase";

type ProviderProfile = {
  id: string; name: string; description: string | null; phone: string | null;
  email: string | null; logo_url: string | null;
};

export default function SettingsPage() {
  const inputRef=useRef<HTMLInputElement>(null);
  const [provider,setProvider]=useState<ProviderProfile|null>(null);
  const [form,setForm]=useState({name:"",description:"",phone:"",email:""});
  const [logoFile,setLogoFile]=useState<File|null>(null);
  const [preview,setPreview]=useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  useEffect(()=>{
    const stored=localStorage.getItem("provider_user");
    if(!stored){setError("Please sign in again.");setLoading(false);return;}
    const parsed=JSON.parse(stored);
    const providerId=parsed?.provider_id||parsed?.provider?.id;
    if(!providerId){setError("Provider account not found.");setLoading(false);return;}
    void (async () => {
      try {
        const { data, error } = await supabase.from("providers").select("id,name,description,phone,email,logo_url").eq("id",providerId).single();
        if(error){setError(error.message);return;}
        const profile=data as ProviderProfile; setProvider(profile);
        setForm({name:profile.name||"",description:profile.description||"",phone:profile.phone||"",email:profile.email||""});
        setPreview(profile.logo_url||"");
      } finally {
        setLoading(false);
      }
    })();
  },[]);

  function chooseLogo(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0]; if(!file)return;
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)){setError("Use a JPG, PNG, or WebP image.");return;}
    if(file.size>2*1024*1024){setError("Logo must be 2MB or smaller.");return;}
    setError(""); setLogoFile(file); setPreview(URL.createObjectURL(file));
  }

  async function save(event:FormEvent){
    event.preventDefault(); if(!provider)return; setSaving(true); setError(""); setMessage("");
    let logoUrl=provider.logo_url;
    if(logoFile){
      const extension=logoFile.name.split(".").pop()?.toLowerCase()||"png";
      const path=`${provider.id}/profile-${Date.now()}.${extension}`;
      const upload=await supabase.storage.from("provider-logos").upload(path,logoFile,{upsert:true,cacheControl:"3600"});
      if(upload.error){setError(upload.error.message);setSaving(false);return;}
      logoUrl=supabase.storage.from("provider-logos").getPublicUrl(path).data.publicUrl;
    }
    const update=await supabase.from("providers").update({
      name:form.name.trim(),description:form.description.trim()||null,phone:form.phone.trim()||null,
      email:form.email.trim()||null,logo_url:logoUrl,updated_at:new Date().toISOString(),
    }).eq("id",provider.id);
    if(update.error){setError(update.error.message);setSaving(false);return;}
    const stored=localStorage.getItem("provider_user");
    if(stored){const parsed=JSON.parse(stored);parsed.provider={...(parsed.provider||{}),...form,logo_url:logoUrl};localStorage.setItem("provider_user",JSON.stringify(parsed));}
    setProvider({...provider,...form,logo_url:logoUrl}); setLogoFile(null); setMessage("Provider profile saved.");
    setSaving(false);
  }

  return <div className="min-h-screen">
    <Header title="Provider Profile" subtitle="This information appears to travelers during booking"/>
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary"/>Company profile</CardTitle></CardHeader>
        <CardContent>{loading?<p>Loading profile…</p>:<form onSubmit={save} className="space-y-6">
          {error&&<div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
          {message&&<div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm">{message}</div>}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b">
            <div className="w-28 h-28 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center border">
              {preview?<img src={preview} alt="Provider logo" className="w-full h-full object-cover"/>:<Building2 className="h-10 w-10 text-primary"/>}
            </div>
            <div><input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseLogo} className="hidden"/>
              <Button type="button" variant="outline" size="sm" leftIcon={<Camera className="h-4 w-4"/>} onClick={()=>inputRef.current?.click()}>Choose profile image</Button>
              <p className="text-xs text-muted-foreground mt-2">Square JPG, PNG, or WebP. Maximum 2MB.</p>
              <p className="text-xs text-muted-foreground">Displayed on trip selection and provider details.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <label className="text-sm font-medium">Company name *<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-2 w-full px-4 py-3 rounded-xl border"/></label>
            <label className="text-sm font-medium">Phone<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="mt-2 w-full px-4 py-3 rounded-xl border"/></label>
            <label className="text-sm font-medium">Public email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="mt-2 w-full px-4 py-3 rounded-xl border"/></label>
            <label className="md:col-span-2 text-sm font-medium">Description<textarea rows={4} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="mt-2 w-full px-4 py-3 rounded-xl border resize-none" placeholder="Tell travelers about your company and experience."/></label>
          </div>
          <div className="flex justify-end"><Button type="submit" isLoading={saving} leftIcon={<Save className="h-4 w-4"/>}>Save profile</Button></div>
        </form>}</CardContent>
      </Card>
    </div>
  </div>;
}

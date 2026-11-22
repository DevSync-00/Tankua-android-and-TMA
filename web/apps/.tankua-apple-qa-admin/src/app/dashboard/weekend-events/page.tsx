"use client";

import { type ComponentPropsWithoutRef, type FormEvent, useEffect, useId, useRef, useState } from "react";
import { CalendarDays, Edit, Plus, RefreshCw } from "lucide-react";
import { Badge, Button, Card, InlineBanner, Input } from "@tankua/ui";
import { Header } from "@/components/header";
import { supabase } from "@/lib/supabase";

type EventFields = {
  slug: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  location: string;
  source_label: string;
  source_url: string;
  map_url: string | null;
  is_published: boolean;
};

type WeekendEvent = EventFields & { id: string };
type EventEditor = EventFields & { id?: string };

const newEvent: EventEditor = {
  slug: "",
  title: "",
  description: "",
  start_date: "",
  end_date: null,
  location: "",
  source_label: "",
  source_url: "",
  map_url: null,
  is_published: false,
};

const eventColumns = "id,slug,title,description,start_date,end_date,location,source_label,source_url,map_url,is_published";
const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function formatDate(date: string) {
  return dateFormat.format(new Date(`${date}T00:00:00Z`));
}

function isHttpsUrl(value: string) {
  if (!value.startsWith("https://")) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function slugFromTitle(title: string) {
  return title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96).replace(/-+$/, "");
}

function EventInput({ label, ...props }: ComponentPropsWithoutRef<"input"> & { label: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">{label}</label>
      <Input {...props} id={id} />
    </div>
  );
}

export default function WeekendEventsPage() {
  const [events, setEvents] = useState<WeekendEvent[]>([]);
  const [editor, setEditor] = useState<EventEditor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [banner, setBanner] = useState<{ message: string; variant: "success" | "error" } | null>(null);
  const [formError, setFormError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function loadEvents() {
    setLoading(true);
    const { data, error } = await supabase
      .from("weekend_events")
      .select(eventColumns)
      .order("start_date", { ascending: false })
      .order("title")
      .returns<WeekendEvent[]>();
    setLoadFailed(Boolean(error));
    if (error) {
      setBanner({
        variant: "error",
        message: error.code === "PGRST205"
          ? "Weekend Events will be available after the database migration is applied."
          : "Weekend events could not be loaded. Try refreshing.",
      });
    } else {
      setEvents(data);
      setBanner(null);
    }
    setLoading(false);
  }

  useEffect(() => { void loadEvents(); }, []);

  function editEvent(event: EventEditor) {
    setFormError("");
    setEditor(event);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ block: "start" }));
  }

  function changeField<Key extends keyof EventFields>(key: Key, value: EventFields[Key]) {
    setEditor((current) => current && { ...current, [key]: value });
  }

  async function saveEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || saving) return;

    const { id, ...fields } = editor;
    const values: EventFields = {
      ...fields,
      slug: fields.slug.trim() || slugFromTitle(fields.title),
      title: fields.title.trim(),
      description: fields.description.trim(),
      location: fields.location.trim(),
      source_label: fields.source_label.trim(),
      source_url: fields.source_url.trim(),
      map_url: fields.map_url?.trim() || null,
    };

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(values.slug)) {
      setFormError("Use a link slug made of lowercase letters, numbers and hyphens.");
      return;
    }
    if (values.end_date && values.end_date < values.start_date) {
      setFormError("The end date must be on or after the start date.");
      return;
    }
    if (!isHttpsUrl(values.source_url) || (values.map_url && !isHttpsUrl(values.map_url))) {
      setFormError("Enter a valid HTTPS link for the source and any map link.");
      return;
    }

    setFormError("");
    setSaving(true);
    const query = id
      ? supabase.from("weekend_events").update(values).eq("id", id)
      : supabase.from("weekend_events").insert(values);
    const { data, error } = await query.select(eventColumns).single<WeekendEvent>();
    setSaving(false);

    if (error) {
      setFormError(error.code === "23505"
        ? "Another event already uses that link slug."
        : "The event could not be saved. Check the dates and required fields and try again.");
      return;
    }

    setEvents((previous) => [...previous.filter((item) => item.id !== data.id), data].sort((a, b) =>
      b.start_date.localeCompare(a.start_date) || a.title.localeCompare(b.title)));
    setEditor(null);
    setBanner({ variant: "success", message: data.is_published ? "Event saved and published." : "Event saved as a draft." });
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Weekend Events"
        subtitle="Manage dated listings for This Weekend in Addis."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />}
              disabled={loading || saving} onClick={loadEvents}>Refresh</Button>
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} disabled={loading || saving || loadFailed}
              onClick={() => editEvent(newEvent)}>New event</Button>
          </div>
        )}
      />
      <div className="space-y-6 p-4 sm:p-6">
        {banner && <InlineBanner {...banner} onDismiss={() => setBanner(null)} />}

        {editor && (
          <Card className="max-w-3xl p-4 sm:p-6">
            <form ref={formRef} className="scroll-mt-6 space-y-4" onSubmit={saveEvent}>
              <h2 className="text-lg font-semibold">{editor.id ? "Edit event" : "New event"}</h2>
              {formError && <InlineBanner variant="error" message={formError} />}
              <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
                <EventInput label="Title" value={editor.title} onChange={(event) => changeField("title", event.target.value)}
                  required maxLength={160} />
                <EventInput label="Link slug (optional)" value={editor.slug} onChange={(event) => changeField("slug", event.target.value)}
                  maxLength={96} placeholder={slugFromTitle(editor.title) || "example-event"} />
                <label className="space-y-2 sm:col-span-2">
                  <span className="block text-sm font-medium">Description</span>
                  <textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm" rows={4}
                    value={editor.description} onChange={(event) => changeField("description", event.target.value)}
                    required maxLength={1000} />
                </label>
                <EventInput label="Start date (Addis time)" type="date" value={editor.start_date} max="9999-12-31"
                  onChange={(event) => changeField("start_date", event.target.value)} required />
                <EventInput label="End date (optional)" type="date" min={editor.start_date} max="9999-12-31" value={editor.end_date ?? ""}
                  onChange={(event) => changeField("end_date", event.target.value || null)} />
                <EventInput label="Venue or location" value={editor.location} maxLength={200}
                  onChange={(event) => changeField("location", event.target.value)} required />
                <EventInput label="Map link (optional)" type="url" value={editor.map_url ?? ""} maxLength={2048}
                  onChange={(event) => changeField("map_url", event.target.value || null)} />
                <EventInput label="Source name" value={editor.source_label} maxLength={120}
                  onChange={(event) => changeField("source_label", event.target.value)} required />
                <EventInput label="Source link" type="url" value={editor.source_url} maxLength={2048}
                  onChange={(event) => changeField("source_url", event.target.value)} required />
                <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
                  <input type="checkbox" checked={editor.is_published}
                    onChange={(event) => changeField("is_published", event.target.checked)} />
                  Publish to This Weekend in Addis
                </label>
              </fieldset>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save event"}</Button>
                <Button type="button" variant="outline" disabled={saving} onClick={() => setEditor(null)}>Cancel</Button>
              </div>
            </form>
          </Card>
        )}

        {loading ? <p className="text-sm text-muted-foreground" role="status">Loading events…</p> : null}
        {!loading && !loadFailed && events.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">No weekend events yet.</Card>
        ) : null}
        {!loading && !loadFailed && events.length > 0 ? (
          <ul className="grid gap-3 xl:grid-cols-2">
            {events.map((event) => (
              <li key={event.id}>
                <Card className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="break-words text-base font-semibold">{event.title}</h2>
                      <Badge variant={event.is_published ? "success" : "secondary"}>
                        {event.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {formatDate(event.start_date)}
                      {event.end_date && event.end_date !== event.start_date ? ` to ${formatDate(event.end_date)}` : ""}
                    </p>
                    <p className="break-words text-sm text-muted-foreground">{event.location}</p>
                  </div>
                  <Button variant="outline" size="sm" leftIcon={<Edit className="h-4 w-4" />}
                    disabled={saving} onClick={() => editEvent(event)}>Edit<span className="sr-only"> {event.title}</span></Button>
                </Card>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

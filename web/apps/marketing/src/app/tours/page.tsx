import { TravelCatalog } from "@/components/TravelCatalog";
import { getTours } from "@/lib/queries";

type Props = {
  searchParams: {
    q?: string | string[];
    category?: string | string[];
    region?: string | string[];
    view?: string | string[];
  };
};

export const dynamic = "force-dynamic";

export default async function ToursPage({ searchParams }: Props) {
  const query = typeof searchParams.q === "string" ? searchParams.q : "";
  const category = typeof searchParams.category === "string" && searchParams.category ? searchParams.category : "all";
  const region = typeof searchParams.region === "string" ? searchParams.region : "";
  const listView = searchParams.view === "list";
  const { tours, total, error } = await getTours({
    search: query.trim() || undefined,
    category: category === "all" ? undefined : category,
    region: region || undefined,
    limit: 50,
  });

  return (
    <TravelCatalog
      key={JSON.stringify([query, category, region, listView])}
      type="tours"
      initialQuery={query}
      initialCategory={category}
      initialRegion={region}
      initialListView={listView}
      initialResults={{ items: tours, total, error }}
    />
  );
}

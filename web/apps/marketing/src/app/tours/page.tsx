import { TravelCatalog } from "@/components/TravelCatalog";

type Props = {
  searchParams: {
    q?: string | string[];
    category?: string | string[];
    region?: string | string[];
    view?: string | string[];
  };
};

export default function ToursPage({ searchParams }: Props) {
  const query = typeof searchParams.q === "string" ? searchParams.q : "";
  const category = typeof searchParams.category === "string" && searchParams.category ? searchParams.category : "all";
  const region = typeof searchParams.region === "string" ? searchParams.region : "";
  const listView = searchParams.view === "list";
  return <TravelCatalog key={JSON.stringify([query, category, region, listView])} type="tours" initialQuery={query} initialCategory={category} initialRegion={region} initialListView={listView} />;
}

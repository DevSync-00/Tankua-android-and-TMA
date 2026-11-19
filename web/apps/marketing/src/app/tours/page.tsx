import { TravelCatalog } from "@/components/TravelCatalog";

type Props = {
  searchParams: {
    q?: string | string[];
    category?: string | string[];
  };
};

export default function ToursPage({ searchParams }: Props) {
  const query = typeof searchParams.q === "string" ? searchParams.q : "";
  const category = typeof searchParams.category === "string" && searchParams.category ? searchParams.category : "all";
  return <TravelCatalog key={JSON.stringify([query, category])} type="tours" initialQuery={query} initialCategory={category} />;
}

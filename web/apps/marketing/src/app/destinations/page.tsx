"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getDestinations } from "@/lib/queries";
import { 
  Search, 
  MapPin, 
  Filter, 
  Grid,
  List,
  ArrowRight,
} from "lucide-react";
import { Button, Card, Badge, formatCurrencyTotals } from "@tankua/ui";

const tourCategories = [
  { id: "all", name: "All Categories", icon: "≡ƒîì" },
  { id: "adventure", name: "Adventure Tours", icon: "≡ƒÅö∩╕Å" },
  { id: "cultural", name: "Cultural Tours", icon: "≡ƒÅ¢∩╕Å" },
  { id: "nature", name: "Nature & Wildlife", icon: "≡ƒªü" },
  { id: "historical", name: "Historical Sites", icon: "Γ¢¬" },
  { id: "city", name: "City Tours", icon: "≡ƒÅÖ∩╕Å" },
  { id: "beach", name: "Beach & Lake", icon: "≡ƒÅû∩╕Å" },
];

type Destination = Awaited<ReturnType<typeof getDestinations>>["destinations"][number];

const regions = ["All Regions", "Amhara", "Tigray", "Oromia", "SNNPR", "Addis Ababa", "Afar"];

export default function DestinationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [destinationsData, setDestinationsData] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);

    getDestinations({
      search: searchQuery || undefined,
      category: selectedCategory !== "all" ? selectedCategory : undefined,
      region: selectedRegion !== "All Regions" ? selectedRegion : undefined,
      limit: 50,
    }).then((result) => {
      if (ignore) return;
      setDestinationsData(result.destinations);
      setLoadError(result.error);
      setLoading(false);
    });

    return () => { ignore = true; };
  }, [searchQuery, selectedCategory, selectedRegion]);

  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffb800] to-[#ffc83d] flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-xl font-bold text-[#181714]">Tankua</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/about" className="text-[#181714]/70 hover:text-[#181714]">About</Link>
              <Link href="/how-it-works" className="text-[#181714]/70 hover:text-[#181714]">How It Works</Link>
              <Link href="/tours" className="text-[#181714]/70 hover:text-[#181714]">Tours</Link>
              <Link href="/destinations" className="text-[#ffb800] font-medium">Destinations</Link>
              <Link href="/providers" className="text-[#181714]/70 hover:text-[#181714]">For Providers</Link>
            </div>
            <Button>Download App</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-[#f7f5f0] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4">Explore</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-[#181714] mb-6">
              Discover Amazing 
              <span className="text-[#ffb800]"> Destinations</span>
            </h1>
            <p className="text-lg text-[#181714]/70">
              Explore destinations across Ethiopia, from adventure treks to cultural
              experiences, historical sites to wildlife safaris, and everything in between.
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-6 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {tourCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? "bg-[#ffb800] text-white border-[#ffb800]"
                    : "bg-white text-[#181714]/70 border-gray-200 hover:border-[#ffb800]"
                }`}
              >
                <span>{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b border-gray-100 sticky top-16 bg-white z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#181714]/40" />
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 focus:border-[#ffb800] focus:ring-2 focus:ring-[#ffb800]/20 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              {/* Region Filter */}
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="h-12 px-4 rounded-xl border border-gray-200 focus:border-[#ffb800] focus:ring-2 focus:ring-[#ffb800]/20 outline-none bg-white"
              >
                {regions.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>

              {/* View Toggle */}
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-3 ${viewMode === "grid" ? "bg-[#ffb800] text-white" : "hover:bg-gray-100"}`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-3 ${viewMode === "list" ? "bg-[#ffb800] text-white" : "hover:bg-gray-100"}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <p className="text-[#181714]/60">
              {loading ? (
                "Loading destinations..."
              ) : loadError ? null : (
                <>
              Showing <span className="font-semibold text-[#181714]">{destinationsData.length}</span> destinations
                </>
              )}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-[#181714]/60">
              Loading destinations...
            </div>
          ) : loadError ? (
            <p className="text-center py-12 text-[#181714]/60" role="status">Unable to load destinations right now.</p>
          ) : destinationsData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#181714]/60 mb-4">No destinations found matching your criteria.</p>
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                setSelectedRegion("All Regions");
                setSelectedCategory("all");
              }}>
                Clear Filters
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {destinationsData.map((destination) => (
                <Card key={destination.id} hoverable className="p-0 overflow-hidden group">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={destination.image}
                      alt={destination.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary" className="text-xs">
                        {tourCategories.find(c => c.id === destination.category)?.name || destination.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[#181714] mb-1 line-clamp-1">{destination.name}</h3>
                    <div className="flex items-center text-sm text-[#181714]/60 mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      {destination.location}
                    </div>
                    <p className="text-sm text-[#181714]/60 mb-3 line-clamp-2">{destination.description}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {destination.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {(destination.fares.ETB !== undefined || destination.fares.USD !== undefined) && (
                        <p className="text-sm text-[#181714]/60">
                          From <strong className="text-[#181714]">{formatCurrencyTotals(destination.fares)}</strong> per person
                        </p>
                      )}
                      <Link href={`/tours?q=${encodeURIComponent(destination.name)}`}>
                        <Button size="sm">Find tours</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {destinationsData.map((destination) => (
                <Card key={destination.id} hoverable className="p-0 overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="relative w-full md:w-64 h-48 md:h-auto overflow-hidden">
                      <Image
                        src={destination.image}
                        alt={destination.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">
                              {tourCategories.find(c => c.id === destination.category)?.name || destination.category}
                            </Badge>
                          </div>
                          <h3 className="text-xl font-semibold text-[#181714] mb-2">{destination.name}</h3>
                          <div className="flex items-center text-sm text-[#181714]/60 mb-3">
                            <MapPin className="h-4 w-4 mr-1" />
                            {destination.location}
                          </div>
                          <p className="text-[#181714]/60 mb-4">{destination.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {destination.tags.map((tag) => (
                              <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          {(destination.fares.ETB !== undefined || destination.fares.USD !== undefined) && (
                            <p className="mb-4 text-sm text-[#181714]/60">
                              From <strong className="text-[#181714]">{formatCurrencyTotals(destination.fares)}</strong> per person
                            </p>
                          )}
                          <Link href={`/tours?q=${encodeURIComponent(destination.name)}`}>
                            <Button>
                              Find tours
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#181714]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Explore?
          </h2>
          <p className="text-lg text-white/70 mb-8">
            Download the Tankua app to book tours, compare prices, and get instant digital tickets.
          </p>
          <Button size="lg" className="bg-[#ffb800] hover:bg-[#d99c00]">
            Download the App
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#181714] border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#ffb800] flex items-center justify-center">
                <span className="text-white font-bold">T</span>
              </div>
              <span className="text-white font-bold">Tankua</span>
            </div>
            <p className="text-white/50 text-sm">
              ┬⌐ {new Date().getFullYear()} Tankua. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}


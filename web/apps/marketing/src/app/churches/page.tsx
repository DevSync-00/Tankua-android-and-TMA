"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getDestinations } from "@/lib/queries";
import { 
  Search, 
  MapPin, 
  Star, 
  Filter, 
  ChevronDown,
  Grid,
  List,
  ArrowRight,
} from "lucide-react";
import { Button, Card, Badge } from "@tankua/ui";

const tourCategories = [
  { id: "all", name: "All Categories", icon: "🌍" },
  { id: "adventure", name: "Adventure Tours", icon: "🏔️" },
  { id: "cultural", name: "Cultural Tours", icon: "🏛️" },
  { id: "nature", name: "Nature & Wildlife", icon: "🦁" },
  { id: "historical", name: "Historical Sites", icon: "⛪" },
  { id: "city", name: "City Tours", icon: "🏙️" },
  { id: "beach", name: "Beach & Lake", icon: "🏖️" },
];

const destinations = [
  {
    id: 1,
    name: "Rock-Hewn Churches of Lalibela",
    location: "Lalibela, Amhara",
    region: "Amhara",
    category: "historical",
    image: "https://images.pexels.com/photos/12109950/pexels-photo-12109950.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    rating: 4.9,
    reviews: 2847,
    price: 1500,
    description: "Eleven medieval monolithic cave churches, carved from a single block of rock - a UNESCO World Heritage site.",
    tags: ["UNESCO", "Rock-hewn", "Historical"],
  },
  {
    id: 2,
    name: "Simien Mountains National Park",
    location: "Gondar, Amhara",
    region: "Amhara",
    category: "nature",
    image: "https://images.pexels.com/photos/32388046/pexels-photo-32388046.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    rating: 4.8,
    reviews: 1893,
    price: 2500,
    description: "Home to unique wildlife including the Ethiopian wolf and gelada baboons, with stunning alpine landscapes.",
    tags: ["Wildlife", "Trekking", "Nature"],
  },
  {
    id: 3,
    name: "Lake Tana & Blue Nile Falls",
    location: "Bahir Dar",
    region: "Amhara",
    category: "nature",
    image: "https://images.pexels.com/photos/12109950/pexels-photo-12109950.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    rating: 4.7,
    reviews: 1856,
    price: 1200,
    description: "Visit Ethiopia's largest lake with ancient monasteries and witness the spectacular Blue Nile Falls.",
    tags: ["Nature", "Waterfalls", "Monasteries"],
  },
  {
    id: 4,
    name: "Danakil Depression",
    location: "Afar Region",
    region: "Afar",
    category: "adventure",
    image: "https://images.pexels.com/photos/12258556/pexels-photo-12258556.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    rating: 4.9,
    reviews: 1245,
    price: 3500,
    description: "Journey to one of the hottest places on Earth, featuring active volcanoes, salt lakes, and unique geological formations.",
    tags: ["Extreme", "Volcano", "Desert"],
  },
  {
    id: 5,
    name: "Gondar Castles & Royal Enclosure",
    location: "Gondar",
    region: "Amhara",
    category: "historical",
    image: "https://images.pexels.com/photos/12109950/pexels-photo-12109950.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    rating: 4.8,
    reviews: 2341,
    price: 800,
    description: "Explore the 17th-century royal castles known as the 'Camelot of Africa' with stunning architecture.",
    tags: ["UNESCO", "Castles", "History"],
  },
  {
    id: 6,
    name: "Omo Valley Cultural Experience",
    location: "Jinka, SNNPR",
    region: "SNNPR",
    category: "cultural",
    image: "https://images.pexels.com/photos/33360960/pexels-photo-33360960.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    rating: 4.6,
    reviews: 892,
    price: 2800,
    description: "Immerse yourself in the rich cultures of Ethiopia's diverse ethnic groups in the Omo Valley.",
    tags: ["Cultural", "Tribes", "Photography"],
  },
  {
    id: 7,
    name: "Bale Mountains National Park",
    location: "Bale Zone, Oromia",
    region: "Oromia",
    category: "nature",
    image: "https://images.pexels.com/photos/32388046/pexels-photo-32388046.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    rating: 4.7,
    reviews: 1567,
    price: 2200,
    description: "Home to the Ethiopian wolf and other endemic species, with stunning alpine landscapes and diverse ecosystems.",
    tags: ["Wildlife", "Hiking", "Nature"],
  },
  {
    id: 8,
    name: "Addis Ababa City Tour",
    location: "Addis Ababa",
    region: "Addis Ababa",
    category: "city",
    image: "https://images.pexels.com/photos/33019023/pexels-photo-33019023.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop",
    rating: 4.5,
    reviews: 634,
    price: 500,
    description: "Discover the capital city's museums, markets, and cultural sites including the National Museum and Merkato.",
    tags: ["City", "Museums", "Shopping"],
  },
];

const regions = ["All Regions", "Amhara", "Tigray", "Oromia", "SNNPR", "Addis Ababa", "Afar"];

export default function DestinationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All Regions");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [destinationsData, setDestinationsData] = useState(destinations);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDestinations() {
      setLoading(true);
      try {
        const result = await getDestinations({
          search: searchQuery || undefined,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
          region: selectedRegion !== "All Regions" ? selectedRegion : undefined,
          limit: 50,
        });
        if (result.destinations.length > 0) {
          setDestinationsData(result.destinations);
        }
      } catch (error) {
        console.error("Error loading destinations:", error);
        // Keep default destinations on error
      } finally {
        setLoading(false);
      }
    }
    loadDestinations();
  }, [searchQuery, selectedCategory, selectedRegion]);

  const filteredDestinations = destinationsData.filter((destination) => {
    const matchesSearch = !searchQuery || 
      destination.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         destination.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         destination.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === "All Regions" || destination.region === selectedRegion;
    const matchesCategory = selectedCategory === "all" || destination.category === selectedCategory;
    return matchesSearch && matchesRegion && matchesCategory;
  });

  return (
    <main className="min-h-screen">

      {/* Hero */}
      <section className="pt-32 pb-12 bg-gradient-to-b from-[#F8F6F0] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4">Explore</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-[#0A1A2F] mb-6">
              Discover Amazing 
              <span className="text-[#D4A017]"> Destinations</span>
            </h1>
            <p className="text-lg text-[#0A1A2F]/70">
              Explore hundreds of destinations across Ethiopia - from adventure treks to cultural 
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
                    ? "bg-[#D4A017] text-white border-[#D4A017]"
                    : "bg-white text-[#0A1A2F]/70 border-gray-200 hover:border-[#D4A017]"
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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#0A1A2F]/40" />
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              {/* Region Filter */}
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="h-12 px-4 rounded-xl border border-gray-200 focus:border-[#D4A017] focus:ring-2 focus:ring-[#D4A017]/20 outline-none bg-white"
              >
                {regions.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>

              {/* View Toggle */}
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-3 ${viewMode === "grid" ? "bg-[#D4A017] text-white" : "hover:bg-gray-100"}`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-3 ${viewMode === "list" ? "bg-[#D4A017] text-white" : "hover:bg-gray-100"}`}
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
            <p className="text-[#0A1A2F]/60">
              {loading ? (
                "Loading destinations..."
              ) : (
                <>
              Showing <span className="font-semibold text-[#0A1A2F]">{filteredDestinations.length}</span> destinations
                </>
              )}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-[#0A1A2F]/60">
              Loading destinations...
            </div>
          ) : filteredDestinations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#0A1A2F]/60 mb-4">No destinations found matching your criteria.</p>
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
              {filteredDestinations.map((destination) => (
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
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-1 text-white mb-1">
                        <Star className="h-4 w-4 fill-[#D4A017] text-[#D4A017]" />
                        <span className="font-semibold">{destination.rating}</span>
                        <span className="text-sm opacity-80">({destination.reviews})</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[#0A1A2F] mb-1 line-clamp-1">{destination.name}</h3>
                    <div className="flex items-center text-sm text-[#0A1A2F]/60 mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      {destination.location}
                    </div>
                    <p className="text-sm text-[#0A1A2F]/60 mb-3 line-clamp-2">{destination.description}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {destination.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-[#D4A017]">{destination.price} ETB</span>
                        <span className="text-sm text-[#0A1A2F]/60"> /person</span>
                      </div>
                      <Link href={`/churches/${destination.id}`}>
                      <Button size="sm">Book Now</Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDestinations.map((destination) => (
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
                          <h3 className="text-xl font-semibold text-[#0A1A2F] mb-2">{destination.name}</h3>
                          <div className="flex items-center text-sm text-[#0A1A2F]/60 mb-3">
                            <MapPin className="h-4 w-4 mr-1" />
                            {destination.location}
                          </div>
                          <p className="text-[#0A1A2F]/60 mb-4">{destination.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {destination.tags.map((tag) => (
                              <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end mb-2">
                            <Star className="h-4 w-4 fill-[#D4A017] text-[#D4A017]" />
                            <span className="font-semibold">{destination.rating}</span>
                            <span className="text-sm text-[#0A1A2F]/60">({destination.reviews} reviews)</span>
                          </div>
                          <div className="mb-4">
                            <span className="text-2xl font-bold text-[#D4A017]">{destination.price} ETB</span>
                            <span className="text-[#0A1A2F]/60"> /person</span>
                          </div>
                          <Link href={`/churches/${destination.id}`}>
                          <Button>
                            Book Now
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
      <section className="py-20 bg-[#0A1A2F]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Explore?
          </h2>
          <p className="text-lg text-white/70 mb-8">
            Download the Tankua app to book tours, compare prices, and get instant digital tickets.
          </p>
          <Button size="lg" className="bg-[#D4A017] hover:bg-[#B8860B]">
            Download the App
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A1A2F] border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#D4A017] flex items-center justify-center">
                <span className="text-white font-bold">T</span>
              </div>
              <span className="text-white font-bold">Tankua</span>
            </div>
            <p className="text-white/50 text-sm">
              © {new Date().getFullYear()} BIT Labs Technologies. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}


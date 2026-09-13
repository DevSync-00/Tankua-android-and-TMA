"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  MapPin, 
  Star, 
  Calendar, 
  Users, 
  Clock,
  ArrowLeft,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { Button, Card, Badge } from "@tankua/ui";
import { getTourById } from "@/lib/queries";

export default function TourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tour, setTour] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTour() {
      if (!params.id || typeof params.id !== 'string') {
        setError("Invalid tour ID");
        setLoading(false);
        return;
      }

      try {
        const data = await getTourById(params.id);
        if (data) {
          setTour(data);
        } else {
          setError("Tour not found");
        }
      } catch (err) {
        console.error("Error loading tour:", err);
        setError("Failed to load tour details");
      } finally {
        setLoading(false);
      }
    }
    loadTour();
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="pt-32 pb-20 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffb800] mx-auto"></div>
          <p className="mt-4 text-[#181714]/60">Loading tour details...</p>
        </div>
      </main>
    );
  }

  if (error || !tour) {
    return (
      <main className="min-h-screen">
        <div className="pt-32 pb-20 text-center">
          <h1 className="text-3xl font-bold text-[#181714] mb-4">Tour Not Found</h1>
          <p className="text-[#181714]/60 mb-8">{error || "The tour you're looking for doesn't exist."}</p>
          <Link href="/tours">
            <Button>Browse All Tours</Button>
          </Link>
        </div>
      </main>
    );
  }

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
            <div className="flex items-center gap-4">
              <Link href="/tours">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Tours
                </Button>
              </Link>
              <Link href="/download">
                <Button size="sm">Download App</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Image */}
      <section className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-8">
            <Image
              src={tour.image || tour.images?.[0] || "https://images.pexels.com/photos/12109950/pexels-photo-12109950.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop"}
              alt={tour.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{tour.category}</Badge>
                <div className="flex items-center gap-1 text-white">
                  <Star className="h-4 w-4 fill-[#ffb800] text-[#ffb800]" />
                  <span className="font-semibold">{tour.rating}</span>
                  <span className="text-sm opacity-80">({tour.reviews} reviews)</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{tour.name}</h1>
              <div className="flex items-center gap-4 text-white/90">
                <div className="flex items-center gap-1">
                  <MapPin className="h-5 w-5" />
                  <span>{tour.location}</span>
                </div>
                {tour.provider && (
                  <div className="flex items-center gap-1">
                    <span>by</span>
                    <span className="font-semibold">{tour.provider.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-[#181714] mb-4">About This Tour</h2>
                <p className="text-[#181714]/70 leading-relaxed whitespace-pre-line">
                  {tour.description || "Experience an amazing journey through Ethiopia's beautiful destinations. This tour offers a perfect blend of adventure, culture, and natural beauty."}
                </p>
              </Card>

              <Card className="p-6">
                <h2 className="text-2xl font-bold text-[#181714] mb-4">What's Included</h2>
                <ul className="space-y-3">
                  {[
                    "Transportation in comfortable vehicle",
                    "Professional guide",
                    "All entrance fees",
                    "Bottled water",
                    "Trip insurance",
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-[#ffb800] flex-shrink-0" />
                      <span className="text-[#181714]/70">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {tour.provider && (
                <Card className="p-6">
                  <h2 className="text-2xl font-bold text-[#181714] mb-4">About the Provider</h2>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-xl bg-[#ffb800]/10 flex items-center justify-center text-[#ffb800] text-2xl font-bold">
                      {tour.provider.name?.[0] || "P"}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#181714] mb-1">{tour.provider.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-4 w-4 fill-[#ffb800] text-[#ffb800]" />
                        <span className="font-medium">{tour.provider.rating?.toFixed(1) || "4.5"}</span>
                        <span className="text-sm text-[#181714]/60">Verified Provider</span>
                      </div>
                      <p className="text-[#181714]/70 text-sm">
                        Trusted travel provider with excellent reviews and verified credentials.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Booking Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <div className="mb-6">
                  <div className="text-3xl font-bold text-[#ffb800] mb-1">
                    {tour.price} ETB
                  </div>
                  <div className="text-sm text-[#181714]/60">per person</div>
                </div>

                <div className="space-y-4 mb-6">
                  {tour.departureDate && (
                    <div className="flex items-center gap-3 text-[#181714]/70">
                      <Calendar className="h-5 w-5 text-[#ffb800]" />
                      <div>
                        <div className="text-sm font-medium">Departure Date</div>
                        <div className="text-sm">
                          {new Date(tour.departureDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[#181714]/70">
                    <Clock className="h-5 w-5 text-[#ffb800]" />
                    <div>
                      <div className="text-sm font-medium">Duration</div>
                      <div className="text-sm">Full Day Tour</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[#181714]/70">
                    <Users className="h-5 w-5 text-[#ffb800]" />
                    <div>
                      <div className="text-sm font-medium">Group Size</div>
                      <div className="text-sm">{tour.tripType || "Group Trip"}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link href="/download">
                    <Button className="w-full bg-[#ffb800] hover:bg-[#d99c00]" size="lg">
                      Book Now
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full" size="lg">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Tour
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-[#181714]/60 text-center">
                    Booking requires the Tankua mobile app. Download now to book this tour.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#181714]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Book This Tour?
          </h2>
          <p className="text-lg text-white/70 mb-8">
            Download the Tankua app to book this tour and get instant digital tickets.
          </p>
          <Link href="/download">
            <Button size="lg" className="bg-[#ffb800] hover:bg-[#d99c00]">
              Download the App
            </Button>
          </Link>
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
              © {new Date().getFullYear()} Tankua. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

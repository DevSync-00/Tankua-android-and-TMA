"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getFeaturedTours } from "@/lib/queries";
import { 
  MapPin, 
  Calendar, 
  Shield, 
  Smartphone, 
  Star, 
  ChevronRight, 
  Users,
  Clock,
  CreditCard,
  Menu,
  X,
  ArrowRight,
  CheckCircle2,
  Leaf,
  Mountain,
  Camera
} from "lucide-react";
import { Button, Card, Badge } from "@tankua/ui";

// Tour categories
const tourCategories = [
  {
    id: 1,
    name: "Adventure Tours",
    icon: <Mountain className="h-6 w-6" />,
    description: "Hiking, trekking, and outdoor adventures",
    count: 45,
  },
  {
    id: 2,
    name: "Cultural Tours",
    icon: <Camera className="h-6 w-6" />,
    description: "Explore Ethiopia's rich history and culture",
    count: 62,
  },
  {
    id: 3,
    name: "Nature & Wildlife",
    icon: <Leaf className="h-6 w-6" />,
    description: "National parks, wildlife safaris, and nature",
    count: 38,
  },
  {
    id: 4,
    name: "Historical Sites",
    icon: <MapPin className="h-6 w-6" />,
    description: "Ancient monuments, castles, and UNESCO heritage sites",
    count: 55,
  },
  {
    id: 5,
    name: "City Tours",
    icon: <MapPin className="h-6 w-6" />,
    description: "Urban exploration and city experiences",
    count: 28,
  },
  {
    id: 6,
    name: "Beach & Lake",
    icon: <MapPin className="h-6 w-6" />,
    description: "Lakes, beaches, and water activities",
    count: 22,
  },
];

// Featured tours data - Using local images
const featuredTours = [
  {
    id: 1,
    name: "Lalibela Rock-Hewn Heritage Tour",
    location: "Lalibela, Amhara",
    category: "Historical Sites",
    image: "/images/pexels-christian-alemu-127251395-30177512.jpg",
    rating: 4.9,
    reviews: 2847,
    price: 1500,
  },
  {
    id: 2,
    name: "Simien Mountains Trekking Adventure",
    location: "Gondar, Amhara",
    category: "Adventure Tours",
    image: "/images/pexels-amanuel-fiseha-1532137422-27247762.jpg",
    rating: 4.8,
    reviews: 1893,
    price: 2500,
  },
  {
    id: 3,
    name: "Lake Tana & Blue Nile Falls",
    location: "Bahir Dar",
    category: "Nature & Wildlife",
    image: "/images/pexels-fanuel-33019023.jpg",
    rating: 4.7,
    reviews: 1856,
    price: 1200,
  },
  {
    id: 4,
    name: "Danakil Depression Expedition",
    location: "Afar Region",
    category: "Adventure Tours",
    image: "/images/pexels-atypeek-12131129.jpg",
    rating: 4.9,
    reviews: 1245,
    price: 3500,
  },
];

const features = [
  {
    icon: <MapPin className="h-6 w-6" />,
    title: "Discover Amazing Destinations",
    description: "Explore hundreds of tours across Ethiopia - from adventure treks to cultural experiences.",
  },
  {
    icon: <Calendar className="h-6 w-6" />,
    title: "Easy Booking",
    description: "Book your perfect tour in minutes with our intuitive app and secure payment system.",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Verified Providers",
    description: "Travel with confidence using our network of vetted and experienced tour operators.",
  },
  {
    icon: <Smartphone className="h-6 w-6" />,
    title: "Digital Tickets",
    description: "Access your QR-coded tickets instantly on your phone - no printing needed.",
  },
];

const stats = [
  { value: "250+", label: "Tour Destinations" },
  { value: "50+", label: "Travel Providers" },
  { value: "15K+", label: "Happy Travelers" },
  { value: "4.9", label: "App Rating" },
];

const testimonials = [
  {
    name: "Yohannes T.",
    role: "Traveler from Addis Ababa",
    content: "Tankua made my trip to Lalibela absolutely seamless. The booking was easy, and the provider was excellent!",
    avatar: "Y",
    rating: 5,
  },
  {
    name: "Sara M.",
    role: "Tourist from Germany",
    content: "As a foreigner, I was worried about booking tours in Ethiopia. Tankua gave me peace of mind with verified providers.",
    avatar: "S",
    rating: 5,
  },
  {
    name: "Abebe K.",
    role: "Regular Traveler",
    content: "I've used Tankua for 5 trips now - from adventure tours to cultural experiences. The QR tickets and multiple payment options are game changers!",
    avatar: "A",
    rating: 5,
  },
];

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tours, setTours] = useState(featuredTours);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function loadTours() {
      try {
        const data = await getFeaturedTours(4);
        if (data.length > 0) {
          setTours(data);
        }
      } catch (error) {
        console.error("Error loading tours:", error);
        // Keep default tours on error
      } finally {
        setLoading(false);
      }
    }
    loadTours();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-[#FAF8F3]/95 backdrop-blur-lg shadow-md border-b border-[#FFB800]/20" : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFB800] flex items-center justify-center shadow-md overflow-hidden">
                <Image src="/favicon.png" alt="Tankua" width={28} height={28} className="object-contain" />
              </div>
              <span className="text-2xl font-bold text-[#4A3A2A]">Tankua</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/tours" className="text-sm font-medium text-[#4A3A2A]/70 hover:text-[#FFB800] transition-colors">
                Explore Tours
              </Link>
              <Link href="/providers" className="text-sm font-medium text-[#4A3A2A]/70 hover:text-[#FFB800] transition-colors">
              For Providers
              </Link>
              <Link href="/about" className="text-sm font-medium text-[#4A3A2A]/70 hover:text-[#FFB800] transition-colors">
              About
              </Link>
              <Link href="/contact" className="text-sm font-medium text-[#4A3A2A]/70 hover:text-[#FFB800] transition-colors">
                Contact
              </Link>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-[#4A3A2A]">
                Sign In
              </Button>
              </Link>
              <Link href="/download">
                <Button size="sm" className="bg-[#FFB800] hover:bg-[#E5A500] text-white font-semibold shadow-md">
                Download App
              </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 text-[#4A3A2A]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#FAF8F3] border-t border-[#FFB800]/20">
            <div className="px-4 py-6 space-y-4">
              <Link href="/tours" className="block text-sm font-medium text-[#4A3A2A]/70 hover:text-[#FFB800]">
                Explore Tours
              </Link>
              <Link href="/providers" className="block text-sm font-medium text-[#4A3A2A]/70 hover:text-[#FFB800]">
                For Providers
              </Link>
              <Link href="/about" className="block text-sm font-medium text-[#4A3A2A]/70 hover:text-[#FFB800]">
                About
              </Link>
              <Link href="/contact" className="block text-sm font-medium text-[#4A3A2A]/70 hover:text-[#FFB800]">
                Contact
              </Link>
              <div className="pt-4 border-t border-[#FFB800]/20 flex gap-4">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full border-[#FFB800]/40 text-[#4A3A2A] hover:bg-[#FFB800]/10">Sign In</Button>
                </Link>
                <Link href="/download" className="flex-1">
                  <Button className="w-full bg-[#FFB800] hover:bg-[#E5A500] text-white font-semibold">Download App</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen hero-natural natural-pattern pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-6 pb-32 overflow-x-hidden">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left content */}
            <div className="space-y-8">
              <Badge className="px-4 py-2 text-sm bg-[#FFB800]/15 text-[#C48900] border-[#FFB800]/30">
                #1 Tour & Travel Platform in Ethiopia
              </Badge>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#4A3A2A] leading-tight">
                Discover Ethiopia's{" "}
                <span className="text-gradient-natural">Natural Wonders</span>
              </h1>
              
              <p className="text-xl text-[#4A3A2A]/70 max-w-xl leading-relaxed">
                Book unforgettable tours and travel experiences - from adventure treks to cultural 
                explorations - with trusted local providers across Ethiopia.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="xl" className="bg-[#FFB800] hover:bg-[#E5A500] text-white font-semibold shadow-lg">
                  Download the App
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="outline" size="xl" className="border-[#FFB800]/40 text-[#4A3A2A] hover:bg-[#FFB800]/10">
                  Explore Tours
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 pt-8 border-t border-[#FFB800]/20">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl font-bold text-[#FFB800]">{stat.value}</div>
                    <div className="text-sm text-[#4A3A2A]/60">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right content - Hero Image */}
            <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] xl:h-[700px]">
              <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/beautiful-shot-building-near-forested-mountains.jpg"
                  alt="Ethiopian landscape"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#4A3A2A]/60 via-transparent to-transparent" />
              </div>
              {/* Natural accent elements - constrained within container */}
              <div className="absolute bottom-4 left-4 w-24 h-24 bg-[#FFB800]/25 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute top-4 right-4 w-32 h-32 bg-[#6B8E5A]/20 rounded-full blur-2xl pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Natural wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto fill-[#FAF8F3]">
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-[#FFB800]/15 text-[#C48900] border-[#FFB800]/30">Why Tankua</Badge>
            <h2 className="text-4xl font-bold text-[#4A3A2A] mb-4">
              Everything You Need for Your Perfect Tour
            </h2>
            <p className="text-lg text-[#4A3A2A]/60">
              From discovery to booking to travel, we've got you covered every step of the way.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                hoverable 
                className="text-center p-8 group natural-card"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFB800]/15 flex items-center justify-center text-[#FFB800] mb-6 group-hover:bg-[#FFB800] group-hover:text-white transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-[#4A3A2A] mb-3">{feature.title}</h3>
                <p className="text-[#4A3A2A]/60">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tour Categories Section */}
      <section className="py-24 bg-gradient-to-b from-white to-[#F5F1E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4 bg-[#FFB800]/15 text-[#C48900] border-[#FFB800]/30">Explore by Category</Badge>
            <h2 className="text-4xl font-bold text-[#4A3A2A] mb-4">
              Find Your Perfect Tour
            </h2>
            <p className="text-lg text-[#4A3A2A]/60">
              Browse tours by category and discover experiences that match your interests.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {tourCategories.map((category) => (
              <Card 
                key={category.id} 
                hoverable 
                className="p-6 group cursor-pointer natural-card"
              >
                <div className="flex items-start gap-4">
                  <div className="text-[#FFB800]">{category.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#4A3A2A] mb-1">{category.name}</h3>
                    <p className="text-sm text-[#4A3A2A]/60 mb-2">{category.description}</p>
                    <div className="text-sm font-medium text-[#FFB800]">{category.count} tours available</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#4A3A2A]/40 group-hover:text-[#FFB800] transition-all" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tours Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12">
            <div>
              <Badge className="mb-4 bg-[#FFB800]/15 text-[#C48900] border-[#FFB800]/30">Popular Tours</Badge>
              <h2 className="text-4xl font-bold text-[#4A3A2A]">
                Featured Destinations
              </h2>
            </div>
            <Link href="/tours">
              <Button variant="outline" className="mt-4 sm:mt-0 border-[#FFB800]/40 text-[#4A3A2A] hover:bg-[#FFB800]/10">
              View All Tours
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              <div className="col-span-4 text-center py-12 text-[#4A3A2A]/60">
                Loading tours...
              </div>
            ) : (
              tours.map((tour, index) => (
              <Card 
                key={tour.id} 
                hoverable 
                className="p-0 overflow-hidden group natural-card"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={tour.image}
                    alt={tour.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#4A3A2A]/70 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <Badge variant="secondary" className="text-xs bg-white/90 text-[#4A3A2A]">{tour.category}</Badge>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-1 text-white mb-1">
                      <Star className="h-4 w-4 fill-[#FFB800] text-[#FFB800]" />
                      <span className="font-semibold">{tour.rating}</span>
                      <span className="text-sm opacity-80">({tour.reviews})</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-[#4A3A2A] mb-1 line-clamp-1">{tour.name}</h3>
                  <div className="flex items-center text-sm text-[#4A3A2A]/60 mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    {tour.location}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-[#FFB800]">{tour.price} ETB</span>
                      <span className="text-sm text-[#4A3A2A]/60"> /person</span>
                    </div>
                    <Link href={`/tours/${tour.id}`}>
                      <Button size="sm" className="bg-[#FFB800] hover:bg-[#E5A500] text-white">Book</Button>
                    </Link>
                  </div>
                </div>
              </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-[#4A3A2A] relative overflow-hidden">
        <div className="absolute inset-0 natural-pattern opacity-5" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-[#FFB800]/20 text-[#C48900] border-[#FFB800]/30">How It Works</Badge>
            <h2 className="text-4xl font-bold text-white mb-4">
              Book Your Tour in 3 Simple Steps
            </h2>
            <p className="text-lg text-white/60">
              Planning your perfect trip has never been easier.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: <MapPin className="h-8 w-8" />,
                title: "Choose Your Destination",
                description: "Browse our collection of over 250 tours across Ethiopia and find the perfect experience for your adventure.",
              },
              {
                step: "02",
                icon: <Users className="h-8 w-8" />,
                title: "Select a Provider",
                description: "Pick from verified travel providers with ratings and reviews to ensure a quality experience.",
              },
              {
                step: "03",
                icon: <CreditCard className="h-8 w-8" />,
                title: "Book & Pay Securely",
                description: "Complete your booking with Chapa, Telebirr, or other payment methods and receive your QR ticket instantly.",
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="text-7xl font-bold text-[#FFB800]/10 absolute -top-4 -left-2">
                  {item.step}
                </div>
                <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="w-16 h-16 rounded-2xl bg-[#FFB800] flex items-center justify-center text-white mb-6">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-white/60">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-[#FAF8F3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4 bg-[#FFB800]/10 text-[#E5A500] border-[#FFB800]/20">Testimonials</Badge>
            <h2 className="text-4xl font-bold text-[#4A3A2A] mb-4">
              What Our Travelers Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} variant="bordered" className="p-8 natural-card">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-[#FFB800] text-[#FFB800]" />
                  ))}
                </div>
                <p className="text-[#4A3A2A]/70 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#FFB800] flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-[#4A3A2A]">{testimonial.name}</div>
                    <div className="text-sm text-[#4A3A2A]/60">{testimonial.role}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Provider CTA Section */}
      <section className="py-24 bg-gradient-to-r from-[#FFB800] to-[#E5A500] relative overflow-hidden">
        <div className="absolute inset-0 natural-pattern opacity-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-white/20 text-white border-white/30">For Travel Providers</Badge>
              <h2 className="text-4xl font-bold text-white">
                Grow Your Business with Tankua
              </h2>
              <p className="text-lg text-white/90">
                Join Ethiopia's fastest-growing tourism platform. Get access to thousands of travelers looking for amazing tour experiences.
              </p>
              <ul className="space-y-3">
                {[
                  "Access to 10,000+ active users",
                  "Easy booking management dashboard",
                  "Secure and fast payouts",
                  "Marketing support and promotion",
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                    <span className="text-white/90">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/providers">
                <Button size="lg" variant="secondary" className="mt-4 bg-white text-[#4A3A2A] hover:bg-[#FAF8F3]">
                Register Your Company
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              </Link>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-[#4A3A2A] flex items-center justify-center text-[#FFB800] text-2xl font-bold">
                    T
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-[#4A3A2A]">Provider Dashboard</div>
                    <div className="text-sm text-[#4A3A2A]/60">Manage your trips easily</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-[#6B8E5A]/10 rounded-xl">
                    <div>
                      <div className="font-semibold text-[#4A3A2A]">Today's Earnings</div>
                      <div className="text-2xl font-bold text-[#6B8E5A]">15,450 ETB</div>
                    </div>
                    <div className="text-[#6B8E5A] text-sm">+12%</div>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-[#FFB800]/10 rounded-xl">
                    <div>
                      <div className="font-semibold text-[#4A3A2A]">Active Bookings</div>
                      <div className="text-2xl font-bold text-[#4A3A2A]">23</div>
                    </div>
                    <div className="text-[#FFB800] text-sm">5 new today</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download CTA Section */}
      <section className="py-24 bg-[#4A3A2A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Begin Your Adventure?
            </h2>
            <p className="text-lg text-white/60 mb-8">
              Download Tankua now and start exploring Ethiopia's amazing destinations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://apps.apple.com/app/tankua" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button size="xl" className="bg-white text-[#4A3A2A] hover:bg-[#FAF8F3]">
                <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                App Store
              </Button>
              </a>
              <a 
                href="https://play.google.com/store/apps/details?id=com.tankua.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button size="xl" variant="outline" className="border-white text-white hover:bg-white hover:text-[#4A3A2A]">
                <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v17c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5zM16.5 12L6 3.5v17l10.5-8.5z"/>
                </svg>
                Google Play
              </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2A1F15] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#FFB800] flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-xl">T</span>
                </div>
                <span className="text-2xl font-bold text-white">Tankua</span>
              </Link>
              <p className="text-white/60 text-sm">
                Connecting travelers with amazing tour experiences across Ethiopia through trusted travel providers.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Explore</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/tours" className="text-white/60 hover:text-[#FFB800] text-sm transition-colors">
                    All Tours
                  </Link>
                </li>
                <li>
                  <Link href="/destinations" className="text-white/60 hover:text-[#FFB800] text-sm transition-colors">
                    Popular Destinations
                  </Link>
                </li>
                <li>
                  <Link href="/providers" className="text-white/60 hover:text-[#FFB800] text-sm transition-colors">
                    Travel Providers
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="text-white/60 hover:text-[#FFB800] text-sm transition-colors">
                    How It Works
                    </Link>
                  </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-white/60 hover:text-[#FFB800] text-sm transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-white/60 hover:text-[#FFB800] text-sm transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-white/60 hover:text-[#FFB800] text-sm transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/download" className="text-white/60 hover:text-[#FFB800] text-sm transition-colors">
                    Download App
                    </Link>
                  </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-white/60 hover:text-[#FFB800] text-sm transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-white/60 hover:text-[#FFB800] text-sm transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-white/60 hover:text-[#FFB800] text-sm transition-colors">
                    Help Center
                    </Link>
                  </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm">
              © 2024 Tankua. All rights reserved.
            </p>
            <div className="flex gap-4">
              {["Twitter", "Instagram", "Facebook", "YouTube"].map((social) => (
                <Link key={social} href="#" className="text-white/40 hover:text-[#FFB800] text-sm transition-colors">
                  {social}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

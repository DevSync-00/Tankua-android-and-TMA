import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "@tankua/ui/styles.css";
import "./globals.css";
import { MarketingNavbar } from "@/components/MarketingNavbar";
import { MarketingFooter } from "@/components/MarketingFooter";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tankua.co"),
  title: {
    default: "Ethiopia Tours & Local Travel Experiences | Tankua",
    template: "%s | Tankua",
  },
  description: "Discover and book Ethiopia tours with trusted local providers. Explore cultural journeys, historical sites, wildlife, trekking, and unforgettable destinations.",
  keywords: ["Ethiopia", "tours", "travel", "adventure", "cultural tours", "Lalibela", "Simien Mountains", "Danakil", "booking", "tourism"],
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Ethiopia Tours & Local Travel Experiences | Tankua",
    description: "Discover and book Ethiopia tours with trusted local providers.",
    url: "https://tankua.co",
    type: "website",
    locale: "en_US",
    siteName: "Tankua",
  },
  twitter: {
    card: "summary",
    title: "Ethiopia Tours & Local Travel Experiences | Tankua",
    description: "Discover and book Ethiopia tours with trusted local providers.",
  },
  alternates: { canonical: "/" },
  category: "travel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://tankua.co/#organization",
        name: "Tankua",
        url: "https://tankua.co",
        logo: "https://tankua.co/favicon.png",
        description: "A marketplace for discovering and booking tours across Ethiopia with trusted local travel providers.",
      },
      {
        "@type": "WebSite",
        "@id": "https://tankua.co/#website",
        url: "https://tankua.co",
        name: "Tankua",
        publisher: { "@id": "https://tankua.co/#organization" },
        potentialAction: {
          "@type": "SearchAction",
          target: "https://tankua.co/tours?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
        <MarketingNavbar />
        <div className="site-content">{children}</div>
        <MarketingFooter />
      </body>
    </html>
  );
}


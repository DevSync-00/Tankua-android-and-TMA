import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "@tankua/ui/styles.css";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Tankua - Discover Amazing Tours & Travel in Ethiopia",
  description: "Book unforgettable tours and travel experiences across Ethiopia. Explore adventure tours, cultural experiences, historical sites, wildlife safaris, and more with trusted travel providers.",
  keywords: ["Ethiopia", "tours", "travel", "adventure", "cultural tours", "Lalibela", "Simien Mountains", "Danakil", "booking", "tourism"],
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Tankua - Discover Amazing Tours & Travel in Ethiopia",
    description: "Book unforgettable tours and travel experiences across Ethiopia with trusted providers.",
    type: "website",
    locale: "en_US",
    siteName: "Tankua",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}


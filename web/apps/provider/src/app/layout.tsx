import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@tankua/ui/styles.css";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Tankua Provider Portal",
  description: "Manage your travel business with Tankua - bookings, drivers, vehicles, and earnings.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-background`}>
        {children}
      </body>
    </html>
  );
}


import type { Metadata } from "next";
import localFont from "next/font/local";
import "@tankua/ui/styles.css";
import "./globals.css";

const inter = localFont({
  src: "../../../../packages/ui/src/fonts/Inter-Latin.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
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
      <body className={`${inter.variable} provider-app bg-background antialiased`}>
        {children}
      </body>
    </html>
  );
}


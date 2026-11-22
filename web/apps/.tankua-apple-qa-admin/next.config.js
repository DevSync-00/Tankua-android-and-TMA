/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@tankua/ui"],
  async redirects() {
    return [
      { source: "/dashboard/churches", destination: "/dashboard/destinations", permanent: true },
      { source: "/dashboard/churches/:path*", destination: "/dashboard/destinations/:path*", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
};

module.exports = nextConfig;


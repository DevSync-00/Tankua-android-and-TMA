/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@tankua/ui"],
  async redirects() {
    return [
      { source: "/churches", destination: "/destinations", permanent: true },
      { source: "/churches/:path*", destination: "/destinations/:path*", permanent: true },
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
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
};

module.exports = nextConfig;


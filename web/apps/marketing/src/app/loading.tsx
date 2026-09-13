import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f7f5f0] to-white">
      <div className="text-center">
        <Image src="/favicon.png" alt="Tankua" width={64} height={64} className="mx-auto mb-4 rounded-2xl object-contain shadow-lg" priority />
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffb800] mx-auto"></div>
        <p className="mt-4 text-[#181714]/60">Loading...</p>
      </div>
    </div>
  );
}

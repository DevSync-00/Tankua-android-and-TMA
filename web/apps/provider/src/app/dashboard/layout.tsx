import { ProviderNavigation } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <a
        href="#provider-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-stone-950 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <ProviderNavigation>
        <main id="provider-content" tabIndex={-1} className="min-w-0 lg:ml-64">
          {children}
        </main>
      </ProviderNavigation>
    </div>
  );
}


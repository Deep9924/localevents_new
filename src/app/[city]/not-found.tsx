// app/[city]/not-found.tsx
import Link from "next/link";

export default function CityNotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-semibold mb-3">City not supported yet</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        We could not find this city in LocalEvents. 
        Try searching for another city or go back to the homepage.
      </p>
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to home
        </Link>
        <Link
          href="/cities"
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Browse all cities
        </Link>
      </div>
    </main>
  );
}
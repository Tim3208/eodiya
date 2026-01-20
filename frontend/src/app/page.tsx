import { Container } from "@/components/layout/Container";
import { LocationSearch } from "@/features/locations";
import { MapView } from "@/features/map";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Container className="py-12">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Sahmyook Navigator
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
            Campus wayfinding workspace
          </h1>
          <p className="max-w-2xl text-base text-slate-600">
            Start with search and map placeholders, then connect real data.
          </p>
        </header>
        <section className="mt-10 grid gap-8 lg:grid-cols-[360px_1fr]">
          <LocationSearch />
          <MapView />
        </section>
      </Container>
    </main>
  );
}

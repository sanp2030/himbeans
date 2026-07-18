import Link from "next/link";

export const metadata = {
  title: "Locations — HimBean",
  description: "Find the HimBean flagship café on Lantern Row, Kathmandu.",
};
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";

async function getLocations() {
  try {
    return await db.location.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  } catch {
    return [];
  }
}

export default async function LocationsPage() {
  const locations = await getLocations();
  return (
    <div className="mx-auto max-w-3xl px-6 pb-28 pt-40">
      <p className="eyebrow">Find us</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">Locations</h1>
      {locations.length === 0 ? (
        <div className="card mt-10 p-8">
          <h2 className="font-display text-2xl">Lantern Row Flagship</h2>
          <p className="mt-2 opacity-70">12 Lantern Row, Kathmandu · +977-1-555-0142</p>
          <p className="mt-1 text-sm opacity-55">Mon–Sat 7:00–21:00 · Sun 8:00–20:00</p>
        </div>
      ) : (
        <div className="mt-10 space-y-5">
          {locations.map((l) => (
            <div key={l.id} className="card p-8">
              <h2 className="font-display text-2xl">{l.name}</h2>
              <p className="mt-2 opacity-70">{l.address}, {l.city}</p>
            </div>
          ))}
        </div>
      )}
      <p className="mt-8 text-sm opacity-60">
        Want a table waiting? <Link href="/reservations" className="underline">Reserve ahead</Link>.
      </p>
    </div>
  );
}

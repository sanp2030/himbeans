import { ReservationForm } from "@/components/shop/ReservationForm";

export const metadata = {
  title: "Reserve a Table — HimBean",
  description: "Book a table at the HimBean flagship on Lantern Row, Kathmandu.",
};

export default function ReservationsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 pb-28 pt-40">
      <p className="eyebrow">Lantern Row flagship</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">Reserve a table.</h1>
      <p className="mt-5 opacity-75">
        For groups of six or more, or the window seats at sunrise — we hold tables for
        fifteen minutes past the reservation time.
      </p>
      <ReservationForm />
    </div>
  );
}

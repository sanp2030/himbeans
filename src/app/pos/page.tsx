import { PosBoard } from "@/components/pos/PosBoard";
import { LowStockStrip } from "@/components/pos/LowStockStrip";

export const metadata = { title: "POS", robots: { index: false } };

export default function PosPage() {
  return (
    <div className="ops px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow">HimBean Ops</p>
        <h1 className="mt-1 font-body text-3xl font-semibold tracking-tight">Drink queue</h1>
        <LowStockStrip />
        <PosBoard />
      </div>
    </div>
  );
}

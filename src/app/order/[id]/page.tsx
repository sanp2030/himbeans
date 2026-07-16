import { OrderTracker } from "@/components/order/OrderTracker";

export const metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-xl px-6 pb-24 pt-36">
      <OrderTracker orderId={id} />
    </div>
  );
}

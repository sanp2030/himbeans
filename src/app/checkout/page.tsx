import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-xl px-6 pb-24 pt-36">
      <p className="eyebrow">Almost there</p>
      <h1 className="mt-2 text-4xl">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}

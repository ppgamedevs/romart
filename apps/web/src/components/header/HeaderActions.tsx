import dynamic from "next/dynamic";

const CartDrawerButton = dynamic(() => import("@/components/cart/MiniCartButton"), { ssr: false });

export default function HeaderActions() {
  return (
    <div className="flex items-center gap-3">
      {/* alte acțiuni */}
      <CartDrawerButton />
    </div>
  );
}

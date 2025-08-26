import Link from "next/link";
import MiniCartButton from "@/components/cart/MiniCartButton";

export default function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            RomArt
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link href="/discover" className="text-sm hover:text-gray-600">
              Discover
            </Link>
            <Link href="/artists" className="text-sm hover:text-gray-600">
              Artists
            </Link>
            <Link href="/about" className="text-sm hover:text-gray-600">
              About
            </Link>
            
            {/* Mini Cart Button */}
            <MiniCartButton />
          </nav>
        </div>
      </div>
    </header>
  );
}

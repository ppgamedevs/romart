import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-fg">About</h3>
            <p className="text-sm text-muted">
              Art from Romania is the premier marketplace for discovering and collecting 
              original Romanian art, prints, and digital artworks from talented artists.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted hover:text-accent transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted hover:text-accent transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted hover:text-accent transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Help & Shipping */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-fg">Help & Shipping</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="#" className="hover:text-fg transition-colors">
                  How to buy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-fg transition-colors">
                  Shipping & delivery
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-fg transition-colors">
                  Returns & refunds
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-fg transition-colors">
                  Artwork care
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-fg transition-colors">
                  Contact support
                </Link>
              </li>
            </ul>
          </div>

          {/* For Artists */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-fg">For Artists</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="#" className="hover:text-fg transition-colors">
                  Sell your art
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-fg transition-colors">
                  Artist guidelines
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-fg transition-colors">
                  Commission rates
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-fg transition-colors">
                  Artist resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-fg">Legal</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="#" className="hover:text-fg transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-fg transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-fg transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-fg transition-colors">
                  Intellectual Property
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-xs text-muted">
              © {currentYear} Art from Romania. All rights reserved.
            </p>
            <p className="text-xs text-muted">
              Made with ❤️ in Romania
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

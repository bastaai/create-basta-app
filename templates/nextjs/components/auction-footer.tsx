import Link from "next/link"

export function AuctionFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-4 font-serif text-lg font-semibold">About</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="transition-colors hover:text-foreground">
                  Our Story
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-foreground">
                  Leadership
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-foreground">
                  Press
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-foreground">
                  Careers
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-serif text-lg font-semibold">Services</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="transition-colors hover:text-foreground">
                  Buying
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-foreground">
                  Selling
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-foreground">
                  Valuations
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-foreground">
                  Authentication
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-serif text-lg font-semibold">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="transition-colors hover:text-foreground">
                  Buyer's Guide
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-foreground">
                  Condition Reports
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-foreground">
                  Catalogues
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-foreground">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-serif text-lg font-semibold">Connect</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="transition-colors hover:text-foreground">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-foreground">
                  Locations
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-foreground">
                  Newsletter
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-foreground">
                  Social Media
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground md:flex-row">
          <p>© 2025 Prestige Auctions. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              Terms of Use
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              Cookie Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

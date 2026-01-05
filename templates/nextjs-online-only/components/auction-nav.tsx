"use client"

import Link from "next/link"
import { Search, User, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function AuctionNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground">
              <span className="font-serif text-lg font-bold">P</span>
            </div>
            <span className="font-serif text-xl font-semibold tracking-tight">PRESTIGE</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/" className="text-sm font-medium transition-opacity hover:opacity-60">
              Auctions
            </Link>
            <Link href="/departments" className="text-sm font-medium transition-opacity hover:opacity-60">
              Departments
            </Link>
            <Link href="#" className="text-sm font-medium transition-opacity hover:opacity-60">
              Services
            </Link>
            <Link href="#" className="text-sm font-medium transition-opacity hover:opacity-60">
              Stories
            </Link>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 lg:flex">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" placeholder="Search artworks, artists..." className="w-64 pl-9" />
              </div>
            </div>
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <User className="h-5 w-5" />
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-6 pt-8">
                  <Link href="/" className="text-lg font-medium">
                    Auctions
                  </Link>
                  <Link href="/departments" className="text-lg font-medium">
                    Departments
                  </Link>
                  <Link href="#" className="text-lg font-medium">
                    Services
                  </Link>
                  <Link href="#" className="text-lg font-medium">
                    Stories
                  </Link>
                  <div className="relative pt-4">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="search" placeholder="Search..." className="pl-9" />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}

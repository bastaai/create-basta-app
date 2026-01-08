"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Search, User, Menu, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function AuctionNav() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/", redirect: true })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const isLoading = status === "loading"
  const user = session?.user

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
            <Link href="/auctions" className="text-sm font-medium transition-opacity hover:opacity-60">
              Auctions
            </Link>
            <Link href="/departments" className="text-sm font-medium transition-opacity hover:opacity-60">
              Departments
            </Link>
            <Link href="/services" className="text-sm font-medium transition-opacity hover:opacity-60">
              Services
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
            {!isLoading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="hidden md:flex">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href="/login">
                    <Button variant="ghost" size="icon" className="hidden md:flex">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
              </>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-6 pt-8">
                  <Link href="/auctions" className="text-lg font-medium">
                    Auctions
                  </Link>
                  <Link href="/departments" className="text-lg font-medium">
                    Departments
                  </Link>
                  <Link href="/services" className="text-lg font-medium">
                    Services
                  </Link>
                  <div className="relative pt-4">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="search" placeholder="Search..." className="pl-9" />
                  </div>
                  <div className="border-t pt-4">
                    {user ? (
                      <div className="space-y-2">
                        <div className="px-2 py-1.5 text-sm font-medium">{user.name}</div>
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">{user.email}</div>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={handleLogout}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Log out
                        </Button>
                      </div>
                    ) : (
                      <Link href="/login">
                        <Button variant="ghost" className="w-full justify-start">
                          <User className="mr-2 h-4 w-4" />
                          Log in
                        </Button>
                      </Link>
                    )}
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

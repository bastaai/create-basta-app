"use client";

import { AuctionNav } from "@/components/auction-nav";
import { AuctionFooter } from "@/components/auction-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Calendar, Clock, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { DateTime } from "luxon";
import { clientApiSchema } from "@bastaai/basta-js";

export type Lot = {
  id: string;
  lotNumber: number;
  title: string | undefined;
  lowEstimate: number | null;
  highEstimate: number | null;
  image: string | undefined;
  currentBid: number | null;
  bidsCount: number | undefined;
};

export type Auction = {
  id: string;
  title: string | undefined;
  status: clientApiSchema.SaleStatus | undefined;
  location?: string | undefined;
  dates: {
    openDate: string | undefined;
    closingDate: string | undefined;
  };
  lots: Lot[];
};
export default function AuctionDetailPage({
  auctionDetails,
}: {
  auctionDetails: Auction;
}) {
  const allLots = auctionDetails.lots ?? [];
  const [lots, setLots] = useState(allLots.slice(0, 12));
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Filters
  const [sortBy, setSortBy] = useState("lotNumber");

  const observerTarget = useRef<HTMLDivElement>(null);

  // Filter and sort lots
  const getFilteredAndSortedLots = useCallback(() => {
    let filtered = [...allLots];

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "lotNumber":
          return a.lotNumber - b.lotNumber;
        case "lotNumberDesc":
          return b.lotNumber - a.lotNumber;
        // case "lowEstimate":
        //   return a.lowEstimate - b.lowEstimate;
        // case "highEstimate":
        //   return b.highEstimate - a.highEstimate;
        default:
          return 0;
      }
    });

    return filtered;
  }, [sortBy]);

  // Reset and apply filters
  useEffect(() => {
    const filtered = getFilteredAndSortedLots();
    setLots(filtered.slice(0, 12));
    setHasMore(filtered.length > 12);
  }, [sortBy, getFilteredAndSortedLots]);

  // Infinite scroll
  const loadMoreLots = useCallback(() => {
    if (loading || !hasMore) return;

    setLoading(true);
    setTimeout(() => {
      const filtered = getFilteredAndSortedLots();
      const currentLength = lots.length;
      const nextLots = filtered.slice(currentLength, currentLength + 12);

      if (nextLots.length === 0) {
        setHasMore(false);
      } else {
        setLots((prev) => [...prev, ...nextLots]);
        setHasMore(currentLength + nextLots.length < filtered.length);
      }
      setLoading(false);
    }, 500);
  }, [lots.length, loading, hasMore, getFilteredAndSortedLots]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreLots();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMoreLots]);

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <h3 className="mb-3 font-semibold">Sort By</h3>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lotNumber">Lot Number (Low to High)</SelectItem>
            <SelectItem value="lotNumberDesc">
              Lot Number (High to Low)
            </SelectItem>
            {/* <SelectItem value="lowEstimate">Estimate (Low to High)</SelectItem>
            <SelectItem value="highEstimate">Estimate (High to Low)</SelectItem> */}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const dt = auctionDetails.dates.openDate
    ? DateTime.fromISO(auctionDetails.dates.openDate)
    : undefined;
  return (
    <div className="min-h-screen">
      <AuctionNav />

      {/* Auction Header */}
      <section className="border-b border-border bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <Badge className="mb-4 bg-muted text-foreground">
                {auctionDetails?.status}
              </Badge>
              <h1 className="font-serif text-4xl font-bold md:text-5xl">
                {auctionDetails?.title}
              </h1>
              <div className="mt-6 flex flex-wrap gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{auctionDetails?.location} location todo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{dt ? dt.toFormat("dd LLL yyyy") : "TBA"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{dt ? dt.toFormat("HH:mm") : "TBA"}</span>
                </div>
              </div>
            </div>
            <div className="hidden flex-col gap-2 md:flex">
              <Button size="lg">Register to Bid</Button>
              <Button size="lg" variant="outline">
                Download Catalogue
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Lots Grid with Filters */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24">
              <FilterPanel />
            </div>
          </aside>

          {/* Lots Grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {lots.length} of {getFilteredAndSortedLots().length}{" "}
                lots
              </p>

              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="lg:hidden bg-transparent"
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterPanel />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {lots.map((lot) => (
                <Link
                  key={lot.id}
                  href={`/auction/${auctionDetails.id}/lot/${lot.id}`}
                >
                  <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={lot.image || "/placeholder.svg"}
                        alt={lot.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <Badge className="absolute left-4 top-4 bg-background/90 text-foreground">
                        Lot {lot.lotNumber}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="mt-1 font-serif text-base font-semibold leading-tight text-balance">
                        {lot.title}
                      </h3>
                      <div className="mt-4 border-t border-border pt-3">
                        {lot.lowEstimate && lot.highEstimate && (
                          <>
                            <p className="text-xs text-muted-foreground">
                              Estimate
                            </p>
                            <p className="font-semibold">
                              ${lot.lowEstimate.toLocaleString()} - $
                              {lot.highEstimate.toLocaleString()}
                            </p>
                          </>
                        )}
                        {lot.currentBid && (
                          <p className="mt-1 text-sm font-medium">
                            Current bid: {lot.currentBid.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Loading indicator / Infinite scroll trigger */}
            <div ref={observerTarget} className="mt-8 flex justify-center">
              {loading && (
                <div className="text-sm text-muted-foreground">
                  Loading more lots...
                </div>
              )}
              {!hasMore && lots.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  No more lots to display
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <AuctionFooter />
    </div>
  );
}

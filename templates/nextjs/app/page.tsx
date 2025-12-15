import { AuctionNav } from "@/components/auction-nav";
import { AuctionFooter } from "@/components/auction-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock } from "lucide-react";
import Link from "next/link";

import { createClientApiClient } from "@bastaai/basta-js";
import { DateTime } from "luxon";
import { Auction, mockAuctions } from "./_mocks/auctions";

async function getUpcomingAuctions() {
  if (!process.env.ACCOUNT_ID || !process.env.API_KEY) {
    console.log("Missing env variables: ACCOUNT_ID | API_KEY");
    console.log("returning mock auctions...");
    return mockAuctions;
  }
  const client = createClientApiClient({
    headers: {
      "x-account-id": process.env.ACCOUNT_ID,
      "x-api-key": process.env.API_KEY,
    },
  });

  try {
    console.log("fetching data...");
    const sales = await client.query({
      sales: {
        __args: {
          accountId: process.env.ACCOUNT_ID,
          first: 10,
          filter: { statuses: ["PUBLISHED", "OPENED"] },
        },
        edges: {
          node: {
            id: true,
            title: true,
            // location: true,
            images: { url: true },
            // items: true,
            status: true,
            // label: true,
            // estimate: true,
            dates: { openDate: true, closingDate: true },
            items: {
              pageInfo: {
                totalRecords: true,
              },
            },
          },
        },
      },
    });
    const auctions: Auction[] = sales.sales.edges.map(({ node: sale }) => {
      return {
        id: sale.id,
        title: sale.title ?? undefined,
        location: undefined,
        dates: {
          openDate: sale.dates.openDate ?? undefined,
          closingDate: sale.dates.closingDate ?? undefined,
        },
        status: sale.status,
        image: sale.images[0]?.url ?? undefined,
        lotsCount: sale.items.pageInfo.totalRecords,
        label: undefined,
        estimate: undefined,
      };
    });
    return auctions;
  } catch (error) {
    console.error(error);
    console.log("Something went wrong, returning mock data...");
    return mockAuctions;
  }
}

export default async function HomePage() {
  const upcomingAuctions = (await getUpcomingAuctions()) ?? [];
  return (
    <div className="min-h-screen">
      <AuctionNav />

      {/* Hero Section */}
      <section className="relative h-[45vh] min-h-[400px] overflow-hidden bg-muted/20">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/elegant-auction-gallery.jpg')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/98 to-background/50" />
        </div>
        <div className="container relative mx-auto flex h-full items-center px-4">
          <div className="max-w-xl">
            <h1 className="font-serif text-4xl font-light leading-tight text-balance tracking-tight md:text-5xl">
              Discover Extraordinary Art & Collectibles
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground text-pretty">
              Join our upcoming auctions featuring masterpieces from the world's
              most celebrated artists and makers.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="default" className="font-normal">
                View All Auctions
              </Button>
              <Button
                size="default"
                variant="outline"
                className="bg-background/80 font-normal backdrop-blur-sm"
              >
                Request a Valuation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Auctions */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="mb-14 flex items-end justify-between">
          <div>
            <h2 className="font-serif text-3xl font-light tracking-tight md:text-4xl">
              Upcoming Auctions
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Browse our calendar of exceptional sales
            </p>
          </div>
          <Button variant="ghost" className="hidden font-normal md:flex">
            View Calendar
            <Calendar className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {upcomingAuctions.length === 0 && (
          <h2 className="font-serif text-3xl font-light tracking-tight md:text-4xl">
            No upcoming auctions
          </h2>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {upcomingAuctions.map((auction) => {
            const dt = auction.dates.openDate
              ? DateTime.fromISO(auction.dates.openDate)
              : undefined;
            return (
              <Link key={auction.id} href={`/auction/${auction.id}`}>
                <Card className="group flex flex-col overflow-hidden border-border/50 transition-all hover:border-border hover:shadow-md">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={auction.image || "/placeholder.svg"}
                      alt={auction.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <Badge
                      className={`absolute right-4 top-4 border-0 backdrop-blur-sm ${
                        auction.status === "LIVE"
                          ? "bg-green-500/90 text-white"
                          : "bg-background/90 text-foreground"
                      }`}
                    >
                      {auction.status === "LIVE" && (
                        <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                      )}
                      {auction.label}
                    </Badge>
                  </div>
                  <CardContent className="flex flex-1 flex-col p-6">
                    <h3 className="font-serif text-xl font-normal leading-snug text-balance tracking-tight">
                      {auction.title}
                    </h3>

                    <div className="mt-5 space-y-2.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2.5">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{auction.location}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{dt ? dt.toFormat("dd LLL yyyy") : "TBA"}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{dt ? dt.toFormat("HH:mm") : "TBA"}</span>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-1 items-end justify-between border-t border-border/50 pt-5">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Lots
                        </p>
                        <p className="mt-1 font-medium">{auction.lotsCount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Estimate
                        </p>
                        <p className="mt-1 font-medium">{auction.estimate}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-y border-border/50 bg-muted/20 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl font-light tracking-tight md:text-4xl">
            Interested in Consigning?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-muted-foreground">
            Our specialists are available to provide complimentary valuations
            and guide you through the consignment process.
          </p>
          <Button size="default" className="mt-8 font-normal">
            Contact a Specialist
          </Button>
        </div>
      </section>

      <AuctionFooter />
    </div>
  );
}

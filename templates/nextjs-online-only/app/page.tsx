import { AuctionNav } from "@/components/auction-nav";
import { AuctionFooter } from "@/components/auction-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Calendar, MapPin, Clock } from "lucide-react";
import Link from "next/link";

import { DateTime } from "luxon";
import { getClientApiClient } from "@/lib/basta-client";
import { Auction, mockAuctions } from "./_mocks/auctions";

type Tag = {
  id: string;
  name: string;
};

async function getAllAuctions() {
  if (!process.env.ACCOUNT_ID) {
    console.error("Missing env variable: ACCOUNT_ID");
    console.log("returning mock auctions...");
    return mockAuctions;
  }
  const client = getClientApiClient();

  try {
    const sales = await client.query({
      sales: {
        __args: {
          accountId: process.env.ACCOUNT_ID,
          first: 20,
          filter: { statuses: ["PUBLISHED", "OPENED", "LIVE", "CLOSING", "CLOSED"] },
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
              edges: {
                node: {
                  images: {
                    url: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    const auctions: Auction[] = sales.sales.edges.map(({ node: sale }) => {
      // Use first item's image if sale doesn't have its own image
      const saleImage = sale.images?.[0]?.url;
      const firstItemImage = sale.items.edges?.[0]?.node?.images?.[0]?.url;
      const image = saleImage || firstItemImage;

      return {
        id: sale.id,
        title: sale.title ?? undefined,
        location: undefined,
        dates: {
          openDate: sale.dates.openDate ?? undefined,
          closingDate: sale.dates.closingDate ?? undefined,
        },
        status: sale.status,
        image: image ?? undefined,
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

async function getAllTags(): Promise<Tag[]> {
  if (!process.env.ACCOUNT_ID) {
    console.log("Missing env variable: ACCOUNT_ID");
    return [];
  }

  try {
    // Use the SDK's search query to get facets (which contain tags)
    const client = getClientApiClient();

    // Query search endpoint to get facets
    const searchData = await client.query({
      search: {
        __args: {
          accountId: process.env.ACCOUNT_ID,
          type: "ITEM",
          query: "*",
        },
        facets: {
          fieldName: true,
          counts: {
            value: true,
            count: true,
          },
        },
      },
    });

    // Extract tags from facets
    const tags: Tag[] = [];
    const searchResult = searchData.search;

    if (searchResult?.facets && Array.isArray(searchResult.facets)) {
      // Find the tags facet
      const tagsFacet = searchResult.facets.find(
        (facet: any) => facet.fieldName === "tags"
      );

      if (tagsFacet?.counts && Array.isArray(tagsFacet.counts)) {
        tagsFacet.counts.forEach((count: any, index: number) => {
          if (count?.value) {
            tags.push({
              id: `tag-${index}`,
              name: count.value,
            });
          }
        });
      }
    }

    // Return tags sorted by name
    return tags.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
}

export default async function HomePage() {
  const allAuctions = (await getAllAuctions()) ?? [];
  const allTags = await getAllTags();

  // Separate auctions into ongoing, upcoming, and past based on status and closing date
  const now = DateTime.now();

  // Ongoing auctions: OPENED, LIVE, or CLOSING status
  const ongoingAuctions = allAuctions.filter((auction) => {
    return auction.status === "OPENED" || auction.status === "LIVE" || auction.status === "CLOSING";
  });

  // Upcoming auctions: PUBLISHED status or future closing date
  const upcomingAuctions = allAuctions.filter((auction) => {
    if (auction.status === "CLOSED" || auction.status === "OPENED" || auction.status === "LIVE" || auction.status === "CLOSING") return false;
    if (!auction.dates.closingDate) return true;
    const closingDate = DateTime.fromISO(auction.dates.closingDate);
    return closingDate > now;
  });

  const pastAuctions = allAuctions
    .filter((auction) => {
      if (auction.status === "CLOSED") return true;
      if (!auction.dates.closingDate) return false;
      const closingDate = DateTime.fromISO(auction.dates.closingDate);
      return closingDate <= now;
    })
    .sort((a, b) => {
      // Sort by closing date, most recent first
      const dateA = a.dates.closingDate
        ? DateTime.fromISO(a.dates.closingDate)
        : DateTime.fromMillis(0);
      const dateB = b.dates.closingDate
        ? DateTime.fromISO(b.dates.closingDate)
        : DateTime.fromMillis(0);
      return dateB.toMillis() - dateA.toMillis();
    })
    .slice(0, 3); // Limit to 3 most recent past auctions

  return (
    <div className="min-h-screen">
      <AuctionNav />

      {/* Hero Section */}
      <section className="relative h-[45vh] min-h-[400px] overflow-hidden bg-muted/20">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/art-gallery.avif')`,
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
            <div className="mt-7">
              <Link href="/auctions">
                <Button size="default" className="font-normal">
                  View All Auctions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Tags Section */}
      {allTags.length > 0 && (
        <section className="border-b border-border/50 bg-muted/10 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 text-center">
              <h2 className="font-serif text-2xl font-light tracking-tight md:text-3xl">
                Browse by Tags
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {allTags.map((tag) => (
                <Link key={tag.id} href={`/tags/${encodeURIComponent(tag.name)}`}>
                  <Badge
                    variant="outline"
                    className="cursor-pointer px-4 py-2 text-sm font-normal transition-all hover:bg-accent hover:scale-105 hover:shadow-sm"
                  >
                    {tag.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ongoing Auctions */}
      {ongoingAuctions.length > 0 && (
        <section className="container mx-auto px-4 py-20 md:py-28">
          <div className="mb-14 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-3xl font-light tracking-tight md:text-4xl">
                Ongoing Auctions
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                Auctions currently accepting bids
              </p>
            </div>
            <Link href="/auctions">
              <Button variant="ghost" className="hidden font-normal md:flex">
                View All Auctions
                <Calendar className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {ongoingAuctions.map((auction) => {
                const dt = auction.dates.openDate
                  ? DateTime.fromISO(auction.dates.openDate)
                  : undefined;
                return (
                  <CarouselItem key={auction.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                    <Link href={`/auction/${auction.id}`}>
                      <Card className="group flex flex-col overflow-hidden border-border/50 transition-all hover:border-border hover:shadow-md">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img
                            src={auction.image || "/placeholder.svg"}
                            alt={auction.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <Badge
                            className={`absolute right-4 top-4 border-0 backdrop-blur-sm ${auction.status === "LIVE"
                              ? "bg-green-500/90 text-white"
                              : auction.status === "CLOSING"
                                ? "bg-orange-500/90 text-white"
                                : "bg-blue-500/90 text-white"
                              }`}
                          >
                            {auction.status === "LIVE" && (
                              <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                            )}
                            {auction.status === "LIVE"
                              ? "Live Now"
                              : auction.status === "CLOSING"
                                ? "Closing Soon"
                                : "Open For Bidding"}
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
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </Carousel>
        </section>
      )}

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
          <Link href="/auctions">
            <Button variant="ghost" className="hidden font-normal md:flex">
              View Calendar
              <Calendar className="ml-2 h-4 w-4" />
            </Button>
          </Link>
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
                      className={`absolute right-4 top-4 border-0 backdrop-blur-sm ${auction.status === "LIVE"
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

      {/* Past Auctions */}
      {pastAuctions.length > 0 && (
        <section className="container mx-auto px-4 py-20 md:py-28">
          <div className="mb-14 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-3xl font-light tracking-tight md:text-4xl">
                Past Auctions
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                Explore our archive of completed sales
              </p>
            </div>
            <Link href="/auctions">
              <Button variant="ghost" className="hidden font-normal md:flex">
                View All Auctions
                <Calendar className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pastAuctions.map((auction) => {
              const dt = auction.dates.openDate
                ? DateTime.fromISO(auction.dates.openDate)
                : undefined;
              return (
                <Link key={auction.id} href={`/auction/${auction.id}`}>
                  <Card className="group flex flex-col overflow-hidden border-border/50 transition-all hover:border-border hover:shadow-md opacity-90">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={auction.image || "/placeholder.svg"}
                        alt={auction.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <Badge
                        className="absolute right-4 top-4 border-0 bg-background/90 text-foreground backdrop-blur-sm"
                      >
                        Closed
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
          {allAuctions.filter((auction) => {
            if (auction.status === "CLOSED") return true;
            if (!auction.dates.closingDate) return false;
            const closingDate = DateTime.fromISO(auction.dates.closingDate);
            return closingDate <= now;
          }).length > 3 && (
              <div className="mt-10 text-center">
                <Link href="/auctions">
                  <Button variant="outline" className="font-normal">
                    View All Past Auctions
                  </Button>
                </Link>
              </div>
            )}
        </section>
      )}

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

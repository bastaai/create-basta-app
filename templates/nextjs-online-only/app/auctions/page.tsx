import { AuctionNav } from "@/components/auction-nav";
import { AuctionFooter } from "@/components/auction-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Clock, CalendarDays, History, Radio } from "lucide-react";
import Link from "next/link";

import { DateTime } from "luxon";
import { getClientApiClient } from "@/lib/basta-client";
import { Auction, mockAuctions } from "../_mocks/auctions";

async function getAllAuctions() {
    if (!process.env.ACCOUNT_ID) {
        console.log("Missing env variable: ACCOUNT_ID");
        console.log("returning mock auctions...");
        return mockAuctions;
    }
    const client = getClientApiClient();

    try {
        console.log("fetching data...");
        const sales = await client.query({
            sales: {
                __args: {
                    accountId: process.env.ACCOUNT_ID,
                    first: 100, // Get more auctions for the calendar
                    filter: { statuses: ["PUBLISHED", "OPENED", "LIVE", "CLOSING", "CLOSED"] },
                },
                edges: {
                    node: {
                        id: true,
                        title: true,
                        images: { url: true },
                        status: true,
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

function AuctionCard({ auction, isPast = false }: { auction: Auction; isPast?: boolean }) {
    const dt = auction.dates.openDate
        ? DateTime.fromISO(auction.dates.openDate)
        : undefined;
    const closingDt = auction.dates.closingDate
        ? DateTime.fromISO(auction.dates.closingDate)
        : undefined;

    const getStatusBadge = () => {
        if (auction.status === "LIVE") {
            return (
                <Badge className="border-0 bg-green-500/90 text-white backdrop-blur-sm">
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    Live Now
                </Badge>
            );
        }
        if (auction.status === "CLOSING") {
            return (
                <Badge className="border-0 bg-orange-500/90 text-white backdrop-blur-sm">
                    Closing Soon
                </Badge>
            );
        }
        if (auction.status === "OPENED") {
            return (
                <Badge className="border-0 bg-blue-500/90 text-white backdrop-blur-sm">
                    Open for Bidding
                </Badge>
            );
        }
        if (auction.status === "CLOSED") {
            return (
                <Badge className="border-0 bg-muted text-muted-foreground backdrop-blur-sm">
                    Closed
                </Badge>
            );
        }
        return (
            <Badge className="border-0 bg-background/90 text-foreground backdrop-blur-sm">
                Upcoming
            </Badge>
        );
    };

    return (
        <Link href={`/auction/${auction.id}`}>
            <Card
                className={`group flex flex-col overflow-hidden border-border/50 transition-all hover:border-border hover:shadow-md ${isPast ? "opacity-90" : ""
                    }`}
            >
                <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                        src={auction.image || "/placeholder.svg"}
                        alt={auction.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute right-4 top-4">{getStatusBadge()}</div>
                </div>
                <CardContent className="flex flex-1 flex-col p-6">
                    <h3 className="font-serif text-xl font-normal leading-snug text-balance tracking-tight">
                        {auction.title}
                    </h3>

                    <div className="mt-5 space-y-2.5 text-sm text-muted-foreground">
                        {auction.location && (
                            <div className="flex items-center gap-2.5">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>{auction.location}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                                {dt ? dt.toFormat("dd LLL yyyy") : "TBA"}
                                {closingDt && dt && closingDt.toISODate() !== dt.toISODate() && (
                                    <span className="text-muted-foreground/70">
                                        {" "}– {closingDt.toFormat("dd LLL yyyy")}
                                    </span>
                                )}
                            </span>
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
                            <p className="mt-1 font-medium">{auction.lotsCount ?? "–"}</p>
                        </div>
                        {auction.estimate && (
                            <div className="text-right">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Estimate
                                </p>
                                <p className="mt-1 font-medium">{auction.estimate}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export default async function AuctionCalendarPage() {
    const allAuctions = (await getAllAuctions()) ?? [];
    const now = DateTime.now();

    // Separate auctions into categories
    const liveAuctions = allAuctions.filter(
        (auction) => auction.status === "LIVE" || auction.status === "CLOSING"
    );

    const upcomingAuctions = allAuctions
        .filter((auction) => {
            if (auction.status === "CLOSED") return false;
            if (auction.status === "LIVE" || auction.status === "CLOSING") return false;
            if (!auction.dates.closingDate) return true;
            const closingDate = DateTime.fromISO(auction.dates.closingDate);
            return closingDate > now;
        })
        .sort((a, b) => {
            const dateA = a.dates.openDate
                ? DateTime.fromISO(a.dates.openDate)
                : DateTime.fromMillis(Number.MAX_SAFE_INTEGER);
            const dateB = b.dates.openDate
                ? DateTime.fromISO(b.dates.openDate)
                : DateTime.fromMillis(Number.MAX_SAFE_INTEGER);
            return dateA.toMillis() - dateB.toMillis();
        });

    const pastAuctions = allAuctions
        .filter((auction) => {
            if (auction.status === "CLOSED") return true;
            if (!auction.dates.closingDate) return false;
            const closingDate = DateTime.fromISO(auction.dates.closingDate);
            return closingDate <= now;
        })
        .sort((a, b) => {
            const dateA = a.dates.closingDate
                ? DateTime.fromISO(a.dates.closingDate)
                : DateTime.fromMillis(0);
            const dateB = b.dates.closingDate
                ? DateTime.fromISO(b.dates.closingDate)
                : DateTime.fromMillis(0);
            return dateB.toMillis() - dateA.toMillis();
        });

    // Group upcoming auctions by month
    const upcomingByMonth = upcomingAuctions.reduce(
        (acc, auction) => {
            const dt = auction.dates.openDate
                ? DateTime.fromISO(auction.dates.openDate)
                : null;
            const monthKey = dt ? dt.toFormat("LLLL yyyy") : "Date TBA";
            if (!acc[monthKey]) acc[monthKey] = [];
            acc[monthKey].push(auction);
            return acc;
        },
        {} as Record<string, Auction[]>
    );

    // Group past auctions by year
    const pastByYear = pastAuctions.reduce(
        (acc, auction) => {
            const dt = auction.dates.closingDate
                ? DateTime.fromISO(auction.dates.closingDate)
                : null;
            const yearKey = dt ? dt.toFormat("yyyy") : "Unknown";
            if (!acc[yearKey]) acc[yearKey] = [];
            acc[yearKey].push(auction);
            return acc;
        },
        {} as Record<string, Auction[]>
    );

    return (
        <div className="min-h-screen">
            <AuctionNav />

            {/* Hero Section */}
            <section className="relative border-b border-border bg-muted/30 py-16 md:py-20">
                <div className="container mx-auto px-4">
                    <div className="mx-auto max-w-3xl text-center">
                        <h1 className="font-serif text-4xl font-light tracking-tight md:text-5xl">
                            Auction Calendar
                        </h1>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Discover upcoming sales and explore our archive of past auctions
                        </p>
                    </div>
                </div>
            </section>

            {/* Tabs Section */}
            <section className="container mx-auto px-4 py-12">
                <Tabs defaultValue="upcoming" className="w-full">
                    <TabsList className="mb-8 grid w-full max-w-md mx-auto grid-cols-3">
                        <TabsTrigger value="live" className="gap-2">
                            <Radio className="h-3.5 w-3.5" />
                            Live ({liveAuctions.length})
                        </TabsTrigger>
                        <TabsTrigger value="upcoming" className="gap-2">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Upcoming ({upcomingAuctions.length})
                        </TabsTrigger>
                        <TabsTrigger value="past" className="gap-2">
                            <History className="h-3.5 w-3.5" />
                            Past ({pastAuctions.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Live Auctions */}
                    <TabsContent value="live">
                        {liveAuctions.length === 0 ? (
                            <div className="py-20 text-center">
                                <Radio className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                <h3 className="mt-4 font-serif text-2xl font-light">
                                    No Live Auctions
                                </h3>
                                <p className="mt-2 text-muted-foreground">
                                    Check back soon or browse our upcoming sales
                                </p>
                                <Link href="/auctions?tab=upcoming">
                                    <Button variant="outline" className="mt-6">
                                        View Upcoming Auctions
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {liveAuctions.map((auction) => (
                                    <AuctionCard key={auction.id} auction={auction} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Upcoming Auctions */}
                    <TabsContent value="upcoming">
                        {upcomingAuctions.length === 0 ? (
                            <div className="py-20 text-center">
                                <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                <h3 className="mt-4 font-serif text-2xl font-light">
                                    No Upcoming Auctions
                                </h3>
                                <p className="mt-2 text-muted-foreground">
                                    New sales are added regularly. Check back soon!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {Object.entries(upcomingByMonth).map(([month, auctions]) => (
                                    <div key={month}>
                                        <h2 className="mb-6 font-serif text-2xl font-light tracking-tight">
                                            {month}
                                        </h2>
                                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                            {auctions.map((auction) => (
                                                <AuctionCard key={auction.id} auction={auction} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Past Auctions */}
                    <TabsContent value="past">
                        {pastAuctions.length === 0 ? (
                            <div className="py-20 text-center">
                                <History className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                <h3 className="mt-4 font-serif text-2xl font-light">
                                    No Past Auctions
                                </h3>
                                <p className="mt-2 text-muted-foreground">
                                    Our archive will grow as auctions are completed
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {Object.entries(pastByYear).map(([year, auctions]) => (
                                    <div key={year}>
                                        <h2 className="mb-6 font-serif text-2xl font-light tracking-tight">
                                            {year}
                                        </h2>
                                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                            {auctions.map((auction) => (
                                                <AuctionCard key={auction.id} auction={auction} isPast />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </section>

            {/* CTA Section */}
            <section className="border-t border-border/50 bg-muted/20 py-16">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="font-serif text-2xl font-light tracking-tight md:text-3xl">
                        Stay Updated
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                        Subscribe to our newsletter to receive updates on upcoming auctions,
                        featured lots, and exclusive previews.
                    </p>
                    <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="w-full max-w-xs rounded-md border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <Button>Subscribe</Button>
                    </div>
                </div>
            </section>

            <AuctionFooter />
        </div>
    );
}


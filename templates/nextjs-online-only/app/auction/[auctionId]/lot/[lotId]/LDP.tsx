"use client";

import { AuctionNav } from "@/components/auction-nav";
import { AuctionFooter } from "@/components/auction-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Heart,
  Share2,
  Gavel,
  TrendingUp,
  FileText,
  Clock,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/utils";
import { RegistrationModal, type SaleRegistration } from "@/components/registration-modal";

export type Lot = {
  lotNumber: number;
  title: string | undefined;
  currency: string | null;
  lowEstimate: number | null;
  highEstimate: number | null;
  currentBid: number | null;
  startingBid: number | null;
  bidsCount: number | undefined;
  nextAsks: number[];
  images: string[];
  closingDate: string | null;
};

// Countdown timer hook
function useCountdown(targetDate: string | null) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        isExpired: false,
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

interface LotDetailPageProps {
  lotData: Lot;
  auctionId: string;
  auctionTitle: string;
  userSaleRegistrations?: SaleRegistration[];
}

export default function LotDetailPage({
  lotData,
  auctionId,
  auctionTitle,
  userSaleRegistrations = []
}: LotDetailPageProps) {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [selectedImage, setSelectedImage] = useState(0);
  // Selected bid amount in minor currency (cents)
  const [selectedBid, setSelectedBid] = useState<string>(
    lotData.nextAsks[0]?.toString() || ""
  );
  const [watchlisted, setWatchlisted] = useState(false);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [registrations, setRegistrations] = useState<SaleRegistration[]>(userSaleRegistrations);
  const [isPlacingBid, setIsPlacingBid] = useState(false);

  const isRegistered = registrations.length > 0;
  const countdown = useCountdown(lotData.closingDate);

  const handlePlaceBid = async () => {
    // Check if user is logged in
    if (!session?.user) {
      // Redirect to login with callback URL
      const callbackUrl = `/auction/${auctionId}/lot/${params.lotId}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    // Check if user is registered for the auction
    if (!isRegistered) {
      setRegistrationModalOpen(true);
      return;
    }

    // Check if we have a bidder token
    if (!session.bidderToken) {
      console.error("No bidder token available");
      // TODO: Show error toast - try logging out and back in
      return;
    }

    // Place the bid directly using the bidder token
    const bidAmount = parseInt(selectedBid, 10);
    setIsPlacingBid(true);

    try {
      const accountId = process.env.NEXT_PUBLIC_ACCOUNT_ID;

      const response = await fetch("https://api.basta.wtf/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.bidderToken}`,
        },
        body: JSON.stringify({
          query: `
            mutation PlaceBid($accountId: String!, $input: BidOnBehalfInput!) {
              bidOnBehalf(accountId: $accountId, input: $input) {
                bidId
                amount
                maxAmount
                userId
                date
                bidStatus
                bidSequenceNumber
              }
            }
          `,
          variables: {
            accountId,
            input: {
              saleId: auctionId,
              itemId: params.lotId,
              amount: bidAmount,
              userId: session.user.id,
              type: "MAX",
            },
          },
        }),
      });

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0]?.message || "Failed to place bid");
      }

      // Bid placed successfully - refresh the page to get updated data
      router.refresh();
    } catch (error) {
      console.error("Error placing bid:", error);
      // TODO: Show error toast
    } finally {
      setIsPlacingBid(false);
    }
  };

  return (
    <div className="min-h-screen">
      <AuctionNav />

      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <Link
            href={`/auction/${params.auctionId}`}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Auction
          </Link>
        </div>
      </div>

      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left Column - Images */}
          <div>
            <div className="sticky top-24">
              <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-muted">
                <img
                  src={lotData.images[selectedImage] || "/placeholder.svg"}
                  alt={lotData.title}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {lotData.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative aspect-square overflow-hidden rounded border-2 transition-all ${selectedImage === idx
                      ? "border-accent"
                      : "border-border hover:border-accent/50"
                      }`}
                  >
                    <img
                      src={img || "/placeholder.svg"}
                      alt={`View ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Details & Bidding */}
          <div>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <Badge className="mb-3">Lot {lotData.lotNumber}</Badge>
                <h1 className="font-serif text-3xl font-bold leading-tight text-balance md:text-4xl">
                  {lotData.title}
                </h1>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setWatchlisted(!watchlisted)}
                >
                  <Heart
                    className={`h-5 w-5 ${watchlisted ? "fill-current text-accent" : ""
                      }`}
                  />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Estimate */}
            {lotData.lowEstimate && lotData.highEstimate && (
              <>
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">Estimate</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(lotData.lowEstimate)} - {formatCurrency(lotData.highEstimate)}
                  </p>
                </div>
              </>
            )}

            {/* Bidding Card */}
            <Card className="mb-6 border-accent/50 bg-accent/5">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    {lotData.currentBid ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Current Bid
                        </p>
                        <p className="text-3xl font-bold">
                          {formatCurrency(lotData.currentBid)}
                        </p>
                      </>
                    ) : lotData.startingBid ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Starting Bid
                        </p>
                        <p className="text-3xl font-bold">
                          {formatCurrency(lotData.startingBid)}
                        </p>
                      </>
                    ) : null}
                  </div>
                  {lotData.bidsCount !== undefined && lotData.bidsCount > 0 && (
                    <div className="flex items-center gap-2 text-accent">
                      <TrendingUp className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        {lotData.bidsCount} {lotData.bidsCount === 1 ? "bid" : "bids"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Registration Status - only show when registered */}
                {session?.user && isRegistered && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Registered to Bid</span>
                  </div>
                )}

                {/* Bid Form */}
                {lotData.nextAsks.length > 0 && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="bidAmount" className="text-sm">
                        Select Your Bid
                      </Label>
                      <Select value={selectedBid} onValueChange={setSelectedBid}>
                        <SelectTrigger className="mt-1.5 w-full">
                          <SelectValue placeholder="Select bid amount" />
                        </SelectTrigger>
                        <SelectContent>
                          {lotData.nextAsks.map((amount) => (
                            <SelectItem key={amount} value={amount.toString()}>
                              {formatCurrency(amount)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handlePlaceBid}
                      disabled={isPlacingBid}
                    >
                      {isPlacingBid ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Gavel className="mr-2 h-5 w-5" />
                      )}
                      {isPlacingBid
                        ? "Placing Bid..."
                        : session?.user && !isRegistered
                          ? "Register to Place Bid"
                          : "Place Bid"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      By placing a bid, you agree to our Terms & Conditions
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Auction Countdown */}
            {lotData.closingDate && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className={`h-4 w-4 ${countdown.isExpired ? "text-destructive" : "text-muted-foreground"}`} />
                    <div className="flex-1">
                      {countdown.isExpired ? (
                        <p className="font-medium text-destructive">Auction Closed</p>
                      ) : (
                        <>
                          <p className="font-medium">
                            {countdown.days > 0 && `${countdown.days}d `}
                            {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
                          </p>
                          <p className="text-muted-foreground">
                            Closes {new Date(lotData.closingDate).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bid History */}
            {/* <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  Bid History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bidHistory.slice(0, 5).map((bid) => (
                    <div
                      key={bid.id}
                      className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-semibold">
                          ${bid.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {bid.bidder}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {bid.time}
                      </p>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="mt-4 w-full bg-transparent"
                  size="sm"
                >
                  View All {lotData.bidsCount} Bids
                </Button>
              </CardContent>
            </Card> */}
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full justify-start border-b border-border bg-transparent p-0">
              <TabsTrigger
                value="details"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
              >
                <FileText className="mr-2 h-4 w-4" />
                Details
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-8">
              <div className="prose prose-sm max-w-none">
                <h3 className="font-serif text-2xl font-bold">
                  About This Work
                </h3>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  This exceptional abstract composition represents a pivotal
                  moment in Jean-Michel Dubois's career, created during his most
                  productive period in the late 1980s. The work exemplifies his
                  mastery of color theory and compositional balance, with
                  vibrant blues contrasting against luminous gold tones.
                </p>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  The painting's dynamic energy and sophisticated layering
                  technique demonstrate Dubois's innovative approach to abstract
                  expressionism, drawing inspiration from both European and
                  American traditions while developing a distinctly personal
                  visual language.
                </p>
                <h4 className="mt-8 font-semibold">Literature</h4>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <AuctionFooter />

      {/* Registration Modal */}
      <RegistrationModal
        open={registrationModalOpen}
        onOpenChange={setRegistrationModalOpen}
        auctionId={auctionId}
        auctionTitle={auctionTitle}
        onRegistrationComplete={(registration) => {
          setRegistrations([...registrations, registration]);
        }}
      />
    </div>
  );
}

const bidHistory = [
  { id: 1, amount: 48000, bidder: "Bidder #7352", time: "2 minutes ago" },
  { id: 2, amount: 46000, bidder: "Bidder #2891", time: "15 minutes ago" },
  { id: 3, amount: 44000, bidder: "Bidder #7352", time: "28 minutes ago" },
  { id: 4, amount: 42000, bidder: "Bidder #5623", time: "45 minutes ago" },
  { id: 5, amount: 40000, bidder: "Bidder #2891", time: "1 hour ago" },
  { id: 6, amount: 38000, bidder: "Bidder #7352", time: "2 hours ago" },
  { id: 7, amount: 36000, bidder: "Bidder #1024", time: "3 hours ago" },
  { id: 8, amount: 34000, bidder: "Bidder #5623", time: "5 hours ago" },
];

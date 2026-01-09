"use client";

import { AuctionNav } from "@/components/auction-nav";
import { AuctionFooter } from "@/components/auction-footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Bell,
  Share2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/utils";
import { getClientApiClient } from "@/lib/basta-client";
import { RegistrationModal, type SaleRegistration } from "@/components/registration-modal";

export type Bid = {
  id: string;
  amount: number;
  maxAmount?: number | null;
  bidder: string;
  date: string;
  bidStatus?: string;
};

export type UserBid = {
  bidId: string;
  amount: number;
  maxAmount?: number | null;
  date: string;
  bidType?: string;
  bidStatus?: string;
};

export type Lot = {
  lotNumber: number;
  title: string | undefined;
  description?: string;
  currency: string | null;
  lowEstimate: number | null;
  highEstimate: number | null;
  currentBid: number | null;
  startingBid: number | null;
  bidsCount: number | undefined;
  nextAsks: number[];
  images: string[];
  closingDate: string | null;
  reserveMet?: boolean | null;
  bids?: Bid[];
  userBids?: UserBid[];
};

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

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
  const [selectedBid, setSelectedBid] = useState<string>(
    lotData.nextAsks[0]?.toString() || ""
  );
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [registrations, setRegistrations] = useState<SaleRegistration[]>(userSaleRegistrations);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const isRegistered = registrations.length > 0;
  const countdown = useCountdown(lotData.closingDate);

  const handlePlaceBid = async () => {
    if (!session?.user) {
      const callbackUrl = `/auction/${auctionId}/lot/${params.lotId}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    if (!isRegistered) {
      setRegistrationModalOpen(true);
      return;
    }

    if (!session.bidderToken) {
      console.error("No bidder token available");
      return;
    }

    const bidAmount = parseInt(selectedBid, 10);
    setIsPlacingBid(true);

    try {
      const client = getClientApiClient(session?.bidderToken);

      const result = await client.mutation({
        bidOnItem: {
          __args: {
            saleId: auctionId,
            itemId: params.lotId as string,
            amount: bidAmount,
            type: "MAX",
          },
          __typename: true,
          on_BidPlacedError: {
            error: true,
            errorCode: true,
          },
          on_BidPlacedSuccess: {
            id: true,
            amount: true,
            date: true,
            bidStatus: true,
          },
          on_MaxBidPlacedSuccess: {
            id: true,
            amount: true,
            maxAmount: true,
            bidStatus: true,
            date: true,
          },
        },
      });

      const bidResult = result.bidOnItem;
      if (bidResult?.__typename === "BidPlacedError") {
        throw new Error(bidResult.error || "Failed to place bid");
      }

      router.refresh();
    } catch (error) {
      console.error("Error placing bid:", error);
    } finally {
      setIsPlacingBid(false);
    }
  };

  const description = lotData.description || "This painting captures the ethereal essence of dance, with faded, ghost-like figures gracefully moving across the canvas. At the center, a luminous figure emerges...";

  return (
    <div className="min-h-screen bg-background">
      <AuctionNav />

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
        {/* Left Column - Images */}
        <div className="lg:w-1/2 lg:sticky lg:top-0 lg:h-screen flex flex-col">
          <div className="flex-1 p-4 lg:p-6 flex flex-col">
            {/* Main Image */}
            <div className="relative flex-1 min-h-0 overflow-hidden rounded-2xl bg-muted">
              <img
                src={lotData.images[selectedImage] || "/placeholder.svg"}
                alt={lotData.title}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Thumbnail Navigation */}
            {lotData.images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {lotData.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg transition-all ${selectedImage === idx
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "opacity-60 hover:opacity-100"
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
            )}
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="lg:w-1/2 p-4 lg:p-8 lg:pt-6">
          <div className="max-w-lg mx-auto lg:mx-0">
            {/* Breadcrumb */}
            <Link
              href={`/auction/${params.auctionId}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground mb-4"
            >
              <ChevronLeft className="h-4 w-4" />
              {auctionTitle}
            </Link>

            {/* Title */}
            <h1 className="font-serif text-3xl lg:text-4xl font-bold leading-tight mb-6">
              {lotData.title}
            </h1>

            {/* Stats Row */}
            <div className="flex items-center gap-6 lg:gap-8 mb-6 text-sm">
              {/* Countdown */}
              <div>
                <p className="text-muted-foreground">Ends in</p>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${countdown.isExpired ? "bg-destructive" : "bg-green-500"}`} />
                  <span className="font-semibold">
                    {countdown.isExpired
                      ? "Closed"
                      : `${countdown.days > 0 ? `${countdown.days}d ` : ""}${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`
                    }
                  </span>
                </div>
              </div>

              {/* Current Bid */}
              <div>
                <p className="text-muted-foreground">Current bid</p>
                <p className="font-semibold">
                  {lotData.currentBid
                    ? formatCurrency(lotData.currentBid)
                    : lotData.startingBid
                      ? formatCurrency(lotData.startingBid)
                      : "No bids"
                  }
                </p>
              </div>

              {/* Reserve Status */}
              <div>
                <p className="text-muted-foreground">Minimum</p>
                <p className="font-semibold">
                  {lotData.reserveMet ? "Met" : lotData.currentBid ? "Not met" : "—"}
                </p>
              </div>

              {/* User's Max Bid */}
              {lotData.userBids && lotData.userBids.length > 0 && (() => {
                // Find the newest max bid (highest maxAmount from bids with maxAmount > 0)
                const maxBids = lotData.userBids
                  .filter(b => b.maxAmount && b.maxAmount > 0)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                const newestMaxBid = maxBids[0];

                if (!newestMaxBid) {
                  // No max bids, show the latest regular bid
                  const latestBid = lotData.userBids.sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                  )[0];
                  return (
                    <div>
                      <p className="text-muted-foreground">Your bid</p>
                      <p className="font-semibold text-primary">
                        {formatCurrency(latestBid.amount)}
                      </p>
                    </div>
                  );
                }

                return (
                  <div>
                    <p className="text-muted-foreground">Your max bid</p>
                    <p className="font-semibold text-primary">
                      {formatCurrency(newestMaxBid.maxAmount!)}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-6">
              <Button variant="secondary" size="icon" className="rounded-full h-10 w-10">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" className="rounded-full h-10 w-10">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Description */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p className="text-sm leading-relaxed">
                {showFullDescription ? description : `${description.slice(0, 150)}...`}
              </p>
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-sm text-primary font-medium mt-1"
              >
                {showFullDescription ? "Show less" : "Read more"}
              </button>
            </div>

            {/* Place Bid Button */}
            <div className="mb-8">
              {lotData.nextAsks.length > 0 && (
                <Select value={selectedBid} onValueChange={setSelectedBid}>
                  <SelectTrigger className="w-full mb-3">
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
              )}
              <Button
                size="lg"
                className="w-full"
                onClick={handlePlaceBid}
                disabled={isPlacingBid || countdown.isExpired}
              >
                {isPlacingBid ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : null}
                {isPlacingBid
                  ? "Placing Bid..."
                  : session?.user && !isRegistered
                    ? "Register to Place Bid"
                    : "Place Bid"}
              </Button>
            </div>

            {/* Bid History */}
            {lotData.bids && lotData.bids.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-semibold">Bid history</span>
                  <span className="text-muted-foreground">{lotData.bidsCount || lotData.bids.length}</span>
                </div>

                <div className="space-y-2">
                  {[...lotData.bids].reverse().map((bid, index) => {
                    // Check if this bid matches any of the user's bids
                    const isCurrentUser = lotData.userBids?.some(ub => ub.bidId === bid.id) || false;
                    const hasMaxBid = bid.maxAmount && bid.maxAmount > bid.amount;
                    const isWinning = bid.bidStatus === "WINNING";

                    return (
                      <div
                        key={bid.id}
                        className={`flex items-center gap-3 p-3 rounded-xl ${isCurrentUser
                          ? "bg-primary/10"
                          : "bg-muted/50"
                          }`}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={isCurrentUser ? "bg-primary/20" : ""}>
                            {bid.bidder.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {isWinning && (
                              <Badge variant="secondary" className="text-xs bg-primary text-primary-foreground">
                                Winning
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">{formatRelativeTime(bid.date)}</span>
                          </div>
                          <p className="font-medium truncate">
                            {isCurrentUser ? "(You) " : ""}{bid.bidder}
                          </p>
                        </div>
                        <div className="text-right">
                          {hasMaxBid && (
                            <Badge variant="outline" className="text-xs mb-1">
                              Max bid
                            </Badge>
                          )}
                          <p className="font-semibold">{formatCurrency(bid.amount)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Previous / Next Navigation */}
            <div className="flex gap-4 pb-8">
              <Link
                href={`/auction/${auctionId}/lot/${Math.max(1, lotData.lotNumber - 1)}`}
                className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden shrink-0">
                  <img src="/placeholder.svg" alt="Previous lot" className="h-full w-full object-cover" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">Previous</span>
                </div>
              </Link>
              <Link
                href={`/auction/${auctionId}/lot/${lotData.lotNumber + 1}`}
                className="flex-1 flex items-center justify-end gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span className="font-medium">Next</span>
                </div>
                <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden shrink-0">
                  <img src="/placeholder.svg" alt="Next lot" className="h-full w-full object-cover" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

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

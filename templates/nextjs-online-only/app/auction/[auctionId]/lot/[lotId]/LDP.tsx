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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Bell,
  BellOff,
  Share2,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/utils";
import { getClientApiClient } from "@/lib/basta-client";
import { RegistrationModal, type SaleRegistration } from "@/components/registration-modal";
import { useClientApi } from "@bastaai/basta-js/client";
import { mapItemToLot, mapSaleToSale, SaleItemDataType } from "./page";
import { CountdownDisplay } from "./countdown";
import { useToast } from "@/hooks/use-toast";

/* Types for the Lot Detail Page */

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
  id: string;
  lotNumber: number;
  title: string | undefined;
  description?: string;
  currency: string | null;
  status: SaleItemDataType["status"]
  lowEstimate: number | null;
  highEstimate: number | null;
  reserveStatus: string | null;
  currentBid: number | null;
  startingBid: number | null;
  bidsCount: number | undefined;
  nextAsks: number[];
  images: string[];
  closingDate: string | null;
  openDate: string | null;
  closingStart: string | null;
  reserveMet?: boolean | null;
  bids?: Bid[];
  userBids?: UserBid[];
  prevItem?: {
    id: string;
    title?: string;
    image?: string;
  } | null;
  nextItem?: {
    id: string;
    title?: string;
    image?: string;
  } | null;
};

export type Sale = {
  id: string;
  title: string;
  userSaleRegistrations: SaleRegistration[];
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

interface LotDetailPageProps {
  initialLotData: Lot;
  initialSaleData: Sale;
  auctionId: string;
}

export default function LotDetailPage({
  initialLotData,
  initialSaleData,
  auctionId,
}: LotDetailPageProps) {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const client = useClientApi();
  const lotId = params.lotId as string;
  const { toast } = useToast();

  // Manage state internally
  const [lotData, setLotData] = useState<Lot>(initialLotData);
  const [saleData, setSaleData] = useState<Sale>(initialSaleData);

  // Memoize the subscription query to prevent re-subscription on re-renders
  const subscriptionQuery = useMemo(
    () =>
      client.subscription({
        saleActivity: {
          __args: {
            saleId: auctionId,
            itemIdFilter: {
              itemIds: [lotId],
            },
          },
          on_Item: {
            __typename: true,
            id: true,
            itemNumber: true,
            title: true,
            description: true,
            currency: true,
            estimates: {
              low: true,
              high: true,
            },
            currentBid: true,
            startingBid: true,
            nextAsks: true,
            totalBids: true,
            status: true,
            nextItem: {
              id: true,
              itemNumber: true,
              title: true,
              images: {
                url: true,
              },
            },
            prevItem: {
              id: true,
              itemNumber: true,
              title: true,
              images: {
                url: true,
              },
            },
            reserveMet: true,
            bidStatus: true,
            reserveStatus: true,
            images: { url: true },
            dates: {
              closingEnd: true,
              closingStart: true,
              openDate: true,
            },
            userBids: {
              amount: true,
              maxAmount: true,
              date: true,
              id: true,
              bidderIdentifier: true,
              bidStatus: true,
            },
            bids: {
              __args: {
                collapseSequentialUserBids: false,
              },
              amount: true,
              maxAmount: true,
              date: true,
              bidderIdentifier: true,
              bidOrigin: {
                on_Aggregator: {
                  name: true,
                },
                on_PaddleBidOrigin: {
                  type: true,
                },
                on_OnlineBidOrigin: {
                  type: true,
                },
                on_PhoneBidOrigin: {
                  type: true,
                },
              },
              bidStatus: true,
              reactiveBid: true,
              saleId: true,
              itemId: true,
              id: true,
            },
          },
          on_Sale: {
            __typename: true,
            id: true,
            title: true,
            userSaleRegistrations: {
              id: true,
              registrationType: true,
              saleId: true,
              status: true,
              userId: true,
            },
          },
        },
      }),
    [auctionId, lotId, client]
  );

  const [{ data: saleActivityData }] = client.useSubscription({
    query: subscriptionQuery,
  });

  useEffect(() => {
    if (saleActivityData?.saleActivity?.__typename === "Item") {
      setLotData(mapItemToLot(saleActivityData.saleActivity));
      setSelectedBid(saleActivityData.saleActivity.nextAsks[0]?.toString() || "");
    }
    if (saleActivityData?.saleActivity?.__typename === "Sale") {
      setSaleData(mapSaleToSale(saleActivityData.saleActivity));
    }
  }, [saleActivityData])

  // Live lot data state - starts with server-rendered data
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedBid, setSelectedBid] = useState<string>(
    lotData.nextAsks[0]?.toString() || ""
  );
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [registrations, setRegistrations] = useState<SaleRegistration[]>();
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showIncreaseMaxBidConfirm, setShowIncreaseMaxBidConfirm] = useState(false);
  const [pendingBidAmount, setPendingBidAmount] = useState<number | null>(null);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const isRegistered = (saleData?.userSaleRegistrations || []).length > 0;
  const [isExpired, setIsExpired] = useState(() => {
    // Initial check without causing re-renders
    if (!lotData.closingDate) return false;
    return new Date(lotData.closingDate).getTime() <= Date.now();
  });

  // Memoize the callback to prevent unnecessary re-renders
  const handleExpiredChange = useCallback((expired: boolean) => {
    setIsExpired(expired);
  }, []);

  const executeBid = async (bidAmount: number) => {
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

    // Check if user already has a bid and is trying to increase their max bid
    const latestUserBid = lotData.userBids?.[lotData.userBids.length - 1];
    const userMaxBid = latestUserBid?.maxAmount;
    const isWinning = latestUserBid?.bidStatus === "WINNING";
    const hasExistingBid = lotData.userBids && lotData.userBids.length > 0;

    // Only show confirmation if user is currently winning and wants to increase max bid
    if (hasExistingBid && isWinning && userMaxBid && bidAmount > userMaxBid) {
      // Show confirmation dialog for increasing max bid
      setPendingBidAmount(bidAmount);
      setShowIncreaseMaxBidConfirm(true);
    } else {
      // Place bid directly (either no existing bid, losing, or not a max bid increase)
      await executeBid(bidAmount);
    }
  };

  const handleConfirmIncreaseBid = async () => {
    setShowIncreaseMaxBidConfirm(false);
    if (pendingBidAmount) {
      await executeBid(pendingBidAmount);
      setPendingBidAmount(null);
    }
  };

  const handleCancelIncreaseBid = () => {
    setShowIncreaseMaxBidConfirm(false);
    setPendingBidAmount(null);
  };

  const handleToggleNotification = () => {
    setIsNotificationEnabled(!isNotificationEnabled);
    toast({
      title: !isNotificationEnabled ? "Notifications enabled" : "Notifications disabled",
      description: !isNotificationEnabled
        ? "You'll be notified about updates to this lot"
        : "You won't receive notifications for this lot",
    });
  };

  const handleShare = async () => {
    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to your clipboard",
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually",
        variant: "destructive",
      });
    }
  };

  const description = lotData.description || "This painting captures the ethereal essence of dance, with faded, ghost-like figures gracefully moving across the canvas. At the center, a luminous figure emerges...";
  const truncatedDescription = description.length > 150
    ? description.slice(0, 150) + '...'
    : description;

  return (
    <div className="min-h-screen bg-background">
      <AuctionNav />

      {/* Back to Auction Link */}
      <div className="container mx-auto px-4 pt-4">
        <Link
          href={`/auction/${params.auctionId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {saleData.title}
        </Link>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)]">
          {/* Left Column - Images */}
          <div className="lg:w-1/2 lg:sticky lg:top-0 lg:h-screen flex flex-col">
            <div className="flex-1 p-4 lg:p-8 lg:pt-6 flex flex-col">
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
              {/* Previous / Next Navigation - Compact */}
              <div className="flex items-center gap-2 mb-6">
                {lotData.prevItem ? (
                  <Link
                    href={`/auction/${auctionId}/lot/${lotData.prevItem.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {lotData.prevItem.image && (
                      <img
                        src={lotData.prevItem.image}
                        alt={lotData.prevItem.title || "Previous lot"}
                        className="h-8 w-8 rounded object-cover"
                      />
                    )}
                    <span className="font-medium">Previous</span>
                  </Link>
                ) : (
                  <div className="w-[100px]" />
                )}
                <div className="flex-1" />
                {lotData.nextItem ? (
                  <Link
                    href={`/auction/${auctionId}/lot/${lotData.nextItem.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                  >
                    <span className="font-medium">Next</span>
                    {lotData.nextItem.image && (
                      <img
                        src={lotData.nextItem.image}
                        alt={lotData.nextItem.title || "Next lot"}
                        className="h-8 w-8 rounded object-cover"
                      />
                    )}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <div className="w-[100px]" />
                )}
              </div>

              {/* Title */}
              <h1 className="font-serif text-3xl lg:text-4xl font-bold leading-tight mb-6">
                {lotData.title}
              </h1>

              {/* Stats Row */}
              <div className="flex items-center gap-6 lg:gap-8 mb-6 text-sm">
                {/* Countdown */}
                <div>
                  <p className="text-muted-foreground">
                    {lotData.status === "ITEM_NOT_OPEN"
                      ? "Opens in"
                      : lotData.status === "ITEM_OPEN" || lotData.status === "ITEM_CLOSING"
                        ? "Closes in"
                        : "Status"}
                  </p>
                  <CountdownDisplay
                    closingDate={lotData.closingDate}
                    onExpiredChange={handleExpiredChange}
                    status={lotData.status}
                  />
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
                <Button
                  variant={isNotificationEnabled ? "default" : "secondary"}
                  size="icon"
                  className="rounded-full h-10 w-10 transition-all"
                  onClick={handleToggleNotification}
                  title={isNotificationEnabled ? "Disable notifications" : "Enable notifications"}
                >
                  {isNotificationEnabled ? (
                    <Bell className="h-4 w-4 fill-current" />
                  ) : (
                    <BellOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full h-10 w-10 transition-all"
                  onClick={handleShare}
                  title="Copy link to clipboard"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: showFullDescription ? description : truncatedDescription
                  }}
                />
                {description.length > 150 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-sm text-primary font-medium mt-1"
                  >
                    {showFullDescription ? "Show less" : "Read more"}
                  </button>
                )}
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
                  disabled={isPlacingBid || lotData.status === "ITEM_CLOSED" || lotData.status === "ITEM_NOT_OPEN"}
                >
                  {isPlacingBid ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : null}
                  {isPlacingBid
                    ? "Placing Bid..."
                    : lotData.status === "ITEM_NOT_OPEN"
                      ? "Not Yet Open"
                      : lotData.status === "ITEM_CLOSED"
                        ? "Bidding Closed"
                        : session?.user && !isRegistered
                          ? "Register to Place Bid"
                          : "Place Bid"}
                </Button>
              </div>

              {/* Bid History */}
              {lotData.bids && lotData.bids.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium">Bid history</span>
                    <span className="text-xs text-muted-foreground">{lotData.bidsCount || lotData.bids.length}</span>
                  </div>

                  <div className="space-y-1.5">
                    {[...lotData.bids].reverse().slice(0, 5).map((bid, index) => {
                      // Check if this bid matches any of the user's bids
                      const isCurrentUser = lotData.userBids?.some(ub => ub.bidId === bid.id) || false;
                      const hasMaxBid = bid.maxAmount && bid.maxAmount > bid.amount;
                      const isWinning = bid.bidStatus === "WINNING";

                      return (
                        <div
                          key={bid.id}
                          className={`flex items-center gap-2.5 p-2 rounded-lg ${isCurrentUser
                            ? "bg-primary/5"
                            : "bg-muted/30"
                            }`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className={`text-xs ${isCurrentUser ? "bg-primary/15" : ""}`}>
                              {bid.bidder.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {isWinning && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary text-primary-foreground">
                                  Winning
                                </Badge>
                              )}
                              <span className="text-[10px] text-muted-foreground">{formatRelativeTime(bid.date)}</span>
                            </div>
                            <p className="text-xs font-normal truncate text-foreground/90">
                              {isCurrentUser ? "(You) " : ""}{bid.bidder}
                            </p>
                          </div>
                          <div className="text-right">
                            {hasMaxBid && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 mb-0.5">
                                Max
                              </Badge>
                            )}
                            <p className="text-xs font-medium">{formatCurrency(bid.amount)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
        auctionTitle={saleData.title}
        onRegistrationComplete={(registration) => {
          setRegistrations([...(registrations ?? []), registration]);
        }}
      />

      {/* Increase Max Bid Confirmation Dialog */}
      <AlertDialog open={showIncreaseMaxBidConfirm} onOpenChange={setShowIncreaseMaxBidConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Increase max bid</AlertDialogTitle>
            <AlertDialogDescription>
              You are currently winning with a max bid of {formatCurrency(lotData.userBids?.[lotData.userBids.length - 1]?.maxAmount || 0)}.
              Would you like to increase your max bid to {formatCurrency(pendingBidAmount || 0)}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelIncreaseBid}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmIncreaseBid}>
              Increase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

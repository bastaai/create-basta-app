import { getServerSession } from "next-auth";
import LDP, { Lot, Bid, UserBid } from "./LDP";
import type { SaleRegistration } from "@/components/registration-modal";
import { getClientApiClient } from "@/lib/basta-client";
import { authOptions } from "@/lib/auth";

// Mock lot data (amounts in minor currency - cents)
const mockLotData: Lot = {
  lotNumber: 42,
  title: "Abstract Composition in Blue and Gold",
  description: "This painting captures the ethereal essence of dance, with faded, ghost-like figures gracefully moving across the canvas. At the center, a luminous figure emerges, bathed in soft light.",
  currency: "USD",
  lowEstimate: 4500000,  // $45,000
  highEstimate: 6500000, // $65,000
  currentBid: 4800000,   // $48,000
  startingBid: 4000000,  // $40,000
  bidsCount: 5,
  nextAsks: [5000000, 5200000, 5500000, 6000000, 6500000], // Available bid amounts
  images: [
    "/abstract-painting-blue-gold.jpg",
    "/abstract-painting-detail-1.jpg",
    "/abstract-painting-detail-2.jpg",
    "/abstract-painting-signature.jpg",
  ],
  closingDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
  reserveMet: true,
  bids: [
    { id: "1", amount: 4800000, maxAmount: 5500000, bidder: "Maroon Anteater", date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), bidStatus: "WINNING" },
    { id: "2", amount: 4600000, bidder: "Teal Horse", date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), bidStatus: "LOSING" },
    { id: "3", amount: 4400000, maxAmount: 4800000, bidder: "Maroon Anteater", date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), bidStatus: "LOSING" },
    { id: "4", amount: 4200000, bidder: "Blush Porcupine", date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), bidStatus: "LOSING" },
    { id: "5", amount: 4000000, bidder: "Azure Dolphin", date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), bidStatus: "LOSING" },
  ],
  userBids: [
    { bidId: "u1", amount: 4600000, maxAmount: 5000000, date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), bidType: "MAX", bidStatus: "LOSING" },
  ],
};

interface LotPageData {
  lot: Lot;
  auctionTitle: string;
  userSaleRegistrations: SaleRegistration[];
}

async function getLotDetails(auctionId: string, lotId: string, bidderToken?: string): Promise<LotPageData | null> {
  if (["1", "2"].includes(auctionId)) {
    return {
      lot: mockLotData,
      auctionTitle: "Spring Contemporary Art Auction",
      userSaleRegistrations: [],
    };
  }

  if (!process.env.ACCOUNT_ID) {
    console.error("Missing env variable: ACCOUNT_ID");
    return null;
  }

  console.log("getLotDetails - bidderToken:", bidderToken ? "present" : "missing");
  const client = getClientApiClient(bidderToken);

  try {
    // Fetch both lot details and sale info
    const data = await client.query({
      saleItem: {
        __args: {
          saleId: auctionId,
          itemId: lotId,
        },
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
        reserveMet: true,
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
              type: true
            },
            on_OnlineBidOrigin: {
              type: true,
            },
            on_PhoneBidOrigin: {
              type: true,
            }
          },
          bidStatus: true,
          reactiveBid: true,
          saleId: true,
          itemId: true,
          id: true,
        }
      },
      sale: {
        __args: {
          id: auctionId,
        },
        title: true,
        userSaleRegistrations: {
          id: true,
          registrationType: true,
          saleId: true,
          status: true,
          userId: true,
        },
      },
    });

    const saleItem = data.saleItem;
    const sale = data.sale;

    const lotDetails: Lot = {
      lotNumber: saleItem.itemNumber,
      title: saleItem.title ?? undefined,
      description: saleItem.description ?? undefined,
      currency: saleItem.currency,
      lowEstimate: saleItem.estimates?.low,
      highEstimate: saleItem.estimates?.high,
      currentBid: saleItem.currentBid,
      startingBid: saleItem.startingBid,
      bidsCount: saleItem.totalBids,
      nextAsks: saleItem.nextAsks || [],
      images: saleItem.images?.map((img: any) => img.url) || [],
      closingDate: saleItem.dates?.closingEnd ?? null,
      reserveMet: saleItem.reserveMet ?? null,
      bids: saleItem.bids?.map((bid: any) => ({
        id: bid.id,
        amount: bid.amount,
        maxAmount: bid.maxAmount,
        bidder: bid.bidderIdentifier || "Anonymous",
        date: bid.date,
        bidStatus: bid.bidStatus,
      })) || [],
      userBids: saleItem.userBids?.map((bid) => ({
        bidId: bid.id,
        amount: bid.amount,
        maxAmount: bid.maxAmount,
        date: bid.date,
        bidType: (bid.maxAmount ?? 0) > 0 ? "MAX" : "NORMAL",
        bidStatus: bid.bidStatus ?? undefined,
      })) || [],
    };

    console.log("getLotDetails - userSaleRegistrations:", sale.userSaleRegistrations?.length || 0);

    return {
      lot: lotDetails,
      auctionTitle: sale.title ?? "Auction",
      userSaleRegistrations: sale.userSaleRegistrations || [],
    };
  } catch (error) {
    console.error("getLotDetails - error:", error);
    return {
      lot: mockLotData,
      auctionTitle: "Auction",
      userSaleRegistrations: [],
    };
  }
}

export default async function LotDetailPage({
  params,
}: {
  params: { auctionId: string; lotId: string };
}) {
  const auctionId = (await params).auctionId;
  const lotId = (await params).lotId;

  // Get session for authenticated requests
  const session = await getServerSession(authOptions);
  const bidderToken = session?.bidderToken;

  console.log("LDP page - session:", session?.user?.id, "bidderToken:", bidderToken ? "present" : "missing");

  const data = await getLotDetails(auctionId, lotId, bidderToken);

  if (data === null) return "Something went wrong";

  return (
    <LDP
      lotData={data.lot}
      auctionId={auctionId}
      auctionTitle={data.auctionTitle}
      userSaleRegistrations={data.userSaleRegistrations}
    />
  );
}

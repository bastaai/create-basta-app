import { createClientApiClient } from "@bastaai/basta-js";
import LDP, { Lot } from "./LDP";
import type { SaleRegistration } from "@/components/registration-modal";

// Mock lot data (amounts in minor currency - cents)
const mockLotData: Lot = {
  lotNumber: 42,
  title: "Abstract Composition in Blue and Gold",
  currency: "USD",
  lowEstimate: 4500000,  // $45,000
  highEstimate: 6500000, // $65,000
  currentBid: 4800000,   // $48,000
  startingBid: 4000000,  // $40,000
  bidsCount: 12,
  nextAsks: [5000000, 5200000, 5500000, 6000000, 6500000], // Available bid amounts
  images: [
    "/abstract-painting-blue-gold.jpg",
    "/abstract-painting-detail-1.jpg",
    "/abstract-painting-detail-2.jpg",
    "/abstract-painting-signature.jpg",
  ],
  closingDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
};

interface LotPageData {
  lot: Lot;
  auctionTitle: string;
  userSaleRegistrations: SaleRegistration[];
}

async function getLotDetails(auctionId: string, lotId: string): Promise<LotPageData | null> {
  if (["1", "2"].includes(auctionId)) {
    return {
      lot: mockLotData,
      auctionTitle: "Spring Contemporary Art Auction",
      userSaleRegistrations: [],
    };
  }

  if (!process.env.ACCOUNT_ID || !process.env.API_KEY) {
    console.error("Missing env variables: ACCOUNT_ID | API_KEY");
    return null;
  }

  const client = createClientApiClient({
    headers: {
      "x-account-id": process.env.ACCOUNT_ID,
      "x-api-key": process.env.API_KEY,
    },
  });

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
        currency: true,
        estimates: {
          low: true,
          high: true,
        },
        currentBid: true,
        startingBid: true,
        nextAsks: true,
        totalBids: true,
        images: { url: true },
        dates: {
          closingEnd: true,
          closingStart: true,
          openDate: true,
        },
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
      currency: saleItem.currency,
      lowEstimate: saleItem.estimates?.low,
      highEstimate: saleItem.estimates?.high,
      currentBid: saleItem.currentBid,
      startingBid: saleItem.startingBid,
      bidsCount: saleItem.totalBids,
      nextAsks: saleItem.nextAsks || [],
      images: saleItem.images?.map((img: any) => img.url) || [],
      closingDate: saleItem.dates?.closingEnd ?? null,
    };

    return {
      lot: lotDetails,
      auctionTitle: sale.title ?? "Auction",
      userSaleRegistrations: sale.userSaleRegistrations || [],
    };
  } catch {
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

  const data = await getLotDetails(auctionId, lotId);

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

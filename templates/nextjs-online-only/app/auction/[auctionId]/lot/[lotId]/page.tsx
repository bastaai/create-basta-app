import LDP, { Lot, Sale } from "./LDP";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getClientApiClient } from "@/lib/basta-client";

// Create a const query to extract types from
const lotPageQuery = (auctionId: string, lotId: string, client: ReturnType<typeof getClientApiClient>) =>
  client.query({
    saleItem: {
      __args: {
        saleId: auctionId,
        itemId: lotId,
      },
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
      bidStatus: true,
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
      status: true,
      reserveMet: true,
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
  });

export async function getItemDetails(auctionId: string, itemId: string, bidderToken?: string): Promise<Lot | null> {
  const client = getClientApiClient(bidderToken);
  const { saleItem } = await lotPageQuery(auctionId, itemId, client);
  return mapItemToLot(saleItem);
}

export default async function LotDetailPage({
  params,
}: {
  params: Promise<{ auctionId: string; lotId: string }>;
}) {
  const { auctionId, lotId: itemId } = await params;

  // Get session for authenticated requests
  const session = await getServerSession(authOptions);
  const bidderToken = session?.bidderToken;

  // Fetch initial data server-side
  const client = getClientApiClient(bidderToken);
  const queryResult = await lotPageQuery(auctionId, itemId, client);

  const initialLotData = mapItemToLot(queryResult.saleItem);
  const initialSaleData = mapSaleToSale(queryResult.sale);

  return (
    <LDP
      initialLotData={initialLotData}
      initialSaleData={initialSaleData}
      auctionId={auctionId}
    />
  );
}

// Type aliases for the mapper functions
// Extract the result type from the GraphQL query operation
type LotPageQueryResultType = Awaited<ReturnType<typeof lotPageQuery>>;
export type SaleItemDataType = NonNullable<LotPageQueryResultType['saleItem']>;
export type SaleDataType = NonNullable<LotPageQueryResultType['sale']>;

export const mapItemToLot = (item: SaleItemDataType): Lot => {
  return {
    id: item.id,
    lotNumber: item.itemNumber,
    title: item.title ?? undefined,
    description: item.description ?? undefined,
    currency: item.currency ?? "USD",
    lowEstimate: item.estimates?.low ?? 0,
    highEstimate: item.estimates?.high ?? 0,
    currentBid: item.currentBid ?? 0,
    startingBid: item.startingBid ?? 0,
    status: item.status,
    bidsCount: item.totalBids ?? undefined,
    nextAsks: item.nextAsks ?? [],
    images: item.images?.map((img) => img.url).filter((url): url is string => url != null) ?? [],
    closingDate: item.dates?.closingEnd ?? null,
    openDate: item.dates?.openDate ?? null,
    closingStart: item.dates?.closingStart ?? null,
    reserveMet: item.reserveMet ?? null,
    reserveStatus: item.reserveStatus ?? null,
    bids: item.bids?.map((bid) => ({
      id: bid.id,
      amount: bid.amount,
      maxAmount: bid.maxAmount ?? undefined,
      bidder: bid.bidderIdentifier ?? "Anonymous",
      date: bid.date,
      bidStatus: bid.bidStatus ?? undefined,
    })) ?? [],
    userBids: item.userBids?.map((bid) => ({
      bidId: bid.id,
      amount: bid.amount,
      maxAmount: bid.maxAmount ?? undefined,
      date: bid.date,
      bidType: (bid.maxAmount ?? 0) > 0 ? "MAX" : "NORMAL",
      bidStatus: bid.bidStatus ?? undefined,
    })) ?? [],
    prevItem: item.prevItem ? {
      id: item.prevItem.id,
      title: item.prevItem.title ?? undefined,
      image: item.prevItem.images?.[0]?.url ?? undefined,
    } : null,
    nextItem: item.nextItem ? {
      id: item.nextItem.id,
      title: item.nextItem.title ?? undefined,
      image: item.nextItem.images?.[0]?.url ?? undefined,
    } : null,
  };
};

export const mapSaleToSale = (sale: SaleDataType): Sale => {
  return {
    id: sale.id,
    title: sale.title ?? "Auction",
    userSaleRegistrations: sale.userSaleRegistrations ?? [],
  };
};
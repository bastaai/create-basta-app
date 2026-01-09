import { type clientApiSchema } from "@bastaai/basta-js";
import { getServerSession } from "next-auth";
import { mockAuctions } from "@/app/_mocks/auctions";
import ADP, { Auction, Lot } from "./ADP";
import { getClientApiClient } from "@/lib/basta-client";
import { authOptions } from "@/lib/auth";

// Mock lot data
const generateLots = (count: number) => {
  const categories = [
    "Painting",
    "Sculpture",
    "Drawing",
    "Print",
    "Photography",
  ];
  const locations = ["New York", "London", "Paris", "Hong Kong"];

  return Array.from({ length: count }, (_, i) => {
    const startingBid = 500000 + i * 100000; // Starting bid in minor currency (cents)
    const hasBids = Math.random() > 0.5;
    return {
      id: `${i + 1}`,
      lotNumber: i + 1,
      title: `Exceptional Artwork ${i + 1}`,
      artist: `Artist Name ${i + 1}`,
      category: categories[i % categories.length],
      location: locations[i % locations.length],
      lowEstimate: 500000 + i * 100000, // In minor currency
      highEstimate: 1000000 + i * 200000, // In minor currency
      image: `/placeholder.svg?height=300&width=400&query=artwork-${i + 1}`,
      currentBid: hasBids ? startingBid + Math.floor(Math.random() * 500000) : null,
      startingBid,
      bidsCount: hasBids ? Math.floor(Math.random() * 20) + 1 : 0,
      reserveMet: hasBids && Math.random() > 0.3 ? true : null, // Randomly set reserve met for some items with bids
    };
  });
};

const allLots = generateLots(100);

async function getAuctionDetails(id: string, bidderToken?: string): Promise<Auction | null> {
  if (["1", "2"].includes(id)) {
    const auction = mockAuctions.find((auction) => auction.id === id);
    if (!auction) return null;

    return { ...auction, lots: allLots };
  }

  if (!process.env.ACCOUNT_ID) {
    console.error("Missing env variable: ACCOUNT_ID");
    return null;
  }

  const client = getClientApiClient(bidderToken);

  try {
    // Get sale details
    const { sale } = await client.query({
      sale: {
        __args: {
          id,
        },
        title: true,
        status: true,
        location: true,
        currency: true,
        externalId: true,
        images: { url: true },
        metafields: {
          nodes: {
            key: true,
            value: true,
          }
        },
        userSaleRegistrations: {
          id: true,
          registrationType: true,
          saleId: true,
          status: true,
          userId: true
        },
        dates: {
          openDate: true,
          closingDate: true,
          liveDate: true,
        },
      },
    });

    // Get items using search endpoint with facets
    const searchData = await client.query({
      search: {
        __args: {
          accountId: process.env.ACCOUNT_ID,
          type: "ITEM",
          query: "*",
          filterBy: `saleId:${id}`,
          orderBy: "itemNumber:asc",
        },
        facets: {
          fieldName: true,
          counts: {
            value: true,
            count: true,
          },
        },
        edges: {
          node: {
            __typename: true,
            on_Item: {
              id: true,
              cursor: true,
              saleId: true,
              itemNumber: true,
              title: true,
              estimates: {
                low: true,
                high: true,
              },
              currentBid: true,
              startingBid: true,
              totalBids: true,
              reserveMet: true,
              images: {
                url: true,
              },
            },
          },
        },
        pageInfo: {
          totalRecords: true,
        },
      },
    });

    const searchResult = searchData.search;
    const lots = searchResult?.edges?.map((edge: any) => {
      const node = edge.node;
      // Access Item fields through the inline fragment
      const lot = node.on_Item || node;
      return {
        id: lot.id,
        lotNumber: lot.itemNumber,
        title: lot.title ?? undefined,
        lowEstimate: lot.estimates?.low,
        highEstimate: lot.estimates?.high,
        image: lot.images?.[0]?.url,
        currentBid: lot.currentBid,
        startingBid: lot.startingBid,
        bidsCount: lot.totalBids,
        reserveMet: lot.reserveMet ?? null,
      };
    }) || [];

    const auctionDetails: Auction = {
      id,
      title: sale.title ?? undefined,
      status: sale.status,
      dates: {
        openDate: sale.dates.openDate ?? undefined,
        closingDate: sale.dates.closingDate ?? undefined,
      },
      lots,
      userSaleRegistrations: sale.userSaleRegistrations || [],
    };
    return auctionDetails;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function getFacets(saleId: string, bidderToken?: string) {
  if (!process.env.ACCOUNT_ID) {
    return [];
  }

  const client = getClientApiClient(bidderToken);

  try {
    const searchData = await client.query({
      search: {
        __args: {
          accountId: process.env.ACCOUNT_ID,
          type: "ITEM",
          query: "*",
          filterBy: `saleId:${saleId}`,
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

    const searchResult = searchData.search;
    return searchResult?.facets || [];
  } catch (error) {
    console.error("Error fetching facets:", error);
    return [];
  }
}

export default async function AuctionDetailPage({
  params,
}: {
  params: { auctionId: string };
}) {
  try {
    const auctionId = (await params).auctionId;

    // Get session for authenticated requests
    const session = await getServerSession(authOptions);
    const bidderToken = session?.bidderToken;

    const auctionDetails = await getAuctionDetails(auctionId, bidderToken);
    const facets = await getFacets(auctionId, bidderToken);

    if (auctionDetails === null) return "Something went wrong";

    const accountId = process.env.ACCOUNT_ID || "";

    return <ADP auctionDetails={auctionDetails} facets={facets} accountId={accountId} />;
  } catch (error) {
    console.error(error);
    return "Something went wrong";
  }
}

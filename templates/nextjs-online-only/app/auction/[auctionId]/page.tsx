import { createClientApiClient, type clientApiSchema } from "@bastaai/basta-js";
import { mockAuctions } from "@/app/_mocks/auctions";
import ADP, { Auction, Lot } from "./ADP";

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
    };
  });
};

const allLots = generateLots(100);

async function getAuctionDetails(id: string): Promise<Auction | null> {
  if (["1", "2"].includes(id)) {
    const auction = mockAuctions.find((auction) => auction.id === id);
    if (!auction) return null;

    return { ...auction, lots: allLots };
  }

  if (!process.env.ACCOUNT_ID) {
    console.error("Missing env variable: ACCOUNT_ID");
    return null;
  }

  const client = createClientApiClient({
    url: "https://client.api.basta.wtf/graphql",
  });

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

    const searchResult = (searchData as any).search;
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

async function getFacets(saleId: string) {
  if (!process.env.ACCOUNT_ID) {
    return [];
  }

  const client = createClientApiClient({
    url: "https://client.api.basta.wtf/graphql",
  });

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
      } as any,
    });

    const searchResult = (searchData as any).search;
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
    const auctionDetails = await getAuctionDetails(auctionId);
    const facets = await getFacets(auctionId);

    if (auctionDetails === null) return "Something went wrong";

    const accountId = process.env.ACCOUNT_ID || "";

    return <ADP auctionDetails={auctionDetails} facets={facets} accountId={accountId} />;
  } catch (error) {
    console.error(error);
    return "Something went wrong";
  }
}

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

  return Array.from({ length: count }, (_, i) => ({
    id: `lot-${i + 1}`,
    lotNumber: i + 1,
    title: `Exceptional Artwork ${i + 1}`,
    artist: `Artist Name ${i + 1}`,
    category: categories[i % categories.length],
    location: locations[i % locations.length],
    lowEstimate: 5000 + i * 1000,
    highEstimate: 10000 + i * 2000,
    image: `/placeholder.svg?height=300&width=400&query=artwork-${i + 1}`,
    currentBid: Math.random() > 0.5 ? 6000 + i * 1200 : null,
    bidsCount: Math.floor(Math.random() * 20),
  }));
};

const allLots = generateLots(100);

async function getAuctionDetails(id: string): Promise<Auction | null> {
  if (["1", "2"].includes(id)) {
    const auction = mockAuctions.find((auction) => auction.id === id);
    if (!auction) return null;

    return { ...auction, lots: allLots };
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
    console.log("fetching auction data...");
    const { sale } = await client.query({
      sale: {
        __args: {
          id,
        },
        title: true,
        status: true,
        // location: true,
        dates: {
          openDate: true,
          closingDate: true,
        },
        items: {
          edges: {
            node: {
              id: true,
              itemNumber: true,
              title: true,
              estimates: {
                low: true,
                high: true,
              },
              currentBid: true,
              totalBids: true,
              // artist: true,
            },
          },
        },
      },
    });
    const auctionDetails: Auction = {
      title: sale.title ?? undefined,
      status: sale.status,
      // location: sale.location,
      dates: {
        openDate: sale.dates.openDate ?? undefined,
        closingDate: sale.dates.closingDate ?? undefined,
      },
      lots: sale.items.edges.map(({ node: lot }) => {
        return {
          id: lot.id,
          lotNumber: lot.itemNumber,
          title: lot.title ?? undefined,
          artist: undefined,
          category: undefined,
          location: undefined,
          lowEstimate: lot.estimates.low,
          highEstimate: lot.estimates.high,
          image: undefined,
          currentBid: lot.currentBid,
          bidsCount: lot.totalBids,
        };
      }),
    };
    return auctionDetails;
  } catch {
    return null;
  }
}

export default async function AuctionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const awaited = await params;
  const auctionDetails = await getAuctionDetails(awaited.id);

  if (auctionDetails === null) return "Something went wrong";

  return <ADP auctionDetails={auctionDetails} />;
}

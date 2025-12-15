import { createClientApiClient } from "@bastaai/basta-js";
import LDP, { Lot } from "./LDP";

// Mock lot data
const lotData = {
  lotNumber: 42,
  title: "Abstract Composition in Blue and Gold",
  artist: "Jean-Michel Dubois",
  year: "1987",
  medium: "Oil on canvas",
  dimensions: "120 x 150 cm (47.2 x 59 in)",
  signed: "Signed and dated lower right",
  provenance: [
    "Private Collection, Paris",
    "Galerie Moderne, Geneva, 2005",
    "Present owner acquired from the above",
  ],
  exhibited: [
    'Paris, Galerie d\'Art Contemporain, "New Visions", 1988',
    'Geneva, Museum of Modern Art, "French Masters", 2010',
  ],
  literature: [
    'Dubois, J.M., "Complete Catalogue", Vol. 2, Paris, 2000, illustrated p. 156',
  ],
  condition:
    "Excellent condition. Minor surface dirt visible under magnification.",
  lowEstimate: 45000,
  highEstimate: 65000,
  currency: "USD",
  currentBid: 48000,
  bidsCount: 12,
  nextMinBid: 50000,
  images: [
    "/abstract-painting-blue-gold.jpg",
    "/abstract-painting-detail-1.jpg",
    "/abstract-painting-detail-2.jpg",
    "/abstract-painting-signature.jpg",
  ],
};

async function getLotDetails(auctionId: string, lotId: string) {
  if (["1", "2"].includes(auctionId)) {
    return lotData;
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
    const { saleItem } = await client.query({
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
        nextAsks: true,
        totalBids: true,
        images: { url: true },
      },
    });
    const lotDetails: Lot = {
      lotNumber: saleItem.itemNumber,
      title: saleItem.title ?? undefined,
      currency: saleItem.currency,
      lowEstimate: saleItem.estimates.low,
      highEstimate: saleItem.estimates.high,
      currentBid: saleItem.currentBid,
      bidsCount: saleItem.totalBids,
      nextMinBid: saleItem.nextAsks[0]!,
      images: saleItem.images.map(({ url }) => url),
    };
    return lotDetails;
  } catch {
    return lotData;
  }
}

export default async function LotDetailPage({
  params,
}: {
  params: { auctionId: string; lotId: string };
}) {
  const lotDetails = await getLotDetails(
    (
      await params
    ).auctionId,
    (
      await params
    ).lotId
  );

  if (lotDetails === null) return "Something went wrong";

  return <LDP lotData={lotDetails} />;
}

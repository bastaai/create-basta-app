import LDP from "./LDP";

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

async function getLotDetails() {}

export default async function LotDetailPage({
  params,
}: {
  params: { id: string; lotId: string };
}) {
  console.log((await params).id, (await params).lotId);

  return <LDP lotData={lotData} />;
}

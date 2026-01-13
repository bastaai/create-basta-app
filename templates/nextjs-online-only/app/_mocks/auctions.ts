import { clientApiSchema } from "@bastaai/basta-js";

export type Auction = {
  id: string;
  title: string | undefined;
  location: string | undefined;
  dates: {
    openDate: string | undefined;
    closingDate: string | undefined;
  };
  status: clientApiSchema.SaleStatus | undefined;
  image: string | undefined;
  lotsCount: number | undefined;
  label: string | undefined;
  estimate: string | undefined;
};

export const mockAuctions: Auction[] = [
  {
    id: "1",
    title: "Modern & Contemporary Art",
    location: "New York",
    dates: {
      openDate: "2025-03-15T07:00:00",
      closingDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toString(), // Closes in 2 hours
    },
    image: "/modern-contemporary-art-auction.jpg",
    lotsCount: 124,
    status: "LIVE" as const,
    label: "Live Bidding",
    estimate: "$15M - $22M",
  },
  {
    id: "2",
    title: "Impressionist & Post-War Art",
    location: "London",
    dates: {
      openDate: "2025-03-22T19:00:00",
      closingDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toString(), // Close in 5 days
    },
    image: "/impressionist-art-auction.jpg",
    lotsCount: 86,
    status: "PUBLISHED" as const,
    label: "Opening Soon",
    estimate: "$25M - $35M",
  },
];

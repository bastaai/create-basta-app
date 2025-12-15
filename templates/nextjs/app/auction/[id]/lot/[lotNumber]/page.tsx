"use client"

import { AuctionNav } from "@/components/auction-nav"
import { AuctionFooter } from "@/components/auction-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Heart, Share2, Gavel, TrendingUp, FileText, Clock } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useParams } from "next/navigation"

// Mock lot data
const lotData = {
  lotNumber: 42,
  title: "Abstract Composition in Blue and Gold",
  artist: "Jean-Michel Dubois",
  year: "1987",
  medium: "Oil on canvas",
  dimensions: "120 x 150 cm (47.2 x 59 in)",
  signed: "Signed and dated lower right",
  provenance: ["Private Collection, Paris", "Galerie Moderne, Geneva, 2005", "Present owner acquired from the above"],
  exhibited: [
    'Paris, Galerie d\'Art Contemporain, "New Visions", 1988',
    'Geneva, Museum of Modern Art, "French Masters", 2010',
  ],
  literature: ['Dubois, J.M., "Complete Catalogue", Vol. 2, Paris, 2000, illustrated p. 156'],
  condition: "Excellent condition. Minor surface dirt visible under magnification.",
  estimate: {
    low: 45000,
    high: 65000,
    currency: "USD",
  },
  currentBid: 48000,
  bidsCount: 12,
  nextMinBid: 50000,
  images: [
    "/abstract-painting-blue-gold.jpg",
    "/abstract-painting-detail-1.jpg",
    "/abstract-painting-detail-2.jpg",
    "/abstract-painting-signature.jpg",
  ],
}

const bidHistory = [
  { id: 1, amount: 48000, bidder: "Bidder #7352", time: "2 minutes ago" },
  { id: 2, amount: 46000, bidder: "Bidder #2891", time: "15 minutes ago" },
  { id: 3, amount: 44000, bidder: "Bidder #7352", time: "28 minutes ago" },
  { id: 4, amount: 42000, bidder: "Bidder #5623", time: "45 minutes ago" },
  { id: 5, amount: 40000, bidder: "Bidder #2891", time: "1 hour ago" },
  { id: 6, amount: 38000, bidder: "Bidder #7352", time: "2 hours ago" },
  { id: 7, amount: 36000, bidder: "Bidder #1024", time: "3 hours ago" },
  { id: 8, amount: 34000, bidder: "Bidder #5623", time: "5 hours ago" },
]

export default function LotDetailPage() {
  const params = useParams()
  const [selectedImage, setSelectedImage] = useState(0)
  const [bidAmount, setBidAmount] = useState(lotData.nextMinBid.toString())
  const [watchlisted, setWatchlisted] = useState(false)

  const handlePlaceBid = () => {
    // Bid logic would go here
    console.log("Placing bid:", bidAmount)
  }

  return (
    <div className="min-h-screen">
      <AuctionNav />

      {/* Breadcrumb */}
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <Link
            href={`/auction/${params.id}`}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Auction
          </Link>
        </div>
      </div>

      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left Column - Images */}
          <div>
            <div className="sticky top-24">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                <img
                  src={lotData.images[selectedImage] || "/placeholder.svg"}
                  alt={lotData.title}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {lotData.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative aspect-square overflow-hidden rounded border-2 transition-all ${
                      selectedImage === idx ? "border-accent" : "border-border hover:border-accent/50"
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
            </div>
          </div>

          {/* Right Column - Details & Bidding */}
          <div>
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <Badge className="mb-3">Lot {lotData.lotNumber}</Badge>
                <h1 className="font-serif text-3xl font-bold leading-tight text-balance md:text-4xl">
                  {lotData.title}
                </h1>
                <p className="mt-2 text-xl text-accent">{lotData.artist}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setWatchlisted(!watchlisted)}>
                  <Heart className={`h-5 w-5 ${watchlisted ? "fill-current text-accent" : ""}`} />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Quick Details */}
            <div className="mb-6 space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Year:</span> {lotData.year}
              </p>
              <p>
                <span className="text-muted-foreground">Medium:</span> {lotData.medium}
              </p>
              <p>
                <span className="text-muted-foreground">Dimensions:</span> {lotData.dimensions}
              </p>
              <p>
                <span className="text-muted-foreground">Signed:</span> {lotData.signed}
              </p>
            </div>

            <Separator className="my-6" />

            {/* Estimate */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">Estimate</p>
              <p className="text-2xl font-bold">
                ${lotData.estimate.low.toLocaleString()} - ${lotData.estimate.high.toLocaleString()}
              </p>
            </div>

            {/* Current Bid Card */}
            <Card className="mb-6 border-accent/50 bg-accent/5">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Bid</p>
                    <p className="text-3xl font-bold">${lotData.currentBid.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 text-accent">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-sm font-medium">{lotData.bidsCount} bids</span>
                  </div>
                </div>

                {/* Bid Form */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="bidAmount" className="text-sm">
                      Your Maximum Bid (Min: ${lotData.nextMinBid.toLocaleString()})
                    </Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="bidAmount"
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="pl-7"
                      />
                    </div>
                  </div>
                  <Button size="lg" className="w-full" onClick={handlePlaceBid}>
                    <Gavel className="mr-2 h-5 w-5" />
                    Place Bid
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    By placing a bid, you agree to our Terms & Conditions
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Auction Info */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Auction ends in 2 days 5 hours</p>
                    <p className="text-muted-foreground">March 15, 2025 at 2:00 PM EST</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bid History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  Bid History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bidHistory.slice(0, 5).map((bid) => (
                    <div
                      key={bid.id}
                      className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-semibold">${bid.amount.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{bid.bidder}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{bid.time}</p>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-4 w-full bg-transparent" size="sm">
                  View All {lotData.bidsCount} Bids
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full justify-start border-b border-border bg-transparent p-0">
              <TabsTrigger
                value="details"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
              >
                <FileText className="mr-2 h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger
                value="provenance"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
              >
                Provenance & Exhibition
              </TabsTrigger>
              <TabsTrigger
                value="condition"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent"
              >
                Condition Report
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-8">
              <div className="prose prose-sm max-w-none">
                <h3 className="font-serif text-2xl font-bold">About This Work</h3>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  This exceptional abstract composition represents a pivotal moment in Jean-Michel Dubois's career,
                  created during his most productive period in the late 1980s. The work exemplifies his mastery of color
                  theory and compositional balance, with vibrant blues contrasting against luminous gold tones.
                </p>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  The painting's dynamic energy and sophisticated layering technique demonstrate Dubois's innovative
                  approach to abstract expressionism, drawing inspiration from both European and American traditions
                  while developing a distinctly personal visual language.
                </p>
                <h4 className="mt-8 font-semibold">Literature</h4>
                <ul className="mt-2 space-y-1">
                  {lotData.literature.map((item, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="provenance" className="mt-8">
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h3 className="mb-4 font-serif text-xl font-bold">Provenance</h3>
                  <ul className="space-y-2">
                    {lotData.provenance.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-4 font-serif text-xl font-bold">Exhibited</h3>
                  <ul className="space-y-2">
                    {lotData.exhibited.map((item, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="condition" className="mt-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="mb-4 font-serif text-xl font-bold">Condition Report</h3>
                  <p className="leading-relaxed text-muted-foreground">{lotData.condition}</p>
                  <Separator className="my-6" />
                  <p className="text-sm text-muted-foreground">
                    This condition report has been provided by our conservation department and is subject to the terms
                    and conditions of sale. For a more detailed condition report, please contact our specialists.
                  </p>
                  <Button variant="outline" className="mt-4 bg-transparent">
                    Request Detailed Report
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <AuctionFooter />
    </div>
  )
}

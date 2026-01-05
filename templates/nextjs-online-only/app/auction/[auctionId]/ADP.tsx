"use client";

import { AuctionNav } from "@/components/auction-nav";
import { AuctionFooter } from "@/components/auction-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Calendar, Clock, SlidersHorizontal, X } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { DateTime } from "luxon";
import { clientApiSchema, createClientApiClient } from "@bastaai/basta-js";
import { translateItemStatus } from "@/lib/utils";

type Facet = {
  fieldName: string;
  counts: Array<{
    value: string;
    count: number;
  }>;
};

export type Lot = {
  id: string;
  lotNumber: number;
  title: string | undefined;
  lowEstimate: number | null;
  highEstimate: number | null;
  image: string | undefined;
  currentBid: number | null;
  bidsCount: number | undefined;
};

export type Auction = {
  id: string;
  title: string | undefined;
  status: clientApiSchema.SaleStatus | undefined;
  location?: string | undefined;
  dates: {
    openDate: string | undefined;
    closingDate: string | undefined;
  };
  lots: Lot[];
};
export default function AuctionDetailPage({
  auctionDetails,
  facets = [],
  accountId,
}: {
  auctionDetails: Auction;
  facets?: Facet[];
  accountId: string;
}) {
  const [lots, setLots] = useState<Lot[]>(auctionDetails.lots.slice(0, 12));
  const [loading, setLoading] = useState(false);
  const [filteredTotal, setFilteredTotal] = useState(auctionDetails.lots.length);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filters
  const [sortBy, setSortBy] = useState("lotNumber");
  const [selectedFacets, setSelectedFacets] = useState<Record<string, string[]>>({});

  const totalPages = Math.ceil(filteredTotal / itemsPerPage);

  // Create a stable string representation of selectedFacets for dependency tracking
  const selectedFacetsKey = useMemo(() => JSON.stringify(selectedFacets), [selectedFacets]);

  // Build filterBy string from selected facets (Typesense syntax)
  const buildFilterBy = (facets: Record<string, string[]>, saleId: string) => {
    const filters: string[] = [`saleId:${saleId}`];

    Object.entries(facets).forEach(([fieldName, values]) => {
      if (values && values.length > 0) {
        const fieldNameLower = fieldName.toLowerCase();
        const isReserveMet = fieldNameLower === "reservemet" ||
          fieldNameLower.includes("reservemet") ||
          fieldNameLower.includes("reserve_met") ||
          fieldName === "reserveMet";

        const isTags = fieldNameLower === "tags" || fieldNameLower === "tag";

        // For reserveMet (boolean field), use the exact value from the facet
        if (isReserveMet) {
          // Use the exact value as it appears in the facet (don't normalize)
          // Use the same syntax as other fields with = sign
          filters.push(`${fieldName}:=${values[0]}`);
        } else if (isTags) {
          // For tags (array field), always use array syntax even for single values
          // Typesense array field syntax: tags:[house] or tags:[house,art]
          filters.push(`${fieldName}:[${values.join(",")}]`);
        } else {
          // Typesense syntax: for multiple values of the same field, use OR
          // Format: field:[value1,value2] or field:=value1 || field:=value2
          if (values.length === 1) {
            filters.push(`${fieldName}:=${values[0]}`);
          } else {
            // Multiple values: use array syntax or OR
            filters.push(`${fieldName}:[${values.join(",")}]`);
          }
        }
      }
    });

    // Join different fields with && (AND)
    return filters.join(" && ");
  };

  // Convert sort option to Typesense sortBy format
  const getSortBy = (sort: string) => {
    switch (sort) {
      case "lotNumber":
        return "itemNumber:asc";
      case "lotNumberDesc":
        return "itemNumber:desc";
      default:
        return "itemNumber:asc";
    }
  };

  // Fetch filtered lots from API
  const fetchFilteredLots = useCallback(async (
    saleId: string,
    facets: Record<string, string[]>,
    sort: string,
    page: number = 1,
    perPage: number = 12
  ) => {
    // If no accountId, return empty result (will use fallback)
    if (!accountId) {
      return {
        lots: [],
        totalRecords: 0,
        hasNextPage: false,
      };
    }

    setLoading(true);
    try {
      const client = createClientApiClient({
        url: "https://client.api.basta.wtf/graphql",
      });

      const filterBy = buildFilterBy(facets, saleId);
      const sortByValue = getSortBy(sort);

      // Debug logging
      console.log("FilterBy string:", filterBy);
      console.log("Selected facets:", facets);
      console.log("Facets breakdown:", Object.entries(facets).map(([key, val]) => `${key}: [${val.join(", ")}]`));

      const searchData = await client.query({
        search: {
          __args: {
            accountId: accountId,
            type: "ITEM",
            query: "*",
            filterBy,
            sortBy: sortByValue,
            page,
            perPage,
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
                totalBids: true,
                images: {
                  url: true,
                },
              },
            },
          },
          pageInfo: {
            totalRecords: true,
            hasNextPage: true,
          },
        },
      });

      const searchResult = (searchData as any).search;
      const fetchedLots: Lot[] = searchResult?.edges?.map((edge: any) => {
        const lot = edge.node.on_Item || edge.node;
        return {
          id: lot.id,
          lotNumber: lot.itemNumber,
          title: lot.title ?? undefined,
          lowEstimate: lot.estimates?.low,
          highEstimate: lot.estimates?.high,
          image: lot.images?.[0]?.url,
          currentBid: lot.currentBid,
          bidsCount: lot.totalBids,
        };
      }) || [];

      return {
        lots: fetchedLots,
        totalRecords: searchResult?.pageInfo?.totalRecords || 0,
      };
    } catch (error) {
      console.error("Error fetching filtered lots:", error);
      return {
        lots: [],
        totalRecords: 0,
        hasNextPage: false,
      };
    } finally {
      setLoading(false);
    }
  }, [buildFilterBy, accountId, getSortBy]);

  // Toggle facet filter
  const toggleFacet = (fieldName: string, value: string) => {
    console.log("toggleFacet called:", fieldName, value);
    setSelectedFacets((prev) => {
      const currentValues = prev[fieldName] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      const updated = { ...prev };
      if (newValues.length > 0) {
        updated[fieldName] = newValues;
      } else {
        delete updated[fieldName];
      }
      console.log("New selectedFacets:", updated);
      return updated;
    });
  };

  // Fetch filtered lots when filters or sort change
  useEffect(() => {
    console.log("useEffect triggered - selectedFacets changed:", JSON.stringify(selectedFacets));
    console.log("useEffect triggered - sortBy:", sortBy);
    console.log("useEffect triggered - currentPage:", currentPage);
    console.log("useEffect triggered - accountId:", accountId);

    const loadFilteredLots = async () => {
      // On initial load with no filters, use the initial lots from auctionDetails
      const hasFilters = Object.keys(selectedFacets).length > 0;

      // Only skip API call if no accountId OR (no filters AND first page AND default sort)
      if (!accountId) {
        // Fallback to initial lots if no accountId
        let filtered = [...auctionDetails.lots];
        filtered.sort((a, b) => {
          switch (sortBy) {
            case "lotNumber":
              return a.lotNumber - b.lotNumber;
            case "lotNumberDesc":
              return b.lotNumber - a.lotNumber;
            default:
              return 0;
          }
        });
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setLots(filtered.slice(startIndex, endIndex));
        setFilteredTotal(filtered.length);
        return;
      }

      // If no filters on first load, use initial lots (skip API call)
      if (!hasFilters && currentPage === 1 && (sortBy === "lotNumber" || sortBy === "lotNumberDesc")) {
        let filtered = [...auctionDetails.lots];
        filtered.sort((a, b) => {
          switch (sortBy) {
            case "lotNumber":
              return a.lotNumber - b.lotNumber;
            case "lotNumberDesc":
              return b.lotNumber - a.lotNumber;
            default:
              return 0;
          }
        });
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setLots(filtered.slice(startIndex, endIndex));
        setFilteredTotal(filtered.length);
        return;
      }

      // If filters are applied, always make API call
      console.log("Filters applied, making API call. hasFilters:", hasFilters);

      setLoading(true);
      try {
        const client = createClientApiClient({
          url: "https://client.api.basta.wtf/graphql",
        });

        const filterBy = buildFilterBy(selectedFacets, auctionDetails.id);
        const sortByValue = getSortBy(sortBy);

        // Debug logging
        console.log("Making API call with filterBy:", filterBy);
        console.log("Selected facets:", selectedFacets);

        const searchData = await client.query({
          search: {
            __args: {
              accountId: accountId,
              type: "ITEM",
              query: "*",
              filterBy,
              sortBy: sortByValue,
              page: currentPage,
              perPage: itemsPerPage,
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
                  totalBids: true,
                  images: {
                    url: true,
                  },
                },
              },
            },
            pageInfo: {
              totalRecords: true,
              hasNextPage: true,
            },
          },
        });

        const searchResult = (searchData as any).search;
        const fetchedLots: Lot[] = searchResult?.edges?.map((edge: any) => {
          const lot = edge.node.on_Item || edge.node;
          return {
            id: lot.id,
            lotNumber: lot.itemNumber,
            title: lot.title ?? undefined,
            lowEstimate: lot.estimates?.low,
            highEstimate: lot.estimates?.high,
            image: lot.images?.[0]?.url,
            currentBid: lot.currentBid,
            bidsCount: lot.totalBids,
          };
        }) || [];

        // Always use API results
        setLots(fetchedLots);
        setFilteredTotal(searchResult?.pageInfo?.totalRecords || 0);
      } catch (error) {
        console.error("Error fetching filtered lots:", error);
        setLots([]);
        setFilteredTotal(0);
      } finally {
        setLoading(false);
      }
    };

    loadFilteredLots();
  }, [selectedFacetsKey, sortBy, currentPage, accountId, auctionDetails.id, auctionDetails.lots, itemsPerPage]);

  // Reset to page 1 when filters or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFacets, sortBy]);

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <h3 className="mb-3 font-semibold">Sort By</h3>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lotNumber">Lot Number (Low to High)</SelectItem>
            <SelectItem value="lotNumberDesc">
              Lot Number (High to Low)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Facet Filters */}
      {facets
        .filter((facet) => {
          // Exclude lot number, date, account ID, sale ID, and hidden related facets from filtering
          const fieldNameLower = facet.fieldName.toLowerCase();
          return (
            !fieldNameLower.includes("lotnumber") &&
            !fieldNameLower.includes("lot_number") &&
            !fieldNameLower.includes("itemnumber") &&
            !fieldNameLower.includes("item_number") &&
            !fieldNameLower.includes("date") &&
            !fieldNameLower.includes("created") &&
            !fieldNameLower.includes("updated") &&
            !fieldNameLower.includes("opendate") &&
            !fieldNameLower.includes("closingdate") &&
            !fieldNameLower.includes("open_date") &&
            !fieldNameLower.includes("closing_date") &&
            !fieldNameLower.includes("accountid") &&
            !fieldNameLower.includes("account_id") &&
            !fieldNameLower.includes("account") &&
            !fieldNameLower.includes("saleid") &&
            !fieldNameLower.includes("sale_id") &&
            !fieldNameLower.includes("sale") &&
            !fieldNameLower.includes("hidden")
          );
        })
        .map((facet) => {
          const selectedValues = selectedFacets[facet.fieldName] || [];
          if (!facet.counts || facet.counts.length === 0) return null;

          return (
            <div key={facet.fieldName}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold capitalize">
                  {facet.fieldName.replace(/([A-Z])/g, " $1").trim()}
                </h3>
                {selectedValues.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() =>
                      setSelectedFacets((prev) => {
                        const newFacets = { ...prev };
                        delete newFacets[facet.fieldName];
                        return newFacets;
                      })
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {/* Special handling for reserve Met - show as yes/no toggle */}
              {facet.fieldName.toLowerCase().includes("reservemet") ||
                facet.fieldName.toLowerCase().includes("reserve_met") ||
                facet.fieldName.toLowerCase() === "reservemet" ? (
                <div className="space-y-2">
                  {(() => {
                    // Find the "true" value from counts (could be "true", "yes", "1", etc.)
                    const trueValue = facet.counts.find(
                      (count) =>
                        count.value.toLowerCase() === "true" ||
                        count.value.toLowerCase() === "yes" ||
                        count.value === "1" ||
                        count.value.toLowerCase() === "yes" ||
                        count.value.toLowerCase() === "reservemet"
                    );

                    // If no true value found, use the first count value
                    const valueToUse = trueValue?.value || facet.counts[0]?.value;
                    const countToShow = trueValue?.count || facet.counts[0]?.count || 0;
                    const isSelected = selectedValues.length > 0 && selectedValues.includes(valueToUse);

                    if (!valueToUse) return null;

                    return (
                      <div
                        className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                        onClick={() => {
                          if (isSelected) {
                            // Uncheck - remove filter
                            setSelectedFacets((prev) => {
                              const newFacets = { ...prev };
                              delete newFacets[facet.fieldName];
                              return newFacets;
                            });
                          } else {
                            // Check - add filter with the value
                            setSelectedFacets((prev) => ({
                              ...prev,
                              [facet.fieldName]: [valueToUse],
                            }));
                          }
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => {
                            if (isSelected) {
                              setSelectedFacets((prev) => {
                                const newFacets = { ...prev };
                                delete newFacets[facet.fieldName];
                                return newFacets;
                              });
                            } else {
                              setSelectedFacets((prev) => ({
                                ...prev,
                                [facet.fieldName]: [valueToUse],
                              }));
                            }
                          }}
                        />
                        <label className="text-sm flex-1 cursor-pointer">
                          Reserve Met
                        </label>
                        {countToShow > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({countToShow})
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {facet.counts.map((count) => {
                    const isSelected = selectedValues.includes(count.value);
                    // Translate status-like values (e.g., ITEM_NOT_OPEN)
                    const displayValue = translateItemStatus(count.value);
                    return (
                      <div
                        key={count.value}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 p-2 rounded"
                        onClick={() => toggleFacet(facet.fieldName, count.value)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            toggleFacet(facet.fieldName, count.value)
                          }
                        />
                        <label className="text-sm flex-1 cursor-pointer">
                          {displayValue}
                        </label>
                        <span className="text-xs text-muted-foreground">
                          ({count.count})
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );

  const dt = auctionDetails.dates.openDate
    ? DateTime.fromISO(auctionDetails.dates.openDate)
    : undefined;

  // Format status for display
  const getStatusDisplay = (status: string | undefined) => {
    if (!status) return { label: "Unknown", className: "bg-muted text-foreground" };

    const statusMap: Record<string, { label: string; className: string }> = {
      LIVE: {
        label: "Live Now",
        className: "bg-green-500/90 text-white border-0",
      },
      OPENED: {
        label: "Open",
        className: "bg-blue-500/90 text-white border-0",
      },
      PUBLISHED: {
        label: "Upcoming",
        className: "bg-amber-500/90 text-white border-0",
      },
      CLOSING: {
        label: "Closing Soon",
        className: "bg-orange-500/90 text-white border-0",
      },
      CLOSED: {
        label: "Closed",
        className: "bg-muted text-muted-foreground border-border",
      },
    };

    // Check if it's an item status and use the translation utility
    const itemStatusLabel = translateItemStatus(status);
    if (itemStatusLabel !== status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())) {
      return {
        label: itemStatusLabel,
        className: "bg-muted text-foreground",
      };
    }

    return (
      statusMap[status] || {
        label: status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        className: "bg-muted text-foreground",
      }
    );
  };

  const statusDisplay = getStatusDisplay(auctionDetails?.status);

  return (
    <div className="min-h-screen">
      <AuctionNav />

      {/* Auction Header */}
      <section className="border-b border-border bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-start justify-between gap-8">
            <div className="flex-1">
              <Badge className={`mb-4 ${statusDisplay.className}`}>
                {auctionDetails?.status === "LIVE" && (
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                )}
                {statusDisplay.label}
              </Badge>
              <h1 className="font-serif text-4xl font-bold md:text-5xl">
                {auctionDetails?.title}
              </h1>
              <div className="mt-6 flex flex-wrap gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{auctionDetails?.location} location todo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{dt ? dt.toFormat("dd LLL yyyy") : "TBA"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{dt ? dt.toFormat("HH:mm") : "TBA"}</span>
                </div>
              </div>
            </div>
            <div className="hidden flex-col gap-2 md:flex">
              <Button size="lg">Register to Bid</Button>
              <Button size="lg" variant="outline">
                Download Catalogue
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Lots Grid with Filters */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24">
              <FilterPanel />
            </div>
          </aside>

          {/* Lots Grid */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {lots.length} of {filteredTotal} lots
              </p>

              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="lg:hidden bg-transparent"
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterPanel />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {lots.map((lot) => (
                <Link
                  key={lot.id}
                  href={`/auction/${auctionDetails.id}/lot/${lot.id}`}
                >
                  <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={lot.image || "/placeholder.svg"}
                        alt={lot.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <Badge className="absolute left-4 top-4 bg-background/90 text-foreground">
                        Lot {lot.lotNumber}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="mt-1 font-serif text-base font-semibold leading-tight text-balance">
                        {lot.title}
                      </h3>
                      <div className="mt-4 border-t border-border pt-3">
                        {lot.lowEstimate && lot.highEstimate && (
                          <>
                            <p className="text-xs text-muted-foreground">
                              Estimate
                            </p>
                            <p className="font-semibold">
                              ${lot.lowEstimate.toLocaleString()} - $
                              {lot.highEstimate.toLocaleString()}
                            </p>
                          </>
                        )}
                        {lot.currentBid && (
                          <p className="mt-1 text-sm font-medium">
                            Current bid: {lot.currentBid.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Loading indicator / Infinite scroll trigger */}
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) {
                            setCurrentPage(currentPage - 1);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(page);
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      }
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) {
                            setCurrentPage(currentPage + 1);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            {loading && (
              <div className="mt-8 flex justify-center">
                <div className="text-sm text-muted-foreground">
                  Loading lots...
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <AuctionFooter />
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Clock,
  Download,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";

export default function RevenuePage() {
  const { token } = useAuth();

  const { data: summary, isLoading } = useQuery({
    queryKey: ["revenue-summary"],
    queryFn: async () => {
      const res = await fetch("/api/marketplace/revenue/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch revenue summary");
      return res.json();
    },
    enabled: !!token,
  });

  const { data: myListings } = useQuery({
    queryKey: ["my-marketplace-listings"],
    queryFn: async () => {
      const res = await fetch("/api/marketplace/listings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch listings");
      return res.json();
    },
    enabled: !!token,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revenue Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track earnings from marketplace listings and payouts
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : summary ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Earnings
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(summary.totalEarned / 100).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all listings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(summary.totalPayout / 100).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total payouts received
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Listings</CardTitle>
                <ShoppingBag className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.totalListings}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active marketplace items
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Payouts
                </CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.pendingPayouts}
                </div>
                <p className="text-xs text-muted-foreground">
                  ${(summary.pendingAmount / 100).toFixed(2)} pending
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Details */}
          {summary.shares && summary.shares.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Listing Revenue Breakdown
                </CardTitle>
                <CardDescription className="text-xs">
                  Detailed earnings per listing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.shares.map((share: any) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          Listing #{share.listingId}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Platform: {share.platformPercentage}%</span>
                          <span>Seller: {share.sellerPercentage}%</span>
                          <Badge
                            variant={
                              share.payoutStatus === "completed"
                                ? "success"
                                : share.payoutStatus === "pending"
                                  ? "outline"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {share.payoutStatus}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ${(Number(share.sellerPayout) / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          of ${(Number(share.totalEarned) / 100).toFixed(2)}{" "}
                          total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* My Listings */}
          {myListings && Array.isArray(myListings) && myListings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  My Marketplace Listings
                </CardTitle>
                <CardDescription className="text-xs">
                  Items you've published to the marketplace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {myListings
                    .filter((l: any) => l.pricing && !l.pricing.free)
                    .map((listing: any) => (
                      <div
                        key={listing.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{listing.title}</p>
                          <p className="text-xs text-muted-foreground">
                            ${((listing.pricing?.price ?? 0) / 100).toFixed(2)}{" "}
                            | {listing.installCount ?? 0} installs
                          </p>
                        </div>
                        <Badge
                          variant={
                            listing.status === "published"
                              ? "success"
                              : "secondary"
                          }
                        >
                          {listing.status}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(!summary.shares || summary.shares.length === 0) && (
            <Card>
              <CardContent className="p-12 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No revenue data yet. Publish paid listings to start earning.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              Sign in to view your revenue dashboard
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

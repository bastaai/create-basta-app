import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createManagementApiClient } from "@bastaai/basta-js";

export async function POST(request: NextRequest) {
    try {
        // Get authenticated session
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized - Please log in" },
                { status: 401 }
            );
        }

        // Get API credentials from environment
        const apiKey = process.env.API_KEY;
        const accountId = process.env.ACCOUNT_ID;

        if (!apiKey || !accountId) {
            console.error("Missing API_KEY or ACCOUNT_ID environment variables");
            return NextResponse.json(
                { error: "Server configuration error" },
                { status: 500 }
            );
        }

        const client = createManagementApiClient({
            headers: {
                "x-api-key": apiKey,
                "x-account-id": accountId,
            },
            url: "https://management.api.basta.wtf/graphql",
        });

        // Create bidder token for this user
        const tokenRes = await client.mutation({
            createBidderToken: {
                __args: {
                    accountId: accountId,
                    input: {
                        metadata: {
                            userId: session.user.id,
                            ttl: 3600, // 1 hour TTL
                            permissions: ["BID_ON_ITEM", "ACCESS_PRIVATE"],
                        }
                    }
                },
            },
        } as any);

        const bidderToken = (tokenRes as any).createBidderToken;

        if (!bidderToken) {
            return NextResponse.json(
                { error: "Failed to create bidder token" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            token: bidderToken,
        });
    } catch (error) {
        console.error("Token creation error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}


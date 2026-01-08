import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createManagementApiClient } from "@bastaai/basta-js";

export async function POST(request: NextRequest) {
    try {
        // Get authenticated session
        const session = await getServerSession(authOptions);

        console.log("Session in API route:", session);

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized - Please log in" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { saleId } = body;

        if (!saleId) {
            return NextResponse.json(
                { error: "Sale ID is required" },
                { status: 400 }
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

        const res = await client.mutation({
            createSaleRegistration: {
                __args: {
                    accountId: accountId,
                    input: {
                        saleId: saleId,
                        userId: session.user.id,
                        type: "ONLINE",
                        identifier: "",
                        status: "ACCEPTED"
                    }
                },
                id: true,
                rejectedReason: true,
                status: true
            }
        })

        const registration = res.createSaleRegistration

        if (!registration) {
            return NextResponse.json(
                { error: "Failed to create registration" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            registration,
        });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

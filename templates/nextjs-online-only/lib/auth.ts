import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { mockUsers } from "@/app/_mocks/users";
import { createManagementApiClient } from "@bastaai/basta-js";

async function createBidderToken(userId: string): Promise<string | null> {
    const apiKey = process.env.API_KEY;
    const accountId = process.env.ACCOUNT_ID;

    if (!apiKey || !accountId) {
        console.error("Missing API_KEY or ACCOUNT_ID environment variables");
        return null;
    }

    try {
        const client = createManagementApiClient({
            headers: {
                "x-api-key": apiKey,
                "x-account-id": accountId,
            },
            url: "https://management.api.basta.wtf/graphql",
        });

        const tokenRes = await client.mutation({
            createBidderToken: {
                __args: {
                    accountId: accountId,
                    input: {
                        metadata: {
                            userId: userId,
                            ttl: 3600, // 1 hour TTL
                            permissions: ["BID_ON_ITEM", "ACCESS_PRIVATE"],
                        }
                    }
                },
            },
        } as any);

        return (tokenRes as any).createBidderToken || null;
    } catch (error) {
        console.error("Failed to create bidder token:", error);
        return null;
    }
}

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET || "development-secret-change-in-production",
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                userId: { label: "User ID", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.userId) return null;

                const user = mockUsers.find((u) => u.id === credentials.userId);
                if (!user) return null;

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger }) {
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                // Fetch bidder token on login
                token.bidderToken = await createBidderToken(user.id) || undefined;
            }
            // Refresh bidder token if it's not present or on update
            if (trigger === "update" || !token.bidderToken) {
                token.bidderToken = await createBidderToken(token.id) || undefined;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id;
                session.user.name = token.name;
                session.user.email = token.email;
            }
            if (token.bidderToken) {
                session.bidderToken = token.bidderToken;
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
};


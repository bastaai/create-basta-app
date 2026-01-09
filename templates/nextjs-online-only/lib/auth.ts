import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { mockUsers } from "@/app/_mocks/users";
import { getManagementApiClient, getAccountId } from "@/lib/basta-client";

async function createBidderToken(userId: string): Promise<string | null> {
    if (!userId) {
        console.error("createBidderToken: userId is required");
        return null;
    }

    try {
        const client = getManagementApiClient();
        const accountId = getAccountId();

        console.log("Creating bidder token for user:", userId);

        const tokenRes = await client.mutation({
            createBidderToken: {
                __args: {
                    accountId: accountId,
                    input: {
                        metadata: {
                            userId: userId,
                            ttl: 3600, // 1 hour TTL
                        }
                    }
                },
                __typename: true,
                token: true,
                expiration: true,
            },
        });

        const token = tokenRes.createBidderToken?.token || null;
        console.log("Bidder token created:", token ? "success" : "failed");
        return token;
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
                const bidderToken = await createBidderToken(user.id);
                if (bidderToken) {
                    token.bidderToken = bidderToken;
                }
            }
            // Refresh bidder token if it's not present or on update
            if ((trigger === "update" || !token.bidderToken) && token.id) {
                const bidderToken = await createBidderToken(token.id as string);
                if (bidderToken) {
                    token.bidderToken = bidderToken;
                }
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


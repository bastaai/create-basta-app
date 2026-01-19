import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { mockUsers } from "@/app/_mocks/users";
import { getManagementApiClient, getAccountId } from "@/lib/basta-client";

type BidderTokenData = {
    token: string;
    expiration: string;
};

async function createBidderToken(userId: string): Promise<BidderTokenData | null> {
    if (!userId) {
        console.error("createBidderToken: userId is required");
        return null;
    }

    try {
        const client = getManagementApiClient();
        const accountId = getAccountId();

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

        const bidderToken = tokenRes.createBidderToken;
        if (!bidderToken?.token || !bidderToken?.expiration) {
            console.error("Failed to create bidder token: missing token or expiration");
            return null;
        }

        return {
            token: bidderToken.token,
            expiration: bidderToken.expiration,
        };
    } catch (error) {
        console.error("Failed to create bidder token:", error);
        return null;
    }
}

function isTokenExpired(expiration: string | undefined): boolean {
    if (!expiration) return true;
    const expirationTime = new Date(expiration).getTime();
    const now = Date.now();
    // Consider token expired if it expires in less than 5 minutes
    const bufferMs = 5 * 60 * 1000;
    return expirationTime - now < bufferMs;
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
                const bidderTokenData = await createBidderToken(user.id);
                if (bidderTokenData) {
                    token.bidderToken = bidderTokenData.token;
                    token.bidderTokenExpiration = bidderTokenData.expiration;
                }
            }

            // Check if bidder token is expired or missing and refresh it
            const needsRefresh =
                trigger === "update" ||
                !token.bidderToken ||
                isTokenExpired(token.bidderTokenExpiration as string | undefined);

            if (needsRefresh && token.id) {
                const bidderTokenData = await createBidderToken(token.id as string);
                if (bidderTokenData) {
                    token.bidderToken = bidderTokenData.token;
                    token.bidderTokenExpiration = bidderTokenData.expiration;
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
                session.bidderToken = token.bidderToken as string;
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


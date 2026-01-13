"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { ReactNode, useState, useEffect } from "react";
import { BastaProvider } from "@bastaai/basta-js/client";

function BastaClientProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [bidderToken, setBidderToken] = useState<string | null>(null);

    useEffect(() => {
        // Only fetch token when user is authenticated
        if (status === "authenticated" && !bidderToken) {
            fetch("/api/protected/token", { method: "POST" })
                .then((res) => res.json())
                .then((data) => {
                    if (data.token) {
                        setBidderToken(data.token);
                    }
                })
                .catch((err) => console.error("Failed to fetch bidder token:", err));
        }
    }, [status, bidderToken]);

    return (
        <BastaProvider
            clientApi={{
                headers: {
                    ...(bidderToken
                        ? { Authorization: `Bearer ${bidderToken}` }
                        : {}),
                },

                wsConnectionParams: {
                    token: bidderToken,
                }
            }}
        >
            {children}
        </BastaProvider>
    );
}

export function Providers({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <BastaClientProvider>{children}</BastaClientProvider>
        </SessionProvider>
    );
}


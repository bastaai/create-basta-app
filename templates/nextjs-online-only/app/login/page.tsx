"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { mockUsers } from "@/app/_mocks/users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AuctionNav } from "@/components/auction-nav";
import { AuctionFooter } from "@/components/auction-footer";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();

    // Get the callback URL from search params, default to "/"
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    const handleLogin = async (userId: string) => {
        await signIn("credentials", {
            userId,
            callbackUrl,
            redirect: true,
        });
    };

    useEffect(() => {
        if (status === "authenticated" && session) {
            router.push(callbackUrl);
        }
    }, [status, session, router, callbackUrl]);

    if (status === "loading") {
        return (
            <div className="min-h-screen">
                <AuctionNav />
                <div className="container mx-auto px-4 py-20">
                    <div className="text-center">Loading...</div>
                </div>
            </div>
        );
    }

    if (status === "authenticated") {
        return null;
    }

    return (
        <div className="min-h-screen">
            <AuctionNav />
            <div className="container mx-auto px-4 py-20">
                <Card className="mx-auto max-w-2xl">
                    <CardHeader className="text-center">
                        <CardTitle className="font-serif text-3xl font-light tracking-tight">
                            Select a User
                        </CardTitle>
                        <CardDescription className="text-base">
                            Choose a user to log in with
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {mockUsers.map((mockUser) => {
                                const initials = mockUser.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2);

                                return (
                                    <Button
                                        key={mockUser.id}
                                        variant="outline"
                                        className="h-auto flex-col items-start gap-3 p-4 text-left hover:bg-accent"
                                        onClick={() => handleLogin(mockUser.id)}
                                    >
                                        <div className="flex w-full items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback>{initials}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 text-left">
                                                <div className="font-medium">{mockUser.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {mockUser.email}
                                                </div>
                                            </div>
                                        </div>
                                    </Button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <AuctionFooter />
        </div>
    );
}


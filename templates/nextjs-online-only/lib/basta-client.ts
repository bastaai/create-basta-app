import { createClientApiClient, createManagementApiClient } from "@bastaai/basta-js";

const CLIENT_API_URL = "https://client.api.basta.wtf/graphql";
const MANAGEMENT_API_URL = "https://management.api.basta.wtf/graphql";

/**
 * Creates a Basta client API client for read operations and bidding
 * @param bidderToken - Optional bidder token for authenticated operations (bidding)
 */
export function getClientApiClient(bidderToken?: string) {
    return createClientApiClient({
        url: CLIENT_API_URL,
        headers: {
            ...(bidderToken ? { "Authorization": `Bearer ${bidderToken}` } : {}),
        },
    });
}

/**
 * Creates a Basta management API client for server-side operations
 * Requires API_KEY and ACCOUNT_ID environment variables
 */
export function getManagementApiClient() {
    const apiKey = process.env.API_KEY;
    const accountId = process.env.ACCOUNT_ID;

    if (!apiKey || !accountId) {
        throw new Error("Missing API_KEY or ACCOUNT_ID environment variables");
    }

    return createManagementApiClient({
        url: MANAGEMENT_API_URL,
        headers: {
            "x-api-key": apiKey,
            "x-account-id": accountId,
        },
    });
}

/**
 * Get the account ID from environment
 */
export function getAccountId(): string {
    const accountId = process.env.ACCOUNT_ID || process.env.NEXT_PUBLIC_ACCOUNT_ID;
    if (!accountId) {
        throw new Error("Missing ACCOUNT_ID environment variable");
    }
    return accountId;
}


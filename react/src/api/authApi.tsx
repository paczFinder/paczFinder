export type RegisterRole = "courier" | "dispatcher";

export interface RegisterData {
    name: string;
    surname: string;
    email: string;
    password: string;
}

const API_URL = "http://localhost:8082";

export async function registerUser(role: RegisterRole, data: RegisterData): Promise<void> {
    const response = await fetch(`${API_URL}/api/auth/register/${role}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        let message = `Registration failed (${response.status})`;
        try {
            const body = await response.json();
            if (body.message) message = body.message;
        } catch { /* empty */ }
        throw new Error(message);
    }
}

import keycloak from "../keycloak";

const STORAGE_KEY = "kc_tokens";

export type StoredTokens = {
    token: string;
    refreshToken: string;
    idToken?: string;
};

export const saveTokens = (tokens: StoredTokens): void => {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    } catch {
        // storage unavailable – user will just need to log in again after reload
    }
};

export const loadTokens = (): StoredTokens | null => {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as StoredTokens) : null;
    } catch {
        return null;
    }
};

export const clearTokens = (): void => {
    try {
        sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
};

type TokenResponse = {
    access_token: string;
    refresh_token: string;
    id_token?: string;
};

type TokenErrorResponse = {
    error?: string;
    error_description?: string;
};

/**
 * Logs the user in with email + password using Keycloak's token endpoint
 * (Direct Access Grants). On success the tokens are stored and the page is
 * reloaded, so keycloak.init() in main.tsx picks them up.
 */
export async function loginWithPassword(email: string, password: string): Promise<void> {
    if (!keycloak.authServerUrl || !keycloak.realm || !keycloak.clientId) {
        throw new Error("Authentication is not configured");
    }

    const baseUrl = keycloak.authServerUrl.replace(/\/$/, "");
    const tokenUrl = `${baseUrl}/realms/${keycloak.realm}/protocol/openid-connect/token`;

    const body = new URLSearchParams({
        grant_type: "password",
        client_id: keycloak.clientId,
        username: email,
        password,
        scope: "openid",
    });

    let response: Response;
    try {
        response = await fetch(tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body,
        });
    } catch {
        throw new Error("Cannot connect to the server. Try again later.");
    }

    if (!response.ok) {
        let data: TokenErrorResponse = {};
        try {
            data = (await response.json()) as TokenErrorResponse;
        } catch {
            // ignore
        }
        console.error("Keycloak token error:", data); // ← dodaj

        if (data.error === "invalid_grant") {
            const description = data.error_description?.toLowerCase() ?? "";
            if (description.includes("not fully set up")) {
                throw new Error("Your account is not fully set up. Check your email.");
            }
            if (description.includes("disabled")) {
                throw new Error("Your account is disabled.");
            }
            throw new Error("Invalid email or password");
        }

        if (data.error === "unauthorized_client") {
            throw new Error("Login with password is not enabled for this client.");
        }

        throw new Error("Login failed. Try again later.");
    }

    const data = (await response.json()) as TokenResponse;

    saveTokens({
        token: data.access_token,
        refreshToken: data.refresh_token,
        idToken: data.id_token,
    });

    window.location.replace("/");
}
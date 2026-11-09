export type RegisterRole = "courier" | "dispatcher";

export interface RegisterData {
    name: string;
    surname: string;
    email: string;
    password: string;
}

// Jedyny adres backendu: api-gateway. Kubernetes: http://localhost:30080 (domyślnie),
// lokalnie: http://localhost:8000 (ustaw VITE_API_URL w react/.env.local)
export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:30080";

const readErrorMessage = async (response: Response): Promise<string | undefined> => {
    try {
        const body = (await response.json()) as { message?: string };
        return body.message || undefined;
    } catch {
        return undefined;
    }
};

export async function registerUser(role: RegisterRole, data: RegisterData): Promise<void> {
    const response = await fetch(`${API_URL}/api/auth/register/${role}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error((await readErrorMessage(response)) ?? `Registration failed (${response.status})`);
    }
}


const STORAGE_KEY = "auth_tokens";
const MIN_VALIDITY_SECONDS = 30;

export type StoredTokens = {
    token: string;
    refreshToken: string;
};

type TokenResponse = {
    access_token: string;
    refresh_token: string;
};

export const saveTokens = (tokens: StoredTokens): void => {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    } catch {
        //ignore
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

type JwtPayload = {
    exp?: number;
    realm_access?: { roles?: string[] };
};

const decodeJwt = (jwt: string): JwtPayload => {
    try {
        const payload = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(atob(payload)) as JwtPayload;
    } catch {
        return {};
    }
};

const expiresAt = (jwt: string): number => {
    const { exp } = decodeJwt(jwt);
    return exp ? exp * 1000 : 0;
};

const secondsLeft = (jwt: string): number => (expiresAt(jwt) - Date.now()) / 1000;

const storeTokenResponse = (data: TokenResponse): void => {
    saveTokens({ token: data.access_token, refreshToken: data.refresh_token });
};

export const isAuthenticated = (): boolean => {
    const tokens = loadTokens();
    return tokens !== null && secondsLeft(tokens.refreshToken) > 0;
};

export const ROLES = {
    ADMIN: "ADMIN",
    DISPATCHER: "DISPATCHER",
    COURIER: "COURIER",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Role realmu Keycloaka zalogowanego użytkownika (claim realm_access.roles z access tokena). */
export const getUserRoles = (): string[] => {
    const tokens = loadTokens();
    return tokens ? (decodeJwt(tokens.token).realm_access?.roles ?? []) : [];
};

export const hasAnyRole = (roles: readonly Role[]): boolean => {
    const userRoles = getUserRoles();
    return roles.some((role) => userRoles.includes(role));
};

export async function loginWithPassword(email: string, password: string): Promise<void> {
    let response: Response;
    try {
        response = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
    } catch {
        throw new Error("Cannot connect to the server. Try again later.");
    }

    if (!response.ok) {
        const message = await readErrorMessage(response);
        if (response.status === 401) throw new Error("Invalid email or password");
        if (response.status === 403) throw new Error(message ?? "Your account is disabled.");
        if (response.status === 400) throw new Error(message ?? "Invalid email or password");
        throw new Error("Login failed. Try again later.");
    }

    storeTokenResponse((await response.json()) as TokenResponse);
    window.location.replace("/");
}

let refreshInFlight: Promise<boolean> | null = null;

export function refreshTokens(): Promise<boolean> {
    refreshInFlight ??= (async () => {
        const tokens = loadTokens();
        if (!tokens) return false;

        try {
            const response = await fetch(`${API_URL}/api/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: tokens.refreshToken }),
            });

            if (response.status === 401 || response.status === 400) {
                clearTokens();
                return false;
            }
            if (!response.ok) return false;

            storeTokenResponse((await response.json()) as TokenResponse);
            return true;
        } catch {
            return false;
        }
    })().finally(() => {
        refreshInFlight = null;
    });

    return refreshInFlight;
}

export async function getAccessToken(): Promise<string | null> {
    const tokens = loadTokens();
    if (!tokens) return null;

    if (secondsLeft(tokens.token) < MIN_VALIDITY_SECONDS) {
        await refreshTokens();
        return loadTokens()?.token ?? null;
    }
    return tokens.token;
}

let refreshTimer: ReturnType<typeof setTimeout> | undefined;

export function scheduleTokenRefresh(): void {
    clearTimeout(refreshTimer);

    const tokens = loadTokens();
    if (!tokens) return;

    const delayMs = Math.max((secondsLeft(tokens.token) - MIN_VALIDITY_SECONDS) * 1000, 0);
    refreshTimer = setTimeout(() => {
        void refreshTokens().then((ok) => {
            if (ok) {
                scheduleTokenRefresh();
            } else if (!isAuthenticated()) {
                window.location.replace("/");
            } else {
                refreshTimer = setTimeout(scheduleTokenRefresh, 10_000);
            }
        });
    }, delayMs);
}

export async function logout(): Promise<void> {
    const tokens = loadTokens();
    clearTimeout(refreshTimer);
    clearTokens();

    if (tokens) {
        try {
            await fetch(`${API_URL}/api/auth/logout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: tokens.refreshToken }),
            });
        } catch {
            //ignore
        }
    }
}

// ---------------------------------------------------------------------------
// Żądania do API (przez api-gateway) z tokenem zalogowanego użytkownika
// ---------------------------------------------------------------------------

export interface Paginated<T> {
    content: T[];
    totalElements: number;
    page: number;
    size: number;
    totalPages: number;
}

export class ApiError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

type RequestOptions = {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
};

const defaultErrorMessage = (status: number): string => {
    if (status === 403) return "You don't have permission to do this.";
    if (status === 404) return "Not found.";
    if (status >= 500) return "Server error. Try again later.";
    return `Request failed (${status})`;
};

/**
 * Żądanie do backendu przez api-gateway z tokenem użytkownika.
 * Zwraca sparsowany JSON (albo undefined dla 204), a błędy rzuca jako ApiError z polem `message` z backendu.
 */
export async function apiRequest<T>(path: string, { method = "GET", body }: RequestOptions = {}): Promise<T> {
    const token = await getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    let response: Response;
    try {
        response = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new ApiError(0, "Cannot connect to the server. Try again later.");
    }

    if (response.status === 401) {
        await logout();
        window.location.replace("/");
        throw new ApiError(401, "Session expired. Please sign in again.");
    }

    if (!response.ok) {
        let message: string | undefined;
        try {
            message = ((await response.json()) as { message?: string }).message;
        } catch {
            // brak JSON-a w odpowiedzi
        }
        throw new ApiError(response.status, message || defaultErrorMessage(response.status));
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
}

export const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : "Something went wrong. Try again.";

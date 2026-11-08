export type RegisterRole = "courier" | "dispatcher";

export interface RegisterData {
    name: string;
    surname: string;
    email: string;
    password: string;
}

// lokalnie: http://localhost:8082, Kubernetes: http://localhost:30082 (ustaw VITE_AUTH_API_URL w react/.env.local)
const API_URL: string = import.meta.env.VITE_AUTH_API_URL ?? "http://localhost:30082";

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

const expiresAt = (jwt: string): number => {
    try {
        const payload = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const { exp } = JSON.parse(atob(payload)) as { exp?: number };
        return exp ? exp * 1000 : 0;
    } catch {
        return 0;
    }
};

const secondsLeft = (jwt: string): number => (expiresAt(jwt) - Date.now()) / 1000;

const storeTokenResponse = (data: TokenResponse): void => {
    saveTokens({ token: data.access_token, refreshToken: data.refresh_token });
};

export const isAuthenticated = (): boolean => {
    const tokens = loadTokens();
    return tokens !== null && secondsLeft(tokens.refreshToken) > 0;
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

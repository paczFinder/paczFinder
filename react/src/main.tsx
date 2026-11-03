import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import keycloak from "./keycloak";
import { clearTokens, loadTokens, saveTokens } from "./api/authApi";

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error('No "#root" found.');
}

const root = createRoot(rootElement);

const persistTokens = (): void => {
    if (keycloak.token && keycloak.refreshToken) {
        saveTokens({
            token: keycloak.token,
            refreshToken: keycloak.refreshToken,
            idToken: keycloak.idToken,
        });
    }
};

keycloak.onAuthRefreshSuccess = persistTokens;
keycloak.onAuthLogout = clearTokens;
keycloak.onAuthRefreshError = clearTokens;

// keep the access token fresh while the app is open
keycloak.onTokenExpired = () => {
    keycloak.updateToken(30).catch(() => {
        clearTokens();
        window.location.replace("/");
    });
};

async function startApp() {
    const stored = loadTokens();

    try {
        const authenticated = await keycloak.init({
            onLoad: "check-sso",
            pkceMethod: "S256",
            checkLoginIframe: false,
            ...(stored ?? {}),
        });

        if (authenticated) {
            persistTokens();
        } else {
            clearTokens();
        }

        console.log("Keycloak authenticated:", keycloak.authenticated);
    } catch (error) {
        clearTokens();
        console.error("Keycloak init failed:", error);
    } finally {
        root.render(
            <StrictMode>
                <App />
            </StrictMode>
        );
    }
}

void startApp();
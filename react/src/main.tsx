import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import App from "./App";
import { theme } from "./styles/theme";
import { getAccessToken, isAuthenticated, scheduleTokenRefresh } from "./api/authApi";

const rootElement = document.getElementById("root");

if (!rootElement) {
    throw new Error('No "#root" found.');
}

const root = createRoot(rootElement);

async function startApp() {
    if (isAuthenticated()) {
        await getAccessToken();
        scheduleTokenRefresh();
    }

    root.render(
        <StrictMode>
            <ThemeProvider theme={theme}>
                <App />
            </ThemeProvider>
        </StrictMode>
    );
}

void startApp();

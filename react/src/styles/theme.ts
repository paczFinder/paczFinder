import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
    interface PaletteColor {
        subtle: string;
        subtleHover: string;
    }
    interface SimplePaletteColorOptions {
        subtle?: string;
        subtleHover?: string;
    }
}

export const theme = createTheme({
    palette: {
        primary: {
            main: "#2563eb",
            dark: "#1d4ed8",
            light: "#93c5fd",
            subtle: "#dbeafe",
            subtleHover: "#bfdbfe",
            contrastText: "#ffffff",
        },
        success: {
            main: "#16a34a",
        },
        error: {
            main: "#dc2626",
        },
        background: {
            default: "#f5f5f5",
            paper: "#ffffff",
        },
        text: {
            primary: "#171717",
            secondary: "#757575",
            disabled: "#999999",
        },
        grey: {
            300: "#d4d4d4",
        },
        common: {
            black: "#000000",
            white: "#ffffff",
        },
    },
});

import type { ReactNode } from "react";
import { Box, Container, type ContainerProps } from "@mui/material";
import AppNavbar from "./AppNavbar";
import { appPageSx, centeredContentSx, contentSx } from "../styles/AppStyle";

type AppLayoutProps = {
    children: ReactNode;
    maxWidth?: ContainerProps["maxWidth"];
    /** Wyśrodkuj zawartość w pionie (np. strona powitalna po zalogowaniu). */
    centered?: boolean;
};

/** Wspólny układ stron po zalogowaniu: pasek nawigacji + zawartość. */
export default function AppLayout({ children, maxWidth = "lg", centered = false }: AppLayoutProps) {
    return (
        <Box sx={appPageSx()}>
            <AppNavbar />
            <Container maxWidth={maxWidth} sx={centered ? centeredContentSx() : contentSx()}>
                {children}
            </Container>
        </Box>
    );
}

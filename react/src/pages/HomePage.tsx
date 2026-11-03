import {
    AppBar,
    Box,
    Button,
    Container,
    Paper,
    Toolbar,
    Typography,
} from "@mui/material";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import keycloak from "../keycloak";
import { clearTokens } from "../api/authApi";

export default function HomePage() {
    const handleSignOut = (): void => {
        clearTokens();
        void keycloak.logout({
            redirectUri: window.location.origin + "/",
        });
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                bgcolor: "#f5f5f5",
            }}
        >
            <AppBar
                position="static"
                elevation={1}
                sx={{
                    bgcolor: "#ffffff",
                    color: "#171717",
                }}
            >
                <Toolbar
                    sx={{
                        justifyContent: "space-between",
                        px: { xs: 2, sm: 4 },
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                        }}
                    >
                        <LocalShippingRoundedIcon
                            sx={{ color: "#2563eb", fontSize: 30 }}
                        />
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{ fontWeight: 700 }}
                        >
                            DeliveryApp
                        </Typography>
                    </Box>

                    <Button
                        onClick={handleSignOut}
                        startIcon={<LogoutRoundedIcon />}
                        sx={{
                            color: "#525252",
                            textTransform: "none",
                            fontWeight: 600,
                            "&:hover": {
                                bgcolor: "#f5f5f5",
                            },
                        }}
                    >
                        Sign out
                    </Button>
                </Toolbar>
            </AppBar>

            <Container
                maxWidth="md"
                sx={{
                    flexGrow: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 5,
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        width: "100%",
                        minHeight: 280,
                        boxSizing: "border-box",
                        p: { xs: 3, sm: 5 },
                        borderRadius: "8px",
                        bgcolor: "#ffffff",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                    }}
                >
                    <Typography
                        component="h1"
                        sx={{
                            color: "#171717",
                            fontWeight: 700,
                            fontSize: { xs: "1.6rem", sm: "2rem" },
                            mb: 1.5,
                        }}
                    >
                        Welcome to DeliveryApp!
                    </Typography>

                    <Typography
                        sx={{
                            color: "#757575",
                            fontSize: "1rem",
                            lineHeight: 1.7,
                        }}
                    >
                        Successful sign in.
                    </Typography>
                </Paper>
            </Container>
        </Box>
    );
}
import {
    Box,
    Button,
    Container,
    Paper,
    Typography,
} from "@mui/material";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import { useNavigate } from "react-router-dom";

const primaryButtonSx = {
    bgcolor: "#2563eb",
    color: "#ffffff",
    py: "15px",
    px: "30px",
    mb: 1,
    borderRadius: "8px",
    textTransform: "none",
    fontSize: "1rem",
    fontWeight: 600,
    boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
    "&:hover": {
        bgcolor: "#1d4ed8",
        boxShadow: "0 10px 24px rgba(37, 99, 235, 0.35)",
    },
};

export default function WelcomePage() {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                minHeight: "100vh",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#f5f5f5",
                px: 2,
                py: 4,
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 3, sm: 4 },
                        borderRadius: "8px",
                        textAlign: "center",
                        bgcolor: "#ffffff",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.12)",
                    }}
                >
                    <Box
                        sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 84,
                            height: 84,
                            mb: 3,
                            borderRadius: "8px",
                            bgcolor: "#dbeafe",
                            color: "#1d4ed8",
                        }}
                    >
                        <LocalShippingRoundedIcon sx={{ fontSize: 48 }} />
                    </Box>

                    <Typography
                        component="h1"
                        sx={{
                            mb: 2,
                            color: "#171717",
                            fontWeight: 600,
                            fontSize: { xs: "1.8rem", sm: "2.1rem" },
                        }}
                    >
                        Welcome to DeliveryApp!
                    </Typography>

                    <Typography
                        sx={{
                            mb: 3,
                            mx: 1.5,
                            color: "#757575",
                            fontSize: "1rem",
                            lineHeight: 1.6,
                        }}
                    >
                        Manage your deliveries in one place.
                        <br />
                        Sign in or create an account to get started.
                    </Typography>

                    <Box
                        sx={{
                            width: "94%",
                            maxWidth: 360,
                            mx: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                            mt: 1.5,
                        }}
                    >
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            startIcon={<LoginRoundedIcon />}
                            onClick={() => navigate("/login")}
                            sx={primaryButtonSx}
                        >
                            Sign In
                        </Button>

                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            startIcon={<PersonAddAlt1RoundedIcon />}
                            onClick={() => navigate("/register/courier")}
                            sx={primaryButtonSx}
                        >
                            Register as Courier
                        </Button>

                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            startIcon={<PersonAddAlt1RoundedIcon />}
                            onClick={() => navigate("/register/dispatcher")}
                            sx={primaryButtonSx}
                        >
                            Register as Dispatcher
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
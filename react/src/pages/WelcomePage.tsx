import {
    Box, Button, Container, Paper,
    Typography,
} from "@mui/material";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import { useNavigate } from "react-router-dom";
import {
    logoIconSx, logoSx, pageSx, paperSx, subtitleSx, titleSx,
    welcomeButtonSx, welcomeButtonsSx,
} from "../styles/LoginStyle";

export default function WelcomePage() {
    const navigate = useNavigate();

    return (
        <Box
            sx={pageSx()}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={0}
                    sx={paperSx()}
                >
                    <Box
                        sx={logoSx()}
                    >
                        <LocalShippingRoundedIcon sx={logoIconSx()} />
                    </Box>

                    <Typography
                        component="h1"
                        sx={titleSx()}
                    >
                        Welcome to DeliveryApp!
                    </Typography>

                    <Typography
                        sx={subtitleSx()}
                    >
                        Manage your deliveries in one place.
                        <br />
                        Sign in or create an account to get started.
                    </Typography>

                    <Box
                        sx={welcomeButtonsSx()}
                    >
                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            startIcon={<LoginRoundedIcon />}
                            onClick={() => navigate("/login")}
                            sx={welcomeButtonSx()}
                        >
                            Sign In
                        </Button>

                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            startIcon={<PersonAddAlt1RoundedIcon />}
                            onClick={() => navigate("/register/courier")}
                            sx={welcomeButtonSx()}
                        >
                            Register as Courier
                        </Button>

                        <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            startIcon={<PersonAddAlt1RoundedIcon />}
                            onClick={() => navigate("/register/dispatcher")}
                            sx={welcomeButtonSx()}
                        >
                            Register as Dispatcher
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
}
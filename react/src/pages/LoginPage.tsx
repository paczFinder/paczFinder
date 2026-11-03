import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    ButtonBase,
    CircularProgress,
    Container,
    Divider,
    IconButton,
    InputAdornment,
    Paper,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import keycloak from "../keycloak";
import { loginWithPassword } from "../api/authApi";
import { emailRegex } from "../utils/validation";

const MIN_PASSWORD_LENGTH = 8;

const fieldSx = {
    "& .MuiOutlinedInput-root": {
        borderRadius: "8px",
        bgcolor: "#ffffff",
        "& fieldset": { borderColor: "#d4d4d4" },
        "&:hover fieldset": { borderColor: "#2563eb" },
        "&.Mui-focused fieldset": { borderColor: "#2563eb" },
    },
    "& .MuiInputLabel-root.Mui-focused": { color: "#2563eb" },
};

const primaryButtonSx = {
    bgcolor: "#2563eb",
    color: "#ffffff",
    py: "15px",
    px: "30px",
    borderRadius: "8px",
    textTransform: "none",
    fontSize: "1rem",
    fontWeight: 600,
    boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
    "&:hover": {
        bgcolor: "#1d4ed8",
        boxShadow: "0 10px 24px rgba(37, 99, 235, 0.35)",
    },
    "&.Mui-disabled": {
        bgcolor: "#93c5fd",
        color: "#ffffff",
        boxShadow: "none",
    },
};

const devButtonSx = {
    ...primaryButtonSx,
    px: "12px",
    whiteSpace: "nowrap",
};

// Test accounts created by the backend seeder – visible only in dev mode
const DEV_ACCOUNTS = [
    { label: "dev | courier", email: "cuser@wp.pl", password: "User123!" },
    { label: "dev | dispatcher", email: "duser@wp.pl", password: "User123!" },
] as const;

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const initialEmail = (location.state as { email?: string } | null)?.email ?? "";

    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const [touchedEmail, setTouchedEmail] = useState(false);
    const [touchedPassword, setTouchedPassword] = useState(false);

    if (keycloak.authenticated) {
        return <Navigate to="/home" replace />;
    }

    const trimmedEmail = email.trim();
    const isEmailValid = emailRegex.test(trimmedEmail);
    const isPasswordValid = password.length >= MIN_PASSWORD_LENGTH;
    const isFormValid = isEmailValid && isPasswordValid;

    const passwordHelperText = !touchedPassword
        ? " "
        : password.length === 0
            ? "Password is required"
            : !isPasswordValid
                ? `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
                : " ";

    const clearError = (): void => setApiError(null);
    const goToWelcome = (): void => {
        void navigate("/");
    };

    const doLogin = async (loginEmail: string, loginPassword: string): Promise<void> => {
        if (loading) return;

        setApiError(null);
        setLoading(true);

        try {
            await loginWithPassword(loginEmail, loginPassword);
        } catch (err) {
            setApiError(err instanceof Error ? err.message : "Login failed");
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!isFormValid) return;
        await doLogin(trimmedEmail, password);
    };

    const handleDevLogin = (devEmail: string, devPassword: string): void => {
        setEmail(devEmail);
        setPassword(devPassword);
        void doLogin(devEmail, devPassword);
    };

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
                    <ButtonBase
                        onClick={goToWelcome}
                        disabled={loading}
                        aria-label="Back to welcome page"
                        title="Back to welcome page"
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
                            transition: "background-color 0.2s, transform 0.2s",
                            "&:hover": {
                                bgcolor: "#bfdbfe",
                                transform: "translateY(-2px)",
                            },
                            "&.Mui-focusVisible": {
                                outline: "2px solid #2563eb",
                                outlineOffset: "2px",
                            },
                        }}
                    >
                        <LocalShippingRoundedIcon sx={{ fontSize: 48 }} />
                    </ButtonBase>

                    <Typography
                        component="h1"
                        sx={{
                            mb: 2,
                            color: "#171717",
                            fontWeight: 600,
                            fontSize: { xs: "1.8rem", sm: "2.1rem" },
                        }}
                    >
                        Sign In
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
                        Enter your email and password to continue.
                    </Typography>

                    <Box
                        component="form"
                        noValidate
                        onSubmit={handleSubmit}
                        sx={{
                            width: "94%",
                            maxWidth: 360,
                            mx: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            mt: 1.5,
                        }}
                    >
                        <TextField
                            label="Email"
                            type="email"
                            autoComplete="email"
                            autoFocus={initialEmail.length === 0}
                            fullWidth
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setTouchedEmail(true);
                                clearError();
                            }}
                            onBlur={() => setTouchedEmail(true)}
                            disabled={loading}
                            error={touchedEmail && !isEmailValid}
                            helperText={
                                touchedEmail && trimmedEmail.length === 0
                                    ? "Email is required"
                                    : touchedEmail && !isEmailValid
                                        ? "Invalid email format"
                                        : " "
                            }
                            sx={fieldSx}
                        />

                        <TextField
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            autoFocus={initialEmail.length > 0}
                            fullWidth
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setTouchedPassword(true);
                                clearError();
                            }}
                            onBlur={() => setTouchedPassword(true)}
                            disabled={loading}
                            error={touchedPassword && !isPasswordValid}
                            helperText={passwordHelperText}
                            sx={fieldSx}
                            slotProps={{
                                htmlInput: { maxLength: 100 },
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword((v) => !v)}
                                                aria-label={
                                                    showPassword ? "Hide password" : "Show password"
                                                }
                                                edge="end"
                                                sx={{ color: "#757575" }}
                                            >
                                                {showPassword ? (
                                                    <VisibilityOffRoundedIcon />
                                                ) : (
                                                    <VisibilityRoundedIcon />
                                                )}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            fullWidth
                            disabled={loading || !isFormValid}
                            sx={primaryButtonSx}
                        >
                            {loading ? (
                                <CircularProgress size={24} sx={{ color: "#ffffff" }} />
                            ) : (
                                "Sign In"
                            )}
                        </Button>

                        <Button
                            type="button"
                            variant="outlined"
                            size="large"
                            fullWidth
                            disabled={loading}
                            onClick={goToWelcome}
                            sx={{
                                color: "#2563eb",
                                borderColor: "#2563eb",
                                py: "15px",
                                px: "30px",
                                borderRadius: "8px",
                                textTransform: "none",
                                fontSize: "1rem",
                                fontWeight: 600,
                                "&:hover": {
                                    borderColor: "#1d4ed8",
                                    bgcolor: "#dbeafe",
                                },
                            }}
                        >
                            Back
                        </Button>

                        {import.meta.env.DEV && (
                            <>
                                <Divider
                                    sx={{
                                        mt: 1,
                                        color: "#999999",
                                        fontSize: "0.75rem",
                                        fontWeight: 600,
                                    }}
                                >
                                    DEV LOGIN
                                </Divider>

                                <Box sx={{ display: "flex", gap: 1.5 }}>
                                    {DEV_ACCOUNTS.map((account) => (
                                        <Button
                                            key={account.email}
                                            type="button"
                                            variant="contained"
                                            size="large"
                                            fullWidth
                                            disabled={loading}
                                            onClick={() =>
                                                handleDevLogin(account.email, account.password)
                                            }
                                            title={account.email}
                                            sx={devButtonSx}
                                        >
                                            {account.label}
                                        </Button>
                                    ))}
                                </Box>
                            </>
                        )}
                    </Box>
                </Paper>
            </Container>

            <Snackbar
                open={apiError !== null}
                autoHideDuration={6000}
                onClose={clearError}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
                <Alert
                    onClose={clearError}
                    severity="error"
                    variant="filled"
                    elevation={6}
                    sx={{ width: "100%", borderRadius: "8px", fontWeight: 500 }}
                >
                    {apiError}
                </Alert>
            </Snackbar>
        </Box>
    );
}
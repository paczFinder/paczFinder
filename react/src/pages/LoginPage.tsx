import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
    Alert, Box, Button, ButtonBase,
    CircularProgress, Container, Divider, IconButton,
    InputAdornment, Paper, Snackbar, TextField,
    Typography,
} from "@mui/material";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { isAuthenticated, loginWithPassword } from "../api/authApi";
import { emailRegex } from "../utils/validation";
import {
    alertSx, backButtonSx, devButtonSx, devButtonsRowSx, devDividerSx,
    fieldSx, formSx, logoButtonSx, logoIconSx, pageSx, paperSx,
    passwordToggleSx, primaryButtonSx, spinnerSx, subtitleSx, titleSx,
} from "../styles/LoginStyle";

const MIN_PASSWORD_LENGTH = 8;

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

    if (isAuthenticated()) {
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
            sx={pageSx()}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={0}
                    sx={paperSx()}
                >
                    <ButtonBase
                        onClick={goToWelcome}
                        disabled={loading}
                        aria-label="Back to welcome page"
                        title="Back to welcome page"
                        sx={logoButtonSx()}
                    >
                        <LocalShippingRoundedIcon sx={logoIconSx()} />
                    </ButtonBase>

                    <Typography
                        component="h1"
                        sx={titleSx()}
                    >
                        Sign In
                    </Typography>

                    <Typography
                        sx={subtitleSx()}
                    >
                        Enter your email and password to continue.
                    </Typography>

                    <Box
                        component="form"
                        noValidate
                        onSubmit={handleSubmit}
                        sx={formSx()}
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
                            sx={fieldSx()}
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
                            sx={fieldSx()}
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
                                                sx={passwordToggleSx()}
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
                            sx={primaryButtonSx()}
                        >
                            {loading ? (
                                <CircularProgress size={24} sx={spinnerSx()} />
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
                            sx={backButtonSx()}
                        >
                            Back
                        </Button>

                        {import.meta.env.DEV && (
                            <>
                                <Divider
                                    sx={devDividerSx()}
                                >
                                    DEV LOGIN
                                </Divider>

                                <Box sx={devButtonsRowSx()}>
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
                                            sx={devButtonSx()}
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
                    sx={alertSx()}
                >
                    {apiError}
                </Alert>
            </Snackbar>
        </Box>
    );
}
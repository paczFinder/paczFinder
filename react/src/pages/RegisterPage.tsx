import React, { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    ButtonBase,
    CircularProgress,
    Container,
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
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import { registerUser, type RegisterRole } from "../api/authApi";
import { loginWithPassword } from "../api/authApi";
import {
    emailRegex,
    nameRegex,
    surnameRegex,
    passwordRegex,
    uppercaseRegex,
    lowercaseRegex,
    numberRegex,
    specialCharRegex,
    nameOnlyRegex,
} from "../utils/validation";

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

const RequirementRow = ({ valid, label }: { valid: boolean; label: string }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25 }}>
        {valid ? (
            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: "#16a34a" }} />
        ) : (
            <CancelRoundedIcon sx={{ fontSize: 16, color: "#dc2626" }} />
        )}
        <Typography
            sx={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: valid ? "#16a34a" : "#dc2626",
            }}
        >
            {label}
        </Typography>
    </Box>
);

export default function RegisterPage() {
    const navigate = useNavigate();
    const { role } = useParams<{ role: string }>();

    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const [touchedName, setTouchedName] = useState(false);
    const [touchedSurname, setTouchedSurname] = useState(false);
    const [touchedEmail, setTouchedEmail] = useState(false);
    const [touchedPassword, setTouchedPassword] = useState(false);
    const [touchedConfirm, setTouchedConfirm] = useState(false);

    if (role !== "courier" && role !== "dispatcher") {
        return <Navigate to="/" replace />;
    }

    const trimmedName = name.trim();
    const trimmedSurname = surname.trim();
    const trimmedEmail = email.trim();

    const isNameValid = trimmedName.length > 0 && nameRegex.test(trimmedName);
    const isSurnameValid = trimmedSurname.length > 0 && surnameRegex.test(trimmedSurname);
    const isEmailValid = emailRegex.test(trimmedEmail);

    const passwordRequirements = {
        minLength: password.length >= 8,
        hasUppercase: uppercaseRegex.test(password),
        hasLowercase: lowercaseRegex.test(password),
        hasNumber: numberRegex.test(password),
        hasSpecial: specialCharRegex.test(password),
    };

    const isPasswordValid = passwordRegex.test(password);
    const showPasswordRequirements = touchedPassword || password.length > 0;

    const isFormValid =
        isNameValid &&
        isSurnameValid &&
        isEmailValid &&
        isPasswordValid &&
        password === confirmPassword;

    const clearError = (): void => setApiError(null);

    const goToWelcome = (): void | Promise<void> => navigate("/");

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!isFormValid || loading) return;

        setApiError(null);
        setLoading(true);

        try {
            await registerUser(role as RegisterRole, {
                name: trimmedName,
                surname: trimmedSurname,
                email: trimmedEmail,
                password,
            });
        } catch (err) {
            setApiError(err instanceof Error ? err.message : "Registration failed");
            setLoading(false);
            return;
        }

        try {
            await loginWithPassword(trimmedEmail, password);
        } catch {
            // account created, but automatic login failed – let the user sign in manually
            navigate("/login", { replace: true, state: { email: trimmedEmail } });
        }
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
                        {role === "courier" ? "Register as Courier" : "Register as Dispatcher"}
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
                        Fill in your details to create an account.
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
                            label="Name"
                            fullWidth
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value.replace(nameOnlyRegex, ""));
                                setTouchedName(true);
                                clearError();
                            }}
                            onBlur={() => setTouchedName(true)}
                            disabled={loading}
                            error={touchedName && !isNameValid}
                            helperText={
                                touchedName && trimmedName.length === 0
                                    ? "Name is required"
                                    : touchedName && !isNameValid
                                        ? "Name can contain only letters, spaces and hyphens"
                                        : " "
                            }
                            sx={fieldSx}
                            slotProps={{ htmlInput: { maxLength: 50 } }}
                        />

                        <TextField
                            label="Surname"
                            fullWidth
                            value={surname}
                            onChange={(e) => {
                                setSurname(e.target.value.replace(nameOnlyRegex, ""));
                                setTouchedSurname(true);
                                clearError();
                            }}
                            onBlur={() => setTouchedSurname(true)}
                            disabled={loading}
                            error={touchedSurname && !isSurnameValid}
                            helperText={
                                touchedSurname && trimmedSurname.length === 0
                                    ? "Surname is required"
                                    : touchedSurname && !isSurnameValid
                                        ? "Surname can contain only letters, spaces and hyphens"
                                        : " "
                            }
                            sx={fieldSx}
                            slotProps={{ htmlInput: { maxLength: 50 } }}
                        />

                        <TextField
                            label="Email"
                            type="email"
                            autoComplete="email"
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
                            autoComplete="new-password"
                            fullWidth
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setTouchedPassword(true);
                                clearError();
                            }}
                            onBlur={() => setTouchedPassword(true)}
                            disabled={loading}
                            helperText={
                                showPasswordRequirements ? (
                                    <Box sx={{ textAlign: "left", mt: 0.5 }}>
                                        <RequirementRow
                                            valid={passwordRequirements.minLength}
                                            label="At least 8 characters"
                                        />
                                        <RequirementRow
                                            valid={passwordRequirements.hasUppercase}
                                            label="One uppercase letter"
                                        />
                                        <RequirementRow
                                            valid={passwordRequirements.hasLowercase}
                                            label="One lowercase letter"
                                        />
                                        <RequirementRow
                                            valid={passwordRequirements.hasNumber}
                                            label="One number"
                                        />
                                        <RequirementRow
                                            valid={passwordRequirements.hasSpecial}
                                            label="One special character"
                                        />
                                    </Box>
                                ) : (
                                    " "
                                )
                            }
                            sx={fieldSx}
                            slotProps={{
                                formHelperText: { component: "div" },
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

                        <TextField
                            label="Confirm password"
                            type={showConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            fullWidth
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setTouchedConfirm(true);
                                clearError();
                            }}
                            onBlur={() => setTouchedConfirm(true)}
                            disabled={loading}
                            error={
                                touchedConfirm &&
                                confirmPassword.length > 0 &&
                                confirmPassword !== password
                            }
                            helperText={
                                touchedConfirm &&
                                confirmPassword.length > 0 &&
                                confirmPassword !== password
                                    ? "Passwords do not match"
                                    : " "
                            }
                            sx={fieldSx}
                            slotProps={{
                                htmlInput: { maxLength: 100 },
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowConfirmPassword((v) => !v)}
                                                aria-label={
                                                    showConfirmPassword
                                                        ? "Hide password"
                                                        : "Show password"
                                                }
                                                edge="end"
                                                sx={{ color: "#757575" }}
                                            >
                                                {showConfirmPassword ? (
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
                            sx={{
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
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={24} sx={{ color: "#ffffff" }} />
                            ) : (
                                "Create account"
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
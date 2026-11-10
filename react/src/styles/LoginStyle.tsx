import { alpha } from "@mui/material/styles";
import { theme } from "./theme";

const { palette } = theme;

export const fieldSx = () => ({
    "& .MuiOutlinedInput-root": {
        borderRadius: "8px",
        bgcolor: palette.background.paper,
        "& fieldset": { borderColor: palette.grey[300] },
        "&:hover fieldset": { borderColor: palette.primary.main },
        "&.Mui-focused fieldset": { borderColor: palette.primary.main },
    },
    "& .MuiInputLabel-root.Mui-focused": { color: palette.primary.main },
});

export const primaryButtonSx = () => ({
    bgcolor: palette.primary.main,
    color: palette.primary.contrastText,
    py: "15px",
    px: "30px",
    borderRadius: "8px",
    textTransform: "none",
    fontSize: "1rem",
    fontWeight: 600,
    boxShadow: `0 8px 20px ${alpha(palette.primary.main, 0.25)}`,
    "&:hover": {
        bgcolor: palette.primary.dark,
        boxShadow: `0 10px 24px ${alpha(palette.primary.main, 0.35)}`,
    },
    "&.Mui-disabled": {
        bgcolor: palette.primary.light,
        color: palette.primary.contrastText,
        boxShadow: "none",
    },
});

export const devButtonSx = () => ({
    ...primaryButtonSx(),
    px: "12px",
    whiteSpace: "nowrap",
});

export const pageSx = () => ({
    minHeight: "100vh",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    bgcolor: palette.background.default,
    px: 2,
    py: 4,
});

export const paperSx = () => ({
    p: { xs: 3, sm: 4 },
    borderRadius: "8px",
    textAlign: "center",
    bgcolor: palette.background.paper,
    boxShadow: `0 2px 4px ${alpha(palette.common.black, 0.12)}`,
});

export const logoSx = () => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 84,
    height: 84,
    mb: 3,
    borderRadius: "8px",
    bgcolor: palette.primary.subtle,
    color: palette.primary.dark,
});

export const logoButtonSx = () => ({
    ...logoSx(),
    transition: "background-color 0.2s, transform 0.2s",
    "&:hover": {
        bgcolor: palette.primary.subtleHover,
        transform: "translateY(-2px)",
    },
    "&.Mui-focusVisible": {
        outline: `2px solid ${palette.primary.main}`,
        outlineOffset: "2px",
    },
});

export const logoIconSx = () => ({
    fontSize: 48,
});

export const titleSx = () => ({
    mb: 2,
    color: palette.text.primary,
    fontWeight: 600,
    fontSize: { xs: "1.8rem", sm: "2.1rem" },
});

export const subtitleSx = () => ({
    mb: 3,
    mx: 1.5,
    color: palette.text.secondary,
    fontSize: "1rem",
    lineHeight: 1.6,
});

export const formSx = () => ({
    width: "94%",
    maxWidth: 360,
    mx: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    mt: 1.5,
});

export const passwordToggleSx = () => ({
    color: palette.text.secondary,
});

export const spinnerSx = () => ({
    color: palette.primary.contrastText,
});

export const backButtonSx = () => ({
    color: palette.primary.main,
    borderColor: palette.primary.main,
    py: "15px",
    px: "30px",
    borderRadius: "8px",
    textTransform: "none",
    fontSize: "1rem",
    fontWeight: 600,
    "&:hover": {
        borderColor: palette.primary.dark,
        bgcolor: palette.primary.subtle,
    },
});

export const devDividerSx = () => ({
    mt: 1,
    color: palette.text.disabled,
    fontSize: "0.75rem",
    fontWeight: 600,
});

export const devButtonsRowSx = () => ({
    display: "flex",
    gap: 1.5,
});

export const alertSx = () => ({
    width: "100%",
    borderRadius: "8px",
    fontWeight: 500,
});

const requirementColor = (valid: boolean) => (valid ? palette.success.main : palette.error.main);

export const requirementsListSx = () => ({
    textAlign: "left",
    mt: 0.5,
});

export const requirementRowSx = () => ({
    display: "flex",
    alignItems: "center",
    gap: 0.75,
    mb: 0.25,
});

export const requirementIconSx = (valid: boolean) => ({
    fontSize: 16,
    color: requirementColor(valid),
});

export const requirementLabelSx = (valid: boolean) => ({
    fontSize: "0.8rem",
    fontWeight: 600,
    color: requirementColor(valid),
});

export const welcomeButtonsSx = () => ({
    ...formSx(),
    gap: 0.5,
});

export const welcomeButtonSx = () => ({
    ...primaryButtonSx(),
    mb: 1,
});

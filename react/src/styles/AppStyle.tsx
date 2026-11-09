import { alpha } from "@mui/material/styles";
import { theme } from "./theme";
import { backButtonSx, fieldSx, primaryButtonSx } from "./LoginStyle";

const { palette } = theme;

export const appPageSx = () => ({
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    bgcolor: palette.background.default,
});

export const appBarSx = () => ({
    bgcolor: palette.background.paper,
    color: palette.text.primary,
});

export const toolbarSx = () => ({
    justifyContent: "space-between",
    gap: 1,
    px: { xs: 2, sm: 4 },
});

export const brandSx = () => ({
    display: "flex",
    alignItems: "center",
    gap: 1.5,
});

export const brandIconSx = () => ({
    color: palette.primary.main,
    fontSize: 30,
});

export const brandTextSx = () => ({
    fontWeight: 700,
    display: { xs: "none", sm: "block" },
});

export const navSx = () => ({
    display: "flex",
    alignItems: "center",
    gap: { xs: 0.5, sm: 1 },
});

export const navButtonSx = (active: boolean) => ({
    minWidth: 0,
    px: { xs: 1, sm: 1.5 },
    borderRadius: "8px",
    textTransform: "none",
    fontWeight: 600,
    color: active ? palette.primary.main : palette.text.secondary,
    bgcolor: active ? palette.primary.subtle : "transparent",
    "& .MuiButton-startIcon": {
        mr: { xs: 0, sm: 1 },
        ml: { xs: 0, sm: -0.5 },
    },
    "&:hover": {
        bgcolor: active ? palette.primary.subtleHover : palette.background.default,
    },
});

export const navLabelSx = () => ({
    display: { xs: "none", sm: "inline" },
});

export const contentSx = () => ({
    flexGrow: 1,
    py: { xs: 3, sm: 5 },
});

export const centeredContentSx = () => ({
    ...contentSx(),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
});

export const cardSx = () => ({
    p: { xs: 2, sm: 3 },
    borderRadius: "8px",
    bgcolor: palette.background.paper,
    boxShadow: `0 2px 8px ${alpha(palette.common.black, 0.08)}`,
});

export const homeCardSx = () => ({
    ...cardSx(),
    width: "100%",
    minHeight: 280,
    boxSizing: "border-box",
    p: { xs: 3, sm: 5 },
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
});

export const headingSx = () => ({
    color: palette.text.primary,
    fontWeight: 700,
    fontSize: { xs: "1.6rem", sm: "2rem" },
    mb: 1.5,
});

export const bodyTextSx = () => ({
    color: palette.text.secondary,
    fontSize: "1rem",
    lineHeight: 1.7,
});

export const pageHeaderSx = () => ({
    display: "flex",
    flexDirection: { xs: "column", sm: "row" },
    alignItems: { xs: "stretch", sm: "center" },
    justifyContent: "space-between",
    gap: 2,
    mb: 3,
});

export const pageTitleSx = () => ({
    ...headingSx(),
    mb: 0.5,
});

export const headerActionsSx = () => ({
    display: "flex",
    gap: 1,
});

export const compactPrimaryButtonSx = () => ({
    ...primaryButtonSx(),
    py: 1,
    px: 2.5,
    boxShadow: "none",
    whiteSpace: "nowrap",
    "&:hover": {
        bgcolor: palette.primary.dark,
        boxShadow: "none",
    },
});

export const compactSecondaryButtonSx = () => ({
    ...backButtonSx(),
    py: 1,
    px: 2.5,
    whiteSpace: "nowrap",
});

export const dangerButtonSx = () => ({
    ...compactPrimaryButtonSx(),
    bgcolor: palette.error.main,
    "&:hover": {
        bgcolor: palette.error.dark,
        boxShadow: "none",
    },
});

export const tableHeadCellSx = () => ({
    fontWeight: 700,
    color: palette.text.secondary,
    whiteSpace: "nowrap",
});

export const nowrapCellSx = () => ({
    whiteSpace: "nowrap",
});

export const monoTextSx = () => ({
    fontFamily: "monospace",
    fontSize: "0.85rem",
});

export const mutedTextSx = () => ({
    color: palette.text.disabled,
});

export const actionsCellSx = () => ({
    whiteSpace: "nowrap",
    textAlign: "right",
});

export const actionIconSx = () => ({
    color: palette.text.secondary,
    "&:hover": {
        color: palette.primary.main,
        bgcolor: palette.primary.subtle,
    },
});

export const dangerIconSx = () => ({
    color: palette.text.secondary,
    "&:hover": {
        color: palette.error.main,
        bgcolor: alpha(palette.error.main, 0.08),
    },
});

export const stateBoxSx = () => ({
    py: 6,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    color: palette.text.secondary,
    textAlign: "center",
});

export const dialogPaperSx = () => ({
    borderRadius: "8px",
});

export const dialogTitleSx = () => ({
    fontWeight: 700,
    color: palette.text.primary,
});

export const dialogFormSx = () => ({
    display: "flex",
    flexDirection: "column",
    gap: 1,
    pt: 1,
});

export const dialogActionsSx = () => ({
    px: 3,
    pb: 2.5,
    gap: 1,
});

export const detailsListSx = () => ({
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    columnGap: 3,
    rowGap: 1.5,
    pt: 1,
});

export const detailsRowSx = () => ({
    display: "contents",
});

export const detailsLabelSx = () => ({
    color: palette.text.secondary,
    fontWeight: 600,
});

export const detailsValueSx = () => ({
    color: palette.text.primary,
    wordBreak: "break-all",
});

export const listToolbarSx = () => ({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 1,
    mb: 2,
});

export const filterChipsSx = () => ({
    display: "flex",
    flexWrap: "wrap",
    gap: 1,
});

export const popoverPaperSx = () => ({
    mt: 1,
    borderRadius: "8px",
    boxShadow: `0 8px 24px ${alpha(palette.common.black, 0.12)}`,
});

export const filterFormSx = () => ({
    p: 2.5,
    width: 300,
    maxWidth: "calc(100vw - 32px)",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: 2,
});

export const filterActionsSx = () => ({
    display: "flex",
    justifyContent: "flex-end",
    gap: 1,
});

export const searchIconSx = () => ({
    color: palette.text.secondary,
});

export const menuCheckSx = () => ({
    color: palette.primary.main,
});

export const brandCellSx = () => ({
    display: "flex",
    alignItems: "center",
    gap: 1,
});

/** Ikona auta w wierszu tabeli – niebieska dla aktywnych, wyszarzona dla nieaktywnych. */
export const vehicleIconSx = (active: boolean) => ({
    color: active ? palette.primary.main : palette.text.disabled,
});

/** Ikona na początku wiersza tabeli; wyszarzona np. dla nieaktywnych / zakończonych pozycji. */
export const rowIconSx = (muted = false) => ({
    color: muted ? palette.text.disabled : palette.primary.main,
});

export const formGridSx = () => ({
    display: "grid",
    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
    columnGap: 2,
    pt: 1,
});

export const formFullRowSx = () => ({
    gridColumn: "1 / -1",
});

export const capacityCellSx = () => ({
    minWidth: 140,
});

export const capacityBarSx = () => ({
    mt: 0.5,
    height: 6,
    borderRadius: 3,
    bgcolor: palette.primary.subtle,
});

export const toggleGroupSx = () => ({
    "& .MuiToggleButton-root": {
        px: 2,
        textTransform: "none",
        fontWeight: 600,
        color: palette.text.secondary,
        borderColor: palette.grey[300],
    },
    "& .MuiToggleButton-root.Mui-selected": {
        color: palette.primary.main,
        bgcolor: palette.primary.subtle,
    },
    "& .MuiToggleButton-root.Mui-selected:hover": {
        bgcolor: palette.primary.subtleHover,
    },
});

export const checkListSx = () => ({
    maxHeight: 320,
    overflowY: "auto",
    border: `1px solid ${palette.grey[300]}`,
    borderRadius: "8px",
});

export const sectionTitleSx = () => ({
    mt: 3,
    mb: 1,
    fontWeight: 700,
    color: palette.text.primary,
});

export const helperTextSx = () => ({
    color: palette.text.secondary,
    fontSize: "0.875rem",
});

export const errorTextSx = () => ({
    color: palette.error.main,
    fontSize: "0.875rem",
    fontWeight: 600,
});

/** Pole formularza zajmujące cały wiersz siatki formGridSx. */
export const fullRowFieldSx = () => ({
    ...fieldSx(),
    ...formFullRowSx(),
});

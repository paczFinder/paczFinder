import { alpha, type SxProps, type Theme } from "@mui/material/styles";
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

export const mapBoxSx = () => ({
    width: "100%",
    height: { xs: 400, md: "calc(100vh - 320px)" },
    minHeight: 400,
    borderRadius: "8px",
    overflow: "hidden",
});

export const DELIVERY_PIN_COLORS = {
    ADDED: palette.grey[600],
    IN_DELIVERY: palette.primary.main,
    DELIVERED: palette.success.main,
} as const;

export const SEARCH_PIN_COLOR = palette.error.main;
export const ADDED_PIN_COLOR = palette.warning.main;
export const MAP_MASK_COLOR = palette.grey[800];
export const MAP_MASK_BORDER_COLOR = palette.primary.main;

export const mapSearchSx = () => ({
    ...inlineSearchSx(),
    "& .MuiFormControl-root, & .MuiOutlinedInput-root": { height: "100%" },
});

export const mapToolbarSx = () => ({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 2,
    mb: 2,
});

export const mapPickerSx = () => ({
    width: { xs: "100%", sm: 405 },
});

export const mapLegendSx = () => ({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 2,
    ml: { sm: "auto" },
    color: palette.text.secondary,
    fontSize: 14,
});

export const mapLegendItemSx = () => ({
    display: "flex",
    alignItems: "center",
    gap: 0.75,
});

export const mapLegendDotSx = (color: string) => ({
    width: 12,
    height: 12,
    borderRadius: "50%",
    bgcolor: color,
});

export const mapAlertSx = () => ({
    mb: 2,
});

export const mapProgressSx = () => ({
    width: "100%",
    mb: 1,
});

export const mapPopupSx = () => ({
    display: "flex",
    flexDirection: "column",
    gap: 0.25,
    minWidth: 200,
    "& .MuiTypography-root": { m: 0 },
});

export const mapPopupDividerSx = () => ({
    my: 0.5,
});

export const mapPopupChipsSx = () => ({
    display: "flex",
    gap: 1,
    mt: 0.5,
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

export const toolbarButtonSx = () => ({
    ...compactSecondaryButtonSx(),
    bgcolor: palette.common.white,
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
    "&&": { pt: 1 },
});

export const dialogActionsSx = () => ({
    px: 3,
    pb: 2.5,
    gap: 1,
});

export const courierGridSx = () => ({
    display: "grid",
    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
    gap: 3,
});

export const courierBoxSx = () => ({
    p: 2.5,
    borderRadius: "8px",
    border: `1px solid ${palette.divider}`,
    bgcolor: palette.background.paper,
    boxShadow: `0 2px 6px ${alpha(palette.common.black, 0.08)}`,
});

export const courierBoxHeaderSx = () => ({
    display: "flex",
    alignItems: "center",
    gap: 1,
    mb: 2,
});

export const courierBoxClickableSx = () => ({
    ...courierBoxSx(),
    cursor: "pointer",
    transition: "box-shadow 0.15s, border-color 0.15s",
    "&:hover": {
        borderColor: palette.primary.main,
        boxShadow: `0 4px 14px ${alpha(palette.common.black, 0.14)}`,
    },
    "&:focus-visible": {
        outline: `2px solid ${palette.primary.main}`,
        outlineOffset: 2,
    },
});

export const courierSectionSx = () => ({
    mb: 3,
});

export const courierSectionTitleSx = () => ({
    ...sectionTitleSx(),
    mt: 0,
    mb: 2,
});

export const courierBackButtonSx = () => ({
    alignSelf: { xs: "flex-start", sm: "center" },
});

export const courierBoxTitleSx = () => ({
    color: palette.text.primary,
    fontWeight: 700,
    fontSize: 18,
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

const TOOLBAR_CONTROL_HEIGHT = 46;

export const inlineSearchSx = () => ({
    width: { xs: "100%", sm: 320 },
    alignSelf: "stretch",
    "& .MuiOutlinedInput-root": { height: "100%", minHeight: TOOLBAR_CONTROL_HEIGHT },
});

export const toolbarButtonsSx = (alignRight = false) => ({
    display: "flex",
    gap: 1,
    ...(alignRight && { ml: "auto" }),
});

export const filterChipsSx = (ownRow = false) => ({
    display: "flex",
    flexWrap: "wrap",
    gap: 1,
    ...(ownRow && { flexBasis: "100%", "&:empty": { display: "none" } }),
});

export const popoverPaperSx = () => ({
    mt: 1,
    borderRadius: "8px",
    boxShadow: `0 8px 24px ${alpha(palette.common.black, 0.12)}`,
});

export const filterFormSx = (fitContent = false): SxProps<Theme> => ({
    p: 2.5,
    width: fitContent ? "max-content" : 300,
    minWidth: fitContent ? 220 : 0,
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

export const vehicleIconSx = (active: boolean) => ({
    color: active ? palette.primary.main : palette.text.disabled,
});

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

export const fullRowFieldSx = () => ({
    ...fieldSx(),
    ...formFullRowSx(),
});

export const HISTORY_ROUTE_COLOR = palette.primary.main;

export const historySummarySx = () => ({
    display: "grid",
    gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
    gap: 1.5,
    mt: 1,
});

export const historySummaryTileSx = () => ({
    p: 1.5,
    borderRadius: "8px",
    bgcolor: alpha(palette.primary.main, 0.06),
});

export const historySummaryLabelSx = () => ({
    display: "flex",
    alignItems: "center",
    gap: 0.75,
    color: palette.text.secondary,
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
});

export const historySummaryIconSx = () => ({
    fontSize: 18,
    color: palette.primary.main,
});

export const historySummaryValueSx = () => ({
    color: palette.text.primary,
    fontSize: "1.1rem",
    fontWeight: 700,
});

export const historyMapBoxSx = () => ({
    width: "100%",
    height: 320,
    mt: 1,
    borderRadius: "8px",
    overflow: "hidden",
});

export const stopOrderBadgeSx = () => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    borderRadius: "50%",
    bgcolor: palette.primary.main,
    color: palette.primary.contrastText,
    fontSize: "0.75rem",
    fontWeight: 700,
});

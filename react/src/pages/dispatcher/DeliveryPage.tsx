import { useEffect, useState, type ChangeEvent } from "react";
import {
    Alert, Box, Button, CircularProgress, IconButton, LinearProgress,
    Paper, Snackbar, Table, TableBody, TableCell, TableContainer,
    TableHead, TablePagination, TableRow, ToggleButton, ToggleButtonGroup,
    Tooltip, Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import AppLayout from "../../components/AppLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import { DeliverySizeChip, DeliveryStatusChip } from "../../components/StatusChips";
import DeliveryFormDialog from "../../components/deliveries/DeliveryFormDialog";
import DeliveryDetailsDialog from "../../components/deliveries/DeliveryDetailsDialog";
import DeliveryToolbar from "../../components/deliveries/DeliveryToolbar";
import { getErrorMessage, type Paginated } from "../../api/authApi";
import {
    createDelivery, deleteDelivery, formatAddress, getAvailableDeliveries, getDeliveries, updateDelivery,
    DEFAULT_DELIVERY_QUERY, type Delivery, type DeliveryPayload, type DeliveryQuery,
} from "../../api/deliveryApi";
import { clearFilters, countActiveFilters } from "../../utils/listQuery";
import { alertSx } from "../../styles/LoginStyle";
import {
    actionIconSx, actionsCellSx, bodyTextSx, brandCellSx, cardSx, compactPrimaryButtonSx,
    compactSecondaryButtonSx, dangerIconSx, headerActionsSx, nowrapCellSx,
    pageHeaderSx, pageTitleSx, rowIconSx, stateBoxSx, tableHeadCellSx, toggleGroupSx,
} from "../../styles/AppStyle";

const ROWS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

type Scope = "all" | "available";

type DialogState =
    | { type: "create" }
    | { type: "edit"; delivery: Delivery }
    | { type: "details"; deliveryId: number }
    | { type: "delete"; delivery: Delivery }
    | null;

type Notice = { severity: "success" | "error"; message: string } | null;

export default function DeliveryPage() {
    const [scope, setScope] = useState<Scope>("all");
    const [query, setQuery] = useState<DeliveryQuery>(DEFAULT_DELIVERY_QUERY);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [reloadKey, setReloadKey] = useState(0);

    const [data, setData] = useState<Paginated<Delivery> | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [dialog, setDialog] = useState<DialogState>(null);
    const [notice, setNotice] = useState<Notice>(null);

    // GET /deliveries albo GET /deliveries/available
    useEffect(() => {
        let cancelled = false;
        const request = scope === "available" ? getAvailableDeliveries : getDeliveries;
        request(page, rowsPerPage, query)
            .then((result) => {
                if (cancelled) return;
                setData(result);
                setLoadError(null);
            })
            .catch((err: unknown) => {
                if (!cancelled) setLoadError(getErrorMessage(err));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [scope, page, rowsPerPage, query, reloadKey]);

    const reload = (): void => {
        setLoading(true);
        setReloadKey((key) => key + 1);
    };

    const closeDialog = (): void => setDialog(null);
    const showSuccess = (message: string): void => setNotice({ severity: "success", message });

    const handleScopeChange = (_: unknown, value: Scope | null): void => {
        if (!value || value === scope) return;
        setLoading(true);
        setScope(value);
        // dostępne przesyłki mają zawsze status "Added" – filtr statusu nie ma wtedy sensu
        if (value === "available") setQuery((q) => ({ ...q, status: "all" }));
        setPage(0);
    };

    // zmiana filtrów lub sortowania – wróć na pierwszą stronę
    const handleQueryChange = (newQuery: DeliveryQuery): void => {
        setLoading(true);
        setQuery(newQuery);
        setPage(0);
    };

    const handleChangePage = (_: unknown, newPage: number): void => {
        setLoading(true);
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (e: ChangeEvent<HTMLInputElement>): void => {
        setLoading(true);
        setRowsPerPage(Number(e.target.value));
        setPage(0);
    };

    // POST /deliveries
    const handleCreate = async (payload: DeliveryPayload): Promise<void> => {
        await createDelivery(payload);
        closeDialog();
        showSuccess("Delivery added.");
        reload();
    };

    // PUT /deliveries/{id}
    const handleUpdate = async (id: number, payload: DeliveryPayload): Promise<void> => {
        await updateDelivery(id, payload);
        closeDialog();
        showSuccess("Delivery updated.");
        reload();
    };

    // DELETE /deliveries/{id}
    const handleDelete = async (id: number): Promise<void> => {
        await deleteDelivery(id);
        closeDialog();
        showSuccess("Delivery deleted.");
        if (data && data.content.length === 1 && page > 0) {
            setLoading(true);
            setPage(page - 1);
        } else {
            reload();
        }
    };

    const deliveries = data?.content ?? [];

    return (
        <AppLayout>
            <Box sx={pageHeaderSx()}>
                <Box>
                    <Typography component="h1" sx={pageTitleSx()}>
                        Deliveries
                    </Typography>
                    <Typography sx={bodyTextSx()}>
                        Register parcels and track their status from added to delivered.
                    </Typography>
                </Box>

                <Box sx={headerActionsSx()}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshRoundedIcon />}
                        onClick={reload}
                        disabled={loading}
                        sx={compactSecondaryButtonSx()}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddRoundedIcon />}
                        onClick={() => setDialog({ type: "create" })}
                        sx={compactPrimaryButtonSx()}
                    >
                        Add delivery
                    </Button>
                </Box>
            </Box>

            <DeliveryToolbar
                query={query}
                onChange={handleQueryChange}
                showStatusFilter={scope === "all"}
                leading={
                    <ToggleButtonGroup
                        exclusive
                        size="small"
                        value={scope}
                        onChange={handleScopeChange}
                        aria-label="Which deliveries to show"
                        sx={toggleGroupSx()}
                    >
                        <ToggleButton value="all">All deliveries</ToggleButton>
                        <ToggleButton value="available">Available for a trip</ToggleButton>
                    </ToggleButtonGroup>
                }
            />

            <Paper elevation={0} sx={cardSx()}>
                {loading && data && <LinearProgress />}

                {loading && !data && (
                    <Box sx={stateBoxSx()}>
                        <CircularProgress />
                    </Box>
                )}

                {loadError && !loading && (
                    <Box sx={stateBoxSx()}>
                        <Alert severity="error">{loadError}</Alert>
                        <Button variant="outlined" onClick={reload} sx={compactSecondaryButtonSx()}>
                            Try again
                        </Button>
                    </Box>
                )}

                {data && !loadError && deliveries.length === 0 && !loading && (
                    countActiveFilters(query, DEFAULT_DELIVERY_QUERY) > 0 ? (
                        <Box sx={stateBoxSx()}>
                            <Typography>No deliveries match the filters.</Typography>
                            <Button
                                variant="outlined"
                                onClick={() => handleQueryChange(clearFilters(query, DEFAULT_DELIVERY_QUERY))}
                                sx={compactSecondaryButtonSx()}
                            >
                                Clear filters
                            </Button>
                        </Box>
                    ) : (
                    <Box sx={stateBoxSx()}>
                        <Typography>
                            {scope === "available" ? "No deliveries waiting for a trip." : "No deliveries yet."}
                        </Typography>
                        {scope === "all" && (
                            <Button
                                variant="contained"
                                startIcon={<AddRoundedIcon />}
                                onClick={() => setDialog({ type: "create" })}
                                sx={compactPrimaryButtonSx()}
                            >
                                Add the first delivery
                            </Button>
                        )}
                    </Box>
                    )
                )}

                {data && !loadError && deliveries.length > 0 && (
                    <>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={tableHeadCellSx()}>Recipient</TableCell>
                                        <TableCell sx={tableHeadCellSx()}>Phone</TableCell>
                                        <TableCell sx={tableHeadCellSx()}>Address</TableCell>
                                        <TableCell sx={tableHeadCellSx()}>Size</TableCell>
                                        <TableCell sx={tableHeadCellSx()}>Status</TableCell>
                                        <TableCell sx={tableHeadCellSx()} align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {deliveries.map((delivery) => {
                                        const delivered = delivery.status === "DELIVERED";
                                        return (
                                            <TableRow key={delivery.id} hover>
                                                <TableCell sx={nowrapCellSx()}>
                                                    <Box sx={brandCellSx()}>
                                                        <Inventory2RoundedIcon fontSize="small" sx={rowIconSx(delivered)} />
                                                        {delivery.recipientName}
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={nowrapCellSx()}>{delivery.recipientPhone}</TableCell>
                                                <TableCell>{formatAddress(delivery)}</TableCell>
                                                <TableCell><DeliverySizeChip size={delivery.size} /></TableCell>
                                                <TableCell><DeliveryStatusChip status={delivery.status} /></TableCell>

                                                <TableCell sx={actionsCellSx()}>
                                                    <Tooltip title="Details">
                                                        <IconButton
                                                            size="small"
                                                            aria-label="Details"
                                                            onClick={() => setDialog({ type: "details", deliveryId: delivery.id })}
                                                            sx={actionIconSx()}
                                                        >
                                                            <VisibilityRoundedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title={delivered ? "Delivered parcels cannot be edited" : "Edit"}>
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                aria-label="Edit"
                                                                disabled={delivered}
                                                                onClick={() => setDialog({ type: "edit", delivery })}
                                                                sx={actionIconSx()}
                                                            >
                                                                <EditRoundedIcon fontSize="small" />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>

                                                    <Tooltip title="Delete">
                                                        <IconButton
                                                            size="small"
                                                            aria-label="Delete"
                                                            onClick={() => setDialog({ type: "delete", delivery })}
                                                            sx={dangerIconSx()}
                                                        >
                                                            <DeleteOutlineRoundedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            component="div"
                            count={data.totalElements}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                        />
                    </>
                )}
            </Paper>

            {dialog?.type === "create" && (
                <DeliveryFormDialog delivery={null} onClose={closeDialog} onSubmit={handleCreate} />
            )}

            {dialog?.type === "edit" && (
                <DeliveryFormDialog
                    delivery={dialog.delivery}
                    onClose={closeDialog}
                    onSubmit={(payload) => handleUpdate(dialog.delivery.id, payload)}
                />
            )}

            {dialog?.type === "details" && (
                <DeliveryDetailsDialog deliveryId={dialog.deliveryId} onClose={closeDialog} />
            )}

            {dialog?.type === "delete" && (
                <ConfirmDialog
                    title="Delete delivery"
                    message={`Delete the delivery for ${dialog.delivery.recipientName} (${formatAddress(dialog.delivery)})?${
                        dialog.delivery.status === "IN_DELIVERY" ? " It will also be removed from its trip." : ""
                    } This cannot be undone.`}
                    confirmLabel="Delete"
                    danger
                    onClose={closeDialog}
                    onConfirm={() => handleDelete(dialog.delivery.id)}
                />
            )}

            <Snackbar
                open={notice !== null}
                autoHideDuration={5000}
                onClose={() => setNotice(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
                <Alert
                    onClose={() => setNotice(null)}
                    severity={notice?.severity ?? "success"}
                    variant="filled"
                    elevation={6}
                    sx={alertSx()}
                >
                    {notice?.message}
                </Alert>
            </Snackbar>
        </AppLayout>
    );
}

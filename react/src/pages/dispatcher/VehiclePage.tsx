import { useEffect, useState, type ChangeEvent } from "react";
import {
    Alert, Box, Button, Chip, CircularProgress, IconButton, LinearProgress,
    Paper, Snackbar, Table, TableBody, TableCell, TableContainer,
    TableHead, TablePagination, TableRow, Tooltip, Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import PersonRemoveRoundedIcon from "@mui/icons-material/PersonRemoveRounded";
import ToggleOnRoundedIcon from "@mui/icons-material/ToggleOnRounded";
import ToggleOffRoundedIcon from "@mui/icons-material/ToggleOffRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import AppLayout from "../../components/AppLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import VehicleFormDialog from "../../components/vehicles/VehicleFormDialog";
import AssignCourierDialog from "../../components/vehicles/AssignCourierDialog";
import VehicleDetailsDialog from "../../components/vehicles/VehicleDetailsDialog";
import VehicleToolbar from "../../components/vehicles/VehicleToolbar";
import { getErrorMessage, type Paginated } from "../../api/authApi";
import {
    activateVehicle, assignCourier, createVehicle, deactivateVehicle, deleteVehicle,
    getVehicles, unassignCourier, updateVehicle, DEFAULT_VEHICLE_QUERY,
    type Vehicle, type VehiclePayload, type VehicleQuery,
} from "../../api/vehicleApi";
import { clearFilters, countActiveFilters } from "../../utils/listQuery";
import { alertSx } from "../../styles/LoginStyle";
import {
    actionIconSx, actionsCellSx, bodyTextSx, cardSx, compactPrimaryButtonSx,
    compactSecondaryButtonSx, dangerIconSx, headerActionsSx, monoTextSx, mutedTextSx,
    brandCellSx, nowrapCellSx, pageHeaderSx, vehicleIconSx, pageTitleSx, stateBoxSx, tableHeadCellSx,
} from "../../styles/AppStyle";

const ROWS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

type DialogState =
    | { type: "create" }
    | { type: "edit"; vehicle: Vehicle }
    | { type: "details"; vehicleId: number }
    | { type: "courier"; vehicle: Vehicle }
    | { type: "delete"; vehicle: Vehicle }
    | null;

type Notice = { severity: "success" | "error"; message: string } | null;

const shortId = (id: string): string => (id.length > 12 ? `${id.slice(0, 8)}…` : id);

export default function VehiclePage() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [query, setQuery] = useState<VehicleQuery>(DEFAULT_VEHICLE_QUERY);
    const [reloadKey, setReloadKey] = useState(0);

    const [data, setData] = useState<Paginated<Vehicle> | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [dialog, setDialog] = useState<DialogState>(null);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [notice, setNotice] = useState<Notice>(null);

    // GET /vehicles?page=&size=
    useEffect(() => {
        let cancelled = false;
        getVehicles(page, rowsPerPage, query)
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
    }, [page, rowsPerPage, query, reloadKey]);

    const reload = (): void => {
        setLoading(true);
        setReloadKey((key) => key + 1);
    };

    const closeDialog = (): void => setDialog(null);
    const showSuccess = (message: string): void => setNotice({ severity: "success", message });
    const showError = (err: unknown): void => setNotice({ severity: "error", message: getErrorMessage(err) });

    const handleChangePage = (_: unknown, newPage: number): void => {
        setLoading(true);
        setPage(newPage);
    };

    // zmiana filtrów lub sortowania – wróć na pierwszą stronę
    const handleQueryChange = (newQuery: VehicleQuery): void => {
        setLoading(true);
        setQuery(newQuery);
        setPage(0);
    };

    const handleChangeRowsPerPage = (e: ChangeEvent<HTMLInputElement>): void => {
        setLoading(true);
        setRowsPerPage(Number(e.target.value));
        setPage(0);
    };

    // POST /vehicles
    const handleCreate = async (payload: VehiclePayload): Promise<void> => {
        await createVehicle(payload);
        closeDialog();
        showSuccess("Vehicle added.");
        reload();
    };

    // PUT /vehicles/{id}
    const handleUpdate = async (id: number, payload: VehiclePayload): Promise<void> => {
        await updateVehicle(id, payload);
        closeDialog();
        showSuccess("Vehicle updated.");
        reload();
    };

    // PATCH /vehicles/{id}/courier
    const handleAssignCourier = async (id: number, keycloakUserId: string): Promise<void> => {
        await assignCourier(id, keycloakUserId);
        closeDialog();
        showSuccess("Courier assigned.");
        reload();
    };

    // DELETE /vehicles/{id}
    const handleDelete = async (id: number): Promise<void> => {
        await deleteVehicle(id);
        closeDialog();
        showSuccess("Vehicle deleted.");
        // usunięto ostatni pojazd na stronie – wróć do poprzedniej
        if (data && data.content.length === 1 && page > 0) {
            setLoading(true);
            setPage(page - 1);
        } else {
            reload();
        }
    };

    // Akcje bez dialogu: DELETE /vehicles/{id}/courier, PATCH /activate, DELETE /deactivate
    const runRowAction = async (id: number, action: () => Promise<unknown>, successMessage: string): Promise<void> => {
        setBusyId(id);
        try {
            await action();
            showSuccess(successMessage);
            reload();
        } catch (err) {
            showError(err);
        } finally {
            setBusyId(null);
        }
    };

    const handleUnassignCourier = (vehicle: Vehicle) =>
        runRowAction(vehicle.id, () => unassignCourier(vehicle.id), "Courier unassigned.");

    const handleToggleActive = (vehicle: Vehicle) =>
        vehicle.active
            ? runRowAction(vehicle.id, () => deactivateVehicle(vehicle.id), "Vehicle deactivated.")
            : runRowAction(vehicle.id, () => activateVehicle(vehicle.id), "Vehicle activated.");

    const vehicles = data?.content ?? [];

    return (
        <AppLayout>
            <Box sx={pageHeaderSx()}>
                <Box>
                    <Typography component="h1" sx={pageTitleSx()}>
                        Vehicles
                    </Typography>
                    <Typography sx={bodyTextSx()}>
                        Manage the fleet, assign couriers and activate or deactivate vehicles.
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
                        Add vehicle
                    </Button>
                </Box>
            </Box>

            <VehicleToolbar query={query} onChange={handleQueryChange} />

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

                {data && !loadError && vehicles.length === 0 && !loading && (
                    countActiveFilters(query, DEFAULT_VEHICLE_QUERY) > 0 ? (
                        <Box sx={stateBoxSx()}>
                            <Typography>No vehicles match the filters.</Typography>
                            <Button
                                variant="outlined"
                                onClick={() => handleQueryChange(clearFilters(query, DEFAULT_VEHICLE_QUERY))}
                                sx={compactSecondaryButtonSx()}
                            >
                                Clear filters
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={stateBoxSx()}>
                            <Typography>No vehicles yet.</Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddRoundedIcon />}
                                onClick={() => setDialog({ type: "create" })}
                                sx={compactPrimaryButtonSx()}
                            >
                                Add the first vehicle
                            </Button>
                        </Box>
                    )
                )}

                {data && !loadError && vehicles.length > 0 && (
                    <>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={tableHeadCellSx()}>Brand</TableCell>
                                        <TableCell sx={tableHeadCellSx()}>Model</TableCell>
                                        <TableCell sx={tableHeadCellSx()}>Registration</TableCell>
                                        <TableCell sx={tableHeadCellSx()} align="right">Capacity</TableCell>
                                        <TableCell sx={tableHeadCellSx()}>Status</TableCell>
                                        <TableCell sx={tableHeadCellSx()}>Courier</TableCell>
                                        <TableCell sx={tableHeadCellSx()} align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {vehicles.map((vehicle) => {
                                        const busy = busyId === vehicle.id;
                                        return (
                                            <TableRow key={vehicle.id} hover>
                                                <TableCell sx={nowrapCellSx()}>
                                                    <Box sx={brandCellSx()}>
                                                        <DirectionsCarRoundedIcon fontSize="small" sx={vehicleIconSx(vehicle.active)} />
                                                        {vehicle.brand}
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={nowrapCellSx()}>{vehicle.model}</TableCell>
                                                <TableCell sx={nowrapCellSx()}>{vehicle.registrationNumber}</TableCell>
                                                <TableCell align="right">{vehicle.capacity}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        variant="outlined"
                                                        label={vehicle.active ? "Active" : "Inactive"}
                                                        color={vehicle.active ? "success" : "default"}
                                                    />
                                                </TableCell>
                                                <TableCell sx={nowrapCellSx()}>
                                                    {vehicle.courierKeycloakId ? (
                                                        <Tooltip title={vehicle.courierKeycloakId}>
                                                            <Box component="span" sx={monoTextSx()}>
                                                                {shortId(vehicle.courierKeycloakId)}
                                                            </Box>
                                                        </Tooltip>
                                                    ) : (
                                                        <Box component="span" sx={mutedTextSx()}>—</Box>
                                                    )}
                                                </TableCell>

                                                <TableCell sx={actionsCellSx()}>
                                                    <Tooltip title="Details">
                                                        <IconButton
                                                            size="small"
                                                            aria-label="Details"
                                                            onClick={() => setDialog({ type: "details", vehicleId: vehicle.id })}
                                                            sx={actionIconSx()}
                                                        >
                                                            <VisibilityRoundedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Edit">
                                                        <IconButton
                                                            size="small"
                                                            aria-label="Edit"
                                                            disabled={busy}
                                                            onClick={() => setDialog({ type: "edit", vehicle })}
                                                            sx={actionIconSx()}
                                                        >
                                                            <EditRoundedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    {vehicle.courierKeycloakId ? (
                                                        <Tooltip title="Unassign courier">
                                                            <span>
                                                                <IconButton
                                                                    size="small"
                                                                    aria-label="Unassign courier"
                                                                    disabled={busy}
                                                                    onClick={() => void handleUnassignCourier(vehicle)}
                                                                    sx={actionIconSx()}
                                                                >
                                                                    <PersonRemoveRoundedIcon fontSize="small" />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip title={vehicle.active ? "Assign courier" : "Activate the vehicle to assign a courier"}>
                                                            <span>
                                                                <IconButton
                                                                    size="small"
                                                                    aria-label="Assign courier"
                                                                    disabled={busy || !vehicle.active}
                                                                    onClick={() => setDialog({ type: "courier", vehicle })}
                                                                    sx={actionIconSx()}
                                                                >
                                                                    <PersonAddAlt1RoundedIcon fontSize="small" />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    )}

                                                    <Tooltip title={vehicle.active ? "Deactivate" : "Activate"}>
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                aria-label={vehicle.active ? "Deactivate" : "Activate"}
                                                                disabled={busy}
                                                                onClick={() => void handleToggleActive(vehicle)}
                                                                sx={actionIconSx()}
                                                            >
                                                                {vehicle.active
                                                                    ? <ToggleOnRoundedIcon fontSize="small" />
                                                                    : <ToggleOffRoundedIcon fontSize="small" />}
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>

                                                    <Tooltip title="Delete">
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                aria-label="Delete"
                                                                disabled={busy}
                                                                onClick={() => setDialog({ type: "delete", vehicle })}
                                                                sx={dangerIconSx()}
                                                            >
                                                                <DeleteOutlineRoundedIcon fontSize="small" />
                                                            </IconButton>
                                                        </span>
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
                <VehicleFormDialog vehicle={null} onClose={closeDialog} onSubmit={handleCreate} />
            )}

            {dialog?.type === "edit" && (
                <VehicleFormDialog
                    vehicle={dialog.vehicle}
                    onClose={closeDialog}
                    onSubmit={(payload) => handleUpdate(dialog.vehicle.id, payload)}
                />
            )}

            {dialog?.type === "details" && (
                <VehicleDetailsDialog vehicleId={dialog.vehicleId} onClose={closeDialog} />
            )}

            {dialog?.type === "courier" && (
                <AssignCourierDialog
                    vehicle={dialog.vehicle}
                    onClose={closeDialog}
                    onSubmit={(keycloakUserId) => handleAssignCourier(dialog.vehicle.id, keycloakUserId)}
                />
            )}

            {dialog?.type === "delete" && (
                <ConfirmDialog
                    title="Delete vehicle"
                    message={`Delete ${dialog.vehicle.brand} ${dialog.vehicle.model} (${dialog.vehicle.registrationNumber})? This cannot be undone.`}
                    confirmLabel="Delete"
                    danger
                    onClose={closeDialog}
                    onConfirm={() => handleDelete(dialog.vehicle.id)}
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

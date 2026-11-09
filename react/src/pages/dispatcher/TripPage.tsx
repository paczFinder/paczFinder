import { useEffect, useState, type ChangeEvent } from "react";
import {
    Alert, Box, Button, CircularProgress, IconButton, LinearProgress,
    Paper, Snackbar, Table, TableBody, TableCell, TableContainer,
    TableHead, TablePagination, TableRow, Tooltip, Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import PlaylistAddRoundedIcon from "@mui/icons-material/PlaylistAddRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import AppLayout from "../../components/AppLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import { TripStatusChip } from "../../components/StatusChips";
import VehiclePickerDialog from "../../components/trips/VehiclePickerDialog";
import AddDeliveriesDialog from "../../components/trips/AddDeliveriesDialog";
import TripDetailsDialog from "../../components/trips/TripDetailsDialog";
import TripToolbar from "../../components/trips/TripToolbar";
import { getErrorMessage, type Paginated } from "../../api/authApi";
import {
    addDeliveriesToTrip, addDeliveryToTrip, changeTripVehicle, createTrip,
    deleteTrip, finishTrip, getTrips, DEFAULT_TRIP_QUERY, type Trip, type TripQuery,
} from "../../api/tripApi";
import { clearFilters, countActiveFilters } from "../../utils/listQuery";
import { alertSx } from "../../styles/LoginStyle";
import {
    actionIconSx, actionsCellSx, bodyTextSx, brandCellSx, capacityBarSx, capacityCellSx,
    cardSx, compactPrimaryButtonSx, compactSecondaryButtonSx, dangerIconSx, headerActionsSx,
    monoTextSx, mutedTextSx, nowrapCellSx, pageHeaderSx, pageTitleSx, rowIconSx,
    stateBoxSx, tableHeadCellSx,
} from "../../styles/AppStyle";

const ROWS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

type DialogState =
    | { type: "create" }
    | { type: "details"; tripId: number }
    | { type: "addDeliveries"; trip: Trip }
    | { type: "changeVehicle"; trip: Trip }
    | { type: "finish"; trip: Trip }
    | { type: "delete"; trip: Trip }
    | null;

type Notice = { severity: "success" | "error"; message: string } | null;

const shortId = (id: string): string => (id.length > 12 ? `${id.slice(0, 8)}…` : id);

export default function TripPage() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [query, setQuery] = useState<TripQuery>(DEFAULT_TRIP_QUERY);
    const [reloadKey, setReloadKey] = useState(0);

    const [data, setData] = useState<Paginated<Trip> | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [dialog, setDialog] = useState<DialogState>(null);
    const [notice, setNotice] = useState<Notice>(null);

    // GET /trips?page=&size=
    useEffect(() => {
        let cancelled = false;
        getTrips(page, rowsPerPage, query)
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

    const finishAction = (message: string): void => {
        closeDialog();
        setNotice({ severity: "success", message });
        reload();
    };

    const handleChangePage = (_: unknown, newPage: number): void => {
        setLoading(true);
        setPage(newPage);
    };

    // zmiana filtrów lub sortowania – wróć na pierwszą stronę
    const handleQueryChange = (newQuery: TripQuery): void => {
        setLoading(true);
        setQuery(newQuery);
        setPage(0);
    };

    const handleChangeRowsPerPage = (e: ChangeEvent<HTMLInputElement>): void => {
        setLoading(true);
        setRowsPerPage(Number(e.target.value));
        setPage(0);
    };

    // POST /trips
    const handleCreate = async (vehicleId: number): Promise<void> => {
        const trip = await createTrip(vehicleId);
        finishAction(`Trip #${trip.id} created. Add deliveries to it next.`);
    };

    // PATCH /trips/{id}/vehicle
    const handleChangeVehicle = async (tripId: number, vehicleId: number): Promise<void> => {
        await changeTripVehicle(tripId, vehicleId);
        finishAction("Vehicle changed.");
    };

    // POST /trips/{id}/deliveries (jedna) albo /trips/{id}/deliveries/batch (kilka)
    const handleAddDeliveries = async (tripId: number, deliveryIds: number[]): Promise<void> => {
        if (deliveryIds.length === 1) {
            await addDeliveryToTrip(tripId, deliveryIds[0]);
        } else {
            await addDeliveriesToTrip(tripId, deliveryIds);
        }
        finishAction(deliveryIds.length === 1 ? "Delivery added to the trip." : `${deliveryIds.length} deliveries added to the trip.`);
    };

    // POST /trips/{id}/finish
    const handleFinish = async (tripId: number): Promise<void> => {
        await finishTrip(tripId);
        finishAction("Trip finished. Its deliveries are marked as delivered.");
    };

    // DELETE /trips/{id}
    const handleDelete = async (tripId: number): Promise<void> => {
        await deleteTrip(tripId);
        closeDialog();
        setNotice({ severity: "success", message: "Trip deleted. Its deliveries are available again." });
        if (data && data.content.length === 1 && page > 0) {
            setLoading(true);
            setPage(page - 1);
        } else {
            reload();
        }
    };

    const trips = data?.content ?? [];

    return (
        <AppLayout>
            <Box sx={pageHeaderSx()}>
                <Box>
                    <Typography component="h1" sx={pageTitleSx()}>
                        Trips
                    </Typography>
                    <Typography sx={bodyTextSx()}>
                        Plan trips, load deliveries into vehicles and finish them once delivered.
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
                        New trip
                    </Button>
                </Box>
            </Box>

            <TripToolbar query={query} onChange={handleQueryChange} />

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

                {data && !loadError && trips.length === 0 && !loading && (
                    countActiveFilters(query, DEFAULT_TRIP_QUERY) > 0 ? (
                        <Box sx={stateBoxSx()}>
                            <Typography>No trips match the filters.</Typography>
                            <Button
                                variant="outlined"
                                onClick={() => handleQueryChange(clearFilters(query, DEFAULT_TRIP_QUERY))}
                                sx={compactSecondaryButtonSx()}
                            >
                                Clear filters
                            </Button>
                        </Box>
                    ) : (
                    <Box sx={stateBoxSx()}>
                        <Typography>No trips yet.</Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddRoundedIcon />}
                            onClick={() => setDialog({ type: "create" })}
                            sx={compactPrimaryButtonSx()}
                        >
                            Plan the first trip
                        </Button>
                    </Box>
                    )
                )}

                {data && !loadError && trips.length > 0 && (
                    <>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={tableHeadCellSx()}>Trip</TableCell>
                                        <TableCell sx={tableHeadCellSx()}>Vehicle</TableCell>
                                        <TableCell sx={tableHeadCellSx()}>Courier</TableCell>
                                        <TableCell sx={tableHeadCellSx()} align="right">Deliveries</TableCell>
                                        <TableCell sx={tableHeadCellSx()}>Load</TableCell>
                                        <TableCell sx={tableHeadCellSx()}>Status</TableCell>
                                        <TableCell sx={tableHeadCellSx()} align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {trips.map((trip) => {
                                        const finished = trip.status === "FINISHED";
                                        const loadPercent = trip.vehicleCapacity > 0
                                            ? Math.min(100, (trip.usedCapacity / trip.vehicleCapacity) * 100)
                                            : 0;
                                        return (
                                            <TableRow key={trip.id} hover>
                                                <TableCell sx={nowrapCellSx()}>
                                                    <Box sx={brandCellSx()}>
                                                        <RouteRoundedIcon fontSize="small" sx={rowIconSx(finished)} />
                                                        #{trip.id}
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={nowrapCellSx()}>
                                                    {trip.vehicleBrand} {trip.vehicleModel} ({trip.registrationNumber})
                                                </TableCell>
                                                <TableCell sx={nowrapCellSx()}>
                                                    {trip.courierKeycloakId ? (
                                                        <Tooltip title={trip.courierKeycloakId}>
                                                            <Box component="span" sx={monoTextSx()}>
                                                                {shortId(trip.courierKeycloakId)}
                                                            </Box>
                                                        </Tooltip>
                                                    ) : (
                                                        <Box component="span" sx={mutedTextSx()}>—</Box>
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">{trip.deliveryCount}</TableCell>
                                                <TableCell sx={capacityCellSx()}>
                                                    {trip.usedCapacity} / {trip.vehicleCapacity}
                                                    <LinearProgress variant="determinate" value={loadPercent} sx={capacityBarSx()} />
                                                </TableCell>
                                                <TableCell><TripStatusChip status={trip.status} /></TableCell>

                                                <TableCell sx={actionsCellSx()}>
                                                    <Tooltip title="Details">
                                                        <IconButton
                                                            size="small"
                                                            aria-label="Details"
                                                            onClick={() => setDialog({ type: "details", tripId: trip.id })}
                                                            sx={actionIconSx()}
                                                        >
                                                            <VisibilityRoundedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title={finished ? "Trip is finished" : "Add deliveries"}>
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                aria-label="Add deliveries"
                                                                disabled={finished}
                                                                onClick={() => setDialog({ type: "addDeliveries", trip })}
                                                                sx={actionIconSx()}
                                                            >
                                                                <PlaylistAddRoundedIcon fontSize="small" />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>

                                                    <Tooltip title={finished ? "Trip is finished" : "Change vehicle"}>
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                aria-label="Change vehicle"
                                                                disabled={finished}
                                                                onClick={() => setDialog({ type: "changeVehicle", trip })}
                                                                sx={actionIconSx()}
                                                            >
                                                                <SwapHorizRoundedIcon fontSize="small" />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>

                                                    <Tooltip
                                                        title={finished
                                                            ? "Trip is finished"
                                                            : trip.deliveryCount === 0 ? "Add deliveries before finishing" : "Finish trip"}
                                                    >
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                aria-label="Finish trip"
                                                                disabled={finished || trip.deliveryCount === 0}
                                                                onClick={() => setDialog({ type: "finish", trip })}
                                                                sx={actionIconSx()}
                                                            >
                                                                <FlagRoundedIcon fontSize="small" />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>

                                                    <Tooltip title={finished ? "Finished trips cannot be deleted" : "Delete"}>
                                                        <span>
                                                            <IconButton
                                                                size="small"
                                                                aria-label="Delete"
                                                                disabled={finished}
                                                                onClick={() => setDialog({ type: "delete", trip })}
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
                <VehiclePickerDialog
                    title="New trip"
                    description="Choose the vehicle that will carry the deliveries."
                    confirmLabel="Create trip"
                    onClose={closeDialog}
                    onSubmit={handleCreate}
                />
            )}

            {dialog?.type === "changeVehicle" && (
                <VehiclePickerDialog
                    title={`Change vehicle for trip #${dialog.trip.id}`}
                    confirmLabel="Change vehicle"
                    currentVehicleId={dialog.trip.vehicleId}
                    requiredCapacity={dialog.trip.usedCapacity}
                    onClose={closeDialog}
                    onSubmit={(vehicleId) => handleChangeVehicle(dialog.trip.id, vehicleId)}
                />
            )}

            {dialog?.type === "addDeliveries" && (
                <AddDeliveriesDialog
                    trip={dialog.trip}
                    onClose={closeDialog}
                    onSubmit={(ids) => handleAddDeliveries(dialog.trip.id, ids)}
                />
            )}

            {dialog?.type === "details" && (
                <TripDetailsDialog tripId={dialog.tripId} onClose={closeDialog} />
            )}

            {dialog?.type === "finish" && (
                <ConfirmDialog
                    title={`Finish trip #${dialog.trip.id}`}
                    message={`All ${dialog.trip.deliveryCount} deliveries in this trip will be marked as delivered. The trip can no longer be changed.`}
                    confirmLabel="Finish trip"
                    onClose={closeDialog}
                    onConfirm={() => handleFinish(dialog.trip.id)}
                />
            )}

            {dialog?.type === "delete" && (
                <ConfirmDialog
                    title={`Delete trip #${dialog.trip.id}`}
                    message={`Delete this trip? Its ${dialog.trip.deliveryCount} deliveries will become available for other trips.`}
                    confirmLabel="Delete"
                    danger
                    onClose={closeDialog}
                    onConfirm={() => handleDelete(dialog.trip.id)}
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

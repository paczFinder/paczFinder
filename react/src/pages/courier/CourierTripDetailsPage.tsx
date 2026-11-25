import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Alert, Box, Button, CircularProgress, LinearProgress, Paper, Snackbar, Tooltip, Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import AppLayout from "../../components/AppLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import { DeliverySizeChip, DeliveryStatusChip, TripStatusChip } from "../../components/StatusChips";
import { getErrorMessage } from "../../api/authApi";
import { formatAddress, type Delivery } from "../../api/deliveryApi";
import { formatCoordinates } from "../../api/geocodingApi";
import { finishTrip, getTrip, getTripDeliveries, tripLoadPercent, type Trip } from "../../api/tripApi";
import { COURIER_ID } from "../../utils/courier";
import {
    bodyTextSx, capacityBarSx, cardSx, compactPrimaryButtonSx, compactSecondaryButtonSx, courierBackButtonSx, courierBoxHeaderSx,
    courierBoxSx, courierBoxTitleSx, courierGridSx, courierSectionSx, courierSectionTitleSx, detailsLabelSx, detailsListSx,
    detailsRowSx, detailsValueSx, headerActionsSx, monoTextSx, pageHeaderSx, pageTitleSx, rowIconSx, stateBoxSx,
} from "../../styles/AppStyle";

type LoadedTrip = { trip: Trip; deliveries: Delivery[] };

const tripRows = (trip: Trip): [string, ReactNode][] => [
    ["Trip", `#${trip.id}`],
    ["Vehicle", `${trip.vehicleBrand} ${trip.vehicleModel}`],
    ["Registration", <Box component="span" sx={monoTextSx()}>{trip.registrationNumber}</Box>],
    ["Deliveries", trip.deliveryCount],
    [
        "Load",
        <Box>
            {trip.usedCapacity} / {trip.vehicleCapacity}
            <LinearProgress variant="determinate" value={tripLoadPercent(trip)} sx={capacityBarSx()} />
        </Box>,
    ],
    ["Status", <TripStatusChip status={trip.status} />],
];

const deliveryRows = (delivery: Delivery): [string, ReactNode][] => [
    ["Phone", delivery.recipientPhone],
    ["Address", formatAddress(delivery)],
    ["Coordinates", formatCoordinates(delivery.latitude, delivery.longitude)],
    ["Size", <DeliverySizeChip size={delivery.size} />],
    ["Status", <DeliveryStatusChip status={delivery.status} />],
];

export default function CourierTripDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const tripId = Number(id);
    const validId = Number.isInteger(tripId) && tripId > 0;

    const [data, setData] = useState<LoadedTrip | null>(null);
    const [error, setError] = useState<string | null>(validId ? null : "Trip not found.");
    const [reloadKey, setReloadKey] = useState(0);
    const [confirmFinish, setConfirmFinish] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);

    useEffect(() => {
        if (!validId) return;
        let cancelled = false;
        Promise.all([getTrip(tripId), getTripDeliveries(tripId)])
            .then(([trip, deliveries]) => {
                if (cancelled) return;
                if (trip.courierKeycloakId !== COURIER_ID) {
                    setError("Trip not found.");
                    return;
                }
                setData({ trip, deliveries });
            })
            .catch((e: unknown) => {
                if (!cancelled) setError(getErrorMessage(e));
            });
        return () => {
            cancelled = true;
        };
    }, [tripId, validId, reloadKey]);

    const finishBlockedReason = ((): string | null => {
        if (!data) return null;
        if (data.deliveries.length === 0) return "A trip without deliveries cannot be finished.";
        if (data.deliveries.some((delivery) => delivery.status !== "IN_DELIVERY")) {
            return "All deliveries must be in delivery to finish the trip.";
        }
        return null;
    })();

    const handleFinish = async (): Promise<void> => {
        if (!data) return;
        await finishTrip(data.trip.id);
        const [trip, deliveries] = await Promise.all([getTrip(data.trip.id), getTripDeliveries(data.trip.id)]);
        setData({ trip, deliveries });
        setConfirmFinish(false);
        setNotice("Trip finished. Its deliveries are marked as delivered.");
    };

    const reload = (): void => {
        setError(null);
        setData(null);
        setReloadKey((key) => key + 1);
    };

    return (
        <AppLayout>
            <Box sx={pageHeaderSx()}>
                <Box>
                    <Typography component="h1" sx={pageTitleSx()}>
                        Trip details
                    </Typography>
                    <Typography sx={bodyTextSx()}>
                        Trip data and its deliveries.
                    </Typography>
                </Box>

                <Box sx={[headerActionsSx(), courierBackButtonSx()]}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackRoundedIcon />}
                        onClick={() => void navigate("/courier/trips")}
                        sx={compactSecondaryButtonSx()}
                    >
                        Back to trips
                    </Button>

                    {data?.trip.status === "ADDED" && (
                        <Tooltip title={finishBlockedReason ?? ""}>
                            <span>
                                <Button
                                    variant="contained"
                                    startIcon={<FlagRoundedIcon />}
                                    disabled={finishBlockedReason !== null}
                                    onClick={() => setConfirmFinish(true)}
                                    sx={compactPrimaryButtonSx()}
                                >
                                    Finish trip
                                </Button>
                            </span>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {!data && !error && (
                <Paper elevation={0} sx={cardSx()}>
                    <Box sx={stateBoxSx()}>
                        <CircularProgress />
                    </Box>
                </Paper>
            )}

            {error && (
                <Paper elevation={0} sx={cardSx()}>
                    <Box sx={stateBoxSx()}>
                        <Alert severity="error">{error}</Alert>
                        {validId && error !== "Trip not found." && (
                            <Button variant="outlined" onClick={reload} sx={compactSecondaryButtonSx()}>
                                Try again
                            </Button>
                        )}
                    </Box>
                </Paper>
            )}

            {data && (
                <>
                    <Paper elevation={0} sx={[cardSx(), courierSectionSx()]}>
                        <Box sx={detailsListSx()}>
                            {tripRows(data.trip).map(([label, value]) => (
                                <Box key={label} sx={detailsRowSx()}>
                                    <Typography sx={detailsLabelSx()}>{label}</Typography>
                                    <Box sx={detailsValueSx()}>{value}</Box>
                                </Box>
                            ))}
                        </Box>
                    </Paper>

                    <Paper elevation={0} sx={cardSx()}>
                        <Typography sx={courierSectionTitleSx()}>
                            Deliveries ({data.deliveries.length})
                        </Typography>

                        {data.deliveries.length === 0 ? (
                            <Box sx={stateBoxSx()}>
                                <Typography>No deliveries in this trip yet.</Typography>
                            </Box>
                        ) : (
                            <Box sx={courierGridSx()}>
                                {data.deliveries.map((delivery) => (
                                    <Box key={delivery.id} sx={courierBoxSx()}>
                                        <Box sx={courierBoxHeaderSx()}>
                                            <Inventory2RoundedIcon sx={rowIconSx(delivery.status === "DELIVERED")} />
                                            <Typography sx={courierBoxTitleSx()}>
                                                #{delivery.id} · {delivery.recipientName}
                                            </Typography>
                                        </Box>
                                        <Box sx={detailsListSx()}>
                                            {deliveryRows(delivery).map(([label, value]) => (
                                                <Box key={label} sx={detailsRowSx()}>
                                                    <Typography sx={detailsLabelSx()}>{label}</Typography>
                                                    <Box sx={detailsValueSx()}>{value}</Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Paper>
                </>
            )}

            {confirmFinish && data && (
                <ConfirmDialog
                    title="Finish trip"
                    message={`Are you sure you want to finish trip #${data.trip.id}? All its deliveries will be marked as delivered.`}
                    confirmLabel="Finish"
                    onClose={() => setConfirmFinish(false)}
                    onConfirm={handleFinish}
                />
            )}

            <Snackbar
                open={notice !== null}
                autoHideDuration={4000}
                onClose={() => setNotice(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert severity="success" variant="filled" onClose={() => setNotice(null)}>
                    {notice}
                </Alert>
            </Snackbar>
        </AppLayout>
    );
}

import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, LinearProgress, Paper, Typography } from "@mui/material";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import AppLayout from "../../components/AppLayout";
import { TripStatusChip } from "../../components/StatusChips";
import { getErrorMessage } from "../../api/authApi";
import { getTrips, tripLoadPercent, type Trip } from "../../api/tripApi";
import { COURIER_ID } from "../../utils/courier";
import {
    bodyTextSx, capacityBarSx, cardSx, compactSecondaryButtonSx, courierBoxClickableSx, courierBoxHeaderSx,
    courierBoxTitleSx, courierGridSx, detailsLabelSx, detailsListSx, detailsRowSx,
    detailsValueSx, monoTextSx, pageHeaderSx, pageTitleSx, rowIconSx, stateBoxSx,
} from "../../styles/AppStyle";

const FETCH_ALL_SIZE = 1000;

const tripRows = (trip: Trip): [string, ReactNode][] => [
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

const byFinishedLastThenOldest = (a: Trip, b: Trip): number => {
    if (a.status !== b.status) return a.status === "FINISHED" ? 1 : -1;
    return a.id - b.id;
};

export default function CourierTripPage() {
    const [trips, setTrips] = useState<Trip[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;
        getTrips(0, FETCH_ALL_SIZE)
            .then((page) => {
                if (cancelled) return;
                setTrips(page.content.filter((trip) => trip.courierKeycloakId === COURIER_ID).sort(byFinishedLastThenOldest));
            })
            .catch((e: unknown) => {
                if (!cancelled) setError(getErrorMessage(e));
            });
        return () => {
            cancelled = true;
        };
    }, [reloadKey]);

    const reload = (): void => {
        setError(null);
        setTrips(null);
        setReloadKey((key) => key + 1);
    };

    return (
        <AppLayout>
            <Box sx={pageHeaderSx()}>
                <Box>
                    <Typography component="h1" sx={pageTitleSx()}>
                        My trips
                    </Typography>
                    <Typography sx={bodyTextSx()}>
                        Trips of your vehicles, oldest first, finished at the end.
                    </Typography>
                </Box>
            </Box>

            {!trips && !error && (
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
                        <Button variant="outlined" onClick={reload} sx={compactSecondaryButtonSx()}>
                            Try again
                        </Button>
                    </Box>
                </Paper>
            )}

            {trips && trips.length === 0 && (
                <Paper elevation={0} sx={cardSx()}>
                    <Box sx={stateBoxSx()}>
                        <Typography>You have no trips yet.</Typography>
                    </Box>
                </Paper>
            )}

            {trips && trips.length > 0 && (
                <Paper elevation={0} sx={cardSx()}>
                    <Box sx={courierGridSx()}>
                        {trips.map((trip) => (
                            <Box
                                key={trip.id}
                                role="button"
                                tabIndex={0}
                                aria-label={`Open trip #${trip.id}`}
                                onClick={() => void navigate(`/courier/trips/${trip.id}`)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        void navigate(`/courier/trips/${trip.id}`);
                                    }
                                }}
                                sx={courierBoxClickableSx()}
                            >
                                <Box sx={courierBoxHeaderSx()}>
                                    <RouteRoundedIcon sx={rowIconSx(trip.status === "FINISHED")} />
                                    <Typography sx={courierBoxTitleSx()}>Trip #{trip.id}</Typography>
                                </Box>
                                <Box sx={detailsListSx()}>
                                    {tripRows(trip).map(([label, value]) => (
                                        <Box key={label} sx={detailsRowSx()}>
                                            <Typography sx={detailsLabelSx()}>{label}</Typography>
                                            <Box sx={detailsValueSx()}>{value}</Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            )}
        </AppLayout>
    );
}

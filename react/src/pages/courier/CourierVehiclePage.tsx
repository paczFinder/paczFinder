import { useEffect, useState, type ReactNode } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Paper, Typography } from "@mui/material";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import AppLayout from "../../components/AppLayout";
import { getErrorMessage } from "../../api/authApi";
import { DEFAULT_VEHICLE_QUERY, getVehicles, type Vehicle } from "../../api/vehicleApi";
import {
    bodyTextSx, cardSx, compactSecondaryButtonSx, courierBoxSx, courierBoxHeaderSx, courierGridSx,
    courierBoxTitleSx, detailsLabelSx, detailsListSx, detailsRowSx, detailsValueSx, monoTextSx,
    pageHeaderSx, pageTitleSx, stateBoxSx, vehicleIconSx,
} from "../../styles/AppStyle";

const COURIER_ID = "c0a1e001-5b2f-4c8e-9a10-000000000001";
const FETCH_ALL_SIZE = 1000;

const vehicleRows = (vehicle: Vehicle): [string, ReactNode][] => [
    ["ID", vehicle.id],
    ["Brand", vehicle.brand],
    ["Model", vehicle.model],
    ["Registration", <Box component="span" sx={monoTextSx()}>{vehicle.registrationNumber}</Box>],
    ["Capacity", `${vehicle.capacity} units`],
    [
        "Status",
        <Chip
            size="small"
            variant="outlined"
            label={vehicle.active ? "Active" : "Inactive"}
            color={vehicle.active ? "success" : "default"}
        />,
    ],
];

export default function CourierVehiclePage() {
    const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        getVehicles(0, FETCH_ALL_SIZE, { ...DEFAULT_VEHICLE_QUERY, courier: "assigned" })
            .then((page) => {
                if (cancelled) return;
                setVehicles(page.content.filter((vehicle) => vehicle.courierKeycloakId === COURIER_ID));
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
        setVehicles(null);
        setReloadKey((key) => key + 1);
    };

    return (
        <AppLayout>
            <Box sx={pageHeaderSx()}>
                <Box>
                    <Typography component="h1" sx={pageTitleSx()}>
                        My vehicles
                    </Typography>
                    <Typography sx={bodyTextSx()}>
                        Vehicles assigned to you and their details.
                    </Typography>
                </Box>
            </Box>

            {!vehicles && !error && (
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

            {vehicles && vehicles.length === 0 && (
                <Paper elevation={0} sx={cardSx()}>
                    <Box sx={stateBoxSx()}>
                        <Typography>You have no vehicles assigned yet.</Typography>
                    </Box>
                </Paper>
            )}

            {vehicles && vehicles.length > 0 && (
                <Paper elevation={0} sx={cardSx()}>
                    <Box sx={courierGridSx()}>
                        {vehicles.map((vehicle) => (
                            <Box key={vehicle.id} sx={courierBoxSx()}>
                                <Box sx={courierBoxHeaderSx()}>
                                    <DirectionsCarRoundedIcon sx={vehicleIconSx(vehicle.active)} />
                                    <Typography sx={courierBoxTitleSx()}>
                                        {vehicle.brand} {vehicle.model}
                                    </Typography>
                                </Box>
                                <Box sx={detailsListSx()}>
                                    {vehicleRows(vehicle).map(([label, value]) => (
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

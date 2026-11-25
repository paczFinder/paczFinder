import { useEffect, useState, type ReactNode } from "react";
import {
    Alert, Box, Button, Chip, CircularProgress, Dialog,
    DialogActions, DialogContent, DialogTitle, Typography,
} from "@mui/material";
import { getVehicle, type Vehicle } from "../../api/vehicleApi";
import { getErrorMessage } from "../../api/authApi";
import {
    compactSecondaryButtonSx, detailsLabelSx, detailsRowSx, detailsListSx, detailsValueSx,
    dialogActionsSx, dialogPaperSx, dialogTitleSx, monoTextSx, mutedTextSx, stateBoxSx,
} from "../../styles/AppStyle";

type VehicleDetailsDialogProps = {
    vehicleId: number;
    onClose: () => void;
};

/** Szczegóły pojazdu pobierane na świeżo z GET /vehicles/{id}. */
export default function VehicleDetailsDialog({ vehicleId, onClose }: VehicleDetailsDialogProps) {
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        getVehicle(vehicleId)
            .then((result) => {
                if (!cancelled) setVehicle(result);
            })
            .catch((err: unknown) => {
                if (!cancelled) setError(getErrorMessage(err));
            });
        return () => {
            cancelled = true;
        };
    }, [vehicleId]);

    const rows: [string, ReactNode][] = vehicle
        ? [
            ["ID", vehicle.id],
            ["Brand", vehicle.brand],
            ["Model", vehicle.model],
            ["Registration", vehicle.registrationNumber],
            ["Capacity", vehicle.capacity],
            [
                "Status",
                <Chip
                    size="small"
                    variant="outlined"
                    label={vehicle.active ? "Active" : "Inactive"}
                    color={vehicle.active ? "success" : "default"}
                />,
            ],
            [
                "Courier",
                vehicle.courierKeycloakId
                    ? <Box component="span" sx={monoTextSx()}>{vehicle.courierKeycloakId}</Box>
                    : <Box component="span" sx={mutedTextSx()}>Not assigned</Box>,
            ],
        ]
        : [];

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="xs" slotProps={{ paper: { sx: dialogPaperSx() } }}>
            <DialogTitle sx={dialogTitleSx()}>Vehicle details</DialogTitle>

            <DialogContent>
                {error && <Alert severity="error">{error}</Alert>}

                {!error && !vehicle && (
                    <Box sx={stateBoxSx()}>
                        <CircularProgress />
                    </Box>
                )}

                {vehicle && (
                    <Box sx={detailsListSx()}>
                        {rows.map(([label, value]) => (
                            <Box key={label} sx={detailsRowSx()}>
                                <Typography sx={detailsLabelSx()}>{label}</Typography>
                                <Box sx={detailsValueSx()}>{value}</Box>
                            </Box>
                        ))}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={dialogActionsSx()}>
                <Button variant="outlined" onClick={onClose} sx={compactSecondaryButtonSx()}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

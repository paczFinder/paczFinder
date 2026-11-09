import React, { useEffect, useState } from "react";
import {
    Alert, Box, Button, CircularProgress, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, MenuItem, TextField,
} from "@mui/material";
import { getErrorMessage } from "../../api/authApi";
import { DEFAULT_VEHICLE_QUERY, getVehicles, type Vehicle } from "../../api/vehicleApi";
import { fieldSx, spinnerSx } from "../../styles/LoginStyle";
import {
    compactPrimaryButtonSx, compactSecondaryButtonSx, dialogActionsSx,
    dialogFormSx, dialogPaperSx, dialogTitleSx, stateBoxSx,
} from "../../styles/AppStyle";

type VehiclePickerDialogProps = {
    title: string;
    description?: string;
    confirmLabel: string;
    /** Pojazd, który już jest w kursie – nie da się go wybrać ponownie. */
    currentVehicleId?: number;
    /** Ile jednostek ładowności zajmują już przesyłki w kursie – mniejsze pojazdy są niedostępne. */
    requiredCapacity?: number;
    onClose: () => void;
    onSubmit: (vehicleId: number) => Promise<void>;
};

/** Wybór aktywnego pojazdu – dla POST /trips i PATCH /trips/{id}/vehicle. */
export default function VehiclePickerDialog({
    title, description, confirmLabel, currentVehicleId, requiredCapacity = 0, onClose, onSubmit,
}: VehiclePickerDialogProps) {
    const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
    const [vehicleId, setVehicleId] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        getVehicles(0, 100, { ...DEFAULT_VEHICLE_QUERY, status: "active", sort: "brand" })
            .then((result) => {
                if (!cancelled) setVehicles(result.content);
            })
            .catch((err: unknown) => {
                if (!cancelled) setError(getErrorMessage(err));
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!vehicleId || saving) return;

        setSaving(true);
        setError(null);
        try {
            await onSubmit(Number(vehicleId));
        } catch (err) {
            setError(getErrorMessage(err));
            setSaving(false);
        }
    };

    return (
        <Dialog
            open
            onClose={saving ? undefined : onClose}
            fullWidth
            maxWidth="xs"
            slotProps={{ paper: { sx: dialogPaperSx() } }}
        >
            <form noValidate onSubmit={handleSubmit}>
                <DialogTitle sx={dialogTitleSx()}>{title}</DialogTitle>

                <DialogContent sx={dialogFormSx()}>
                    {description && <DialogContentText>{description}</DialogContentText>}
                    {error && <Alert severity="error">{error}</Alert>}

                    {!vehicles && !error && (
                        <Box sx={stateBoxSx()}>
                            <CircularProgress />
                        </Box>
                    )}

                    {vehicles && vehicles.length === 0 && (
                        <Alert severity="info">There are no active vehicles. Activate or add a vehicle first.</Alert>
                    )}

                    {vehicles && vehicles.length > 0 && (
                        <TextField
                            select
                            label="Vehicle"
                            fullWidth
                            autoFocus
                            value={vehicleId}
                            onChange={(e) => setVehicleId(e.target.value)}
                            disabled={saving}
                            helperText={requiredCapacity > 0 ? `Needs capacity of at least ${requiredCapacity}` : " "}
                            sx={fieldSx()}
                        >
                            {vehicles.map((vehicle) => {
                                const isCurrent = vehicle.id === currentVehicleId;
                                const tooSmall = vehicle.capacity < requiredCapacity;
                                return (
                                    <MenuItem key={vehicle.id} value={String(vehicle.id)} disabled={isCurrent || tooSmall}>
                                        {vehicle.brand} {vehicle.model} ({vehicle.registrationNumber}) · capacity {vehicle.capacity}
                                        {isCurrent ? " · current" : tooSmall ? " · too small" : ""}
                                    </MenuItem>
                                );
                            })}
                        </TextField>
                    )}
                </DialogContent>

                <DialogActions sx={dialogActionsSx()}>
                    <Button variant="outlined" onClick={onClose} disabled={saving} sx={compactSecondaryButtonSx()}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={saving || !vehicleId}
                        sx={compactPrimaryButtonSx()}
                    >
                        {saving ? <CircularProgress size={22} sx={spinnerSx()} /> : confirmLabel}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

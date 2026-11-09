import React, { useState } from "react";
import {
    Alert, Button, CircularProgress, Dialog, DialogActions,
    DialogContent, DialogTitle, TextField,
} from "@mui/material";
import type { Vehicle, VehiclePayload } from "../../api/vehicleApi";
import { getErrorMessage } from "../../api/authApi";
import { fieldSx, spinnerSx } from "../../styles/LoginStyle";
import {
    compactPrimaryButtonSx, compactSecondaryButtonSx, dialogActionsSx,
    dialogFormSx, dialogPaperSx, dialogTitleSx,
} from "../../styles/AppStyle";

type VehicleFormDialogProps = {
    /** null = tworzenie nowego pojazdu (POST), obiekt = edycja (PUT). */
    vehicle: Vehicle | null;
    onClose: () => void;
    onSubmit: (payload: VehiclePayload) => Promise<void>;
};

const MAX_TEXT = 50;
const MAX_REGISTRATION = 10;
const MAX_COURIER_ID = 255;

export default function VehicleFormDialog({ vehicle, onClose, onSubmit }: VehicleFormDialogProps) {
    const [brand, setBrand] = useState(vehicle?.brand ?? "");
    const [model, setModel] = useState(vehicle?.model ?? "");
    const [registrationNumber, setRegistrationNumber] = useState(vehicle?.registrationNumber ?? "");
    const [capacity, setCapacity] = useState(vehicle ? String(vehicle.capacity) : "");
    const [courierKeycloakId, setCourierKeycloakId] = useState(vehicle?.courierKeycloakId ?? "");
    const [touched, setTouched] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const capacityNumber = Number(capacity);
    const errors = {
        brand: brand.trim().length === 0 ? "Brand is required" : null,
        model: model.trim().length === 0 ? "Model is required" : null,
        registrationNumber: registrationNumber.trim().length === 0 ? "Registration number is required" : null,
        capacity: !Number.isInteger(capacityNumber) || capacityNumber <= 0
            ? "Capacity must be a whole number greater than 0"
            : null,
    };
    const isValid = Object.values(errors).every((e) => e === null);
    const showError = (message: string | null): string => (touched && message) || " ";

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setTouched(true);
        if (!isValid || saving) return;

        setSaving(true);
        setError(null);
        try {
            await onSubmit({
                brand: brand.trim(),
                model: model.trim(),
                registrationNumber: registrationNumber.trim(),
                capacity: capacityNumber,
                courierKeycloakId: courierKeycloakId.trim() || null,
            });
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
                <DialogTitle sx={dialogTitleSx()}>
                    {vehicle ? "Edit vehicle" : "Add vehicle"}
                </DialogTitle>

                <DialogContent sx={dialogFormSx()}>
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField
                        label="Brand"
                        autoFocus
                        fullWidth
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        disabled={saving}
                        error={touched && errors.brand !== null}
                        helperText={showError(errors.brand)}
                        sx={fieldSx()}
                        slotProps={{ htmlInput: { maxLength: MAX_TEXT } }}
                    />
                    <TextField
                        label="Model"
                        fullWidth
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        disabled={saving}
                        error={touched && errors.model !== null}
                        helperText={showError(errors.model)}
                        sx={fieldSx()}
                        slotProps={{ htmlInput: { maxLength: MAX_TEXT } }}
                    />
                    <TextField
                        label="Registration number"
                        fullWidth
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                        disabled={saving}
                        error={touched && errors.registrationNumber !== null}
                        helperText={showError(errors.registrationNumber)}
                        sx={fieldSx()}
                        slotProps={{ htmlInput: { maxLength: MAX_REGISTRATION } }}
                    />
                    <TextField
                        label="Capacity"
                        type="number"
                        fullWidth
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        disabled={saving}
                        error={touched && errors.capacity !== null}
                        helperText={showError(errors.capacity)}
                        sx={fieldSx()}
                        slotProps={{ htmlInput: { min: 1, step: 1 } }}
                    />
                    <TextField
                        label="Courier Keycloak ID (optional)"
                        fullWidth
                        value={courierKeycloakId}
                        onChange={(e) => setCourierKeycloakId(e.target.value)}
                        disabled={saving}
                        helperText=" "
                        sx={fieldSx()}
                        slotProps={{ htmlInput: { maxLength: MAX_COURIER_ID } }}
                    />
                </DialogContent>

                <DialogActions sx={dialogActionsSx()}>
                    <Button variant="outlined" onClick={onClose} disabled={saving} sx={compactSecondaryButtonSx()}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={saving || (touched && !isValid)}
                        sx={compactPrimaryButtonSx()}
                    >
                        {saving ? <CircularProgress size={22} sx={spinnerSx()} /> : vehicle ? "Save" : "Add"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

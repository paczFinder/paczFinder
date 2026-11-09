import React, { useState } from "react";
import {
    Alert, Button, CircularProgress, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, TextField,
} from "@mui/material";
import type { Vehicle } from "../../api/vehicleApi";
import { getErrorMessage } from "../../api/authApi";
import { fieldSx, spinnerSx } from "../../styles/LoginStyle";
import {
    compactPrimaryButtonSx, compactSecondaryButtonSx, dialogActionsSx,
    dialogFormSx, dialogPaperSx, dialogTitleSx,
} from "../../styles/AppStyle";

type AssignCourierDialogProps = {
    vehicle: Vehicle;
    onClose: () => void;
    onSubmit: (keycloakUserId: string) => Promise<void>;
};

export default function AssignCourierDialog({ vehicle, onClose, onSubmit }: AssignCourierDialogProps) {
    const [keycloakUserId, setKeycloakUserId] = useState("");
    const [touched, setTouched] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const trimmed = keycloakUserId.trim();
    const isValid = trimmed.length > 0;

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setTouched(true);
        if (!isValid || saving) return;

        setSaving(true);
        setError(null);
        try {
            await onSubmit(trimmed);
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
                <DialogTitle sx={dialogTitleSx()}>Assign courier</DialogTitle>

                <DialogContent sx={dialogFormSx()}>
                    <DialogContentText>
                        {vehicle.brand} {vehicle.model} ({vehicle.registrationNumber})
                    </DialogContentText>

                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField
                        label="Courier Keycloak user ID"
                        autoFocus
                        fullWidth
                        value={keycloakUserId}
                        onChange={(e) => setKeycloakUserId(e.target.value)}
                        disabled={saving}
                        error={touched && !isValid}
                        helperText={touched && !isValid ? "Courier Keycloak user ID is required" : " "}
                        sx={fieldSx()}
                        slotProps={{ htmlInput: { maxLength: 255 } }}
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
                        {saving ? <CircularProgress size={22} sx={spinnerSx()} /> : "Assign"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

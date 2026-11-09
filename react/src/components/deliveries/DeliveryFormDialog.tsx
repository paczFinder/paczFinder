import React, { useState } from "react";
import {
    Alert, Box, Button, CircularProgress, Dialog, DialogActions,
    DialogContent, DialogTitle, MenuItem, TextField,
} from "@mui/material";
import { getErrorMessage } from "../../api/authApi";
import type { Delivery, DeliveryPayload, DeliverySize } from "../../api/deliveryApi";
import { fieldSx, spinnerSx } from "../../styles/LoginStyle";
import {
    compactPrimaryButtonSx, compactSecondaryButtonSx, dialogActionsSx,
    dialogPaperSx, dialogTitleSx, formGridSx, fullRowFieldSx,
} from "../../styles/AppStyle";

type DeliveryFormDialogProps = {
    /** null = nowa przesyłka (POST), obiekt = edycja (PUT). */
    delivery: Delivery | null;
    onClose: () => void;
    onSubmit: (payload: DeliveryPayload) => Promise<void>;
};

type FieldName =
    | "recipientName" | "recipientPhone" | "street" | "buildingNumber" | "apartmentNumber"
    | "postalCode" | "city" | "country" | "latitude" | "longitude";

type FieldConfig = { name: FieldName; label: string; max?: number; required?: boolean; fullRow?: boolean };

// limity jak w CreateDeliveryRequest w delivery-service
const FIELDS: FieldConfig[] = [
    { name: "recipientName", label: "Recipient name", max: 100, required: true },
    { name: "recipientPhone", label: "Recipient phone", max: 20, required: true },
    { name: "street", label: "Street", max: 100, required: true, fullRow: true },
    { name: "buildingNumber", label: "Building number", max: 10, required: true },
    { name: "apartmentNumber", label: "Apartment (optional)", max: 10 },
    { name: "postalCode", label: "Postal code", max: 10, required: true },
    { name: "city", label: "City", max: 100, required: true },
    { name: "country", label: "Country", max: 60, required: true, fullRow: true },
    { name: "latitude", label: "Latitude", required: true },
    { name: "longitude", label: "Longitude", required: true },
];

const SIZES: { value: DeliverySize; label: string }[] = [
    { value: "S", label: "S – small (1 unit)" },
    { value: "M", label: "M – medium (2 units)" },
    { value: "L", label: "L – large (4 units)" },
];

const toValues = (d: Delivery | null): Record<FieldName, string> => ({
    recipientName: d?.recipientName ?? "",
    recipientPhone: d?.recipientPhone ?? "",
    street: d?.street ?? "",
    buildingNumber: d?.buildingNumber ?? "",
    apartmentNumber: d?.apartmentNumber ?? "",
    postalCode: d?.postalCode ?? "",
    city: d?.city ?? "",
    country: d?.country ?? "Poland",
    latitude: d ? String(d.latitude) : "",
    longitude: d ? String(d.longitude) : "",
});

const validate = (values: Record<FieldName, string>): Partial<Record<FieldName, string>> => {
    const errors: Partial<Record<FieldName, string>> = {};
    for (const field of FIELDS) {
        if (field.required && values[field.name].trim() === "") {
            errors[field.name] = `${field.label} is required`;
        }
    }
    const lat = Number(values.latitude);
    if (!errors.latitude && (Number.isNaN(lat) || lat < -90 || lat > 90)) {
        errors.latitude = "Latitude must be between -90 and 90";
    }
    const lng = Number(values.longitude);
    if (!errors.longitude && (Number.isNaN(lng) || lng < -180 || lng > 180)) {
        errors.longitude = "Longitude must be between -180 and 180";
    }
    return errors;
};

export default function DeliveryFormDialog({ delivery, onClose, onSubmit }: DeliveryFormDialogProps) {
    const [values, setValues] = useState(() => toValues(delivery));
    const [size, setSize] = useState<DeliverySize>(delivery?.size ?? "M");
    const [touched, setTouched] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const errors = validate(values);
    const isValid = Object.keys(errors).length === 0;

    const setField = (name: FieldName, value: string): void =>
        setValues((prev) => ({ ...prev, [name]: value }));

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setTouched(true);
        if (!isValid || saving) return;

        setSaving(true);
        setError(null);
        try {
            await onSubmit({
                recipientName: values.recipientName.trim(),
                recipientPhone: values.recipientPhone.trim(),
                street: values.street.trim(),
                buildingNumber: values.buildingNumber.trim(),
                apartmentNumber: values.apartmentNumber.trim() || null,
                postalCode: values.postalCode.trim(),
                city: values.city.trim(),
                country: values.country.trim(),
                latitude: Number(values.latitude),
                longitude: Number(values.longitude),
                size,
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
            maxWidth="sm"
            slotProps={{ paper: { sx: dialogPaperSx() } }}
        >
            <form noValidate onSubmit={handleSubmit}>
                <DialogTitle sx={dialogTitleSx()}>
                    {delivery ? "Edit delivery" : "Add delivery"}
                </DialogTitle>

                <DialogContent>
                    {error && <Alert severity="error">{error}</Alert>}

                    <Box sx={formGridSx()}>
                        {FIELDS.map((field, index) => {
                            const fieldError = touched ? errors[field.name] : undefined;
                            return (
                                <TextField
                                    key={field.name}
                                    label={field.label}
                                    autoFocus={index === 0}
                                    type={field.name === "latitude" || field.name === "longitude" ? "number" : "text"}
                                    fullWidth
                                    value={values[field.name]}
                                    onChange={(e) => setField(field.name, e.target.value)}
                                    disabled={saving}
                                    error={fieldError !== undefined}
                                    helperText={fieldError ?? " "}
                                    sx={field.fullRow ? fullRowFieldSx() : fieldSx()}
                                    slotProps={{
                                        htmlInput: field.max ? { maxLength: field.max } : { step: "any" },
                                    }}
                                />
                            );
                        })}

                        <TextField
                            select
                            label="Size"
                            fullWidth
                            value={size}
                            onChange={(e) => setSize(e.target.value as DeliverySize)}
                            disabled={saving}
                            helperText=" "
                            sx={fullRowFieldSx()}
                        >
                            {SIZES.map((option) => (
                                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                            ))}
                        </TextField>
                    </Box>
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
                        {saving ? <CircularProgress size={22} sx={spinnerSx()} /> : delivery ? "Save" : "Add"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

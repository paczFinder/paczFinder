import { useEffect, useState } from "react";
import {
    Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, List, ListItemButton,
    ListItemIcon, ListItemText, Typography,
} from "@mui/material";
import { getErrorMessage } from "../../api/authApi";
import {
    DELIVERY_LOAD_UNITS, formatAddress, getAvailableDeliveries, type Delivery,
} from "../../api/deliveryApi";
import type { Trip } from "../../api/tripApi";
import { DeliverySizeChip } from "../StatusChips";
import { spinnerSx } from "../../styles/LoginStyle";
import {
    brandCellSx, checkListSx, compactPrimaryButtonSx, compactSecondaryButtonSx,
    dialogActionsSx, dialogFormSx, dialogPaperSx, dialogTitleSx, errorTextSx,
    helperTextSx, stateBoxSx,
} from "../../styles/AppStyle";

type AddDeliveriesDialogProps = {
    trip: Trip;
    onClose: () => void;
    /** Jedna przesyłka -> POST /trips/{id}/deliveries, kilka -> POST /trips/{id}/deliveries/batch */
    onSubmit: (deliveryIds: number[]) => Promise<void>;
};

export default function AddDeliveriesDialog({ trip, onClose, onSubmit }: AddDeliveriesDialogProps) {
    const [deliveries, setDeliveries] = useState<Delivery[] | null>(null);
    const [selected, setSelected] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        getAvailableDeliveries(0, 100)
            .then((result) => {
                if (!cancelled) setDeliveries(result.content);
            })
            .catch((err: unknown) => {
                if (!cancelled) setError(getErrorMessage(err));
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const freeCapacity = trip.vehicleCapacity - trip.usedCapacity;
    const selectedLoad = (deliveries ?? [])
        .filter((d) => selected.includes(d.id))
        .reduce((sum, d) => sum + DELIVERY_LOAD_UNITS[d.size], 0);
    const overCapacity = selectedLoad > freeCapacity;

    const toggle = (id: number): void =>
        setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const handleSubmit = async (): Promise<void> => {
        if (selected.length === 0 || saving) return;
        setSaving(true);
        setError(null);
        try {
            await onSubmit(selected);
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
            <DialogTitle sx={dialogTitleSx()}>Add deliveries to trip #{trip.id}</DialogTitle>

            <DialogContent sx={dialogFormSx()}>
                <DialogContentText>
                    {trip.vehicleBrand} {trip.vehicleModel} ({trip.registrationNumber}) – free capacity {freeCapacity} of {trip.vehicleCapacity}.
                </DialogContentText>

                {error && <Alert severity="error">{error}</Alert>}

                {!deliveries && !error && (
                    <Box sx={stateBoxSx()}>
                        <CircularProgress />
                    </Box>
                )}

                {deliveries && deliveries.length === 0 && (
                    <Alert severity="info">No deliveries are waiting for a trip. Add deliveries on the Deliveries page.</Alert>
                )}

                {deliveries && deliveries.length > 0 && (
                    <>
                        <List dense disablePadding sx={checkListSx()}>
                            {deliveries.map((delivery) => (
                                <ListItemButton
                                    key={delivery.id}
                                    onClick={() => toggle(delivery.id)}
                                    disabled={saving}
                                >
                                    <ListItemIcon>
                                        <Checkbox edge="start" checked={selected.includes(delivery.id)} tabIndex={-1} disableRipple />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Box component="span" sx={brandCellSx()}>
                                                {delivery.recipientName}
                                                <DeliverySizeChip size={delivery.size} />
                                            </Box>
                                        }
                                        secondary={formatAddress(delivery)}
                                    />
                                </ListItemButton>
                            ))}
                        </List>

                        <Typography sx={overCapacity ? errorTextSx() : helperTextSx()}>
                            Selected {selected.length} · load {selectedLoad} of {freeCapacity} free units
                            {overCapacity ? " – too much for this vehicle" : ""}
                        </Typography>
                    </>
                )}
            </DialogContent>

            <DialogActions sx={dialogActionsSx()}>
                <Button variant="outlined" onClick={onClose} disabled={saving} sx={compactSecondaryButtonSx()}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={() => void handleSubmit()}
                    disabled={saving || selected.length === 0 || overCapacity}
                    sx={compactPrimaryButtonSx()}
                >
                    {saving
                        ? <CircularProgress size={22} sx={spinnerSx()} />
                        : selected.length > 1 ? `Add ${selected.length} deliveries` : "Add delivery"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

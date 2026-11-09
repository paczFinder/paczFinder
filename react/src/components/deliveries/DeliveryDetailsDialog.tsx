import { useEffect, useState, type ReactNode } from "react";
import {
    Alert, Box, Button, CircularProgress, Dialog,
    DialogActions, DialogContent, DialogTitle, Typography,
} from "@mui/material";
import { getErrorMessage } from "../../api/authApi";
import { formatAddress, getDelivery, type Delivery } from "../../api/deliveryApi";
import { DeliverySizeChip, DeliveryStatusChip } from "../StatusChips";
import {
    compactSecondaryButtonSx, detailsLabelSx, detailsListSx, detailsRowSx, detailsValueSx,
    dialogActionsSx, dialogPaperSx, dialogTitleSx, stateBoxSx,
} from "../../styles/AppStyle";

type DeliveryDetailsDialogProps = {
    deliveryId: number;
    onClose: () => void;
};

/** Szczegóły przesyłki pobierane na świeżo z GET /deliveries/{id}. */
export default function DeliveryDetailsDialog({ deliveryId, onClose }: DeliveryDetailsDialogProps) {
    const [delivery, setDelivery] = useState<Delivery | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        getDelivery(deliveryId)
            .then((result) => {
                if (!cancelled) setDelivery(result);
            })
            .catch((err: unknown) => {
                if (!cancelled) setError(getErrorMessage(err));
            });
        return () => {
            cancelled = true;
        };
    }, [deliveryId]);

    const rows: [string, ReactNode][] = delivery
        ? [
            ["ID", delivery.id],
            ["Recipient", delivery.recipientName],
            ["Phone", delivery.recipientPhone],
            ["Address", formatAddress(delivery)],
            ["Country", delivery.country],
            ["Coordinates", `${delivery.latitude}, ${delivery.longitude}`],
            ["Size", <DeliverySizeChip size={delivery.size} />],
            ["Status", <DeliveryStatusChip status={delivery.status} />],
        ]
        : [];

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="xs" slotProps={{ paper: { sx: dialogPaperSx() } }}>
            <DialogTitle sx={dialogTitleSx()}>Delivery details</DialogTitle>

            <DialogContent>
                {error && <Alert severity="error">{error}</Alert>}

                {!error && !delivery && (
                    <Box sx={stateBoxSx()}>
                        <CircularProgress />
                    </Box>
                )}

                {delivery && (
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

import { useEffect, useState, type ReactNode } from "react";
import {
    Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
    DialogTitle, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import { getErrorMessage } from "../../api/authApi";
import { formatAddress, type Delivery } from "../../api/deliveryApi";
import { getTrip, getTripDeliveries, type Trip } from "../../api/tripApi";
import { DeliverySizeChip, DeliveryStatusChip, TripStatusChip } from "../StatusChips";
import {
    compactSecondaryButtonSx, detailsLabelSx, detailsListSx, detailsRowSx, detailsValueSx,
    dialogActionsSx, dialogPaperSx, dialogTitleSx, helperTextSx, monoTextSx, mutedTextSx,
    nowrapCellSx, sectionTitleSx, stateBoxSx, tableHeadCellSx,
} from "../../styles/AppStyle";

type TripDetailsDialogProps = {
    tripId: number;
    onClose: () => void;
};

/** GET /trips/{id} + GET /trips/{id}/deliveries */
export default function TripDetailsDialog({ tripId, onClose }: TripDetailsDialogProps) {
    const [trip, setTrip] = useState<Trip | null>(null);
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        Promise.all([getTrip(tripId), getTripDeliveries(tripId)])
            .then(([tripResult, deliveriesResult]) => {
                if (cancelled) return;
                setTrip(tripResult);
                setDeliveries(deliveriesResult);
            })
            .catch((err: unknown) => {
                if (!cancelled) setError(getErrorMessage(err));
            });
        return () => {
            cancelled = true;
        };
    }, [tripId]);

    const rows: [string, ReactNode][] = trip
        ? [
            ["Trip", `#${trip.id}`],
            ["Vehicle", `${trip.vehicleBrand} ${trip.vehicleModel} (${trip.registrationNumber})`],
            [
                "Courier",
                trip.courierKeycloakId
                    ? <Box component="span" sx={monoTextSx()}>{trip.courierKeycloakId}</Box>
                    : <Box component="span" sx={mutedTextSx()}>Not assigned</Box>,
            ],
            ["Load", `${trip.usedCapacity} / ${trip.vehicleCapacity}`],
            ["Status", <TripStatusChip status={trip.status} />],
        ]
        : [];

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="md" slotProps={{ paper: { sx: dialogPaperSx() } }}>
            <DialogTitle sx={dialogTitleSx()}>Trip details</DialogTitle>

            <DialogContent>
                {error && <Alert severity="error">{error}</Alert>}

                {!error && !trip && (
                    <Box sx={stateBoxSx()}>
                        <CircularProgress />
                    </Box>
                )}

                {trip && (
                    <>
                        <Box sx={detailsListSx()}>
                            {rows.map(([label, value]) => (
                                <Box key={label} sx={detailsRowSx()}>
                                    <Typography sx={detailsLabelSx()}>{label}</Typography>
                                    <Box sx={detailsValueSx()}>{value}</Box>
                                </Box>
                            ))}
                        </Box>

                        <Typography sx={sectionTitleSx()}>Deliveries ({deliveries.length})</Typography>

                        {deliveries.length === 0 ? (
                            <Typography sx={helperTextSx()}>No deliveries in this trip yet.</Typography>
                        ) : (
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={tableHeadCellSx()}>Recipient</TableCell>
                                        <TableCell sx={tableHeadCellSx()}>Address</TableCell>
                                        <TableCell sx={tableHeadCellSx()}>Size</TableCell>
                                        <TableCell sx={tableHeadCellSx()}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {deliveries.map((delivery) => (
                                        <TableRow key={delivery.id}>
                                            <TableCell sx={nowrapCellSx()}>{delivery.recipientName}</TableCell>
                                            <TableCell>{formatAddress(delivery)}</TableCell>
                                            <TableCell><DeliverySizeChip size={delivery.size} /></TableCell>
                                            <TableCell><DeliveryStatusChip status={delivery.status} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </>
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

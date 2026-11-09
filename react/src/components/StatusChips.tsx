import { Chip, type ChipProps } from "@mui/material";
import type { DeliverySize, DeliveryStatus } from "../api/deliveryApi";
import type { TripStatus } from "../api/tripApi";

const DELIVERY_STATUS: Record<DeliveryStatus, { label: string; color: ChipProps["color"] }> = {
    ADDED: { label: "Added", color: "default" },
    IN_DELIVERY: { label: "In delivery", color: "primary" },
    DELIVERED: { label: "Delivered", color: "success" },
};

const TRIP_STATUS: Record<TripStatus, { label: string; color: ChipProps["color"] }> = {
    ADDED: { label: "In progress", color: "primary" },
    FINISHED: { label: "Finished", color: "success" },
};

const DELIVERY_SIZE: Record<DeliverySize, string> = {
    S: "S · 1 unit",
    M: "M · 2 units",
    L: "L · 4 units",
};

export function DeliveryStatusChip({ status }: { status: DeliveryStatus }) {
    const { label, color } = DELIVERY_STATUS[status];
    return <Chip size="small" variant="outlined" label={label} color={color} />;
}

export function TripStatusChip({ status }: { status: TripStatus }) {
    const { label, color } = TRIP_STATUS[status];
    return <Chip size="small" variant="outlined" label={label} color={color} />;
}

export function DeliverySizeChip({ size }: { size: DeliverySize }) {
    return <Chip size="small" label={DELIVERY_SIZE[size]} />;
}

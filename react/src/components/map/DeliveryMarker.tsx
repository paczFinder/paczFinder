import { Fragment } from "react";
import type { DivIcon } from "leaflet";
import { Marker, Popup } from "react-leaflet";
import { Box, Divider, Typography } from "@mui/material";
import { formatAddress, type Delivery, type DeliveryStatus } from "../../api/deliveryApi";
import { formatCoordinates } from "../../api/geocodingApi";
import { pinIcon } from "./pinIcon";
import { DeliverySizeChip, DeliveryStatusChip } from "../StatusChips";
import {
    DELIVERY_PIN_COLORS, mapPopupChipsSx, mapPopupDividerSx, mapPopupListSx, mapPopupSx,
} from "../../styles/AppStyle";

const PIN_ICONS = Object.fromEntries(
    Object.entries(DELIVERY_PIN_COLORS).map(([status, color]) => [status, pinIcon(color)]),
) as Record<DeliveryStatus, DivIcon>;

const MAX_VISIBLE_IN_POPUP = 4;

const STATUS_PRIORITY: DeliveryStatus[] = ["IN_DELIVERY", "ADDED", "DELIVERED"];

const groupStatus = (deliveries: Delivery[]): DeliveryStatus =>
    STATUS_PRIORITY.find((status) => deliveries.some((d) => d.status === status)) ?? deliveries[0].status;

const buildingAddress = (d: Delivery): string => `${d.street} ${d.buildingNumber}, ${d.postalCode} ${d.city}`;

function SingleDeliveryPopup({ delivery }: { delivery: Delivery }) {
    return (
        <Box sx={mapPopupSx()}>
            <Typography variant="subtitle2">
                #{delivery.id} · {delivery.recipientName}
            </Typography>
            <Typography variant="body2">{delivery.recipientPhone}</Typography>
            <Divider sx={mapPopupDividerSx()} />
            <Typography variant="body2">{formatAddress(delivery)}</Typography>
            <Typography variant="body2">
                {formatCoordinates(delivery.latitude, delivery.longitude)}
            </Typography>
            <Box sx={mapPopupChipsSx()}>
                <DeliveryStatusChip status={delivery.status} />
                <DeliverySizeChip size={delivery.size} />
            </Box>
        </Box>
    );
}

function GroupedDeliveriesPopup({ deliveries }: { deliveries: Delivery[] }) {
    const first = deliveries[0];
    return (
        <Box sx={mapPopupSx()}>
            <Typography variant="subtitle2">{deliveries.length} deliveries at this address</Typography>
            <Typography variant="body2">{buildingAddress(first)}</Typography>
            <Typography variant="body2">{formatCoordinates(first.latitude, first.longitude)}</Typography>

            <Box sx={mapPopupListSx(deliveries.length > MAX_VISIBLE_IN_POPUP)}>
                {deliveries.map((delivery) => (
                    <Fragment key={delivery.id}>
                        <Divider sx={mapPopupDividerSx()} />
                        <Typography variant="subtitle2">
                            #{delivery.id} · {delivery.recipientName}
                        </Typography>
                        <Typography variant="body2">
                            {delivery.recipientPhone}
                            {delivery.apartmentNumber ? ` · apt. ${delivery.apartmentNumber}` : ""}
                        </Typography>
                        <Box sx={mapPopupChipsSx()}>
                            <DeliveryStatusChip status={delivery.status} />
                            <DeliverySizeChip size={delivery.size} />
                        </Box>
                    </Fragment>
                ))}
            </Box>
        </Box>
    );
}

export default function DeliveryMarker({ deliveries }: { deliveries: Delivery[] }) {
    const first = deliveries[0];
    const grouped = deliveries.length > 1;
    const status = groupStatus(deliveries);
    const icon = grouped
        ? pinIcon(DELIVERY_PIN_COLORS[status], 28, String(deliveries.length))
        : PIN_ICONS[status];

    return (
        <Marker position={[first.latitude, first.longitude]} icon={icon}>
            <Popup>
                {grouped
                    ? <GroupedDeliveriesPopup deliveries={deliveries} />
                    : <SingleDeliveryPopup delivery={first} />}
            </Popup>
        </Marker>
    );
}

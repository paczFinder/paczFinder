import type { DivIcon } from "leaflet";
import { Marker, Popup } from "react-leaflet";
import { Box, Divider, Typography } from "@mui/material";
import { formatAddress, type Delivery, type DeliveryStatus } from "../../api/deliveryApi";
import { formatCoordinates } from "../../api/geocodingApi";
import { pinIcon } from "./pinIcon";
import { DeliverySizeChip, DeliveryStatusChip } from "../StatusChips";
import { DELIVERY_PIN_COLORS, mapPopupChipsSx, mapPopupDividerSx, mapPopupSx } from "../../styles/AppStyle";

const PIN_ICONS = Object.fromEntries(
    Object.entries(DELIVERY_PIN_COLORS).map(([status, color]) => [status, pinIcon(color)]),
) as Record<DeliveryStatus, DivIcon>;

export default function DeliveryMarker({ delivery }: { delivery: Delivery }) {
    return (
        <Marker position={[delivery.latitude, delivery.longitude]} icon={PIN_ICONS[delivery.status]}>
            <Popup>
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
            </Popup>
        </Marker>
    );
}

import { Marker, Popup } from "react-leaflet";
import { Box, Button, Typography } from "@mui/material";
import { formatCoordinates } from "../../api/geocodingApi";
import { pinIcon } from "./pinIcon";
import { ADDED_PIN_COLOR, compactSecondaryButtonSx, mapPopupSx } from "../../styles/AppStyle";

export type AddedPin = {
    id: number;
    latitude: number;
    longitude: number;
    address: string | null;
};

const ADDED_ICON = pinIcon(ADDED_PIN_COLOR);

type Props = {
    pin: AddedPin;
    onRemove: (id: number) => void;
};

export default function AddedPinMarker({ pin, onRemove }: Props) {
    return (
        <Marker position={[pin.latitude, pin.longitude]} icon={ADDED_ICON}>
            <Popup>
                <Box sx={mapPopupSx()}>
                    <Typography variant="subtitle2">Added pin</Typography>
                    {pin.address && <Typography variant="body2">{pin.address}</Typography>}
                    <Typography variant="body2">{formatCoordinates(pin.latitude, pin.longitude)}</Typography>
                    <Button size="small" variant="outlined" onClick={() => onRemove(pin.id)} sx={compactSecondaryButtonSx()}>
                        Remove
                    </Button>
                </Box>
            </Popup>
        </Marker>
    );
}

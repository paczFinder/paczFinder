import { useEffect, useRef } from "react";
import type { Marker as LeafletMarker } from "leaflet";
import { Marker, Popup, useMap } from "react-leaflet";
import { Typography } from "@mui/material";
import type { GeocodeResult } from "../../api/geocodingApi";
import { pinIcon } from "./pinIcon";
import { SEARCH_PIN_COLOR } from "../../styles/AppStyle";

const SEARCH_ICON = pinIcon(SEARCH_PIN_COLOR, 32);

export default function SearchResultMarker({ result }: { result: GeocodeResult }) {
    const map = useMap();
    const markerRef = useRef<LeafletMarker | null>(null);

    useEffect(() => {
        map.setView([result.latitude, result.longitude], 17);
        markerRef.current?.openPopup();
    }, [map, result]);

    return (
        <Marker ref={markerRef} position={[result.latitude, result.longitude]} icon={SEARCH_ICON} zIndexOffset={1000}>
            <Popup>
                <Typography variant="body2">{result.label}</Typography>
            </Popup>
        </Marker>
    );
}

import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";

type Props = {
    active: boolean;
    onPick: (latitude: number, longitude: number) => void;
};

export default function MapClickPicker({ active, onPick }: Props) {
    const map = useMap();

    useEffect(() => {
        const container = map.getContainer();
        container.style.cursor = active ? "crosshair" : "";
        return () => {
            container.style.cursor = "";
        };
    }, [map, active]);

    useMapEvents({
        click: (event) => {
            if (active) onPick(event.latlng.lat, event.latlng.lng);
        },
    });

    return null;
}

import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { isInLodz } from "../../utils/lodzArea";

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
            const { lat, lng } = event.latlng;
            if (active && isInLodz(lat, lng)) onPick(lat, lng);
        },
    });

    return null;
}

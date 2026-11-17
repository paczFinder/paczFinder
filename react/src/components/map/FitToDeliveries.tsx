import { useEffect } from "react";
import { latLngBounds } from "leaflet";
import { useMap } from "react-leaflet";
import type { Delivery } from "../../api/deliveryApi";

type Props = {
    deliveries: Delivery[];
    fallbackCenter: [number, number];
    fallbackZoom: number;
};

export default function FitToDeliveries({ deliveries, fallbackCenter, fallbackZoom }: Props) {
    const map = useMap();

    useEffect(() => {
        if (deliveries.length === 0) {
            map.setView(fallbackCenter, fallbackZoom);
        } else if (deliveries.length === 1) {
            map.setView([deliveries[0].latitude, deliveries[0].longitude], 15);
        } else {
            const bounds = latLngBounds(deliveries.map((d) => [d.latitude, d.longitude] as [number, number]));
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        }
    }, [deliveries, map, fallbackCenter, fallbackZoom]);

    return null;
}

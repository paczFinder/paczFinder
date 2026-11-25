import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { LODZ_VIEW_BOUNDS } from "../../utils/lodzArea";

export default function LodzBoundsLimiter() {
    const map = useMap();

    useEffect(() => {
        const updateMinZoom = (): void => {
            map.setMinZoom(map.getBoundsZoom(LODZ_VIEW_BOUNDS));
        };
        updateMinZoom();
        map.on("resize", updateMinZoom);
        return () => {
            map.off("resize", updateMinZoom);
        };
    }, [map]);

    return null;
}

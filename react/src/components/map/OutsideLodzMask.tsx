import { Polygon } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import { LODZ_NORTH_EAST, LODZ_SOUTH_WEST } from "../../utils/lodzArea";
import { MAP_MASK_BORDER_COLOR, MAP_MASK_COLOR } from "../../styles/AppStyle";

const WORLD: LatLngTuple[] = [
    [-85, -180],
    [85, -180],
    [85, 180],
    [-85, 180],
];

const LODZ: LatLngTuple[] = [
    LODZ_SOUTH_WEST,
    [LODZ_NORTH_EAST[0], LODZ_SOUTH_WEST[1]],
    LODZ_NORTH_EAST,
    [LODZ_SOUTH_WEST[0], LODZ_NORTH_EAST[1]],
];

export default function OutsideLodzMask() {
    return (
        <Polygon
            positions={[WORLD, LODZ]}
            interactive={false}
            pathOptions={{
                color: MAP_MASK_BORDER_COLOR,
                weight: 2,
                dashArray: "6 6",
                fillColor: MAP_MASK_COLOR,
                fillOpacity: 0.45,
            }}
        />
    );
}

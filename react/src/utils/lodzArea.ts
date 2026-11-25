import { latLngBounds } from "leaflet";

export const LODZ_CENTER: [number, number] = [51.7592, 19.456];

export const LODZ_SOUTH_WEST: [number, number] = [51.68, 19.32];
export const LODZ_NORTH_EAST: [number, number] = [51.86, 19.64];

export const LODZ_BOUNDS = latLngBounds(LODZ_SOUTH_WEST, LODZ_NORTH_EAST);

export const LODZ_VIEWBOX = `${LODZ_SOUTH_WEST[1]},${LODZ_NORTH_EAST[0]},${LODZ_NORTH_EAST[1]},${LODZ_SOUTH_WEST[0]}`;

export const isInLodz = (latitude: number, longitude: number): boolean =>
    LODZ_BOUNDS.contains([latitude, longitude]);

export const LODZ_VIEW_BOUNDS = LODZ_BOUNDS.pad(0.15);

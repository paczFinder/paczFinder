import { apiRequest, type Paginated } from "./authApi";
import type { SortDirection } from "../utils/listQuery";

export interface RouteHistoryStop {
    id: number;
    routeHistoryId: number;
    deliveryId: number;
    stopOrder: number;
    address: string;
    latitude: number | null;
    longitude: number | null;
}

export interface RouteHistory {
    id: number;
    sourceRoutePlanId: number;
    tripId: number;
    totalDistanceM: number;
    drivingTimeS: number;
    serviceTimeS: number;
    totalTimeS: number;
    calculatedAt: string;
    courierKeycloakId: string | null;
    stops: RouteHistoryStop[];
}

export const getRouteHistory = (page: number, size: number) =>
    apiRequest<Paginated<RouteHistory>>(`/history/routes?page=${page}&size=${size}`);

export const getRouteHistoryById = (id: number) =>
    apiRequest<RouteHistory>(`/history/routes/${id}`);

export const getRouteHistoryBySourcePlan = (sourceRoutePlanId: number) =>
    apiRequest<RouteHistory>(`/history/routes/source-route-plan/${sourceRoutePlanId}`);

export const getTripRouteHistory = (tripId: number) =>
    apiRequest<RouteHistory[]>(`/history/trips/${tripId}`);

export const getLatestTripRouteHistory = (tripId: number) =>
    apiRequest<RouteHistory>(`/history/trips/${tripId}/latest`);

export const deleteRouteHistory = (id: number) =>
    apiRequest<void>(`/history/routes/${id}`, { method: "DELETE" });

export const formatDistance = (meters: number): string =>
    meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;

export const formatDuration = (seconds: number): string => {
    const totalMinutes = Math.round(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes} min`;
    return `${hours} h ${String(minutes).padStart(2, "0")} min`;
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

export const formatCalculatedAt = (iso: string): string => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? iso : DATE_FORMAT.format(date);
};

export interface HistoryQuery {
    search: string;
    sort: "calculatedAt";
    direction: SortDirection;
}

export const DEFAULT_HISTORY_QUERY: HistoryQuery = {
    search: "",
    sort: "calculatedAt",
    direction: "desc",
};

export const searchedTripId = (search: string): number | null => {
    const trimmed = search.trim().replace(/^#/, "");
    if (!/^\d+$/.test(trimmed)) return null;
    const value = Number(trimmed);
    return value > 0 ? value : null;
};

import { apiRequest, type Paginated } from "./authApi";
import type { Delivery } from "./deliveryApi";
import type { SortDirection } from "../utils/listQuery";

export type TripStatus = "ADDED" | "FINISHED";

export interface Trip {
    id: number;
    vehicleId: number;
    vehicleBrand: string;
    vehicleModel: string;
    registrationNumber: string;
    vehicleCapacity: number;
    courierKeycloakId: string | null;
    deliveryCount: number;
    usedCapacity: number;
    status: TripStatus;
}

export const tripLoadPercent = (trip: Pick<Trip, "usedCapacity" | "vehicleCapacity">): number =>
    trip.vehicleCapacity > 0 ? Math.min(100, (trip.usedCapacity / trip.vehicleCapacity) * 100) : 0;

export type TripSortField = "id" | "vehicle.registrationNumber" | "vehicle.brand";

export interface TripQuery {
    search: string;
    status: "all" | TripStatus;
    sort: TripSortField;
    direction: SortDirection;
}

export const DEFAULT_TRIP_QUERY: TripQuery = {
    search: "",
    status: "all",
    sort: "id",
    direction: "asc",
};

export const getTrips = (page: number, size: number, query: TripQuery = DEFAULT_TRIP_QUERY) => {
    const params = new URLSearchParams({
        page: String(page),
        size: String(size),
        sort: query.sort,
        direction: query.direction,
    });
    if (query.search.trim()) params.set("search", query.search.trim());
    if (query.status !== "all") params.set("status", query.status);

    return apiRequest<Paginated<Trip>>(`/trips?${params.toString()}`);
};

export const getTrip = (id: number) =>
    apiRequest<Trip>(`/trips/${id}`);

export const getTripDeliveries = (id: number) =>
    apiRequest<Delivery[]>(`/trips/${id}/deliveries`);

export const createTrip = (vehicleId: number) =>
    apiRequest<Trip>("/trips", { method: "POST", body: { vehicleId } });

export const changeTripVehicle = (id: number, vehicleId: number) =>
    apiRequest<Trip>(`/trips/${id}/vehicle`, { method: "PATCH", body: { vehicleId } });

export const deleteTrip = (id: number) =>
    apiRequest<void>(`/trips/${id}`, { method: "DELETE" });

export const addDeliveryToTrip = (id: number, deliveryId: number) =>
    apiRequest<Trip>(`/trips/${id}/deliveries`, { method: "POST", body: { deliveryId } });

export const addDeliveriesToTrip = (id: number, deliveryIds: number[]) =>
    apiRequest<Trip>(`/trips/${id}/deliveries/batch`, { method: "POST", body: { deliveryIds } });

export const finishTrip = (id: number) =>
    apiRequest<Trip>(`/trips/${id}/finish`, { method: "POST" });

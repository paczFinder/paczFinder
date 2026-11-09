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

/** GET /trips?page=&size=&search=&status=&sort=&direction= */
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

/** GET /trips/{id} */
export const getTrip = (id: number) =>
    apiRequest<Trip>(`/trips/${id}`);

/** GET /trips/{id}/deliveries */
export const getTripDeliveries = (id: number) =>
    apiRequest<Delivery[]>(`/trips/${id}/deliveries`);

/** POST /trips */
export const createTrip = (vehicleId: number) =>
    apiRequest<Trip>("/trips", { method: "POST", body: { vehicleId } });

/** PATCH /trips/{id}/vehicle */
export const changeTripVehicle = (id: number, vehicleId: number) =>
    apiRequest<Trip>(`/trips/${id}/vehicle`, { method: "PATCH", body: { vehicleId } });

/** DELETE /trips/{id} – przesyłki z kursu wracają do puli dostępnych */
export const deleteTrip = (id: number) =>
    apiRequest<void>(`/trips/${id}`, { method: "DELETE" });

/** POST /trips/{id}/deliveries */
export const addDeliveryToTrip = (id: number, deliveryId: number) =>
    apiRequest<Trip>(`/trips/${id}/deliveries`, { method: "POST", body: { deliveryId } });

/** POST /trips/{id}/deliveries/batch */
export const addDeliveriesToTrip = (id: number, deliveryIds: number[]) =>
    apiRequest<Trip>(`/trips/${id}/deliveries/batch`, { method: "POST", body: { deliveryIds } });

/** POST /trips/{id}/finish – oznacza przesyłki z kursu jako dostarczone */
export const finishTrip = (id: number) =>
    apiRequest<Trip>(`/trips/${id}/finish`, { method: "POST" });

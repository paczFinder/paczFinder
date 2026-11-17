import { apiRequest, type Paginated } from "./authApi";
import type { SortDirection } from "../utils/listQuery";

export interface Vehicle {
    id: number;
    brand: string;
    model: string;
    registrationNumber: string;
    capacity: number;
    active: boolean;
    courierKeycloakId: string | null;
}

export interface VehiclePayload {
    brand: string;
    model: string;
    registrationNumber: string;
    capacity: number;
    courierKeycloakId: string | null;
}

export type VehicleSortField = "id" | "registrationNumber" | "capacity";
export type VehicleStatusFilter = "all" | "active" | "inactive";
export type VehicleCourierFilter = "all" | "assigned" | "unassigned";

export interface VehicleQuery {
    search: string;
    status: VehicleStatusFilter;
    courier: VehicleCourierFilter;
    sort: VehicleSortField;
    direction: SortDirection;
}

export const DEFAULT_VEHICLE_QUERY: VehicleQuery = {
    search: "",
    status: "all",
    courier: "all",
    sort: "id",
    direction: "asc",
};

export const getVehicles = (page: number, size: number, query: VehicleQuery = DEFAULT_VEHICLE_QUERY) => {
    const params = new URLSearchParams({
        page: String(page),
        size: String(size),
        sort: query.sort,
        direction: query.direction,
    });
    if (query.search.trim()) params.set("search", query.search.trim());
    if (query.status !== "all") params.set("active", String(query.status === "active"));
    if (query.courier !== "all") params.set("hasCourier", String(query.courier === "assigned"));

    return apiRequest<Paginated<Vehicle>>(`/vehicles?${params.toString()}`);
};

export const getVehicle = (id: number) =>
    apiRequest<Vehicle>(`/vehicles/${id}`);

export const createVehicle = (payload: VehiclePayload) =>
    apiRequest<Vehicle>("/vehicles", { method: "POST", body: payload });

export const updateVehicle = (id: number, payload: VehiclePayload) =>
    apiRequest<Vehicle>(`/vehicles/${id}`, { method: "PUT", body: payload });

export const assignCourier = (id: number, keycloakUserId: string) =>
    apiRequest<Vehicle>(`/vehicles/${id}/courier`, { method: "PATCH", body: { keycloakUserId } });

export const unassignCourier = (id: number) =>
    apiRequest<Vehicle>(`/vehicles/${id}/courier`, { method: "DELETE" });

export const activateVehicle = (id: number) =>
    apiRequest<void>(`/vehicles/${id}/activate`, { method: "PATCH" });

export const deactivateVehicle = (id: number) =>
    apiRequest<void>(`/vehicles/${id}/deactivate`, { method: "DELETE" });

export const deleteVehicle = (id: number) =>
    apiRequest<void>(`/vehicles/${id}`, { method: "DELETE" });

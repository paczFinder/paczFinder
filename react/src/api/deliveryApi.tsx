import { apiRequest, type Paginated } from "./authApi";
import type { SortDirection } from "../utils/listQuery";

export type DeliverySize = "S" | "M" | "L";
export type DeliveryStatus = "ADDED" | "IN_DELIVERY" | "DELIVERED";

/** Ile jednostek ładowności pojazdu zajmuje paczka danego rozmiaru (jak DeliverySize w backendzie). */
export const DELIVERY_LOAD_UNITS: Record<DeliverySize, number> = { S: 1, M: 2, L: 4 };

export interface Delivery {
    id: number;
    recipientName: string;
    recipientPhone: string;
    street: string;
    buildingNumber: string;
    apartmentNumber: string | null;
    postalCode: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    size: DeliverySize;
    status: DeliveryStatus;
}

export interface DeliveryPayload {
    recipientName: string;
    recipientPhone: string;
    street: string;
    buildingNumber: string;
    apartmentNumber: string | null;
    postalCode: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    size: DeliverySize;
}

export const formatAddress = (d: Pick<Delivery, "street" | "buildingNumber" | "apartmentNumber" | "postalCode" | "city">): string =>
    `${d.street} ${d.buildingNumber}${d.apartmentNumber ? `/${d.apartmentNumber}` : ""}, ${d.postalCode} ${d.city}`;

export type DeliverySortField = "id" | "recipientName" | "city";

export interface DeliveryQuery {
    search: string;
    status: "all" | DeliveryStatus;
    size: "all" | DeliverySize;
    sort: DeliverySortField;
    direction: SortDirection;
}

export const DEFAULT_DELIVERY_QUERY: DeliveryQuery = {
    search: "",
    status: "all",
    size: "all",
    sort: "id",
    direction: "asc",
};

const deliveryParams = (page: number, size: number, query: DeliveryQuery, withStatus: boolean): string => {
    const params = new URLSearchParams({
        page: String(page),
        size: String(size),
        sort: query.sort,
        direction: query.direction,
    });
    if (query.search.trim()) params.set("search", query.search.trim());
    if (withStatus && query.status !== "all") params.set("status", query.status);
    if (query.size !== "all") params.set("deliverySize", query.size);
    return params.toString();
};

/** GET /deliveries?page=&size=&search=&status=&deliverySize=&sort=&direction= */
export const getDeliveries = (page: number, size: number, query: DeliveryQuery = DEFAULT_DELIVERY_QUERY) =>
    apiRequest<Paginated<Delivery>>(`/deliveries?${deliveryParams(page, size, query, true)}`);

/** GET /deliveries/available – przesyłki, które nie są jeszcze w żadnym kursie (te same filtry poza statusem) */
export const getAvailableDeliveries = (page: number, size: number, query: DeliveryQuery = DEFAULT_DELIVERY_QUERY) =>
    apiRequest<Paginated<Delivery>>(`/deliveries/available?${deliveryParams(page, size, query, false)}`);

/** GET /deliveries/{id} */
export const getDelivery = (id: number) =>
    apiRequest<Delivery>(`/deliveries/${id}`);

/** POST /deliveries */
export const createDelivery = (payload: DeliveryPayload) =>
    apiRequest<Delivery>("/deliveries", { method: "POST", body: payload });

/** PUT /deliveries/{id} */
export const updateDelivery = (id: number, payload: DeliveryPayload) =>
    apiRequest<Delivery>(`/deliveries/${id}`, { method: "PUT", body: payload });

/** DELETE /deliveries/{id} */
export const deleteDelivery = (id: number) =>
    apiRequest<void>(`/deliveries/${id}`, { method: "DELETE" });

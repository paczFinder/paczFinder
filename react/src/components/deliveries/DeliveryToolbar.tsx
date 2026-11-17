import ListToolbar, { type FilterField, type SortOption } from "../ListToolbar";
import { DEFAULT_DELIVERY_QUERY, type DeliveryQuery } from "../../api/deliveryApi";

const SCOPE_FILTER: FilterField<DeliveryQuery> = {
    key: "scope",
    label: "Show",
    options: [
        { value: "all", label: "All deliveries" },
        { value: "available", label: "Available for a trip" },
    ],
};

const STATUS_FILTER: FilterField<DeliveryQuery> = {
    key: "status",
    label: "Status",
    options: [
        { value: "all", label: "All" },
        { value: "ADDED", label: "Added" },
        { value: "IN_DELIVERY", label: "In delivery" },
        { value: "DELIVERED", label: "Delivered" },
    ],
};

const SIZE_FILTER: FilterField<DeliveryQuery> = {
    key: "size",
    label: "Size",
    options: [
        { value: "all", label: "All" },
        { value: "S", label: "S – small" },
        { value: "M", label: "M – medium" },
        { value: "L", label: "L – large" },
    ],
};

const SORT_OPTIONS: SortOption<DeliveryQuery>[] = [
    { label: "Oldest first", sort: "id", direction: "asc" },
    { label: "Newest first", sort: "id", direction: "desc" },
    { label: "Recipient A–Z", sort: "recipientName", direction: "asc" },
    { label: "Recipient Z–A", sort: "recipientName", direction: "desc" },
    { label: "City A–Z", sort: "city", direction: "asc" },
    { label: "City Z–A", sort: "city", direction: "desc" },
];

type DeliveryToolbarProps = {
    query: DeliveryQuery;
    onChange: (query: DeliveryQuery) => void;
};

export default function DeliveryToolbar({ query, onChange }: DeliveryToolbarProps) {
    const filters = query.scope === "available"
        ? [SCOPE_FILTER, SIZE_FILTER]
        : [SCOPE_FILTER, STATUS_FILTER, SIZE_FILTER];

    return (
        <ListToolbar
            query={query}
            defaultQuery={DEFAULT_DELIVERY_QUERY}
            searchLabel="Recipient, phone or address"
            filters={filters}
            sortOptions={SORT_OPTIONS}
            onChange={onChange}
            inlineSearch
        />
    );
}

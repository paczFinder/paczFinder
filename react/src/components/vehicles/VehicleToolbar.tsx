import ListToolbar, { type FilterField, type SortOption } from "../ListToolbar";
import { DEFAULT_VEHICLE_QUERY, type VehicleQuery } from "../../api/vehicleApi";

const FILTERS: FilterField<VehicleQuery>[] = [
    {
        key: "status",
        label: "Status",
        options: [
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
        ],
    },
    {
        key: "courier",
        label: "Courier",
        options: [
            { value: "all", label: "All" },
            { value: "assigned", label: "Assigned" },
            { value: "unassigned", label: "Not assigned" },
        ],
    },
];

const SORT_OPTIONS: SortOption<VehicleQuery>[] = [
    { label: "Oldest first", sort: "id", direction: "asc" },
    { label: "Newest first", sort: "id", direction: "desc" },
    { label: "Brand A–Z", sort: "brand", direction: "asc" },
    { label: "Brand Z–A", sort: "brand", direction: "desc" },
    { label: "Model A–Z", sort: "model", direction: "asc" },
    { label: "Registration A–Z", sort: "registrationNumber", direction: "asc" },
    { label: "Capacity: low to high", sort: "capacity", direction: "asc" },
    { label: "Capacity: high to low", sort: "capacity", direction: "desc" },
];

type VehicleToolbarProps = {
    query: VehicleQuery;
    onChange: (query: VehicleQuery) => void;
};

export default function VehicleToolbar({ query, onChange }: VehicleToolbarProps) {
    return (
        <ListToolbar
            query={query}
            defaultQuery={DEFAULT_VEHICLE_QUERY}
            searchLabel="Brand, model or registration"
            filters={FILTERS}
            sortOptions={SORT_OPTIONS}
            onChange={onChange}
        />
    );
}

import ListToolbar, { type FilterField, type SortOption } from "../ListToolbar";
import { DEFAULT_TRIP_QUERY, type TripQuery } from "../../api/tripApi";

const FILTERS: FilterField<TripQuery>[] = [
    {
        key: "status",
        label: "Status",
        options: [
            { value: "all", label: "All" },
            { value: "ADDED", label: "In progress" },
            { value: "FINISHED", label: "Finished" },
        ],
    },
];

const SORT_OPTIONS: SortOption<TripQuery>[] = [
    { label: "Oldest first", sort: "id", direction: "asc" },
    { label: "Newest first", sort: "id", direction: "desc" },
    { label: "Registration A–Z", sort: "vehicle.registrationNumber", direction: "asc" },
    { label: "Registration Z–A", sort: "vehicle.registrationNumber", direction: "desc" },
    { label: "Vehicle brand A–Z", sort: "vehicle.brand", direction: "asc" },
    { label: "Vehicle brand Z–A", sort: "vehicle.brand", direction: "desc" },
];

type TripToolbarProps = {
    query: TripQuery;
    onChange: (query: TripQuery) => void;
};

export default function TripToolbar({ query, onChange }: TripToolbarProps) {
    return (
        <ListToolbar
            query={query}
            defaultQuery={DEFAULT_TRIP_QUERY}
            searchLabel="Vehicle brand, model or registration"
            filters={FILTERS}
            sortOptions={SORT_OPTIONS}
            onChange={onChange}
        />
    );
}

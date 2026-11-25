import ListToolbar, { type SortOption } from "../ListToolbar";
import { DEFAULT_HISTORY_QUERY, type HistoryQuery } from "../../api/historyApi";

const SORT_OPTIONS: SortOption<HistoryQuery>[] = [
    { label: "Newest first", sort: "calculatedAt", direction: "desc" },
    { label: "Oldest first", sort: "calculatedAt", direction: "asc" },
];

type HistoryToolbarProps = {
    query: HistoryQuery;
    onChange: (query: HistoryQuery) => void;
};

export default function HistoryToolbar({ query, onChange }: HistoryToolbarProps) {
    return (
        <ListToolbar
            query={query}
            defaultQuery={DEFAULT_HISTORY_QUERY}
            searchLabel="Trip ID"
            filters={[]}
            sortOptions={SORT_OPTIONS}
            onChange={onChange}
            inlineSearch
        />
    );
}

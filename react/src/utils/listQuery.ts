export type SortDirection = "asc" | "desc";

/** Wspólna część zapytań list (pojazdy, przesyłki, kursy): wyszukiwanie + sortowanie, reszta to filtry. */
export interface BaseListQuery {
    search: string;
    sort: string;
    direction: SortDirection;
}

const isSortKey = (key: string): boolean => key === "sort" || key === "direction";

/** Ile filtrów (wyszukiwanie i pola inne niż sortowanie) różni się od wartości domyślnych. */
export const countActiveFilters = <Q extends BaseListQuery>(query: Q, defaults: Q): number =>
    (Object.keys(defaults) as (keyof Q & string)[])
        .filter((key) => !isSortKey(key))
        .filter((key) => (key === "search" ? query.search.trim() !== "" : query[key] !== defaults[key]))
        .length;

/** Czyści filtry, zostawiając wybrane sortowanie. */
export const clearFilters = <Q extends BaseListQuery>(query: Q, defaults: Q): Q => ({
    ...defaults,
    sort: query.sort,
    direction: query.direction,
});

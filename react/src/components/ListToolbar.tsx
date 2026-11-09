import React, { useState, type ReactNode } from "react";
import {
    Box, Button, Chip, InputAdornment, ListItemIcon, ListItemText,
    Menu, MenuItem, Popover, TextField,
} from "@mui/material";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { clearFilters, countActiveFilters, type BaseListQuery, type SortDirection } from "../utils/listQuery";
import { fieldSx } from "../styles/LoginStyle";
import {
    compactPrimaryButtonSx, compactSecondaryButtonSx, filterActionsSx, filterChipsSx,
    filterFormSx, listToolbarSx, menuCheckSx, popoverPaperSx, searchIconSx,
} from "../styles/AppStyle";

export type FilterOption = { value: string; label: string };

/** Filtr typu "lista wyboru"; pierwsza opcja powinna odpowiadać wartości domyślnej (np. "all"). */
export type FilterField<Q> = {
    key: Extract<keyof Q, string>;
    label: string;
    options: FilterOption[];
};

export type SortOption<Q extends BaseListQuery> = {
    label: string;
    sort: Q["sort"];
    direction: SortDirection;
};

type ListToolbarProps<Q extends BaseListQuery> = {
    query: Q;
    defaultQuery: Q;
    searchLabel: string;
    filters: FilterField<Q>[];
    sortOptions: SortOption<Q>[];
    onChange: (query: Q) => void;
    /** Dodatkowe elementy na początku paska (np. przełącznik zakresu listy). */
    leading?: ReactNode;
};

type FilterFormProps<Q extends BaseListQuery> = {
    initial: Q;
    searchLabel: string;
    filters: FilterField<Q>[];
    onApply: (query: Q) => void;
    onClear: () => void;
};

/** Formularz w popoverze – ma własny szkic, zmiany trafiają do listy dopiero po "Apply". */
function FilterForm<Q extends BaseListQuery>({ initial, searchLabel, filters, onApply, onClear }: FilterFormProps<Q>) {
    const [draft, setDraft] = useState<Q>(initial);

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        onApply({ ...draft, search: draft.search.trim() });
    };

    return (
        <Box component="form" noValidate onSubmit={handleSubmit} sx={filterFormSx()}>
            <TextField
                label="Search"
                placeholder={searchLabel}
                size="small"
                autoFocus
                fullWidth
                value={draft.search}
                onChange={(e) => setDraft({ ...draft, search: e.target.value })}
                sx={fieldSx()}
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchRoundedIcon fontSize="small" sx={searchIconSx()} />
                            </InputAdornment>
                        ),
                    },
                }}
            />

            {filters.map((filter) => (
                <TextField
                    key={filter.key}
                    select
                    label={filter.label}
                    size="small"
                    fullWidth
                    value={String(draft[filter.key])}
                    onChange={(e) => setDraft({ ...draft, [filter.key]: e.target.value })}
                    sx={fieldSx()}
                >
                    {filter.options.map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                </TextField>
            ))}

            <Box sx={filterActionsSx()}>
                <Button variant="outlined" onClick={onClear} sx={compactSecondaryButtonSx()}>
                    Clear
                </Button>
                <Button type="submit" variant="contained" sx={compactPrimaryButtonSx()}>
                    Apply
                </Button>
            </Box>
        </Box>
    );
}

/** Pasek nad tabelą: przycisk filtrów (wyszukiwanie + listy wyboru), menu sortowania i chipy aktywnych filtrów. */
export default function ListToolbar<Q extends BaseListQuery>({
    query, defaultQuery, searchLabel, filters, sortOptions, onChange, leading,
}: ListToolbarProps<Q>) {
    const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
    const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);

    const activeFilters = countActiveFilters(query, defaultQuery);
    const currentSort =
        sortOptions.find((o) => o.sort === query.sort && o.direction === query.direction) ?? sortOptions[0];

    const applyFilters = (next: Q): void => {
        setFilterAnchor(null);
        onChange(next);
    };

    const handleClear = (): void => {
        setFilterAnchor(null);
        onChange(clearFilters(query, defaultQuery));
    };

    const applySort = (option: SortOption<Q>): void => {
        setSortAnchor(null);
        onChange({ ...query, sort: option.sort, direction: option.direction });
    };

    const optionLabel = (filter: FilterField<Q>): string =>
        filter.options.find((o) => o.value === String(query[filter.key]))?.label ?? String(query[filter.key]);

    return (
        <Box sx={listToolbarSx()}>
            {leading}

            <Button
                variant="outlined"
                startIcon={<FilterListRoundedIcon />}
                onClick={(e) => setFilterAnchor(e.currentTarget)}
                aria-haspopup="dialog"
                sx={compactSecondaryButtonSx()}
            >
                {activeFilters > 0 ? `Filter (${activeFilters})` : "Filter"}
            </Button>

            <Button
                variant="outlined"
                startIcon={<SortRoundedIcon />}
                onClick={(e) => setSortAnchor(e.currentTarget)}
                aria-haspopup="menu"
                sx={compactSecondaryButtonSx()}
            >
                {currentSort.label}
            </Button>

            <Box sx={filterChipsSx()}>
                {query.search.trim() && (
                    <Chip
                        label={`Search: ${query.search}`}
                        onDelete={() => onChange({ ...query, search: defaultQuery.search })}
                    />
                )}
                {filters
                    .filter((filter) => query[filter.key] !== defaultQuery[filter.key])
                    .map((filter) => (
                        <Chip
                            key={filter.key}
                            label={`${filter.label}: ${optionLabel(filter)}`}
                            onDelete={() => onChange({ ...query, [filter.key]: defaultQuery[filter.key] })}
                        />
                    ))}
            </Box>

            <Popover
                open={filterAnchor !== null}
                anchorEl={filterAnchor}
                onClose={() => setFilterAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                slotProps={{ paper: { sx: popoverPaperSx() } }}
            >
                <FilterForm
                    initial={query}
                    searchLabel={searchLabel}
                    filters={filters}
                    onApply={applyFilters}
                    onClear={handleClear}
                />
            </Popover>

            <Menu
                open={sortAnchor !== null}
                anchorEl={sortAnchor}
                onClose={() => setSortAnchor(null)}
                slotProps={{ paper: { sx: popoverPaperSx() } }}
            >
                {sortOptions.map((option) => {
                    const selected = option === currentSort;
                    return (
                        <MenuItem key={option.label} selected={selected} onClick={() => applySort(option)}>
                            <ListItemIcon>
                                {selected && <CheckRoundedIcon fontSize="small" sx={menuCheckSx()} />}
                            </ListItemIcon>
                            <ListItemText>{option.label}</ListItemText>
                        </MenuItem>
                    );
                })}
            </Menu>
        </Box>
    );
}

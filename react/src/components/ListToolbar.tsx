import React, { useEffect, useRef, useState, type ReactNode } from "react";
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
    filterFormSx, inlineSearchSx, listToolbarSx, toolbarButtonSx, toolbarButtonsSx, menuCheckSx, popoverPaperSx, searchIconSx,
} from "../styles/AppStyle";

const SEARCH_DEBOUNCE_MS = 350;

export type FilterOption = { value: string; label: string };

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
    leading?: ReactNode;
    inlineSearch?: boolean;
};

type FilterFormProps<Q extends BaseListQuery> = {
    initial: Q;
    searchLabel: string;
    filters: FilterField<Q>[];
    showSearch: boolean;
    onApply: (query: Q) => void;
    onClear: () => void;
};

const searchAdornment = {
    input: {
        startAdornment: (
            <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" sx={searchIconSx()} />
            </InputAdornment>
        ),
    },
};

type InlineSearchProps = {
    value: string;
    placeholder: string;
    onSearch: (search: string) => void;
};

function InlineSearch({ value, placeholder, onSearch }: InlineSearchProps) {
    const [text, setText] = useState(value);
    const [syncedValue, setSyncedValue] = useState(value);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onSearchRef = useRef(onSearch);

    useEffect(() => {
        onSearchRef.current = onSearch;
    }, [onSearch]);

    useEffect(() => () => {
        if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    if (value !== syncedValue) {
        setSyncedValue(value);
        setText(value);
    }

    const cancelPending = (): void => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
    };

    const submit = (next: string): void => {
        cancelPending();
        if (next.trim() !== value.trim()) onSearchRef.current(next.trim());
    };

    const handleChange = (next: string): void => {
        setText(next);
        cancelPending();
        timerRef.current = setTimeout(() => submit(next), SEARCH_DEBOUNCE_MS);
    };

    return (
        <TextField
            placeholder={placeholder}
            size="small"
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === "Enter") submit(text);
            }}
            sx={[fieldSx(), inlineSearchSx()]}
            slotProps={{ ...searchAdornment, htmlInput: { "aria-label": "Search" } }}
        />
    );
}

function FilterForm<Q extends BaseListQuery>({ initial, searchLabel, filters, showSearch, onApply, onClear }: FilterFormProps<Q>) {
    const [draft, setDraft] = useState<Q>(initial);

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();
        onApply({ ...draft, search: draft.search.trim() });
    };

    return (
        <Box component="form" noValidate onSubmit={handleSubmit} sx={filterFormSx(!showSearch)}>
            {showSearch && (
                <TextField
                    label="Search"
                    placeholder={searchLabel}
                    size="small"
                    autoFocus
                    fullWidth
                    value={draft.search}
                    onChange={(e) => setDraft({ ...draft, search: e.target.value })}
                    sx={fieldSx()}
                    slotProps={searchAdornment}
                />
            )}

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

export default function ListToolbar<Q extends BaseListQuery>({
    query, defaultQuery, searchLabel, filters, sortOptions, onChange, leading, inlineSearch = false,
}: ListToolbarProps<Q>) {
    const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
    const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);

    const activeFilters = countActiveFilters(query, defaultQuery) - (inlineSearch && query.search.trim() ? 1 : 0);
    const currentSort =
        sortOptions.find((o) => o.sort === query.sort && o.direction === query.direction) ?? sortOptions[0];

    const applyFilters = (next: Q): void => {
        setFilterAnchor(null);
        onChange(next);
    };

    const handleClear = (): void => {
        setFilterAnchor(null);
        const cleared = clearFilters(query, defaultQuery);
        onChange(inlineSearch ? { ...cleared, search: query.search } : cleared);
    };

    const handleInlineSearch = (search: string): void => onChange({ ...query, search });

    const applySort = (option: SortOption<Q>): void => {
        setSortAnchor(null);
        onChange({ ...query, sort: option.sort, direction: option.direction });
    };

    const optionLabel = (filter: FilterField<Q>): string =>
        filter.options.find((o) => o.value === String(query[filter.key]))?.label ?? String(query[filter.key]);

    return (
        <Box sx={listToolbarSx()}>
            {leading}

            {inlineSearch && (
                <InlineSearch value={query.search} placeholder={searchLabel} onSearch={handleInlineSearch} />
            )}

            <Box sx={toolbarButtonsSx(inlineSearch)}>
                <Button
                    variant="outlined"
                    startIcon={<FilterListRoundedIcon />}
                    onClick={(e) => setFilterAnchor(e.currentTarget)}
                    aria-haspopup="dialog"
                    sx={toolbarButtonSx()}
                >
                    {activeFilters > 0 ? `Filter (${activeFilters})` : "Filter"}
                </Button>

                <Button
                    variant="outlined"
                    startIcon={<SortRoundedIcon />}
                    onClick={(e) => setSortAnchor(e.currentTarget)}
                    aria-haspopup="menu"
                    sx={toolbarButtonSx()}
                >
                    {currentSort.label}
                </Button>
            </Box>

            <Box sx={filterChipsSx(inlineSearch)}>
                {!inlineSearch && query.search.trim() && (
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
                    showSearch={!inlineSearch}
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

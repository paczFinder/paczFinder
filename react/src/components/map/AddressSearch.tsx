import { useRef, useState } from "react";
import { Autocomplete, CircularProgress, InputAdornment, TextField } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { searchAddress, type GeocodeResult } from "../../api/geocodingApi";
import { fieldSx } from "../../styles/LoginStyle";
import { mapSearchSx } from "../../styles/AppStyle";

type Props = {
    onSelect: (result: GeocodeResult | null) => void;
    onError: (message: string) => void;
};

export default function AddressSearch({ onSelect, onError }: Props) {
    const [input, setInput] = useState("");
    const [options, setOptions] = useState<GeocodeResult[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [noResults, setNoResults] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const runSearch = (text: string): void => {
        const query = text.trim();
        if (!query) return;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setNoResults(false);
        searchAddress(query, controller.signal)
            .then((results) => {
                setOptions(results);
                setNoResults(results.length === 0);
                setOpen(true);
                if (results.length === 1) onSelect(results[0]);
            })
            .catch((e: unknown) => {
                if (controller.signal.aborted) return;
                onError(e instanceof Error ? e.message : "Address search failed.");
            })
            .finally(() => {
                if (abortRef.current === controller) setLoading(false);
            });
    };

    return (
        <Autocomplete<GeocodeResult, false, false, true>
            freeSolo
            size="small"
            sx={mapSearchSx()}
            options={options}
            open={open}
            onOpen={() => (options.length > 0 || noResults) && setOpen(true)}
            noOptionsText="No address found."
            onClose={() => setOpen(false)}
            filterOptions={(items) => items}
            getOptionLabel={(option) => (typeof option === "string" ? option : option.label)}
            getOptionKey={(option) => (typeof option === "string" ? option : option.id)}
            inputValue={input}
            onInputChange={(_, value, reason) => {
                setInput(value);
                if (reason === "clear") {
                    setOptions([]);
                    setNoResults(false);
                    onSelect(null);
                }
            }}
            onChange={(_, value) => {
                if (typeof value === "string") {
                    runSearch(value);
                } else if (value) {
                    onSelect(value);
                }
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    placeholder="Search address and press Enter"
                    sx={fieldSx()}
                    slotProps={{
                        ...params.slotProps,
                        input: {
                            ...params.slotProps.input,
                            startAdornment: (
                                <InputAdornment position="start">
                                    {loading ? <CircularProgress size={18} /> : <SearchRoundedIcon fontSize="small" />}
                                </InputAdornment>
                            ),
                        },
                    }}
                />
            )}
        />
    );
}

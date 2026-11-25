import { useEffect, useMemo, useState } from "react";
import {
    Alert, Autocomplete, Box, Button, LinearProgress, Paper, TextField,
    ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import AddLocationAltRoundedIcon from "@mui/icons-material/AddLocationAltRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AppLayout from "../../components/AppLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import AddedPinMarker, { type AddedPin } from "../../components/map/AddedPinMarker";
import AddressSearch from "../../components/map/AddressSearch";
import DeliveryMarker from "../../components/map/DeliveryMarker";
import FitToDeliveries from "../../components/map/FitToDeliveries";
import LodzBoundsLimiter from "../../components/map/LodzBoundsLimiter";
import MapClickPicker from "../../components/map/MapClickPicker";
import SearchResultMarker from "../../components/map/SearchResultMarker";
import { getErrorMessage } from "../../api/authApi";
import { formatCoordinates, reverseGeocode, type GeocodeResult } from "../../api/geocodingApi";
import { formatAddress, getDeliveries, type Delivery } from "../../api/deliveryApi";
import { getTripDeliveries, getTrips, type Trip } from "../../api/tripApi";
import { fieldSx } from "../../styles/LoginStyle";
import { LODZ_BOUNDS, LODZ_CENTER } from "../../utils/lodzArea";
import {
    ADDED_PIN_COLOR, bodyTextSx, compactPrimaryButtonSx, compactSecondaryButtonSx, DELIVERY_PIN_COLORS, headerActionsSx, homeCardSx, mapAlertSx, mapBoxSx, mapLegendDotSx,
    mapLegendItemSx, mapLegendSx, mapPickerSx, mapProgressSx, mapToolbarSx, pageHeaderSx, pageTitleSx, SEARCH_PIN_COLOR,
} from "../../styles/AppStyle";

const DEFAULT_ZOOM = 12;
const FETCH_ALL_SIZE = 1000;

type Mode = "all" | "delivery" | "trip";

const LEGEND = [
    { label: "Added", color: DELIVERY_PIN_COLORS.ADDED },
    { label: "In delivery", color: DELIVERY_PIN_COLORS.IN_DELIVERY },
    { label: "Delivered", color: DELIVERY_PIN_COLORS.DELIVERED },
    { label: "Searched address", color: SEARCH_PIN_COLOR },
    { label: "Added pin", color: ADDED_PIN_COLOR },
];

type PendingPin = Omit<AddedPin, "id"> & { resolving: boolean };

const deliveryLabel = (d: Delivery): string => `#${d.id} · ${d.recipientName} — ${formatAddress(d)}`;
const tripLabel = (t: Trip): string =>
    `#${t.id} · ${t.registrationNumber} (${t.vehicleBrand} ${t.vehicleModel}) · ${t.deliveryCount} deliveries`;

export default function MapPage() {
    const [mode, setMode] = useState<Mode>("all");

    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [tripDeliveries, setTripDeliveries] = useState<Delivery[]>([]);
    const [tripLoading, setTripLoading] = useState(false);
    const [searchResult, setSearchResult] = useState<GeocodeResult | null>(null);

    const [picking, setPicking] = useState(false);
    const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
    const [addedPins, setAddedPins] = useState<AddedPin[]>([]);

    useEffect(() => {
        let cancelled = false;
        Promise.all([getDeliveries(0, FETCH_ALL_SIZE), getTrips(0, FETCH_ALL_SIZE)])
            .then(([deliveryPage, tripPage]) => {
                if (cancelled) return;
                setDeliveries(deliveryPage.content);
                setTrips(tripPage.content);
            })
            .catch((e: unknown) => {
                if (!cancelled) setError(getErrorMessage(e));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!selectedTrip) return;
        let cancelled = false;
        getTripDeliveries(selectedTrip.id)
            .then((items) => {
                if (!cancelled) setTripDeliveries(items);
            })
            .catch((e: unknown) => {
                if (!cancelled) setError(getErrorMessage(e));
            })
            .finally(() => {
                if (!cancelled) setTripLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [selectedTrip]);

    const handleTripChange = (trip: Trip | null): void => {
        setSelectedTrip(trip);
        setTripDeliveries([]);
        setTripLoading(trip !== null);
        setError(null);
    };

    const handlePick = (latitude: number, longitude: number): void => {
        setPendingPin({ latitude, longitude, address: null, resolving: true });
        reverseGeocode(latitude, longitude)
            .catch(() => null)
            .then((address) => {
                setPendingPin((current) =>
                    current && current.latitude === latitude && current.longitude === longitude
                        ? { ...current, address, resolving: false }
                        : current,
                );
            });
    };

    const confirmPin = async (): Promise<void> => {
        if (!pendingPin) return;
        const { latitude, longitude, address } = pendingPin;
        setAddedPins((pins) => [...pins, { id: Date.now(), latitude, longitude, address }]);
        setPendingPin(null);
        setPicking(false);
    };

    const pendingMessage = pendingPin
        ? `Are you sure you want to add a pin at ${
            pendingPin.resolving
                ? formatCoordinates(pendingPin.latitude, pendingPin.longitude)
                : pendingPin.address ?? formatCoordinates(pendingPin.latitude, pendingPin.longitude)
        }?`
        : "";

    const visible = useMemo<Delivery[]>(() => {
        if (mode === "all") return deliveries;
        if (mode === "delivery") return selectedDelivery ? [selectedDelivery] : [];
        return tripDeliveries;
    }, [mode, deliveries, selectedDelivery, tripDeliveries]);

    const showTripEmpty = mode === "trip" && selectedTrip !== null && !tripLoading && tripDeliveries.length === 0;

    return (
        <AppLayout>
            <Box sx={pageHeaderSx()}>
                <Box>
                    <Typography component="h1" sx={pageTitleSx()}>
                        Map
                    </Typography>
                    <Typography sx={bodyTextSx()}>
                        See vehicles, deliveries and trip routes on the map.
                    </Typography>
                </Box>

                <Box sx={headerActionsSx()}>
                    <AddressSearch
                        onSelect={(result) => {
                            setSearchResult(result);
                            if (result) setError(null);
                        }}
                        onError={setError}
                    />
                    {picking ? (
                        <Button
                            variant="outlined"
                            startIcon={<CloseRoundedIcon />}
                            onClick={() => setPicking(false)}
                            sx={compactSecondaryButtonSx()}
                        >
                            Cancel
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            startIcon={<AddLocationAltRoundedIcon />}
                            onClick={() => setPicking(true)}
                            sx={compactPrimaryButtonSx()}
                        >
                            Add
                        </Button>
                    )}
                </Box>
            </Box>

            <Box sx={mapToolbarSx()}>
                <ToggleButtonGroup
                    exclusive
                    size="small"
                    color="primary"
                    value={mode}
                    onChange={(_, value: Mode | null) => value && setMode(value)}
                >
                    <ToggleButton value="all">All</ToggleButton>
                    <ToggleButton value="delivery">Delivery</ToggleButton>
                    <ToggleButton value="trip">Trip</ToggleButton>
                </ToggleButtonGroup>

                {mode === "delivery" && (
                    <Autocomplete
                        size="small"
                        sx={mapPickerSx()}
                        options={deliveries}
                        value={selectedDelivery}
                        onChange={(_, value) => setSelectedDelivery(value)}
                        getOptionLabel={deliveryLabel}
                        isOptionEqualToValue={(a, b) => a.id === b.id}
                        loading={loading}
                        renderInput={(params) => (
                            <TextField {...params} label="Choose delivery" sx={fieldSx()} />
                        )}
                    />
                )}

                {mode === "trip" && (
                    <Autocomplete
                        size="small"
                        sx={mapPickerSx()}
                        options={trips}
                        value={selectedTrip}
                        onChange={(_, value) => handleTripChange(value)}
                        getOptionLabel={tripLabel}
                        isOptionEqualToValue={(a, b) => a.id === b.id}
                        loading={loading}
                        renderInput={(params) => (
                            <TextField {...params} label="Choose trip" sx={fieldSx()} />
                        )}
                    />
                )}

                <Box sx={mapLegendSx()}>
                    {LEGEND.map((item) => (
                        <Box key={item.label} sx={mapLegendItemSx()}>
                            <Box sx={mapLegendDotSx(item.color)} />
                            {item.label}
                        </Box>
                    ))}
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={mapAlertSx()}>
                    {error}
                </Alert>
            )}

            {picking && (
                <Alert severity="info" sx={mapAlertSx()}>
                    Click on the map to choose the location of the pin. Only places in Łódź can be picked.
                </Alert>
            )}

            {showTripEmpty && (
                <Alert severity="info" sx={mapAlertSx()}>
                    This trip has no deliveries yet.
                </Alert>
            )}

            <Paper elevation={0} sx={homeCardSx()}>
                {(loading || tripLoading) && <LinearProgress sx={mapProgressSx()} />}
                <Box sx={mapBoxSx()}>
                    <MapContainer
                        center={LODZ_CENTER}
                        zoom={DEFAULT_ZOOM}
                        maxBounds={LODZ_BOUNDS}
                        maxBoundsViscosity={1}
                        scrollWheelZoom
                        style={{ height: "100%", width: "100%" }}
                    >
                        <LodzBoundsLimiter />
                        <TileLayer
                            bounds={LODZ_BOUNDS}
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {visible.map((delivery) => (
                            <DeliveryMarker key={delivery.id} delivery={delivery} />
                        ))}
                        {searchResult && <SearchResultMarker result={searchResult} />}
                        {addedPins.map((pin) => (
                            <AddedPinMarker
                                key={pin.id}
                                pin={pin}
                                onRemove={(id) => setAddedPins((pins) => pins.filter((p) => p.id !== id))}
                            />
                        ))}
                        <MapClickPicker active={picking && !pendingPin} onPick={handlePick} />
                        <FitToDeliveries
                            deliveries={visible}
                            fallbackCenter={LODZ_CENTER}
                            fallbackZoom={DEFAULT_ZOOM}
                        />
                    </MapContainer>
                </Box>
            </Paper>

            {pendingPin && (
                <ConfirmDialog
                    title="Add pin"
                    message={pendingMessage}
                    confirmLabel="Add"
                    onClose={() => setPendingPin(null)}
                    onConfirm={confirmPin}
                />
            )}
        </AppLayout>
    );
}

export interface GeocodeResult {
    id: number;
    label: string;
    latitude: number;
    longitude: number;
}

interface NominatimItem {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

export const formatCoordinates = (latitude: number, longitude: number): string =>
    `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const LODZ_VIEWBOX = "19.32,51.86,19.64,51.68";

export const searchAddress = async (query: string, signal?: AbortSignal): Promise<GeocodeResult[]> => {
    const params = new URLSearchParams({
        q: query,
        format: "jsonv2",
        countrycodes: "pl",
        viewbox: LODZ_VIEWBOX,
        limit: "5",
        "accept-language": "pl",
    });

    const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, { signal });
    if (!response.ok) {
        throw new Error("Address search failed. Try again in a moment.");
    }

    const items = (await response.json()) as NominatimItem[];
    return items.map((item) => ({
        id: item.place_id,
        label: item.display_name,
        latitude: Number(item.lat),
        longitude: Number(item.lon),
    }));
};

export const reverseGeocode = async (latitude: number, longitude: number, signal?: AbortSignal): Promise<string | null> => {
    const params = new URLSearchParams({
        lat: String(latitude),
        lon: String(longitude),
        format: "jsonv2",
        zoom: "18",
        "accept-language": "pl",
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, { signal });
    if (!response.ok) return null;

    const item = (await response.json()) as Partial<NominatimItem>;
    return item.display_name ?? null;
};

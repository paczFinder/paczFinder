import { divIcon, type DivIcon } from "leaflet";

export const pinIcon = (color: string, width = 28): DivIcon => {
    const height = Math.round((width * 40) / 28);
    return divIcon({
        className: "",
        iconSize: [width, height],
        iconAnchor: [width / 2, height],
        popupAnchor: [0, -height + 4],
        html: `<svg width="${width}" height="${height}" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 1C6.8 1 1 6.8 1 14c0 9.8 13 25 13 25s13-15.2 13-25C27 6.8 21.2 1 14 1z"
                fill="${color}" stroke="#ffffff" stroke-width="2"/>
            <circle cx="14" cy="14" r="5" fill="#ffffff"/>
        </svg>`,
    });
};

import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";
import {
    Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
    DialogTitle, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import { divIcon, latLngBounds, type DivIcon } from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import StraightenRoundedIcon from "@mui/icons-material/StraightenRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import LodzBoundsLimiter from "../map/LodzBoundsLimiter";
import { getErrorMessage } from "../../api/authApi";
import {
    formatCalculatedAt, formatDistance, formatDuration, getRouteHistoryById,
    type RouteHistory, type RouteHistoryStop,
} from "../../api/historyApi";
import { LODZ_BOUNDS, LODZ_CENTER } from "../../utils/lodzArea";
import {
    compactSecondaryButtonSx, detailsLabelSx, detailsListSx, detailsRowSx, detailsValueSx,
    dialogActionsSx, dialogPaperSx, dialogTitleSx, helperTextSx, HISTORY_ROUTE_COLOR,
    historyMapBoxSx, historySummaryIconSx, historySummaryLabelSx, historySummarySx, historySummaryTileSx,
    historySummaryValueSx, monoTextSx, mutedTextSx, sectionTitleSx, stateBoxSx,
    stopOrderBadgeSx, tableHeadCellSx,
} from "../../styles/AppStyle";

type RouteHistoryDetailsDialogProps = {
    historyId: number;
    preloaded?: RouteHistory;
    onClose: () => void;
};

type LocatedStop = RouteHistoryStop & { latitude: number; longitude: number };

const hasLocation = (stop: RouteHistoryStop): stop is LocatedStop =>
    stop.latitude !== null && stop.longitude !== null;

const stopIcon = (order: number): DivIcon =>
    divIcon({
        className: "",
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        popupAnchor: [0, -14],
        html: `<div style="width:26px;height:26px;border-radius:50%;background:${HISTORY_ROUTE_COLOR};
            color:#fff;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);
            display:flex;align-items:center;justify-content:center;font:700 12px/1 sans-serif;">${order}</div>`,
    });

function FitToStops({ stops }: { stops: LocatedStop[] }) {
    const map = useMap();

    useEffect(() => {
        const timer = window.setTimeout(() => {
            map.invalidateSize();
            if (stops.length === 1) {
                map.setView([stops[0].latitude, stops[0].longitude], 15);
            } else if (stops.length > 1) {
                const bounds = latLngBounds(stops.map((s) => [s.latitude, s.longitude] as [number, number]));
                map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
            }
        }, 250);
        return () => window.clearTimeout(timer);
    }, [map, stops]);

    return null;
}

export default function RouteHistoryDetailsDialog({ historyId, preloaded, onClose }: RouteHistoryDetailsDialogProps) {
    const [history, setHistory] = useState<RouteHistory | null>(preloaded ?? null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (preloaded) return;
        let cancelled = false;
        getRouteHistoryById(historyId)
            .then((result) => {
                if (!cancelled) setHistory(result);
            })
            .catch((err: unknown) => {
                if (!cancelled) setError(getErrorMessage(err));
            });
        return () => {
            cancelled = true;
        };
    }, [historyId, preloaded]);

    const stops = useMemo(
        () => [...(history?.stops ?? [])].sort((a, b) => a.stopOrder - b.stopOrder),
        [history],
    );
    const locatedStops = useMemo(() => stops.filter(hasLocation), [stops]);
    const routeLine = useMemo(
        () => locatedStops.map((s) => [s.latitude, s.longitude] as [number, number]),
        [locatedStops],
    );

    const summary: [string, ReactElement, string][] = history
        ? [
            ["Distance", <StraightenRoundedIcon sx={historySummaryIconSx()} />, formatDistance(history.totalDistanceM)],
            ["Driving", <DirectionsCarRoundedIcon sx={historySummaryIconSx()} />, formatDuration(history.drivingTimeS)],
            ["Service", <Inventory2RoundedIcon sx={historySummaryIconSx()} />, formatDuration(history.serviceTimeS)],
            ["Total time", <ScheduleRoundedIcon sx={historySummaryIconSx()} />, formatDuration(history.totalTimeS)],
        ]
        : [];

    const rows: [string, ReactNode][] = history
        ? [
            ["History entry", `#${history.id}`],
            ["Trip", `#${history.tripId}`],
            ["Route plan", `#${history.sourceRoutePlanId}`],
            ["Calculated at", formatCalculatedAt(history.calculatedAt)],
            [
                "Courier",
                history.courierKeycloakId
                    ? <Box component="span" sx={monoTextSx()}>{history.courierKeycloakId}</Box>
                    : <Box component="span" sx={mutedTextSx()}>Not assigned</Box>,
            ],
        ]
        : [];

    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="md" slotProps={{ paper: { sx: dialogPaperSx() } }}>
            <DialogTitle sx={dialogTitleSx()}>
                Route history{history ? ` #${history.id}` : ""}
            </DialogTitle>

            <DialogContent>
                {error && <Alert severity="error">{error}</Alert>}

                {!error && !history && (
                    <Box sx={stateBoxSx()}>
                        <CircularProgress />
                    </Box>
                )}

                {history && (
                    <>
                        <Box sx={historySummarySx()}>
                            {summary.map(([label, icon, value]) => (
                                <Box key={label} sx={historySummaryTileSx()}>
                                    <Typography component="div" sx={historySummaryLabelSx()}>
                                        {icon}
                                        {label}
                                    </Typography>
                                    <Typography sx={historySummaryValueSx()}>{value}</Typography>
                                </Box>
                            ))}
                        </Box>

                        <Box sx={{ ...detailsListSx(), mt: 2 }}>
                            {rows.map(([label, value]) => (
                                <Box key={label} sx={detailsRowSx()}>
                                    <Typography sx={detailsLabelSx()}>{label}</Typography>
                                    <Box sx={detailsValueSx()}>{value}</Box>
                                </Box>
                            ))}
                        </Box>

                        <Typography sx={sectionTitleSx()}>Route</Typography>
                        {locatedStops.length === 0 ? (
                            <Typography sx={helperTextSx()}>No coordinates saved for this route.</Typography>
                        ) : (
                            <>
                                <Box sx={historyMapBoxSx()}>
                                    <MapContainer
                                        center={LODZ_CENTER}
                                        zoom={12}
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
                                        {routeLine.length > 1 && (
                                            <Polyline
                                                positions={routeLine}
                                                pathOptions={{ color: HISTORY_ROUTE_COLOR, weight: 4, opacity: 0.7, dashArray: "6 8" }}
                                            />
                                        )}
                                        {locatedStops.map((stop) => (
                                            <Marker
                                                key={stop.id}
                                                position={[stop.latitude, stop.longitude]}
                                                icon={stopIcon(stop.stopOrder)}
                                            >
                                                <Popup>
                                                    <strong>Stop {stop.stopOrder}</strong> · delivery #{stop.deliveryId}
                                                    <br />
                                                    {stop.address}
                                                </Popup>
                                            </Marker>
                                        ))}
                                        <FitToStops stops={locatedStops} />
                                    </MapContainer>
                                </Box>
                                <Typography sx={{ ...helperTextSx(), mt: 0.5 }}>
                                    The line connects stops in visiting order; it is not the exact road geometry.
                                </Typography>
                            </>
                        )}

                        <Typography sx={sectionTitleSx()}>Stops ({stops.length})</Typography>
                        {stops.length === 0 ? (
                            <Typography sx={helperTextSx()}>This snapshot has no stops.</Typography>
                        ) : (
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={tableHeadCellSx()}>Order</TableCell>
                                        <TableCell sx={tableHeadCellSx()}>Delivery</TableCell>
                                        <TableCell sx={tableHeadCellSx()}>Address</TableCell>
                                        <TableCell sx={tableHeadCellSx()} align="right">Coordinates</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stops.map((stop) => (
                                        <TableRow key={stop.id}>
                                            <TableCell>
                                                <Box component="span" sx={stopOrderBadgeSx()}>{stop.stopOrder}</Box>
                                            </TableCell>
                                            <TableCell>#{stop.deliveryId}</TableCell>
                                            <TableCell>{stop.address}</TableCell>
                                            <TableCell align="right">
                                                {hasLocation(stop) ? (
                                                    <Box component="span" sx={monoTextSx()}>
                                                        {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                                                    </Box>
                                                ) : (
                                                    <Box component="span" sx={mutedTextSx()}>—</Box>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </>
                )}
            </DialogContent>

            <DialogActions sx={dialogActionsSx()}>
                <Button variant="outlined" onClick={onClose} sx={compactSecondaryButtonSx()}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

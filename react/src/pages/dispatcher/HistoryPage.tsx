import { useEffect, useState, type ChangeEvent } from "react";
import {
    Alert, Box, Button, CircularProgress, IconButton, LinearProgress, Paper, Snackbar,
    Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow,
    Tooltip, Typography,
} from "@mui/material";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AppLayout from "../../components/AppLayout";
import ConfirmDialog from "../../components/ConfirmDialog";
import HistoryToolbar from "../../components/history/HistoryToolbar";
import RouteHistoryDetailsDialog from "../../components/history/RouteHistoryDetailsDialog";
import { ApiError, getErrorMessage } from "../../api/authApi";
import {
    deleteRouteHistory, formatCalculatedAt, formatDistance, formatDuration,
    getRouteHistory, getTripRouteHistory, searchedTripId, DEFAULT_HISTORY_QUERY,
    type HistoryQuery, type RouteHistory,
} from "../../api/historyApi";
import routeHistoryMock from "../../mocks/routeHistory.json";
import { alertSx } from "../../styles/LoginStyle";
import {
    actionIconSx, actionsCellSx, bodyTextSx, brandCellSx, cardSx, compactSecondaryButtonSx,
    dangerIconSx, monoTextSx, mutedTextSx, nowrapCellSx, pageHeaderSx, pageTitleSx,
    rowIconSx, stateBoxSx, tableHeadCellSx,
} from "../../styles/AppStyle";

const ROWS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

const MOCK_HISTORY: RouteHistory[] = routeHistoryMock;

type HistoryTarget = { kind: "all" } | { kind: "trip"; tripId: number } | { kind: "invalid" };

type HistoryResult = {
    rows: RouteHistory[];
    total: number;
    mock: boolean;
};

type DialogState =
    | { type: "details"; history: RouteHistory }
    | { type: "delete"; history: RouteHistory }
    | null;

type Notice = { severity: "success" | "error"; message: string } | null;

const shortId = (id: string): string => (id.length > 12 ? `${id.slice(0, 8)}…` : id);

const isNotFound = (err: unknown): boolean => err instanceof ApiError && err.status === 404;

const targetOf = (search: string): HistoryTarget => {
    if (!search.trim()) return { kind: "all" };
    const tripId = searchedTripId(search);
    return tripId !== null ? { kind: "trip", tripId } : { kind: "invalid" };
};

const targetKey = (target: HistoryTarget): string =>
    target.kind === "trip" ? `trip:${target.tripId}` : target.kind;

const targetFromKey = (key: string): HistoryTarget => {
    if (key.startsWith("trip:")) return { kind: "trip", tripId: Number(key.slice(5)) };
    return key === "invalid" ? { kind: "invalid" } : { kind: "all" };
};

const pageOf = (list: RouteHistory[], page: number, size: number): RouteHistory[] =>
    list.slice(page * size, page * size + size);

const ordered = (list: RouteHistory[], oldestFirst: boolean): RouteHistory[] =>
    oldestFirst ? [...list].reverse() : list;

const mockResult = (
    target: HistoryTarget, page: number, size: number, oldestFirst: boolean, removedIds: number[],
): HistoryResult => {
    const list = MOCK_HISTORY
        .filter((h) => !removedIds.includes(h.id))
        .filter((h) => target.kind !== "trip" || h.tripId === target.tripId);
    return { rows: pageOf(ordered(list, oldestFirst), page, size), total: list.length, mock: true };
};

async function getOldestFirstPage(page: number, size: number): Promise<{ rows: RouteHistory[]; total: number }> {
    const total = (await getRouteHistory(0, 1)).totalElements;
    const to = total - 1 - page * size;
    if (to < 0) return { rows: [], total };
    const from = Math.max(0, total - (page + 1) * size);

    const firstPage = Math.floor(from / size);
    const lastPage = Math.floor(to / size);
    const pages = await Promise.all(
        Array.from({ length: lastPage - firstPage + 1 }, (_, i) => getRouteHistory(firstPage + i, size)),
    );
    const offset = firstPage * size;
    const slice = pages.flatMap((p) => p.content).slice(from - offset, to - offset + 1);
    return { rows: slice.reverse(), total };
}

async function fetchHistory(
    target: HistoryTarget,
    page: number,
    size: number,
    oldestFirst: boolean,
    useMock: boolean,
    removedIds: number[],
): Promise<HistoryResult> {
    if (target.kind === "invalid") return { rows: [], total: 0, mock: useMock };
    if (useMock) return mockResult(target, page, size, oldestFirst, removedIds);

    if (target.kind === "all") {
        try {
            const result = oldestFirst
                ? await getOldestFirstPage(page, size)
                : await getRouteHistory(page, size).then((r) => ({ rows: r.content, total: r.totalElements }));
            if (result.total === 0) return mockResult(target, page, size, oldestFirst, removedIds);
            return { ...result, mock: false };
        } catch (err) {
            if (err instanceof ApiError && err.status === 403) throw err;
            return mockResult(target, page, size, oldestFirst, removedIds);
        }
    }

    try {
        const list = await getTripRouteHistory(target.tripId);
        return { rows: pageOf(ordered(list, oldestFirst), page, size), total: list.length, mock: false };
    } catch (err) {
        if (isNotFound(err)) return { rows: [], total: 0, mock: false };
        throw err;
    }
}

export default function HistoryPage() {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [query, setQuery] = useState<HistoryQuery>(DEFAULT_HISTORY_QUERY);
    const [reloadKey, setReloadKey] = useState(0);

    const [data, setData] = useState<HistoryResult | null>(null);
    const [useMock, setUseMock] = useState(false);
    const [removedIds, setRemovedIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [dialog, setDialog] = useState<DialogState>(null);
    const [notice, setNotice] = useState<Notice>(null);

    const target = targetOf(query.search);
    const key = targetKey(target);
    const oldestFirst = query.direction === "asc";

    useEffect(() => {
        let cancelled = false;
        fetchHistory(targetFromKey(key), page, rowsPerPage, oldestFirst, useMock, removedIds)
            .then((result) => {
                if (cancelled) return;
                setData(result);
                setUseMock(result.mock);
                setLoadError(null);
            })
            .catch((err: unknown) => {
                if (!cancelled) setLoadError(getErrorMessage(err));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [key, page, rowsPerPage, oldestFirst, useMock, removedIds, reloadKey]);

    const rows = data?.rows ?? [];

    const reload = (): void => {
        setLoading(true);
        setReloadKey((k) => k + 1);
    };

    const handleQueryChange = (newQuery: HistoryQuery): void => {
        const refetch = targetKey(targetOf(newQuery.search)) !== key
            || newQuery.direction !== query.direction
            || page !== 0;
        if (refetch) setLoading(true);
        setQuery(newQuery);
        setPage(0);
    };

    const handleChangePage = (_: unknown, newPage: number): void => {
        setLoading(true);
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (e: ChangeEvent<HTMLInputElement>): void => {
        setLoading(true);
        setRowsPerPage(Number(e.target.value));
        setPage(0);
    };

    const handleDelete = async (id: number): Promise<void> => {
        if (!data?.mock) await deleteRouteHistory(id);
        setDialog(null);
        setNotice({ severity: "success", message: `History entry #${id} deleted.` });
        setLoading(true);
        if (data?.mock) {
            setRemovedIds((ids) => [...ids, id]);
        } else {
            setReloadKey((k) => k + 1);
        }
        if (rows.length === 1 && page > 0) setPage(page - 1);
    };

    return (
        <AppLayout>
            <Box sx={pageHeaderSx()}>
                <Box>
                    <Typography component="h1" sx={pageTitleSx()}>
                        History
                    </Typography>
                    <Typography sx={bodyTextSx()}>
                        Saved route calculations for trips: distance, time and the order of stops.
                    </Typography>
                </Box>
            </Box>

            <HistoryToolbar query={query} onChange={handleQueryChange} />

            <Paper elevation={0} sx={cardSx()}>
                {loading && data && <LinearProgress />}

                {loading && !data && (
                    <Box sx={stateBoxSx()}>
                        <CircularProgress />
                    </Box>
                )}

                {loadError && !loading && (
                    <Box sx={stateBoxSx()}>
                        <Alert severity="error">{loadError}</Alert>
                        <Button variant="outlined" onClick={reload} sx={compactSecondaryButtonSx()}>
                            Try again
                        </Button>
                    </Box>
                )}

                {data && !loadError && rows.length === 0 && !loading && (
                    <Box sx={stateBoxSx()}>
                        <Typography>
                            {target.kind === "invalid" && "Enter a trip ID (a number) to search."}
                            {target.kind === "trip" && `No saved routes for trip #${target.tripId}.`}
                            {target.kind === "all" && "No saved routes yet."}
                        </Typography>
                        {target.kind !== "all" && (
                            <Button
                                variant="outlined"
                                onClick={() => handleQueryChange(DEFAULT_HISTORY_QUERY)}
                                sx={compactSecondaryButtonSx()}
                            >
                                Clear search
                            </Button>
                        )}
                    </Box>
                )}

                {data && !loadError && rows.length > 0 && (
                    <>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={tableHeadCellSx()}>Entry</TableCell>
                                        <TableCell sx={tableHeadCellSx()}>Trip</TableCell>
                                        <TableCell sx={tableHeadCellSx()}>Calculated at</TableCell>
                                        <TableCell sx={tableHeadCellSx()} align="right">Stops</TableCell>
                                        <TableCell sx={tableHeadCellSx()} align="right">Distance</TableCell>
                                        <TableCell sx={tableHeadCellSx()} align="right">Driving</TableCell>
                                        <TableCell sx={tableHeadCellSx()} align="right">Total time</TableCell>
                                        <TableCell sx={tableHeadCellSx()}>Courier</TableCell>
                                        <TableCell sx={tableHeadCellSx()} align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {rows.map((history) => (
                                        <TableRow key={history.id} hover>
                                            <TableCell sx={nowrapCellSx()}>
                                                <Box sx={brandCellSx()}>
                                                    <HistoryRoundedIcon fontSize="small" sx={rowIconSx()} />
                                                    #{history.id}
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={nowrapCellSx()}>
                                                <Tooltip title={`Route plan #${history.sourceRoutePlanId}`}>
                                                    <span>#{history.tripId}</span>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell sx={nowrapCellSx()}>
                                                {formatCalculatedAt(history.calculatedAt)}
                                            </TableCell>
                                            <TableCell align="right">{history.stops.length}</TableCell>
                                            <TableCell align="right" sx={nowrapCellSx()}>
                                                {formatDistance(history.totalDistanceM)}
                                            </TableCell>
                                            <TableCell align="right" sx={nowrapCellSx()}>
                                                {formatDuration(history.drivingTimeS)}
                                            </TableCell>
                                            <TableCell align="right" sx={nowrapCellSx()}>
                                                <Tooltip title={`Driving ${formatDuration(history.drivingTimeS)} + service ${formatDuration(history.serviceTimeS)}`}>
                                                    <span>{formatDuration(history.totalTimeS)}</span>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell sx={nowrapCellSx()}>
                                                {history.courierKeycloakId ? (
                                                    <Tooltip title={history.courierKeycloakId}>
                                                        <Box component="span" sx={monoTextSx()}>
                                                            {shortId(history.courierKeycloakId)}
                                                        </Box>
                                                    </Tooltip>
                                                ) : (
                                                    <Box component="span" sx={mutedTextSx()}>—</Box>
                                                )}
                                            </TableCell>

                                            <TableCell sx={actionsCellSx()}>
                                                <Tooltip title="Details">
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Details"
                                                        onClick={() => setDialog({ type: "details", history })}
                                                        sx={actionIconSx()}
                                                    >
                                                        <VisibilityRoundedIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Delete">
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Delete"
                                                        onClick={() => setDialog({ type: "delete", history })}
                                                        sx={dangerIconSx()}
                                                    >
                                                        <DeleteOutlineRoundedIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <TablePagination
                            component="div"
                            count={data.total}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                        />
                    </>
                )}
            </Paper>

            {dialog?.type === "details" && (
                <RouteHistoryDetailsDialog
                    historyId={dialog.history.id}
                    preloaded={data?.mock ? dialog.history : undefined}
                    onClose={() => setDialog(null)}
                />
            )}

            {dialog?.type === "delete" && (
                <ConfirmDialog
                    title={`Delete history entry #${dialog.history.id}`}
                    message={`The saved route for trip #${dialog.history.tripId} (${formatCalculatedAt(dialog.history.calculatedAt)}) will be removed permanently. The trip itself is not affected.`}
                    confirmLabel="Delete"
                    danger
                    onClose={() => setDialog(null)}
                    onConfirm={() => handleDelete(dialog.history.id)}
                />
            )}

            <Snackbar
                open={notice !== null}
                autoHideDuration={5000}
                onClose={() => setNotice(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
                <Alert
                    onClose={() => setNotice(null)}
                    severity={notice?.severity ?? "success"}
                    variant="filled"
                    elevation={6}
                    sx={alertSx()}
                >
                    {notice?.message}
                </Alert>
            </Snackbar>
        </AppLayout>
    );
}

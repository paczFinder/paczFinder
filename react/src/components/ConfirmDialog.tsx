import { useState } from "react";
import {
    Alert, Button, CircularProgress, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle,
} from "@mui/material";
import { getErrorMessage } from "../api/authApi";
import { spinnerSx } from "../styles/LoginStyle";
import {
    compactPrimaryButtonSx, compactSecondaryButtonSx, dangerButtonSx,
    dialogActionsSx, dialogPaperSx, dialogTitleSx,
} from "../styles/AppStyle";

type ConfirmDialogProps = {
    title: string;
    message: string;
    confirmLabel: string;
    danger?: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
};

export default function ConfirmDialog({
    title, message, confirmLabel, danger = false, onClose, onConfirm,
}: ConfirmDialogProps) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async (): Promise<void> => {
        setBusy(true);
        setError(null);
        try {
            await onConfirm();
        } catch (err) {
            setError(getErrorMessage(err));
            setBusy(false);
        }
    };

    return (
        <Dialog
            open
            onClose={busy ? undefined : onClose}
            fullWidth
            maxWidth="xs"
            slotProps={{ paper: { sx: dialogPaperSx() } }}
        >
            <DialogTitle sx={dialogTitleSx()}>{title}</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error">{error}</Alert>}
                <DialogContentText>{message}</DialogContentText>
            </DialogContent>
            <DialogActions sx={dialogActionsSx()}>
                <Button variant="outlined" onClick={onClose} disabled={busy} sx={compactSecondaryButtonSx()}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={() => void handleConfirm()}
                    disabled={busy}
                    sx={danger ? dangerButtonSx() : compactPrimaryButtonSx()}
                >
                    {busy ? <CircularProgress size={22} sx={spinnerSx()} /> : confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

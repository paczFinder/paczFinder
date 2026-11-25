import { Paper, Typography } from "@mui/material";
import AppLayout from "../components/AppLayout";
import { bodyTextSx, headingSx, homeCardSx } from "../styles/AppStyle";

export default function HomePage() {
    return (
        <AppLayout maxWidth="md" centered>
            <Paper elevation={0} sx={homeCardSx()}>
                <Typography component="h1" sx={headingSx()}>
                    Welcome to DeliveryApp!
                </Typography>

                <Typography sx={bodyTextSx()}>
                    Successful sign in.
                </Typography>
            </Paper>
        </AppLayout>
    );
}

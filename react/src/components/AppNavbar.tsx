import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import RouteRoundedIcon from "@mui/icons-material/RouteRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { hasAnyRole, logout, ROLES, type Role } from "../api/authApi";
import {
    appBarSx, brandIconSx, brandSx, brandTextSx,
    navButtonSx, navLabelSx, navSx, toolbarSx,
} from "../styles/AppStyle";

type NavItem = {
    label: string;
    path: string;
    icon: ReactNode;
    /** Jeśli podane – przycisk widzą tylko użytkownicy z jedną z tych ról. */
    roles?: readonly Role[];
};

const NAV_ITEMS: NavItem[] = [
    { label: "Home", path: "/home", icon: <HomeRoundedIcon /> },
    {
        label: "Vehicles",
        path: "/vehicles",
        icon: <DirectionsCarRoundedIcon />,
        roles: [ROLES.DISPATCHER, ROLES.ADMIN],
    },
    {
        label: "Deliveries",
        path: "/deliveries",
        icon: <Inventory2RoundedIcon />,
        roles: [ROLES.DISPATCHER, ROLES.ADMIN],
    },
    {
        label: "Trips",
        path: "/trips",
        icon: <RouteRoundedIcon />,
        roles: [ROLES.DISPATCHER, ROLES.ADMIN],
    },
];

export default function AppNavbar() {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const handleSignOut = (): void => {
        void logout().finally(() => {
            window.location.replace("/");
        });
    };

    const visibleItems = NAV_ITEMS.filter((item) => !item.roles || hasAnyRole(item.roles));

    return (
        <AppBar position="static" elevation={1} sx={appBarSx()}>
            <Toolbar sx={toolbarSx()}>
                <Box sx={brandSx()}>
                    <LocalShippingRoundedIcon sx={brandIconSx()} />
                    <Typography variant="h6" component="div" sx={brandTextSx()}>
                        DeliveryApp
                    </Typography>
                </Box>

                <Box component="nav" sx={navSx()}>
                    {visibleItems.map((item) => {
                        const active = pathname === item.path;
                        return (
                            <Button
                                key={item.path}
                                onClick={() => void navigate(item.path)}
                                startIcon={item.icon}
                                aria-label={item.label}
                                aria-current={active ? "page" : undefined}
                                sx={navButtonSx(active)}
                            >
                                <Box component="span" sx={navLabelSx()}>
                                    {item.label}
                                </Box>
                            </Button>
                        );
                    })}

                    <Button
                        onClick={handleSignOut}
                        startIcon={<LogoutRoundedIcon />}
                        aria-label="Sign out"
                        sx={navButtonSx(false)}
                    >
                        <Box component="span" sx={navLabelSx()}>
                            Sign out
                        </Box>
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
}

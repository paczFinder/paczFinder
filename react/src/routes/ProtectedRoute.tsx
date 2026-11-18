import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { hasAnyRole, isAuthenticated, type Role } from "../api/authApi";

type ProtectedRouteProps = {
    children: ReactNode;
    roles?: readonly Role[];
};

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
    if (!isAuthenticated()) {
        return <Navigate to="/" replace />;
    }
    if (roles && !hasAnyRole(roles)) {
        return <Navigate to="/home" replace />;
    }
    return <>{children}</>;
}

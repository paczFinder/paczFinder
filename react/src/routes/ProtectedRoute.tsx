import { Navigate } from "react-router-dom";
import keycloak from "../keycloak";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    if (!keycloak.authenticated) {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
}
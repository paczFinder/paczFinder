import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../api/authApi";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    if (!isAuthenticated()) {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
}
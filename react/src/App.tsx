import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import WelcomePage from "./pages/auth/WelcomePage.tsx";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/auth/RegisterPage.tsx";
import LoginPage from "./pages/auth/LoginPage.tsx";
import VehiclePage from "./pages/dispatcher/VehiclePage";
import DeliveryPage from "./pages/dispatcher/DeliveryPage";
import TripPage from "./pages/dispatcher/TripPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { isAuthenticated, ROLES } from "./api/authApi";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        isAuthenticated()
                            ? <Navigate to="/home" replace />
                            : <WelcomePage />
                    }
                />

                <Route
                    path="/home"
                    element={
                        isAuthenticated()
                            ? <HomePage />
                            : <Navigate to="/" replace />
                    }
                />

                <Route
                    path="/vehicles"
                    element={
                        <ProtectedRoute roles={[ROLES.DISPATCHER, ROLES.ADMIN]}>
                            <VehiclePage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/deliveries"
                    element={
                        <ProtectedRoute roles={[ROLES.DISPATCHER, ROLES.ADMIN]}>
                            <DeliveryPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/trips"
                    element={
                        <ProtectedRoute roles={[ROLES.DISPATCHER, ROLES.ADMIN]}>
                            <TripPage />
                        </ProtectedRoute>
                    }
                />

                <Route path="/login" element={<LoginPage />} />
                <Route path="/register/:role" element={<RegisterPage />} />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
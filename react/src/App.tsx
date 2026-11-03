import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import WelcomePage from "./pages/WelcomePage";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import keycloak from "./keycloak";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={
                        keycloak.authenticated
                            ? <Navigate to="/home" replace />
                            : <WelcomePage />
                    }
                />

                <Route
                    path="/home"
                    element={
                        keycloak.authenticated
                            ? <HomePage />
                            : <Navigate to="/" replace />
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
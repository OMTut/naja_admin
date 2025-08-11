/* src/routes/AppRoutes.tsx: This file manages all the routes for the application. */
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import HomePageAdmin from "../pages/Admin/HomePageAdmin";
import LoginPage from "../pages/LoginPage";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import PublicRoute from "../components/auth/PublicRoute";


const AppRoutes = () => (
    <Router>
        <Routes>
            <Route 
                path="/" 
                element={
                    <ProtectedRoute>
                        <HomePage />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/admin" 
                element={
                    <ProtectedRoute>
                        <HomePageAdmin />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/login" 
                element={
                    <PublicRoute>
                        <LoginPage />
                    </PublicRoute>
                } 
            />
        </Routes>
    </Router>
);

export default AppRoutes;
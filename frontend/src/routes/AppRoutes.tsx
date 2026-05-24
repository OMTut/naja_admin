/* src/routes/AppRoutes.tsx: This file manages all the routes for the application. */
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import HomePageAdmin from "../pages/Admin/HomePageAdmin";
import RolesPage from "../pages/Admin/RolesPage";
import UsersPage from "../pages/Admin/UsersPage";
import LoginPage from "../pages/LoginPage";
import ProfilePage from "../pages/ProfilePage";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import PublicRoute from "../components/auth/PublicRoute";
import Layout from "../components/layout/Layout";


const AppRoutes = () => (
    <Router>
        <Routes>
            <Route 
                path="/" 
                element={
                    <ProtectedRoute>
                        <Layout>
                            <HomePage />
                        </Layout>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/admin/roles" 
                element={
                    <ProtectedRoute>
                        <Layout>
                            <RolesPage />
                        </Layout>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/admin/users" 
                element={
                    <ProtectedRoute>
                        <Layout>
                            <UsersPage />
                        </Layout>
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/admin"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <HomePageAdmin />
                        </Layout>
                    </ProtectedRoute>
                } 
            />
            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <ProfilePage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/users/:userId"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <ProfilePage />
                        </Layout>
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
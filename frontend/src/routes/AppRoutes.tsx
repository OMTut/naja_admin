/* src/routes/AppRoutes.tsx: This file manages all the routes for the application. */
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import HomePageAdmin from "../pages/Admin/HomePageAdmin";
import RolesPage from "../pages/Admin/RolesPage";
import UsersPage from "../pages/Admin/UsersPage";
import BlueprintsPage from "../pages/BlueprintsPage";
import InventoryPage from "../pages/InventoryPage";
import ManageInventoryPage from "../pages/Admin/ManageInventoryPage";
import ResourceInventoryPage from "../pages/ResourceInventoryPage";
import MiscInventoryPage from "../pages/MiscInventoryPage";
import LoginPage from "../pages/LoginPage";
import ProfilePage from "../pages/ProfilePage";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import PublicRoute from "../components/auth/PublicRoute";
import Layout from "../components/layout/Layout";

const ADMIN_ROLES = ["Role 1", "App Admin"];

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
                    <ProtectedRoute requiredRoles={ADMIN_ROLES}>
                        <Layout>
                            <RolesPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/users"
                element={
                    <ProtectedRoute requiredRoles={ADMIN_ROLES}>
                        <Layout>
                            <UsersPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin"
                element={
                    <ProtectedRoute requiredRoles={ADMIN_ROLES}>
                        <Layout>
                            <HomePageAdmin />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/inventory"
                element={
                    <ProtectedRoute requiredRoles={ADMIN_ROLES}>
                        <Layout>
                            <ManageInventoryPage />
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
                    <ProtectedRoute requiredRoles={ADMIN_ROLES}>
                        <Layout>
                            <ProfilePage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/blueprints"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <BlueprintsPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/inventory"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <InventoryPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/inventory/resources"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <ResourceInventoryPage />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/inventory/misc"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <MiscInventoryPage />
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

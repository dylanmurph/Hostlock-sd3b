import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import api from "./api";

// Pages
import Landing from "./components/Landing";

// Auth pages
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";

// Admin pages
import AdminDashboard from "./components/Admin/AdminDashboard";
import AdminHosts from "./components/Admin/AdminHosts";
import AdminProperties from "./components/Admin/AdminProperties";

// Guest pages
import GuestHome from "./components/Guest/GuestHome";
import GuestAlerts from "./components/Guest/GuestAlerts";
import GuestBookings from "./components/Guest/GuestBookings";
import GuestSettings from "./components/Guest/GuestSettings";
import GuestLayout from "./components/Guest/GuestLayout";

// Host pages
import HostHome from "./components/Host/HostHome";
import HostGuests from "./components/Host/HostGuests";
import HostAlerts from "./components/Host/HostAlerts";
import HostLogs from "./components/Host/HostLogs";
import HostSettings from "./components/Host/HostSettings";
import HostLayout from "./components/Host/HostLayout";

// helper: where should this user land?
const getHomePath = (user) => {
  if (!user) return "/auth/login";

  if (user.role === "admin") return "/admin/dashboard";
  if (user.role === "host") return "/host/home";

  // default to guest home
  return "/guest/home";
};

// wrapper to protect role-specific routes
function RequireRole({ user, role, children }) {
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  if (user.role !== role) {
    // logged in but wrong role -> send to THEIR home
    return <Navigate to={getHomePath(user)} replace />;
  }
  return children;
}

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });

  const handleSetUser = (u) => {
    if (u) {
      localStorage.setItem("user", JSON.stringify(u));
      localStorage.setItem("token", u.token);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
    setUser(u);
  };

  // Log Out
  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (err) {
      console.error("Logout request failed:", err);
    }
    handleSetUser(null);
  };

  return (
    <Router>
      <div className="max-w-md mx-auto p-4">
        <Routes>
          {/* Landing */}
          <Route
            path="/"
            element={
              !user ? <Landing /> : <Navigate to={getHomePath(user)} replace />
            }
          />

          {/* Register */}
          <Route
            path="/auth/register"
            element={
              !user ? <Register /> : <Navigate to={getHomePath(user)} replace />
            }
          />

          {/* Login */}
          <Route
            path="/auth/login"
            element={
              !user ? (
                <Login setUser={handleSetUser} />
              ) : (
                <Navigate to={getHomePath(user)} replace />
              )
            }
          />

          {/* Generic /home just bounces to role home */}
          <Route
            path="/home"
            element={
              user ? (
                <Navigate to={getHomePath(user)} replace />
              ) : (
                <Navigate to="/auth/login" replace />
              )
            }
          />

          {/* ======================= ADMIN ======================= */}
          <Route
            path="/admin/dashboard"
            element={
              <RequireRole user={user} role="admin">
                <AdminDashboard user={user} />
              </RequireRole>
            }
          />
          <Route
            path="/admin/hosts"
            element={
              <RequireRole user={user} role="admin">
                <AdminHosts user={user} />
              </RequireRole>
            }
          />
          <Route
            path="/admin/properties"
            element={
              <RequireRole user={user} role="admin">
                <AdminProperties user={user} />
              </RequireRole>
            }
          />
          <Route
            path="/admin"
            element={
              user ? (
                user.role === "admin" ? (
                  <Navigate to="/admin/dashboard" replace />
                ) : (
                  <Navigate to={getHomePath(user)} replace />
                )
              ) : (
                <Navigate to="/auth/login" replace />
              )
            }
          />

          {/* ======================= GUEST ======================= */}
          {/* <Route
            path="/guest/home"
            element={
              <RequireRole user={user} role="guest">
                <GuestHome user={user} />
              </RequireRole>
            }
          />
          <Route
            path="/guest/alerts"
            element={
              <RequireRole user={user} role="guest">
                <GuestAlerts user={user} />
              </RequireRole>
            }
          />
          <Route
            path="/guest/bookings"
            element={
              <RequireRole user={user} role="guest">
                <GuestBookings user={user} />
              </RequireRole>
            }
          />
          <Route
            path="/guest/settings"
            element={
              <RequireRole user={user} role="guest">
                <GuestSettings onLogout={handleLogout} />
              </RequireRole>
            }
          /> */}

          <Route
            element={
              <RequireRole user={user} role="guest">
                <GuestLayout />
              </RequireRole>
            }
          >
            <Route path="/guest/home" element={<GuestHome user={user} />} />
            <Route path="/guest/bookings" element={<GuestBookings user={user} />} />
            <Route path="/guest/alerts" element={<GuestAlerts user={user} />} />
            <Route path="/guest/settings" element={<GuestSettings onLogout={handleLogout} />} />
          </Route>

          {/* ======================= HOST ======================= */}
          <Route
            element={
              <RequireRole user={user} role="host">
                <HostLayout />
              </RequireRole>
            }
          >
            <Route path="/host/home" element={<HostHome user={user} />} />
            <Route path="/host/guests" element={<HostGuests user={user} />} />
            <Route path="/host/logs" element={<HostLogs user={user} />} />
            <Route path="/host/alerts" element={<HostAlerts user={user} />} />
            <Route path="/host/settings" element={<HostSettings onLogout={handleLogout} />} />
          </Route>


          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
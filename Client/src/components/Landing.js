import React from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useEffect } from "react";

function Landing() {
  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await api.get("/users");
        const data = await res.data;
        console.log("Users from backend:", data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    }

    loadUsers();
  }, []);
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center px-6">

      {/* Logo */}
      <img 
        src="/logo192.png"
        alt="HostLock Logo"
        className="w-24 h-24 mb-4 drop-shadow-md"
      />

      {/* Title */}
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Welcome to HostLock
      </h1>

      {/* Subtitle */}
      <p className="text-slate-600 mb-6 text-sm">
        Your guests. Your space. Securely connected.
      </p>

      {/* Buttons */}
      <div className="flex gap-4">
        <Link to="/auth/register">
          <button className="px-6 py-2 bg-cyan-600 text-white rounded-xl shadow hover:bg-cyan-500">
            Register
          </button>
        </Link>

        <Link to="/auth/login">
          <button className="px-6 py-2 border border-cyan-600 text-cyan-600 rounded-xl shadow hover:bg-cyan-50">
            Login
          </button>
        </Link>
      </div>
    </div>
  );
}

export default Landing;
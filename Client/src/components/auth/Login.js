import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import api from "../../api";

import logoImage from "../../logo.svg";

function Login({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await api.post("/login", { email, password });

      const token = res.data.access_token;

      const userData = {
        user_id: res.data.user_id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role,
        photo: res.data.photo_path,
        token: token,
      };

      // store token/user if you want it later
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);

      setMessage(res.data.message || "Logged in successfully");

      // role-based redirect
      if (userData.role === "host") {
        navigate("/host/home", { replace: true });
      } else if (userData.role === "guest") {
        navigate("/guest/home", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error logging in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,212,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.1) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Card */}
      <div className="w-full max-w-md relative z-10 bg-white/95 border border-cyan-500/20 rounded-2xl shadow-2xl shadow-cyan-500/20 backdrop-blur">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <img
            src={logoImage}
            alt="HostLock"
            className="h-20 w-auto mx-auto mb-4 object-contain"
          />

          <h1 className="text-xl font-semibold text-slate-900">
            Welcome Back
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="px-6 pb-6 space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="you@gmail.com"
                className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <button
              type="button"
              className="text-xs text-cyan-500 hover:text-cyan-400 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-500 hover:bg-cyan-600 text-navy-950 text-sm font-semibold py-2.5 shadow-lg shadow-cyan-500/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {/* Backend message */}
          {message && (
            <p className="text-center text-sm text-slate-700">{message}</p>
          )}

          {/* Register link */}
          <div className="text-center text-xs mt-1">
            <span className="text-slate-600">Don’t have an account? </span>
            <Link
              to="/auth/register"
              className="text-cyan-500 hover:text-cyan-400 font-medium hover:underline"
            >
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, UserCircle, Lock, Mail, User, Phone,} from "lucide-react";
import api from "../../api";

function Register() {
  const [role, setRole] = useState("guest"); // "guest" | "host"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const backendRole = role;

      await api.post("/register", {
        name,
        email,
        password,
        contact_number: contactNumber,
        role: backendRole,
      });

      // no token / no setUser here:
      // user must log in after registering
      setMessage("Registered successfully. Please log in.");
      navigate("/auth/login", { replace: true });
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error registering");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid pattern (same vibe as Login) */}
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
            src="/logo192.png"
            alt="HostLock"
            className="h-20 w-auto mx-auto mb-4 object-contain"
          />

          <h1 className="text-xl font-semibold text-slate-900">
            Create Account
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Register to get started
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="px-6 pb-6 space-y-4 text-sm">
          {/* Role selection */}
          <div>
            <p className="text-xs font-medium text-slate-700 mb-1">I am a</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("guest")}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-xs transition-all ${
                  role === "guest"
                    ? "border-cyan-500 bg-cyan-500/10 shadow-md shadow-cyan-500/30"
                    : "border-slate-200 bg-white hover:border-cyan-300"
                }`}
              >
                <UserCircle
                  className={`w-7 h-7 ${
                    role === "guest" ? "text-cyan-500" : "text-slate-400"
                  }`}
                />
                <span
                  className={
                    role === "guest"
                      ? "text-cyan-500 font-semibold"
                      : "text-slate-600"
                  }
                >
                  Guest
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRole("host")}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-xs transition-all ${
                  role === "host"
                    ? "border-cyan-500 bg-cyan-500/10 shadow-md shadow-cyan-500/30"
                    : "border-slate-200 bg-white hover:border-cyan-300"
                }`}
              >
                <Building2
                  className={`w-7 h-7 ${
                    role === "host" ? "text-cyan-500" : "text-slate-400"
                  }`}
                />
                <span
                  className={
                    role === "host"
                      ? "text-cyan-500 font-semibold"
                      : "text-slate-600"
                  }
                >
                  Host
                </span>
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-medium text-slate-700"
            >
              Full Name
            </label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="name"
                type="text"
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-slate-700"
            >
              Email
            </label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="email"
                type="email"
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Contact Number */}
          <div>
            <label
              htmlFor="contactNumber"
              className="block text-xs font-medium text-slate-700"
            >
              Contact Number
            </label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="contactNumber"
                type="tel"
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="08XXXXXXXX"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-slate-700"
            >
              Password
            </label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="password"
                type="password"
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs font-medium text-slate-700"
            >
              Confirm Password
            </label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="confirmPassword"
                type="password"
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-cyan-500 hover:bg-cyan-600 text-navy-950 text-sm font-semibold py-2.5 shadow-lg shadow-cyan-500/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          {/* Message */}
          {message && (
            <p className="text-center text-xs mt-1 text-slate-700">
              {message}
            </p>
          )}

          {/* Login link */}
          <div className="text-center text-xs mt-1">
            <span className="text-slate-600">Already have an account? </span>
            <Link
              to="/auth/login"
              className="text-cyan-500 hover:text-cyan-400 font-medium hover:underline"
            >
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
import React, { useEffect, useState } from "react";
import { User, LogOut } from "lucide-react";
import api from "../../api";

export function HostSettings({ onLogout }) {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    contact_number: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

  const handleLogout = () => onLogout && onLogout();

  // Load profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true);
        const res = await api.get("/me");

        setProfile({
          name: res.data.name || "",
          email: res.data.email || "",
          contact_number: res.data.contact_number || "",
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
        setProfileError("Failed to load profile.");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle form changes
  const handleChange = (e) => {
    const { id, value } = e.target;

    if (id === "host-name") {
      setProfile((p) => ({ ...p, name: value }));
    } else if (id === "host-email") {
      setProfile((p) => ({ ...p, email: value }));
    } else if (id === "host-phone") {
      setProfile((p) => ({ ...p, contact_number: value }));
    }
  };

  // Save updated profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();

    try {
      setSavingProfile(true);
      setProfileError(null);
      setProfileSuccess(null);

      const res = await api.put("/me", {
        name: profile.name,
        email: profile.email,
        contact_number: profile.contact_number,
      });

      setProfile({
        name: res.data.name,
        email: res.data.email,
        contact_number: res.data.contact_number,
      });

      setProfileSuccess("Profile updated successfully.");
    } catch (err) {
      console.error("Update error:", err);
      setProfileError("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 max-w-4xl mx-auto w-full">
        <div>
          <h1 className="text-slate-900 mb-2 text-lg font-semibold">Settings</h1>
          <p className="text-slate-600 text-sm md:text-base">Manage your account</p>
        </div>

        {/* Personal Information */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="flex items-center gap-2 text-base md:text-lg font-semibold text-slate-900">
              <User className="w-5 h-5" />
              Personal Information
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Update your host profile details
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="px-4 py-4 space-y-4 text-sm">
            {loadingProfile && (
              <p className="text-xs text-slate-500">Loading profile...</p>
            )}

            {profileError && (
              <p className="text-xs text-red-500">{profileError}</p>
            )}

            {profileSuccess && (
              <p className="text-xs text-emerald-600">{profileSuccess}</p>
            )}

            {!loadingProfile && (
              <>
                <div>
                  <label
                    htmlFor="host-name"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Full Name
                  </label>
                  <input
                    id="host-name"
                    type="text"
                    value={profile.name}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label
                    htmlFor="host-email"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Email Address
                  </label>
                  <input
                    id="host-email"
                    type="email"
                    value={profile.email}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label
                    htmlFor="host-phone"
                    className="block text-xs font-medium text-slate-700"
                  >
                    Phone Number
                  </label>
                  <input
                    id="host-phone"
                    type="tel"
                    value={profile.contact_number}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 disabled:opacity-60"
                >
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </form>
        </section>

        {/* Logout */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 py-4 space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
            >
              <LogOut className="w-4 h-4" />
              Log Out
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default HostSettings;
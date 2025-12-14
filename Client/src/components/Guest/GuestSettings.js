import React, { useState, useEffect } from "react";
import { User, LogOut, Camera } from "lucide-react";
import api from "../../api";

export function GuestSettings({ onLogout }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    contact_number: "",
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

  // Load profile photo + profile data
  useEffect(() => {
    const init = async () => {
      // 1) Photo from localStorage (if present)
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.photo) {
          setPreviewUrl(user.photo);
        }
      }

      // 2) Profile (and photo) from backend
      try {
        setLoadingProfile(true);
        setProfileError(null);

        const res = await api.get("/me");
        setProfile({
          name: res.data.name || "",
          email: res.data.email || "",
          contact_number: res.data.contact_number || "",
        });

        if (res.data.photo_path) {
          setPreviewUrl(
            `https://www.hostlocksd3b.online/${res.data.photo_path}`
          );
        }
      } catch (err) {
        console.error("Failed to load profile:", err.response || err);
        setProfileError("Failed to load profile.");
      } finally {
        setLoadingProfile(false);
      }
    };

    init();
  }, []);

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  const handleChange = (e) => {
    const { id, value } = e.target;

    if (id === "guest-name") {
      setProfile((prev) => ({ ...prev, name: value }));
    } else if (id === "guest-email") {
      setProfile((prev) => ({ ...prev, email: value }));
    } else if (id === "guest-phone") {
      setProfile((prev) => ({ ...prev, contact_number: value }));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    try {
      setSavingProfile(true);
      setProfileError(null);
      setProfileSuccess(null);

      const payload = {
        name: profile.name,
        email: profile.email,
        contact_number: profile.contact_number,
      };

      const res = await api.put("/me", payload);

      const updated = res.data;
      setProfile({
        name: updated.name || "",
        email: updated.email || "",
        contact_number: updated.contact_number || "",
      });

      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        user.name = updated.name;
        user.email = updated.email;
        user.contact_number = updated.contact_number;
        localStorage.setItem("user", JSON.stringify(user));
      }

      setProfileSuccess("Profile updated successfully.");
    } catch (err) {
      console.error("Failed to update profile:", err.response || err);
      setProfileError("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

const uploadImage = async () => {
    if (!selectedImage) return alert("Please select an image first.");

    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
        setSavingProfile(true); 
        setProfileError(null);
        setProfileSuccess(null);

        const res = await api.post("/booking/uploadImage", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const photoUrl = `https://www.hostlocksd3b.online/${res.data.file}`;
        setPreviewUrl(photoUrl);
        setSelectedImage(null); 

        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          user.photo = photoUrl;
          user.photo_path = res.data.file;
          localStorage.setItem("user", JSON.stringify(user));
        }

        setProfileSuccess("Profile image updated successfully!"); 
        alert("Profile image updated successfully!");

    } catch (err) {
        console.error("Upload error:", err.response || err);
        setProfileError("Failed to upload image. Please try again.");
        alert("Failed to upload image.");
    } finally {
        setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 px-4 pt-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-slate-900 mb-2 text-lg font-semibold">
              Settings
            </h1>
            <p className="text-slate-600 text-sm">
              Manage your account and preferences
            </p>
          </div>

          {/* PROFILE IMAGE SECTION */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Photo
            </h2>

            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-200">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    No Image
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="upload"
                  className="px-3 py-2 text-sm rounded-lg border border-slate-300 cursor-pointer flex items-center gap-2 hover:bg-slate-50"
                >
                  <Camera className="w-4 h-4" />
                  Choose Image
                </label>

                <input
                  id="upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />

                <button
                  onClick={uploadImage}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-700"
                >
                  Upload Image
                </button>
              </div>
            </div>
          </section>

          {/* PROFILE INFO */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <User className="w-5 h-5" />
                Profile Information
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Update your personal details
              </p>
            </div>

            <form
              onSubmit={handleSaveProfile}
              className="px-4 py-4 space-y-4 text-sm"
            >
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
                      htmlFor="guest-name"
                      className="block text-xs font-medium text-slate-700"
                    >
                      Full Name
                    </label>
                    <input
                      id="guest-name"
                      type="text"
                      value={profile.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg mt-1 text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="guest-email"
                      className="block text-xs font-medium text-slate-700"
                    >
                      Email Address
                    </label>
                    <input
                      id="guest-email"
                      type="email"
                      value={profile.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg mt-1 text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="guest-phone"
                      className="block text-xs font-medium text-slate-700"
                    >
                      Phone Number
                    </label>
                    <input
                      id="guest-phone"
                      type="tel"
                      value={profile.contact_number}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg mt-1 text-sm"
                    />
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 disabled:opacity-60"
                    >
                      {savingProfile ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </section>

          {/* ACCOUNT ACTIONS */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200">
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
        </div>
      </main>
    </div>
  );
}

export default GuestSettings;
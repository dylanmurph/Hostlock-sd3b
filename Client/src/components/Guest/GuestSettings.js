import React, { useState, useEffect } from "react";
import {
  Shield,
  Bell,
  User,
  Trash2,
  LogOut,
  Camera,
} from "lucide-react";
import api from "../../api";

export function GuestSettings({ onLogout }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Load user photo from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.photo) {
        setPreviewUrl(`https://www.hostlocksd3b.online/${user.photo}`);
      }
    }
  }, []);

  const handleLogout = () => {
    if (onLogout) onLogout();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadImage = async () => {
    if (!selectedImage) return alert("No image selected.");

    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
      const res = await api.post("/booking/uploadImage", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Assuming backend returns just filename
      const photoUrl = `https://www.hostlocksd3b.online/${res.data.file}`;
      setPreviewUrl(photoUrl);

      // Update localStorage
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        user.photo = photoUrl;
        localStorage.setItem("user", JSON.stringify(user));
      }

      alert("Profile image updated!");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload image.");
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

          {/* ---------------- PROFILE IMAGE SECTION ---------------- */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Photo
            </h2>

            <div className="flex items-center gap-4">
              {/* Avatar preview */}
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

          {/* Profile Settings */}
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

            <div className="px-4 py-4 space-y-4 text-sm">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-medium text-slate-700"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg mt-1 text-sm"
                  defaultValue="Sarah Johnson"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-slate-700"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg mt-1 text-sm"
                  defaultValue="sarah.j@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-medium text-slate-700"
                >
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg mt-1 text-sm"
                  defaultValue="+1 (555) 123-4567"
                />
              </div>

              <button className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700">
                Save Changes
              </button>
            </div>
          </section>

          {/* Security */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Shield className="w-5 h-5" />
                Security
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enhance your account security
              </p>
            </div>

            <div className="px-4 py-4 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <label
                    htmlFor="twofa"
                    className="text-xs font-medium text-slate-700"
                  >
                    Two-Step Verification
                  </label>
                  <p className="text-xs text-slate-500">
                    Add an extra layer of security
                  </p>
                </div>
                <input id="twofa" type="checkbox" className="h-4 w-4" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label
                    htmlFor="biometric"
                    className="text-xs font-medium text-slate-700"
                  >
                    Biometric Login
                  </label>
                  <p className="text-xs text-slate-500">
                    Use Face ID or Touch ID
                  </p>
                </div>
                <input
                  id="biometric"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4"
                />
              </div>

              <button className="px-3 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50">
                Change Password
              </button>
            </div>
          </section>

          {/* Notification Preferences */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose how you want to be notified
              </p>
            </div>

            <div className="px-4 py-4 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="push" className="text-xs font-medium text-slate-700">
                    Push Notifications
                  </label>
                  <p className="text-xs text-slate-500">Receive alerts on your device</p>
                </div>
                <input id="push" type="checkbox" defaultChecked className="h-4 w-4" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="email-notif" className="text-xs font-medium text-slate-700">
                    Email Notifications
                  </label>
                  <p className="text-xs text-slate-500">Get updates via email</p>
                </div>
                <input id="email-notif" type="checkbox" defaultChecked className="h-4 w-4" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="sms" className="text-xs font-medium text-slate-700">
                    SMS Notifications
                  </label>
                  <p className="text-xs text-slate-500">Receive text messages</p>
                </div>
                <input id="sms" type="checkbox" className="h-4 w-4" />
              </div>
            </div>
          </section>

          {/* Account Actions */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="px-4 py-4 space-y-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>

              <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default GuestSettings;
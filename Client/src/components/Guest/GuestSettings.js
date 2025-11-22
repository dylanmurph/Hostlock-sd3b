import React from "react";
import {
  Shield,
  Bell,
  User,
  Trash2,
  LogOut,
} from "lucide-react";

export function GuestSettings({ onLogout }) {
  const handleLogout = () => {
    if (onLogout) {
      onLogout(); // calls App.handleLogout -> clears token + user
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* MAIN CONTENT */}
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
                  <label
                    htmlFor="push"
                    className="text-xs font-medium text-slate-700"
                  >
                    Push Notifications
                  </label>
                  <p className="text-xs text-slate-500">
                    Receive alerts on your device
                  </p>
                </div>
                <input
                  id="push"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label
                    htmlFor="email-notif"
                    className="text-xs font-medium text-slate-700"
                  >
                    Email Notifications
                  </label>
                  <p className="text-xs text-slate-500">
                    Get updates via email
                  </p>
                </div>
                <input
                  id="email-notif"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label
                    htmlFor="sms"
                    className="text-xs font-medium text-slate-700"
                  >
                    SMS Notifications
                  </label>
                  <p className="text-xs text-slate-500">
                    Receive text messages
                  </p>
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
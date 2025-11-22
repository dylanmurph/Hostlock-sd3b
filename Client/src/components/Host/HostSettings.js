import React from "react";
import {
  User,
  Bell,
  Building2,
  Shield,
  LogOut,
} from "lucide-react";

export function HostSettings({ onLogout }) {
  const handleLogout = () => {
    if (onLogout) {
      onLogout(); // calls App.handleLogout
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 max-w-4xl mx-auto w-full">
        <div>
          <h1 className="text-slate-900 mb-2 text-lg font-semibold">
            Settings
          </h1>
          <p className="text-slate-600 text-sm md:text-base">
            Manage your account and system preferences
          </p>
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
          <div className="px-4 py-4 space-y-4 text-sm">
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
                defaultValue="Robert Anderson"
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
                defaultValue="robert@properties.com"
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
                defaultValue="+1 (555) 987-6543"
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <button className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700">
              Save Changes
            </button>
          </div>
        </section>

        {/* Property Settings */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="flex items-center gap-2 text-base md:text-lg font-semibold text-slate-900">
              <Building2 className="w-5 h-5" />
              Property Management
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Configure your properties
            </p>
          </div>
          <div className="px-4 py-4 space-y-3 text-sm">
            {[
              {
                name: "Sunset Beach Villa",
                address: "123 Ocean Drive, Miami Beach, FL",
              },
              {
                name: "Downtown Loft",
                address: "789 Broadway, New York, NY",
              },
              {
                name: "Mountain Retreat Cabin",
                address: "456 Alpine Way, Aspen, CO",
              },
            ].map((prop) => (
              <div
                key={prop.name}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg gap-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{prop.name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {prop.address}
                  </p>
                </div>
                <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs hover:bg-slate-100 flex-shrink-0">
                  Edit
                </button>
              </div>
            ))}
            <button className="w-full inline-flex items-center justify-center px-3 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50">
              Add New Property
            </button>
          </div>
        </section>

        {/* Security Settings */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="flex items-center gap-2 text-base md:text-lg font-semibold text-slate-900">
              <Shield className="w-5 h-5" />
              Security Settings
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Manage access control and security
            </p>
          </div>
          <div className="px-4 py-4 space-y-4 text-sm">
            {[
              {
                id: "auto-lock",
                label: "Auto-lock After Failed Attempts",
                desc: "Lock access after 3 failed attempts",
                defaultChecked: true,
              },
              {
                id: "camera-recording",
                label: "Camera Recording",
                desc: "Record video on access attempts",
                defaultChecked: true,
              },
              {
                id: "guest-photos",
                label: "Require Guest Photos",
                desc: "Mandatory photo for facial recognition",
                defaultChecked: true,
              },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <label
                    htmlFor={item.id}
                    className="block text-xs font-medium text-slate-700"
                  >
                    {item.label}
                  </label>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <input
                  id={item.id}
                  type="checkbox"
                  defaultChecked={item.defaultChecked}
                  className="h-4 w-4"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Alert Preferences */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="flex items-center gap-2 text-base md:text-lg font-semibold text-slate-900">
              <Bell className="w-5 h-5" />
              Alert Preferences
            </h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1">
              Configure how you receive alerts
            </p>
          </div>
          <div className="px-4 py-4 space-y-4 text-sm">
            {[
              {
                id: "failed-access-alert",
                label: "Failed Access Attempts",
                desc: "Get notified of failed entry attempts",
                defaultChecked: true,
              },
              {
                id: "system-error-alert",
                label: "System Errors",
                desc: "Camera offline, device issues",
                defaultChecked: true,
              },
              {
                id: "email-alerts",
                label: "Email Alerts",
                desc: "Receive alerts via email",
                defaultChecked: true,
              },
              {
                id: "sms-alerts",
                label: "SMS Alerts",
                desc: "Receive urgent alerts via SMS",
                defaultChecked: false,
              },
              {
                id: "sound-alerts",
                label: "Sound Notifications",
                desc: "Play sound for app notifications",
                defaultChecked: true,
              },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <label
                    htmlFor={item.id}
                    className="block text-xs font-medium text-slate-700"
                  >
                    {item.label}
                  </label>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <input
                  id={item.id}
                  type="checkbox"
                  defaultChecked={item.defaultChecked}
                  className="h-4 w-4"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Account Actions */}
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
import React from "react";
import { Outlet } from "react-router-dom";
import AdminNav from "./AdminNav";

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 p-4 md:p-6">
        <Outlet />
      </main>

      <AdminNav />
    </div>
  );
};

export default AdminLayout;
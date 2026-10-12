
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="min-h-screen lg:pl-64">
                <Navbar onMenuClick={() => setSidebarOpen(true)} />

                <main className="mx-auto max-w-[1600px] p-4 sm:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

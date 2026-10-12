
import { NavLink } from "react-router-dom";
import {
    BookOpen,
    LayoutDashboard,
    Users,
    ClipboardList,
    Receipt,
    BarChart3,
    Library,
    X,
} from "lucide-react";

const links = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/books", label: "Books", icon: BookOpen },
    { to: "/members", label: "Members", icon: Users },
    { to: "/loans", label: "Loans", icon: ClipboardList },
    { to: "/fines", label: "Fines", icon: Receipt },
    { to: "/reports", label: "Reports", icon: BarChart3 },
];

export default function Sidebar({ open, onClose }) {
    return (
        <>
            {open && (
                <button
                    aria-label="Close sidebar overlay"
                    className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col
          border-r border-slate-200 bg-white transition-transform
          lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex h-20 items-center justify-between border-b px-6">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-600 p-2 text-white">
                            <Library size={23} />
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-900">Libra</h1>
                            <p className="text-xs text-slate-500">Library Management</p>
                        </div>
                    </div>

                    <button
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                        onClick={onClose}
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 p-4">
                    <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Workspace
                    </p>

                    {links.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === "/"}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`
                            }
                        >
                            <Icon size={19} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                <div className="m-4 rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">
                        Library workspace
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        Manage books, members and circulation from one place.
                    </p>
                </div>
            </aside>
        </>
    );
}

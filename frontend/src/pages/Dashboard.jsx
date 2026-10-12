
import { useCallback, useEffect, useState } from "react";
import {
    BookOpen,
    Users,
    ClipboardList,
    AlertTriangle,
    ArrowUpRight,
    RefreshCw,
} from "lucide-react";
import StatCard from "../components/StatCard";
import api from "../services/api";

const initialStats = [
    {
        title: "Total Books",
        key: "total_books",
        value: "—",
        subtitle: "Catalogue records",
        icon: BookOpen,
        color: "blue",
    },
    {
        title: "Members",
        key: "total_members",
        value: "—",
        subtitle: "Registered members",
        icon: Users,
        color: "green",
    },
    {
        title: "Active Loans",
        key: "active_loans",
        value: "—",
        subtitle: "Books currently borrowed",
        icon: ClipboardList,
        color: "purple",
    },
    {
        title: "Overdue Loans",
        key: "overdue_loans",
        value: "—",
        subtitle: "Require follow-up",
        icon: AlertTriangle,
        color: "orange",
    },
];

export default function Dashboard() {
    const [stats, setStats] = useState(initialStats);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/reports/dashboard-stats");
            const data = response.data;

            setStats(
                initialStats.map((stat) => ({
                    ...stat,
                    value: Number(data[stat.key] ?? 0).toLocaleString(),
                }))
            );
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to load dashboard statistics."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return (
        <div className="space-y-8">
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <p className="text-sm font-medium text-blue-600">
                        LIBRARY OVERVIEW
                    </p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                        Dashboard
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Monitor your library catalogue and daily operations.
                    </p>
                </div>

                <button
                    onClick={fetchStats}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    {loading ? "Loading..." : "Refresh"}
                </button>
            </section>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {typeof error === "string" ? error : JSON.stringify(error)}
                    <button
                        onClick={fetchStats}
                        className="ml-3 font-semibold underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                    <StatCard
                        key={stat.key}
                        {...stat}
                        value={loading ? "…" : stat.value}
                    />
                ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-900">
                                Library activity
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Current circulation overview.
                            </p>
                        </div>
                        <ArrowUpRight className="text-slate-400" size={20} />
                    </div>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-5">
                            <p className="text-sm text-slate-500">Books currently borrowed</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {loading
                                    ? "…"
                                    : stats.find((s) => s.key === "active_loans")?.value}
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-5">
                            <p className="text-sm text-slate-500">Overdue books</p>
                            <p className="mt-2 text-2xl font-bold text-orange-600">
                                {loading
                                    ? "…"
                                    : stats.find((s) => s.key === "overdue_loans")?.value}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h3 className="font-semibold text-slate-900">Quick overview</h3>

                    <div className="mt-5 space-y-4">
                        {[
                            ["Catalogue", "Browse and search books"],
                            ["Circulation", "Track checkouts and returns"],
                            ["Fine management", "Review outstanding fines"],
                            ["Reports", "Review overdue and popular books"],
                        ].map(([title, description]) => (
                            <div key={title} className="rounded-xl bg-slate-50 p-4">
                                <p className="text-sm font-semibold text-slate-800">
                                    {title}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    {description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}

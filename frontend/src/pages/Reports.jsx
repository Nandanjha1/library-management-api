
import { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle, TrendingUp } from "lucide-react";
import {
    getOverdueLoans,
    getMostBorrowedBooks,
} from "../services/librarianApi";

function asList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.loans)) return data.loans;
    if (Array.isArray(data?.books)) return data.books;
    return null;
}

export default function Reports() {
    const [overdue, setOverdue] = useState([]);
    const [popular, setPopular] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadReports() {
            try {
                const [overdueResponse, popularResponse] = await Promise.all([
                    getOverdueLoans(),
                    getMostBorrowedBooks(10),
                ]);

                const overdueList = asList(overdueResponse);
                const popularList = asList(popularResponse);

                if (!overdueList || !popularList) {
                    console.error("Unexpected report responses:", {
                        overdueResponse,
                        popularResponse,
                    });
                    throw new Error("Unexpected report response format.");
                }

                if (active) {
                    setOverdue(overdueList);
                    setPopular(popularList);
                }
            } catch (err) {
                if (active) {
                    setError(
                        err.message === "Unexpected report response format."
                            ? err.message
                            : err.response?.status === 401 || err.response?.status === 403
                                ? "Your librarian session may have expired. Sign in again."
                                : "Unable to load reports. Check your API connection."
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        loadReports();

        return () => {
            active = false;
        };
    }, []);

    if (loading) {
        return (
            <div className="flex items-center gap-2 p-8 text-slate-500">
                <RefreshCw size={18} className="animate-spin" />
                Loading reports...
            </div>
        );
    }

    return (
        <div className="space-y-7">
            <div>
                <p className="text-sm font-medium text-blue-600">ANALYTICS</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">Reports</h1>
                <p className="mt-2 text-sm text-slate-500">
                    Monitor overdue loans and frequently borrowed books.
                </p>
            </div>

            {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-2">
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-3 border-b border-slate-100 p-5">
                        <AlertTriangle className="text-orange-500" size={21} />
                        <div>
                            <h2 className="font-semibold text-slate-900">Overdue loans</h2>
                            <p className="text-sm text-slate-500">
                                {overdue.length} records returned by the API
                            </p>
                        </div>
                    </div>

                    {overdue.length === 0 ? (
                        <p className="p-6 text-sm text-slate-500">
                            No overdue records found.
                        </p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {overdue.map((item, index) => (
                                <div key={item.loan_id ?? index} className="p-5">
                                    <p className="font-medium text-slate-900">
                                        {item.title ?? item.book_title ?? `Loan #${item.loan_id ?? "—"}`}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        {item.full_name ?? item.member_name ?? "Member details unavailable"}
                                    </p>
                                    <p className="mt-2 text-xs text-orange-700">
                                        Days overdue: {item.days_overdue ?? "—"}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-3 border-b border-slate-100 p-5">
                        <TrendingUp className="text-blue-600" size={21} />
                        <div>
                            <h2 className="font-semibold text-slate-900">Most borrowed books</h2>
                            <p className="text-sm text-slate-500">Top 10 by loan count</p>
                        </div>
                    </div>

                    {popular.length === 0 ? (
                        <p className="p-6 text-sm text-slate-500">
                            No borrowing records found.
                        </p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {popular.map((item, index) => (
                                <div key={item.book_id ?? index} className="flex items-center justify-between gap-4 p-5">
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {item.title ?? item.book_title ?? "Untitled book"}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Book ID: {item.book_id ?? "—"}
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                        {item.borrow_count ?? "—"} loans
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

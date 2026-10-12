import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, IndianRupee, AlertCircle } from "lucide-react";
import api from "../services/api";

export default function Fines() {
    const [fines, setFines] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [processingId, setProcessingId] = useState(null);

    async function fetchFines() {
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            // Update this endpoint if your backend uses a different
            // librarian fines-list route.
            const response = await api.get("/fines");
            const data = response.data;

            const list = Array.isArray(data)
                ? data
                : data.items ?? data.fines ?? [];

            setFines(list);
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to load fines. Please check the backend endpoint."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchFines();
    }, []);

    const filteredFines = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return fines;

        return fines.filter((fine) =>
            [
                fine.fine_id,
                fine.member_id,
                fine.loan_id,
                fine.payment_status,
            ].some((value) =>
                String(value ?? "").toLowerCase().includes(query)
            )
        );
    }, [fines, search]);

    async function recordPayment(fine) {
        const fineId = fine.fine_id;
        const remaining =
            Number(fine.amount ?? 0) - Number(fine.amount_paid ?? 0);

        if (!fineId || remaining <= 0) {
            setError("This fine has no outstanding balance.");
            return;
        }

        const confirmed = window.confirm(
            `Record a desk payment of ₹${remaining.toFixed(2)} for Fine #${fineId}?`
        );

        if (!confirmed) return;

        setProcessingId(fineId);
        setError("");
        setSuccess("");

        try {
            // This records a payment verified by the librarian.
            // It does not charge a card or process an online payment.
            await api.post(`/fines/${fineId}/record-payment`, {
                amount: remaining,
                payment_method: "cash",
            });

            setSuccess(`Payment recorded for Fine #${fineId}.`);
            await fetchFines();
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to record payment. Please verify the API request format."
            );
        } finally {
            setProcessingId(null);
        }
    }

    function formatCurrency(value) {
        return `₹${Number(value ?? 0).toFixed(2)}`;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Fines & Payments
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Review outstanding fines and record verified desk payments.
                    </p>
                </div>

                <button
                    onClick={fetchFines}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Total fines</p>
                    <p className="mt-2 text-2xl font-bold text-gray-800">
                        {fines.length}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Outstanding balance</p>
                    <p className="mt-2 text-2xl font-bold text-red-600">
                        {formatCurrency(
                            fines.reduce(
                                (sum, fine) =>
                                    sum +
                                    Math.max(
                                        0,
                                        Number(fine.amount ?? 0) -
                                        Number(fine.amount_paid ?? 0)
                                    ),
                                0
                            )
                        )}
                    </p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="text-sm text-gray-500">Fully paid fines</p>
                    <p className="mt-2 text-2xl font-bold text-green-600">
                        {
                            fines.filter(
                                (fine) =>
                                    Number(fine.amount_paid ?? 0) >=
                                    Number(fine.amount ?? 0) &&
                                    Number(fine.amount ?? 0) > 0
                            ).length
                        }
                    </p>
                </div>
            </div>

            {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    {success}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="font-semibold text-gray-800">Fine records</h2>

                    <div className="relative w-full sm:max-w-xs">
                        <Search
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search fine or member ID..."
                            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-sm text-gray-500">
                        Loading fines...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-5 py-3">Fine ID</th>
                                    <th className="px-5 py-3">Member ID</th>
                                    <th className="px-5 py-3">Loan ID</th>
                                    <th className="px-5 py-3">Fine amount</th>
                                    <th className="px-5 py-3">Paid</th>
                                    <th className="px-5 py-3">Balance</th>
                                    <th className="px-5 py-3">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {filteredFines.map((fine) => {
                                    const amount = Number(fine.amount ?? 0);
                                    const paid = Number(fine.amount_paid ?? 0);
                                    const balance = Math.max(0, amount - paid);
                                    const fineId = fine.fine_id;

                                    return (
                                        <tr key={fineId} className="hover:bg-gray-50">
                                            <td className="px-5 py-4 font-medium text-gray-800">
                                                #{fineId}
                                            </td>
                                            <td className="px-5 py-4">{fine.member_id ?? "—"}</td>
                                            <td className="px-5 py-4">{fine.loan_id ?? "—"}</td>
                                            <td className="px-5 py-4">
                                                {formatCurrency(amount)}
                                            </td>
                                            <td className="px-5 py-4 text-green-700">
                                                {formatCurrency(paid)}
                                            </td>
                                            <td className="px-5 py-4 font-medium text-red-600">
                                                {formatCurrency(balance)}
                                            </td>
                                            <td className="px-5 py-4">
                                                {balance > 0 ? (
                                                    <button
                                                        onClick={() => recordPayment(fine)}
                                                        disabled={processingId === fineId}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        <IndianRupee size={14} />
                                                        {processingId === fineId
                                                            ? "Processing..."
                                                            : "Record payment"}
                                                    </button>
                                                ) : (
                                                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                                        Paid
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filteredFines.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-5 py-10 text-center text-gray-500"
                                        >
                                            {fines.length === 0
                                                ? "No fine records found."
                                                : "No matching fine records."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

import { useEffect, useState } from "react";
import { BookOpen, ClipboardList, Receipt, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function MemberDashboard() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loans, setLoans] = useState([]);
    const [fines, setFines] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    function logout() {
        sessionStorage.removeItem("member_token");
        navigate("/login", { replace: true });
    }

    useEffect(() => {
        let active = true;

        async function loadDashboard() {
            try {
                const [profileResponse, loansResponse, finesResponse] =
                    await Promise.all([
                        api.get("/members/me"),
                        api.get("/members/me/loans"),
                        api.get("/fines/me"),
                    ]);

                if (!active) return;


                setProfile(profileResponse.data);

                // Support direct arrays and common wrapped response formats.
                const loansData = loansResponse.data;
                const finesData = finesResponse.data;

                const loansList = Array.isArray(loansData)
                    ? loansData
                    : Array.isArray(loansData?.items)
                        ? loansData.items
                        : Array.isArray(loansData?.loans)
                            ? loansData.loans
                            : null;

                const finesList = Array.isArray(finesData)
                    ? finesData
                    : Array.isArray(finesData?.items)
                        ? finesData.items
                        : Array.isArray(finesData?.fines)
                            ? finesData.fines
                            : null;

                if (!loansList || !finesList) {
                    console.error("Unexpected loans response:", loansData);
                    console.error("Unexpected fines response:", finesData);
                    throw new Error("Unexpected API response format for loans or fines.");
                }

                setLoans(loansList);
                setFines(finesList);

            } catch (err) {
                if (!active) return;

                if (err.response?.status === 401 || err.response?.status === 403) {
                    sessionStorage.removeItem("member_token");
                    navigate("/login", { replace: true });
                } else {
                    setError("Unable to load your account. Please try again.");
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        loadDashboard();

        return () => {
            active = false;
        };
    }, [navigate]);

    if (loading) {
        return <div className="p-8 text-slate-500">Loading your dashboard...</div>;
    }

    const outstanding = fines.reduce(
        (total, fine) =>
            total + Number(fine.amount) - Number(fine.amount_paid),
        0
    );

    return (
        <div className="space-y-7 m-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-blue-600">MEMBER PORTAL</p>
                    <h1 className="mt-2 text-3xl font-bold text-slate-900">
                        Welcome, {profile?.full_name || "Member"}
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        View your borrowed books and outstanding fines.
                    </p>
                </div>

                <button
                    onClick={logout}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
                >
                    <LogOut size={17} /> Sign out
                </button>
            </div>

            {error && (
                <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </p>
            )}

            <div className="grid gap-5 md:grid-cols-3">
                {[
                    {
                        title: "Total Loans",
                        value: loans.length,
                        icon: ClipboardList,
                    },
                    {
                        title: "Active Loans",
                        value: loans.filter((loan) => !loan.returned_at).length,
                        icon: BookOpen,
                    },
                    {
                        title: "Outstanding Fines",
                        value: `₹${outstanding.toFixed(2)}`,
                        icon: Receipt,
                    },
                ].map(({ title, value, icon: Icon }) => (
                    <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">{title}</p>
                            <Icon className="text-blue-600" size={21} />
                        </div>
                        <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
                    </div>
                ))}
            </div>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 p-5">
                    <h2 className="font-semibold text-slate-900">My loan history</h2>
                </div>

                {loans.length === 0 ? (
                    <p className="p-8 text-sm text-slate-500">No loans found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-5 py-4">Book</th>
                                    <th className="px-5 py-4">Checkout</th>
                                    <th className="px-5 py-4">Due date</th>
                                    <th className="px-5 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loans.map((loan) => (
                                    <tr key={loan.loan_id}>
                                        <td className="px-5 py-4 font-medium text-slate-800">
                                            {loan.title}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {loan.checkout_date
                                                ? new Date(loan.checkout_date).toLocaleDateString()
                                                : "—"}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {loan.due_date
                                                ? new Date(loan.due_date).toLocaleDateString()
                                                : "—"}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${loan.returned_at
                                                ? "bg-slate-100 text-slate-600"
                                                : loan.is_overdue
                                                    ? "bg-red-50 text-red-700"
                                                    : "bg-emerald-50 text-emerald-700"
                                                }`}>
                                                {loan.returned_at
                                                    ? "Returned"
                                                    : loan.is_overdue
                                                        ? "Overdue"
                                                        : "Active"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

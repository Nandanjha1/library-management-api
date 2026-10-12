
import { useState } from "react";
import { BookOpen, RotateCcw, CheckCircle2 } from "lucide-react";
import { checkoutBook, returnBook } from "../services/librarianApi";

function getErrorMessage(error) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") return detail;
    if (detail?.message) return detail.message;

    if (error.response?.status === 401 || error.response?.status === 403) {
        return "Your librarian session may be invalid or expired. Sign in again.";
    }

    return "Request failed. Verify the entered IDs and try again.";
}

export default function Loans() {
    const [checkout, setCheckout] = useState({
        member_id: "",
        copy_id: "",
        due_date: "",
    });

    const [loanId, setLoanId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    function updateCheckout(event) {
        setCheckout({
            ...checkout,
            [event.target.name]: event.target.value,
        });
    }

    async function handleCheckout(event) {
        event.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const dueDate = new Date(checkout.due_date);

            if (Number.isNaN(dueDate.getTime())) {
                throw new Error("Please select a valid due date.");
            }

            const result = await checkoutBook({
                member_id: Number(checkout.member_id),
                copy_id: Number(checkout.copy_id),
                due_date: dueDate.toISOString(),
            });

            setSuccess(
                `Checkout successful. Loan ID: ${result.loan_id ?? "See response details"
                }`
            );
            setCheckout({ member_id: "", copy_id: "", due_date: "" });
        } catch (err) {
            setError(err.message === "Please select a valid due date."
                ? err.message
                : getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    async function handleReturn(event) {
        event.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const result = await returnBook(Number(loanId));

            setSuccess(
                result.fine_amount != null
                    ? `Return successful. Fine: ₹${result.fine_amount}`
                    : "Return successful. Check the API response for the loan details."
            );

            setLoanId("");
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-7">
            <div>
                <p className="text-sm font-medium text-blue-600">CIRCULATION</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">
                    Book Loans
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    Check out physical copies and process book returns.
                </p>
            </div>

            {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    {success}
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-2">
                <section className="rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <BookOpen size={22} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">Check out a book</h2>
                            <p className="text-sm text-slate-500">Assign a copy to a member.</p>
                        </div>
                    </div>

                    <form onSubmit={handleCheckout} className="mt-6 space-y-5">
                        <div>
                            <label htmlFor="member_id" className="mb-2 block text-sm font-medium">
                                Member ID
                            </label>
                            <input
                                id="member_id"
                                name="member_id"
                                type="number"
                                min="1"
                                required
                                value={checkout.member_id}
                                onChange={updateCheckout}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                                placeholder="Enter member ID"
                            />
                        </div>

                        <div>
                            <label htmlFor="copy_id" className="mb-2 block text-sm font-medium">
                                Physical copy ID
                            </label>
                            <input
                                id="copy_id"
                                name="copy_id"
                                type="number"
                                min="1"
                                required
                                value={checkout.copy_id}
                                onChange={updateCheckout}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                                placeholder="Enter copy ID"
                            />
                        </div>

                        <div>
                            <label htmlFor="due_date" className="mb-2 block text-sm font-medium">
                                Due date and time
                            </label>
                            <input
                                id="due_date"
                                name="due_date"
                                type="datetime-local"
                                required
                                value={checkout.due_date}
                                onChange={updateCheckout}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            {loading ? "Processing..." : "Check out book"}
                        </button>
                    </form>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                            <RotateCcw size={22} />
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">Return a book</h2>
                            <p className="text-sm text-slate-500">Close an active loan.</p>
                        </div>
                    </div>

                    <form onSubmit={handleReturn} className="mt-6 space-y-5">
                        <div>
                            <label htmlFor="loan_id" className="mb-2 block text-sm font-medium">
                                Loan ID
                            </label>
                            <input
                                id="loan_id"
                                type="number"
                                min="1"
                                required
                                value={loanId}
                                onChange={(event) => setLoanId(event.target.value)}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                                placeholder="Enter active loan ID"
                            />
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                            The backend will calculate any overdue fine according to its
                            configured business rules.
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                        >
                            {loading ? "Processing..." : "Return book"}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
}


import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Library, LockKeyhole } from "lucide-react";
import { loginLibrarian } from "../services/librarianAuth";

export default function LibrarianLogin() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            await loginLibrarian({
                email: email.trim(),
                password,
            });

            // UI navigation state only; the backend cookie is authoritative.
            sessionStorage.setItem("librarian_logged_in", "true");
            navigate("/", { replace: true });
        } catch (err) {
            const detail = err.response?.data?.detail;

            setError(
                typeof detail === "string"
                    ? detail
                    : detail?.message || "Login failed. Verify your credentials."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
            <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-8 flex items-center gap-3">
                    <div className="rounded-xl bg-blue-600 p-3 text-white">
                        <Library size={25} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            Libra Library
                        </h1>
                        <p className="text-sm text-slate-500">
                            Staff workspace
                        </p>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900">
                    Librarian sign in
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                    Sign in to manage book circulation and reports.
                </p>

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                    <div>
                        <label htmlFor="staff-email" className="mb-2 block text-sm font-medium">
                            Work email
                        </label>
                        <input
                            id="staff-email"
                            type="email"
                            autoComplete="username"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="librarian@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="staff-password" className="mb-2 block text-sm font-medium">
                            Password
                        </label>
                        <input
                            id="staff-password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Enter your password"
                        />
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                        >
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <LockKeyhole size={18} />
                        {loading ? "Signing in..." : "Sign in as librarian"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Are you a library member?{" "}
                    <Link to="/login" className="font-semibold text-blue-600">
                        Member login
                    </Link>
                </p>
            </section>
        </main>
    );
}

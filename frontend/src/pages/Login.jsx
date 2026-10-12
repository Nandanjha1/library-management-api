
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Library, LockKeyhole } from "lucide-react";
import { loginMember } from "../services/auth";

export default function Login() {
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
            const data = await loginMember({ email, password });

            if (!data.access_token) {
                throw new Error("Login response did not contain an access token.");
            }

            sessionStorage.setItem("member_token", data.access_token);
            navigate("/member");
        } catch (err) {
            setError(
                err.response?.data?.detail?.message ||
                (typeof err.response?.data?.detail === "string"
                    ? err.response.data.detail
                    : "Login failed. Check your credentials and try again.")
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="mb-8 flex items-center gap-3">
                    <div className="rounded-xl bg-blue-600 p-3 text-white">
                        <Library size={25} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            Libra Library
                        </h1>
                        <p className="text-sm text-slate-500">Member portal</p>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
                <p className="mt-2 text-sm text-slate-500">
                    Sign in to view your loans and fines.
                </p>

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                    <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-medium">
                            Email address
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="mb-2 block text-sm font-medium">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Enter your password"
                        />
                    </div>

                    {error && (
                        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </p>
                    )}

                    <button
                        disabled={loading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        <LockKeyhole size={18} />
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-600">
                    Don't have an account?{" "}
                    <Link to="/register" className="font-semibold text-blue-600">
                        Create account
                    </Link>
                </p>
            </div>
        </div>
    );
}

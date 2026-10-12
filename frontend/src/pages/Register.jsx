
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Library } from "lucide-react";
import { registerMember } from "../services/auth";

export default function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        full_name: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(event) {
        setForm({ ...form, [event.target.name]: event.target.value });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            await registerMember({
                full_name: form.full_name.trim(),
                email: form.email.trim(),
                password: form.password,
            });

            navigate("/login", {
                state: { message: "Account created. Please sign in." },
            });
        } catch (err) {
            const detail = err.response?.data?.detail;
            setError(
                typeof detail === "string"
                    ? detail
                    : detail?.message || "Registration failed. Check your details."
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
                        <h1 className="text-xl font-bold text-slate-900">Libra Library</h1>
                        <p className="text-sm text-slate-500">Member portal</p>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-slate-900">Create account</h2>
                <p className="mt-2 text-sm text-slate-500">
                    Register to manage your library activity.
                </p>

                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                    <div>
                        <label htmlFor="full_name" className="mb-2 block text-sm font-medium">
                            Full name
                        </label>
                        <input
                            id="full_name"
                            name="full_name"
                            value={form.full_name}
                            onChange={handleChange}
                            minLength={2}
                            maxLength={150}
                            required
                            autoComplete="name"
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                            placeholder="Your full name"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-medium">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            autoComplete="email"
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="mb-2 block text-sm font-medium">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            minLength={8}
                            maxLength={128}
                            required
                            autoComplete="new-password"
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                            placeholder="At least 8 characters"
                        />
                    </div>

                    {error && (
                        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </p>
                    )}

                    <button
                        disabled={loading}
                        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-600">
                    Already registered?{" "}
                    <Link to="/login" className="font-semibold text-blue-600">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}

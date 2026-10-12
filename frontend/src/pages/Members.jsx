
import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

export default function Members() {
    const [members, setMembers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get("/members");

                if (!Array.isArray(response.data)) {
                    throw new Error("Unexpected response from server.");
                }

                setMembers(response.data);
            } catch (err) {
                setError(
                    err.response?.data?.detail?.message ||
                    err.message ||
                    "Unable to load members."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, []);

    const filteredMembers = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return members;

        return members.filter((member) =>
            [
                member.full_name,
                member.email,
                String(member.member_id),
            ].some((value) => value?.toLowerCase?.().includes(query) ||
                String(value ?? "").toLowerCase().includes(query))
        );
    }, [members, search]);

    const activeCount = members.filter(
        (member) => member.is_active
    ).length;

    const inactiveCount = members.length - activeCount;

    if (loading) {
        return <div className="p-6">Loading members...</div>;
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">
                    Members
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Manage and view registered library members.
                </p>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard title="Total Members" value={members.length} />
                <StatCard title="Active Members" value={activeCount} />
                <StatCard title="Inactive Members" value={inactiveCount} />
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-5">
                    <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by name, email, or member ID..."
                        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-4 py-3">Member ID</th>
                                <th className="px-4 py-3">Full Name</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {filteredMembers.map((member) => (
                                <tr
                                    key={member.member_id}
                                    className="hover:bg-gray-50"
                                >
                                    <td className="px-4 py-3">
                                        #{member.member_id}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-800">
                                        {member.full_name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {member.email}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-medium ${member.is_active
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                                }`}
                                        >
                                            {member.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                </tr>
                            ))}

                            {filteredMembers.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="4"
                                        className="px-4 py-8 text-center text-gray-500"
                                    >
                                        {search
                                            ? "No members match your search."
                                            : "No members found."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <p className="mt-4 text-sm text-gray-500">
                    Showing {filteredMembers.length} of {members.length} members
                </p>
            </div>
        </div>
    );
}

function StatCard({ title, value }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-800">
                {value}
            </p>
        </div>
    );
}

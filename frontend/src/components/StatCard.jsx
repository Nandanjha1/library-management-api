
export default function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color = "blue",
}) {
    const colors = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-emerald-50 text-emerald-600",
        orange: "bg-orange-50 text-orange-600",
        purple: "bg-purple-50 text-purple-600",
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                        {value}
                    </h3>
                </div>

                <div className={`rounded-xl p-3 ${colors[color] || colors.blue}`}>
                    {Icon && <Icon size={22} />}
                </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">{subtitle}</p>
        </div>
    );
}

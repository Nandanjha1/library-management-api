
import { Bell, Menu, Search } from "lucide-react";

export default function Navbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        <div className="hidden items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 sm:flex">
          <Search size={18} className="text-slate-400" />
          <span className="text-sm text-slate-400">
            Library workspace
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          aria-label="Notifications"
          className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
        >
          <Bell size={19} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
            L
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">
              Librarian
            </p>
            <p className="text-xs text-slate-500">Library staff</p>
          </div>
        </div>
      </div>
    </header>
  );
}

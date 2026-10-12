import ProtectedRoute from "./components/ProtectedRoute";
import LibrarianLogin from "./pages/LibrarianLogin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MemberDashboard from "./pages/MemberDashboard";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import Loans from "./pages/Loans";
import Reports from "./pages/Reports";
import Fines from "./pages/Fines";
import Members from "./pages/Members";

function Placeholder({ title }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">
        This page will be implemented and connected to the API in the
        upcoming phase.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/staff/login" element={<LibrarianLogin />} />

        {/* Member routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute role="member" />}>
          <Route path="/member" element={<MemberDashboard />} />
        </Route>

        {/* Librarian routes */}
        <Route element={<ProtectedRoute role="librarian" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/books" element={<Books />} />
            <Route path="/members" element={<Members />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/fines" element={<Fines />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

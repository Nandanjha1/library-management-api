import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ role }) {
  const storageKey =
    role === "librarian"
      ? "librarian_logged_in"
      : "member_token";

  const isAuthenticated =
    Boolean(sessionStorage.getItem(storageKey));

  if (!isAuthenticated) {
    return (
      <Navigate
        to={role === "librarian" ? "/staff/login" : "/login"}
        replace
      />
    );
  }

  return <Outlet />;
}

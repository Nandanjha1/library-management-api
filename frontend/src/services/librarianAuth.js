import api from "./api";

export async function loginLibrarian(credentials) {
    // Successful login should establish the backend session cookie.
    const response = await api.post(
        "/auth/librarian/login",
        credentials
    );

    return response.data;
}

export async function logoutLibrarian() {
    const response = await api.post("/auth/librarian/logout");
    return response.data;
}

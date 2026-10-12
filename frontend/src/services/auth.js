import api from "./api";

export async function registerMember(payload) {
    const response = await api.post("/auth/member/register", payload);
    return response.data;
}

export async function loginMember(payload) {
    const response = await api.post("/auth/member/login", payload);
    return response.data;
}

export async function getMyProfile() {
    const response = await api.get("/members/me");
    return response.data;
}

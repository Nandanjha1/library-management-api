
import api from "./api";
export async function checkoutBook(payload) {
    const response = await api.post("/loans", payload);
    return response.data;
}

export async function returnBook(loanId) {
    const response = await api.post(`/loans/${loanId}/return`);
    return response.data;
}

export async function getOverdueLoans() {
    const response = await api.get("/reports/overdue");
    return response.data;
}

export async function getMostBorrowedBooks(limit = 10) {
    const response = await api.get("/reports/most-borrowed", {
        params: { limit },
    });
    return response.data;
}


import { useEffect, useState } from "react";
import { Search, BookOpen, RefreshCw } from "lucide-react";
import api from "../services/api";

export default function Books() {
    const [search, setSearch] = useState("");
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        isbn: "",
        title: "",
        publisher: "",
        publication_year: "",
        author_ids: "",
    });

    const [showCopiesForm, setShowCopiesForm] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [copyForm, setCopyForm] = useState({
        branch_id: "",
        barcodes: "",
    });

    useEffect(() => {
        const controller = new AbortController();

        async function loadBooks() {
            setLoading(true);
            setError("");

            try {
                const response = await api.get("/books", {
                    params: { search: search.trim() || undefined, limit: 50, offset: 0 },
                    signal: controller.signal,
                });

                setBooks(response.data.items || []);
            } catch (err) {
                if (err.code !== "ERR_CANCELED") {
                    setError(
                        err.response?.data?.detail?.message ||
                        "Unable to load books. Check whether the backend is running."
                    );
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        const timer = setTimeout(loadBooks, 250);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [search]);

    async function handleBookSubmit(event) {
        event.preventDefault();

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const authorIds = form.author_ids.trim()
                ? form.author_ids
                    .split(",")
                    .map((id) => Number(id.trim()))
                : [];

            if (
                authorIds.some(
                    (id) => !Number.isInteger(id) || id <= 0
                )
            ) {
                throw new Error(
                    "Author IDs must be positive integers separated by commas."
                );
            }

            const payload = {
                isbn: form.isbn.trim() || null,
                title: form.title.trim(),
                publisher: form.publisher.trim() || null,
                publication_year: form.publication_year
                    ? Number(form.publication_year)
                    : null,
                author_ids: authorIds,
            };

            if (!payload.title) {
                throw new Error("Book title is required.");
            }

            if (
                payload.publication_year !== null &&
                (!Number.isInteger(payload.publication_year) ||
                    payload.publication_year < 1 ||
                    payload.publication_year > 2100)
            ) {
                throw new Error("Enter a valid publication year.");
            }

            if (editingBook) {
                await api.patch(
                    `/books/${editingBook.book_id}`,
                    payload
                );
                setSuccess("Book updated successfully.");
            } else {
                await api.post("/books", payload);
                setSuccess("Book added successfully.");
            }

            setShowForm(false);
            setEditingBook(null);
            setForm({
                isbn: "",
                title: "",
                publisher: "",
                publication_year: "",
                author_ids: "",
            });

            // Refresh the catalogue after saving.
            const response = await api.get("/books", {
                params: {
                    search: search.trim() || undefined,
                    limit: 50,
                    offset: 0,
                },
            });

            setBooks(response.data.items || []);
        } catch (err) {
            setError(
                err.response?.data?.detail?.message ||
                (typeof err.response?.data?.detail === "string"
                    ? err.response.data.detail
                    : null) ||
                err.message ||
                "Unable to save book."
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleCopiesSubmit(event) {
        event.preventDefault();

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const barcodes = copyForm.barcodes
                .split(/\r?\n/)
                .map((barcode) => barcode.trim())
                .filter(Boolean);

            if (barcodes.length === 0 || barcodes.length > 100) {
                throw new Error("Enter between 1 and 100 barcodes.");
            }

            if (new Set(barcodes).size !== barcodes.length) {
                throw new Error("Duplicate barcodes are not allowed.");
            }

            await api.post(
                `/books/${selectedBook.book_id}/copies`,
                {
                    branch_id: Number(copyForm.branch_id),
                    barcodes,
                }
            );

            setSuccess(
                `${barcodes.length} physical copy/copies added successfully.`
            );
            setShowCopiesForm(false);
            setSelectedBook(null);

            const response = await api.get("/books", {
                params: {
                    search: search.trim() || undefined,
                    limit: 50,
                    offset: 0,
                },
            });

            setBooks(response.data.items || []);
        } catch (err) {
            setError(
                err.response?.data?.detail?.message ||
                (typeof err.response?.data?.detail === "string"
                    ? err.response.data.detail
                    : null) ||
                err.message ||
                "Unable to add copies."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-blue-600">
                        CATALOGUE
                    </p>
                    <h2 className="mt-2 text-3xl font-bold text-slate-900">
                        Books
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Search books and manage library inventory.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setEditingBook(null);
                        setForm({
                            isbn: "",
                            title: "",
                            publisher: "",
                            publication_year: "",
                            author_ids: "",
                        });
                        setError("");
                        setSuccess("");
                        setShowForm(true);
                    }}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                    + Add Book
                </button>
            </div>

            {showForm && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">
                                {editingBook ? "Edit Book" : "Add New Book"}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Enter the book details below.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setEditingBook(null);
                            }}
                            className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
                        >
                            Cancel
                        </button>
                    </div>

                    <form
                        onSubmit={handleBookSubmit}
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
                    >
                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Book Title *
                            </label>
                            <input
                                required
                                maxLength={255}
                                value={form.title}
                                onChange={(event) =>
                                    setForm({ ...form, title: event.target.value })
                                }
                                placeholder="Enter book title"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                            />
                        </div>

                        {success && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                                {success}
                            </div>
                        )}

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                ISBN
                            </label>
                            <input
                                maxLength={20}
                                value={form.isbn}
                                onChange={(event) =>
                                    setForm({ ...form, isbn: event.target.value })
                                }
                                placeholder="Enter ISBN"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Publisher
                            </label>
                            <input
                                maxLength={255}
                                value={form.publisher}
                                onChange={(event) =>
                                    setForm({ ...form, publisher: event.target.value })
                                }
                                placeholder="Enter publisher"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Publication Year
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="2100"
                                value={form.publication_year}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        publication_year: event.target.value,
                                    })
                                }
                                placeholder="e.g. 2024"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Author IDs
                            </label>
                            <input
                                value={form.author_ids}
                                onChange={(event) =>
                                    setForm({ ...form, author_ids: event.target.value })
                                }
                                placeholder="e.g. 1, 2"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                Enter existing author IDs separated by commas.
                            </p>
                        </div>

                        <div className="flex items-end gap-3 sm:col-span-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving
                                    ? "Saving..."
                                    : editingBook
                                        ? "Update Book"
                                        : "Save Book"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingBook(null);
                                }}
                                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {showCopiesForm && selectedBook && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5">
                        <h3 className="text-xl font-bold text-slate-900">
                            Manage Copies
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Add physical copies for{" "}
                            <span className="font-semibold">{selectedBook.title}</span>.
                        </p>
                    </div>

                    <form
                        onSubmit={handleCopiesSubmit}
                        className="space-y-4"
                    >
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Branch ID *
                            </label>
                            <input
                                type="number"
                                min="1"
                                required
                                value={copyForm.branch_id}
                                onChange={(event) =>
                                    setCopyForm({
                                        ...copyForm,
                                        branch_id: event.target.value,
                                    })
                                }
                                placeholder="Enter an existing branch ID"
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                Barcodes *
                            </label>
                            <textarea
                                required
                                rows={4}
                                value={copyForm.barcodes}
                                onChange={(event) =>
                                    setCopyForm({
                                        ...copyForm,
                                        barcodes: event.target.value,
                                    })
                                }
                                placeholder={"Enter one barcode per line\nLIB-001\nLIB-002"}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                Enter up to 100 unique barcodes, one per line.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {saving ? "Adding..." : "Add Copies"}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowCopiesForm(false);
                                    setSelectedBook(null);
                                }}
                                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <Search size={20} className="text-slate-400" />
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by title, ISBN or author..."
                    className="w-full bg-transparent text-sm outline-none"
                    aria-label="Search books"
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-white p-12 text-slate-500">
                    <RefreshCw size={18} className="animate-spin" />
                    Loading books...
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                    {error}
                </div>
            ) : books.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                    <BookOpen className="mx-auto text-slate-400" size={32} />
                    <p className="mt-3 font-semibold text-slate-800">No books found</p>
                    <p className="mt-1 text-sm text-slate-500">
                        Try another title or author.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-5 py-4">Book</th>
                                    <th className="px-5 py-4">Authors</th>
                                    <th className="px-5 py-4">ISBN</th>
                                    <th className="px-5 py-4">Available copies</th>
                                    <th className="px-5 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {books.map((book) => (
                                    <tr key={book.book_id} className="hover:bg-slate-50">
                                        <td className="px-5 py-4 font-medium text-slate-900">
                                            {book.title}
                                            {book.publication_year && (
                                                <p className="mt-1 text-xs font-normal text-slate-500">
                                                    {book.publication_year}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {book.authors?.map((author) => author.name).join(", ") || "—"}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            {book.isbn || "—"}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                {book.available_copies ?? 0}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingBook(book);

                                                    setForm({
                                                        isbn: book.isbn || "",
                                                        title: book.title || "",
                                                        publisher: book.publisher || "",
                                                        publication_year: book.publication_year
                                                            ? String(book.publication_year)
                                                            : "",
                                                        author_ids: (book.authors || [])
                                                            .map((author) => author.author_id)
                                                            .join(", "),
                                                    });

                                                    setError("");
                                                    setSuccess("");
                                                    setShowForm(true);
                                                }}
                                                className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedBook(book);
                                                    setCopyForm({
                                                        branch_id: "",
                                                        barcodes: "",
                                                    });
                                                    setError("");
                                                    setSuccess("");
                                                    setShowCopiesForm(true);
                                                }}
                                                className="ml-2 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                            >
                                                Manage Copies
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

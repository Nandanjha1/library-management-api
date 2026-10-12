-- =====================================================
-- Library Management API
-- Database schema: PostgreSQL
-- =====================================================

CREATE TABLE branches (
    branch_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE books (
    book_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    isbn VARCHAR(20) UNIQUE,
    title VARCHAR(255) NOT NULL,
    publisher VARCHAR(150),
    publication_year INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_publication_year
        CHECK (
            publication_year IS NULL
            OR publication_year BETWEEN 1 AND 9999
        )
);

CREATE TABLE authors (
    author_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(150) NOT NULL
);

-- A book can have multiple authors, and an author
-- can write multiple books.
CREATE TABLE book_authors (
    book_id INTEGER NOT NULL REFERENCES books(book_id)
        ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES authors(author_id)
        ON DELETE RESTRICT,

    PRIMARY KEY (book_id, author_id)
);

-- Every physical copy belongs to a book and a branch.
CREATE TABLE book_copies (
    copy_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES books(book_id)
        ON DELETE RESTRICT,
    branch_id INTEGER NOT NULL REFERENCES branches(branch_id)
        ON DELETE RESTRICT,
    barcode VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'available',

    CONSTRAINT chk_copy_status
        CHECK (status IN ('available', 'loaned', 'maintenance'))
);

CREATE TABLE members (
    member_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE staff (
    staff_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- A loan represents the checkout of one physical copy.
CREATE TABLE loans (
    loan_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(member_id)
        ON DELETE RESTRICT,
    copy_id INTEGER NOT NULL REFERENCES book_copies(copy_id)
        ON DELETE RESTRICT,
    checked_out_by INTEGER NOT NULL REFERENCES staff(staff_id)
        ON DELETE RESTRICT,
    returned_to INTEGER REFERENCES staff(staff_id)
        ON DELETE RESTRICT,
    checkout_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMPTZ NOT NULL,
    returned_at TIMESTAMPTZ,

    CONSTRAINT chk_loan_dates
        CHECK (due_date >= checkout_date),

    CONSTRAINT chk_return_date
        CHECK (returned_at IS NULL OR returned_at >= checkout_date)
);

-- At most one active loan may exist for a physical copy.
CREATE UNIQUE INDEX uq_active_loan_per_copy
    ON loans(copy_id)
    WHERE returned_at IS NULL;

CREATE TABLE fines (
    fine_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    loan_id INTEGER NOT NULL UNIQUE REFERENCES loans(loan_id)
        ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL,
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMPTZ,

    CONSTRAINT chk_fine_amount
        CHECK (amount >= 0 AND amount_paid >= 0
               AND amount_paid <= amount),

    CONSTRAINT chk_fine_payment_status
        CHECK (payment_status IN ('unpaid', 'partial', 'paid')),

    CONSTRAINT chk_fine_paid_at
        CHECK (
            (payment_status = 'paid' AND paid_at IS NOT NULL)
            OR
            (payment_status <> 'paid' AND paid_at IS NULL)
        )
);

-- Partner catalogue clients.
CREATE TABLE partner_clients (
    partner_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    partner_name VARCHAR(150) NOT NULL,
    api_key VARCHAR(100) NOT NULL UNIQUE,
    secret_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Helpful indexes for common lookups and reports.
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_book_authors_author ON book_authors(author_id);
CREATE INDEX idx_copies_branch_status
    ON book_copies(branch_id, status);
CREATE INDEX idx_loans_member ON loans(member_id);
CREATE INDEX idx_loans_due_date ON loans(due_date);
CREATE INDEX idx_loans_copy ON loans(copy_id);
CREATE INDEX idx_fines_payment_status
    ON fines(payment_status);

-- An efficient index for active loans of each member.
CREATE INDEX idx_active_loans_member
    ON loans(member_id)
    WHERE returned_at IS NULL;


CREATE TABLE librarian_sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    staff_id INTEGER NOT NULL
        REFERENCES staff(staff_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,

    CONSTRAINT chk_session_expiry
        CHECK (expires_at > created_at)
);

CREATE INDEX idx_librarian_sessions_staff
    ON librarian_sessions(staff_id);

CREATE INDEX idx_librarian_sessions_expiry
    ON librarian_sessions(expires_at);



CREATE TABLE IF NOT EXISTS fine_payments (
    payment_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    fine_id BIGINT NOT NULL
        REFERENCES fines(fine_id),

    amount NUMERIC(10, 2) NOT NULL
        CHECK (amount > 0),

    payment_method VARCHAR(30) NOT NULL
        CHECK (
            payment_method IN (
                'cash',
                'card',
                'upi',
                'online'
            )
        ),

    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (
            payment_status IN (
                'pending',
                'confirmed',
                'failed',
                'refunded'
            )
        ),

    transaction_reference VARCHAR(150) UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMPTZ,

    CHECK (
        (payment_status = 'confirmed' AND confirmed_at IS NOT NULL)
        OR
        (payment_status <> 'confirmed' AND confirmed_at IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_fine_payments_fine_id
    ON fine_payments(fine_id);

CREATE INDEX IF NOT EXISTS idx_fine_payments_status
    ON fine_payments(payment_status);

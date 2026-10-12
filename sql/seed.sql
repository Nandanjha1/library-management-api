-- =====================================================
-- Library Management API: Sample Data
-- Run only once on a fresh database.
-- Demo password hashes will be configured separately.
-- =====================================================

BEGIN;

-- 1. Three library branches
INSERT INTO branches (name, address) VALUES
    ('Central Library', 'Sector 17, Chandigarh'),
    ('North Branch', 'Sector 15, Chandigarh'),
    ('South Branch', 'Sector 35, Chandigarh');

-- 2. Books
INSERT INTO books (isbn, title, publisher, publication_year) VALUES
    ('9780132350884', 'Clean Code', 'Prentice Hall', 2008),
    ('9780134685991', 'Effective Java', 'Addison-Wesley', 2017),
    ('9781491950296', 'Learning Python', 'O''Reilly Media', 2013),
    ('9780135957059', 'The Pragmatic Programmer', 'Addison-Wesley', 2019),
    ('9780262033848', 'Introduction to Algorithms', 'MIT Press', 2009);

-- 3. Authors
INSERT INTO authors (name) VALUES
    ('Robert C. Martin'),
    ('Joshua Bloch'),
    ('Mark Lutz'),
    ('David Thomas'),
    ('Andrew Hunt'),
    ('Thomas H. Cormen'),
    ('Charles E. Leiserson'),
    ('Ronald L. Rivest'),
    ('Clifford Stein');

-- 4. Book-author relationships
INSERT INTO book_authors (book_id, author_id)
SELECT b.book_id, a.author_id
FROM books b CROSS JOIN authors a
WHERE (b.isbn = '9780132350884' AND a.name = 'Robert C. Martin')
   OR (b.isbn = '9780134685991' AND a.name = 'Joshua Bloch')
   OR (b.isbn = '9781491950296' AND a.name = 'Mark Lutz')
   OR (b.isbn = '9780135957059' AND a.name IN ('David Thomas', 'Andrew Hunt'))
   OR (b.isbn = '9780262033848' AND a.name IN (
       'Thomas H. Cormen',
       'Charles E. Leiserson',
       'Ronald L. Rivest',
       'Clifford Stein'
   ));

-- 5. Physical copies across branches
INSERT INTO book_copies (book_id, branch_id, barcode, status)
SELECT b.book_id, br.branch_id, v.barcode, 'available'
FROM (VALUES
    ('9780132350884', 'Central Library', 'CL-0001'),
    ('9780132350884', 'North Branch',    'NB-0001'),
    ('9780134685991', 'Central Library', 'CL-0002'),
    ('9780134685991', 'South Branch',   'SB-0001'),
    ('9781491950296', 'North Branch',   'NB-0002'),
    ('9781491950296', 'South Branch',   'SB-0002'),
    ('9780135957059', 'Central Library', 'CL-0003'),
    ('9780262033848', 'Central Library', 'CL-0004'),
    ('9780262033848', 'North Branch',   'NB-0003')
) AS v(isbn, branch_name, barcode)
JOIN books b ON b.isbn = v.isbn
JOIN branches br ON br.name = v.branch_name;

-- 6. Demo members
-- These placeholder hashes deliberately cannot authenticate.
-- Replace them with real Argon2 hashes before testing login.
INSERT INTO members (full_name, email, password_hash) VALUES
    ('Aarav Sharma', 'aarav@example.com', '!DISABLED_DEMO_ACCOUNT'),
    ('Priya Verma', 'priya@example.com', '!DISABLED_DEMO_ACCOUNT'),
    ('Rahul Singh', 'rahul@example.com', '!DISABLED_DEMO_ACCOUNT');

-- 7. Demo librarians
INSERT INTO staff (full_name, email, password_hash) VALUES
    ('Ananya Gupta', 'ananya.librarian@example.com',
     '!DISABLED_DEMO_ACCOUNT'),
    ('Vikram Mehta', 'vikram.librarian@example.com',
     '!DISABLED_DEMO_ACCOUNT');

COMMIT;

-- 1. Find all currently overdue loans
SELECT
    l.loan_id,
    m.full_name AS member_name,
    b.title AS book_title,
    br.name AS branch_name,
    l.due_date,
    CURRENT_DATE - l.due_date::date AS days_overdue
FROM loans AS l
JOIN members AS m ON m.member_id = l.member_id
JOIN book_copies AS bc ON bc.copy_id = l.copy_id
JOIN books AS b ON b.book_id = bc.book_id
JOIN branches AS br ON br.branch_id = bc.branch_id
WHERE l.returned_at IS NULL
  AND l.due_date < CURRENT_TIMESTAMP
ORDER BY l.due_date ASC;

-- 2. Find the most-borrowed books
SELECT
    b.book_id,
    b.title,
    COUNT(l.loan_id) AS borrow_count
FROM books AS b
JOIN book_copies AS bc ON bc.book_id = b.book_id
JOIN loans AS l ON l.copy_id = bc.copy_id
GROUP BY b.book_id, b.title
ORDER BY borrow_count DESC, b.title ASC
LIMIT 10;

-- 3. Count available physical copies by branch
SELECT
    br.branch_id,
    br.name AS branch_name,
    COUNT(bc.copy_id) AS available_copies
FROM branches AS br
LEFT JOIN book_copies AS bc
    ON bc.branch_id = br.branch_id
   AND bc.status = 'available'
GROUP BY br.branch_id, br.name
ORDER BY br.name;

-- 4. Calculate outstanding fines per member
SELECT
    m.member_id,
    m.full_name,
    SUM(f.amount - f.amount_paid) AS outstanding_amount
FROM members AS m
JOIN loans AS l ON l.member_id = m.member_id
JOIN fines AS f ON f.loan_id = l.loan_id
WHERE f.amount > f.amount_paid
GROUP BY m.member_id, m.full_name
ORDER BY outstanding_amount DESC;

INSERT INTO admins (name, email, phone, password, enabled)
SELECT COALESCE(name, email), email, phone, password, enabled
FROM users
WHERE role = 'ADMIN'
ON CONFLICT (email) DO NOTHING;

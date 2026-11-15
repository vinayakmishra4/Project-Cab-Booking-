CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL,
    idle_timeout_seconds INTEGER NOT NULL,
    absolute_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_email
    ON user_sessions(email);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expiry
    ON user_sessions(absolute_expires_at);
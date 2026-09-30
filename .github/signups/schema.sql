CREATE TABLE IF NOT EXISTS release_signups (
  app TEXT NOT NULL CHECK(app IN ('accessshield', 'storechronicle', 'warrantytracker')),
  email TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (app, email)
);
CREATE TABLE IF NOT EXISTS signup_limits (
  key TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  attempts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS signup_limits_day ON signup_limits(day);


CREATE TABLE IF NOT EXISTS scripts (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS licenses (
    license_key TEXT PRIMARY KEY,
    script_id TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY (script_id) REFERENCES scripts(id)
);

CREATE INDEX IF NOT EXISTS idx_licenses_script_id
ON licenses(script_id);

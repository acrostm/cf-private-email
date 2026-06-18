CREATE TABLE IF NOT EXISTS domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT NOT NULL UNIQUE,
  zone_id TEXT NOT NULL,
  receive_status TEXT NOT NULL CHECK (receive_status IN ('pending_onboarding', 'ready', 'disabled')),
  send_status TEXT NOT NULL CHECK (send_status IN ('pending_onboarding', 'ready', 'disabled')),
  routing_rule_id TEXT,
  sending_subdomain_id TEXT,
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS domains_single_default
  ON domains(is_default)
  WHERE is_default = 1;

CREATE TABLE IF NOT EXISTS aliases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_part TEXT NOT NULL,
  domain TEXT NOT NULL,
  full_address TEXT GENERATED ALWAYS AS (lower(local_part || '@' || domain)) STORED UNIQUE,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  source TEXT NOT NULL DEFAULT 'app' CHECK (source IN ('app', 'imported_cloudflare')),
  cloudflare_rule_id TEXT,
  forward_to TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (domain) REFERENCES domains(domain) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS aliases_domain_idx ON aliases(domain);
CREATE INDEX IF NOT EXISTS aliases_enabled_idx ON aliases(enabled);

CREATE TABLE IF NOT EXISTS audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'system',
  target TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO domains (domain, zone_id, receive_status, send_status, is_default, enabled)
VALUES
  ('jiachz.com', '4a6de0d966dd8a7674c8817c90b1702c', 'ready', 'ready', 1, 1),
  ('cozc.cc', 'e6c2138fea5757d665f99e60811525da', 'ready', 'pending_onboarding', 0, 1)
ON CONFLICT(domain) DO UPDATE SET
  zone_id = excluded.zone_id,
  receive_status = excluded.receive_status,
  send_status = excluded.send_status,
  is_default = excluded.is_default,
  enabled = excluded.enabled,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO aliases (local_part, domain, enabled, source, cloudflare_rule_id, forward_to)
VALUES
  ('cat', 'jiachz.com', 1, 'imported_cloudflare', NULL, 'gmail'),
  ('x', 'cozc.cc', 1, 'imported_cloudflare', NULL, 'gmail'),
  ('xx', 'cozc.cc', 1, 'imported_cloudflare', NULL, 'gmail'),
  ('spaceship', 'cozc.cc', 1, 'imported_cloudflare', NULL, 'gmail'),
  ('huob', 'cozc.cc', 0, 'imported_cloudflare', NULL, 'gmail')
ON CONFLICT(full_address) DO UPDATE SET
  enabled = excluded.enabled,
  source = excluded.source,
  forward_to = excluded.forward_to,
  updated_at = CURRENT_TIMESTAMP;

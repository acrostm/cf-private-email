import { AliasRecord, DomainRecord, fullAddress, normalizeLocalPart } from './domain-model';

export interface Database {
  prepare(query: string): D1PreparedStatement;
}

export async function listDomains(db: Database): Promise<DomainRecord[]> {
  const result = await db.prepare('SELECT * FROM domains WHERE enabled = 1 ORDER BY is_default DESC, domain ASC').all<DomainRecord>();
  return result.results ?? [];
}

export async function listAliases(db: Database, domain?: string): Promise<AliasRecord[]> {
  const statement = domain
    ? db.prepare('SELECT id, local_part, domain, full_address, enabled, source, forward_to FROM aliases WHERE domain = ? ORDER BY domain, local_part').bind(domain)
    : db.prepare('SELECT id, local_part, domain, full_address, enabled, source, forward_to FROM aliases ORDER BY domain, local_part');
  const result = await statement.all<AliasRecord>();
  return result.results ?? [];
}

export async function createAlias(db: Database, localPart: string, domain: string, forwardTo?: string): Promise<string> {
  const normalizedLocalPart = normalizeLocalPart(localPart);
  const normalizedDomain = domain.toLowerCase();
  const address = fullAddress(normalizedLocalPart, normalizedDomain);

  await db.prepare(
    `INSERT INTO aliases (local_part, domain, enabled, source, forward_to)
     SELECT ?, domain, 1, 'app', ? FROM domains WHERE domain = ? AND enabled = 1`,
  ).bind(normalizedLocalPart, forwardTo ?? null, normalizedDomain).run();

  await db.prepare(
    `INSERT INTO audit_events (event_type, actor, target, metadata)
     VALUES ('alias.created', 'api', ?, json_object('domain', ?, 'local_part', ?))`,
  ).bind(address, normalizedDomain, normalizedLocalPart).run();

  return address;
}

export async function findEnabledAlias(db: Database, address: string): Promise<AliasRecord | null> {
  const result = await db.prepare(
    `SELECT id, local_part, domain, full_address, enabled, source, forward_to
     FROM aliases WHERE full_address = lower(?) AND enabled = 1`,
  ).bind(address).first<AliasRecord>();
  return result ?? null;
}

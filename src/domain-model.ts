export type DomainStatus = 'pending_onboarding' | 'ready' | 'disabled';

export interface DomainRecord {
  domain: string;
  zone_id: string;
  receive_status: DomainStatus;
  send_status: DomainStatus;
  routing_rule_id: string | null;
  sending_subdomain_id: string | null;
  is_default: 0 | 1;
  enabled: 0 | 1;
}

export interface AliasRecord {
  id: number;
  local_part: string;
  domain: string;
  full_address: string;
  enabled: 0 | 1;
  source: 'app' | 'imported_cloudflare';
  forward_to: string | null;
}

export const SEEDED_DOMAINS = [
  {
    domain: 'jiachz.com',
    zone_id: '4a6de0d966dd8a7674c8817c90b1702c',
    receive_status: 'ready',
    send_status: 'ready',
    is_default: 1,
    enabled: 1,
  },
  {
    domain: 'cozc.cc',
    zone_id: 'e6c2138fea5757d665f99e60811525da',
    receive_status: 'ready',
    send_status: 'pending_onboarding',
    is_default: 0,
    enabled: 1,
  },
] as const;

export function capabilityBadge(domain: Pick<DomainRecord, 'receive_status' | 'send_status' | 'enabled'>): string {
  if (domain.receive_status === 'ready' && domain.send_status === 'ready') {
    return '可收发';
  }

  if (domain.receive_status === 'ready' && domain.send_status === 'pending_onboarding') {
    return '仅收信，发信待配置';
  }

  if (domain.enabled === 0) {
    return '已停用';
  }

  return '配置中';
}

export function normalizeLocalPart(localPart: string): string {
  const normalized = localPart.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{0,62}$/.test(normalized)) {
    throw new Error('Alias local part must start with a letter or number and contain only letters, numbers, dots, underscores, or hyphens.');
  }
  return normalized;
}

export function fullAddress(localPart: string, domain: string): string {
  return `${normalizeLocalPart(localPart)}@${domain.toLowerCase()}`;
}

# cf-private-email

Cloudflare Worker for privacy email aliases across multiple domains.

## Domains

The initial deployment is designed for two domains:

| Domain | Zone ID | Receive | Send | Badge |
| --- | --- | --- | --- | --- |
| `jiachz.com` | `4a6de0d966dd8a7674c8817c90b1702c` | ready | ready | 可收发 |
| `cozc.cc` | `e6c2138fea5757d665f99e60811525da` | ready | pending onboarding | 仅收信，发信待配置 |

## Setup

1. Apply `migrations/0001_domains_aliases.sql` to the D1 database.
2. Deploy the Worker as `privacy-alias-email`.
3. Point existing Cloudflare Email Routing literal rules and catch-all rules at the Worker after unknown-address rejection is deployed.
4. Onboard Email Sending for `cozc.cc`, then update `domains.send_status` to `ready` only after Cloudflare reports healthy `cf-bounce` MX/SPF/DKIM records.

## Development

```bash
npm install
npm test
npm run typecheck
```

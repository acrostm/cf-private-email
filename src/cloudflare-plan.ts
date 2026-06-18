export interface CloudflareDomainPlan {
  domain: string;
  zoneId: string;
  receiveStatus: 'ready' | 'pending_onboarding';
  sendStatus: 'ready' | 'pending_onboarding';
  routing: string[];
}

export const CLOUDFLARE_DOMAIN_PLANS: CloudflareDomainPlan[] = [
  {
    domain: 'jiachz.com',
    zoneId: '4a6de0d966dd8a7674c8817c90b1702c',
    receiveStatus: 'ready',
    sendStatus: 'ready',
    routing: [
      'Deploy Worker privacy-alias-email.',
      'Import cat@jiachz.com as an active alias.',
      'Update literal routing rules and catch-all to worker after unknown-address rejection is deployed.',
    ],
  },
  {
    domain: 'cozc.cc',
    zoneId: 'e6c2138fea5757d665f99e60811525da',
    receiveStatus: 'ready',
    sendStatus: 'pending_onboarding',
    routing: [
      'Import x@cozc.cc, xx@cozc.cc, and spaceship@cozc.cc as active aliases; import huob@cozc.cc disabled.',
      'Create Email Sending subdomain with POST /zones/e6c2138fea5757d665f99e60811525da/email/sending/subdomains and body { "name": "cozc.cc" }.',
      'Run Cloudflare DNS fix/status checks until cf-bounce MX/SPF/DKIM are healthy before marking send_status ready.',
    ],
  },
];

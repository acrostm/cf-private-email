import { capabilityBadge } from './domain-model';
import { createAlias, findEnabledAlias, listAliases, listDomains } from './repository';

export interface Env {
  DB: D1Database;
  DEFAULT_FORWARD_TO: string;
}

function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', ...init.headers },
  });
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === '/api/domains' && request.method === 'GET') {
    const domains = await listDomains(env.DB);
    return json(domains.map((domain) => ({ ...domain, capability_badge: capabilityBadge(domain) })));
  }

  if (url.pathname === '/api/aliases' && request.method === 'GET') {
    return json(await listAliases(env.DB, url.searchParams.get('domain') ?? undefined));
  }

  if (url.pathname === '/api/aliases' && request.method === 'POST') {
    const body = await request.json() as { local_part?: string; domain?: string; forward_to?: string };
    if (!body.local_part || !body.domain) {
      return json({ error: 'local_part and domain are required' }, { status: 400 });
    }
    const address = await createAlias(env.DB, body.local_part, body.domain, body.forward_to ?? (env.DEFAULT_FORWARD_TO || undefined));
    return json({ address }, { status: 201 });
  }

  return json({ error: 'Not found' }, { status: 404 });
}

function renderApp(): Response {
  return new Response(`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Privacy Alias Email</title>
  <style>
    body { font-family: Inter, system-ui, sans-serif; margin: 2rem; color: #172033; }
    label, input, select, button { font: inherit; }
    .badge { display: inline-block; border-radius: 999px; padding: .2rem .6rem; background: #eef4ff; color: #174ea6; }
    .grid { display: grid; gap: 1rem; max-width: 56rem; }
  </style>
</head>
<body>
  <main class="grid">
    <h1>双域名隐私邮箱别名</h1>
    <p>支持 jiachz.com 与 cozc.cc；域名能力会显示“可收发”或“仅收信，发信待配置”。</p>
    <form id="alias-form">
      <input name="local_part" placeholder="alias" required /> @
      <select name="domain" id="domain-select"></select>
      <button>创建别名</button>
    </form>
    <section><h2>域名状态</h2><div id="domains"></div></section>
    <section><h2>别名</h2><div id="aliases"></div></section>
  </main>
  <script>
    async function refresh() {
      const domains = await fetch('/api/domains').then(r => r.json());
      document.querySelector('#domain-select').innerHTML = domains.map(d => '<option value="'+d.domain+'">'+d.domain+'</option>').join('');
      document.querySelector('#domains').innerHTML = domains.map(d => '<p><strong>'+d.domain+'</strong> <span class="badge">'+d.capability_badge+'</span></p>').join('');
      const aliases = await fetch('/api/aliases').then(r => r.json());
      document.querySelector('#aliases').innerHTML = aliases.map(a => '<p>'+a.full_address+' — '+(a.enabled ? 'active' : 'disabled')+'</p>').join('');
    }
    document.querySelector('#alias-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      await fetch('/api/aliases', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(Object.fromEntries(new FormData(event.target))) });
      event.target.reset();
      refresh();
    });
    refresh();
  </script>
</body>
</html>`, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

export default {
  fetch(request: Request, env: Env): Promise<Response> | Response {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handleApi(request, env);
    return renderApp();
  },

  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    const alias = await findEnabledAlias(env.DB, message.to);
    if (!alias) {
      message.setReject(`Unknown alias: ${message.to}`);
      return;
    }
    await message.forward(alias.forward_to || env.DEFAULT_FORWARD_TO);
  },
};

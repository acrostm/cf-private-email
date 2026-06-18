import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(new URL('../migrations/0001_domains_aliases.sql', import.meta.url), 'utf8');
const model = readFileSync(new URL('../src/domain-model.ts', import.meta.url), 'utf8');

test('migration creates multi-domain tables and seeds planned domains', () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS domains/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS aliases/);
  assert.match(migration, /'jiachz\.com', '4a6de0d966dd8a7674c8817c90b1702c', 'ready', 'ready'/);
  assert.match(migration, /'cozc\.cc', 'e6c2138fea5757d665f99e60811525da', 'ready', 'pending_onboarding'/);
});

test('domain model exposes expected Chinese capability badges', () => {
  assert.match(model, /可收发/);
  assert.match(model, /仅收信，发信待配置/);
});

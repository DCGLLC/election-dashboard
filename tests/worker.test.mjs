import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker.mjs';

test('worker rejects writes to its read-only source endpoint', async () => {
  const result = await worker.fetch(new Request('https://example.com/api/sources', {method: 'POST'}), {});
  assert.equal(result.status, 405);
  assert.equal(result.headers.get('Allow'), 'GET');
});

test('worker delegates pages to Cloudflare static assets', async () => {
  const result = await worker.fetch(new Request('https://example.com/'), {
    ASSETS: {fetch: () => new Response('dashboard')}
  });
  assert.equal(await result.text(), 'dashboard');
});

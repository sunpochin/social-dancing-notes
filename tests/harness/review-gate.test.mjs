/**
 * 檔案用途：驗證真正 workflow 的分頁與 head 檢查，不複製另一份判斷邏輯。
 * 所在層：tests/harness；只用 stub，不送出 GitHub 請求。
 * 主要關聯：.github/workflows/review-thread-gate.yml。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const workflow = readFileSync(new URL('../../.github/workflows/review-thread-gate.yml', import.meta.url), 'utf8');
const script = workflow.split('          script: |\n')[1];
if (!script) throw new Error('Workflow script missing');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const execute = new AsyncFunction('github', 'core', 'context', script);
async function check(pages, head = 'fixture') {
  const calls = [], failures = [];
  const github = { graphql: async (query, variables) => {
    calls.push({ query, variables });
    return { repository: { pullRequest: {
      headRefOid: 'fixture', reviewThreads: { nodes: pages[calls.length - 1],
        pageInfo: { hasNextPage: calls.length < pages.length, endCursor: `page-${calls.length}` } },
    } } };
  } };
  await execute(github, { info() {}, setFailed(message) { failures.push(message); } }, {
    repo: { owner: 'fixture', repo: 'fixture' }, payload: { pull_request: { number: 1, head: { sha: head } } },
  });
  return { calls, failures };
}
test('unresolved second page fails without mutations', async () => {
  const { calls, failures } = await check([[{ isResolved: true }], [{ isResolved: false }]]);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].variables.cursor, 'page-1');
  assert.ok(calls.every(call => !call.query.includes('mutation')));
  assert.deepEqual(failures, ['1 unresolved review thread(s).']);
});
test('fully resolved pages pass', async () => {
  assert.deepEqual((await check([[{ isResolved: true }], []])).failures, []);
});
test('old head and malformed manual PR fail', async () => {
  await assert.rejects(check([[]], 'old'), /PR head changed/);
  await assert.rejects(execute({}, {}, { payload: {} }), /Invalid PR number/);
});

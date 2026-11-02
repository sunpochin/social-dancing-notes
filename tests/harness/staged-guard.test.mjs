/**
 * 檔案用途：以真實隔離 Git index／HEAD 驗證提交防線。
 * 所在層：tests/harness；不讀憑證、不使用網路。
 * 主要關聯：scripts/check-staged.mjs、.githooks/pre-commit。
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { contentProblem, inspectGit } from '../../scripts/check-staged.mjs';

function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'notes-harness-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  git('init', '-b', 'codex/fixture');
  git('config', 'user.name', 'Fixture');
  git('config', 'user.email', 'fixture@example.com');
  git('config', 'commit.gpgsign', 'false');
  // 為什麼用空 hook：開發者的全域設定不能污染隔離測試。
  git('config', 'core.hooksPath', join(cwd, 'no-hooks'));
  const stage = (name, text) => { writeFileSync(join(cwd, name), text); git('add', '-f', '--', name); };
  stage('README.md', 'fixture');
  git('commit', '-m', 'test: fixture');
  return { cwd, git, stage };
}
test('clean branch and placeholder example pass', t => {
  const repo = fixture(t);
  repo.stage('.env.example', 'API_KEY=replace-me');
  assert.deepEqual(inspectGit({ cwd: repo.cwd, commit: true }), []);
});
test('main, staging and detached commits fail', t => {
  const repo = fixture(t);
  for (const branch of ['main', 'staging']) {
    repo.git('checkout', '-b', branch);
    assert.ok(inspectGit({ cwd: repo.cwd, commit: true }).includes('commit requires a task branch'));
  }
  repo.git('checkout', '--detach');
  assert.ok(inspectGit({ cwd: repo.cwd, commit: true }).includes('commit requires a task branch'));
});
test('protected paths and OAuth files fail', t => {
  const repo = fixture(t);
  repo.stage('.env.local', 'fixture');
  assert.deepEqual(inspectGit({ cwd: repo.cwd }), ['.env.local: protected file']);
  for (const path of ['config/.env.production', 'spotify_tokens.json', 'private.key', '.serena/project.yml', 'data/lyrics-vault/song.md']) {
    assert.equal(contentProblem(path, ''), 'protected file');
  }
});
test('staged blob is scanned even if working file is cleaned; report never prints token', t => {
  const repo = fixture(t);
  const fake = ['ghp_', 'x'.repeat(36)].join('');
  repo.stage('example.txt', fake);
  writeFileSync(join(repo.cwd, 'example.txt'), 'clean');
  assert.deepEqual(inspectGit({ cwd: repo.cwd }), ['example.txt: possible secret']);
  assert.ok(!inspectGit({ cwd: repo.cwd }).join().includes(fake));
});
test('HEAD scan ignores untracked credentials and allows protected file deletion', t => {
  const repo = fixture(t);
  repo.stage('example.txt', ['AKIA', 'X'.repeat(16)].join(''));
  repo.git('commit', '-m', 'test: fixture');
  writeFileSync(join(repo.cwd, '.env.local'), 'fixture');
  assert.deepEqual(inspectGit({ cwd: repo.cwd, tracked: true }), ['example.txt: possible secret']);
  repo.git('add', '-f', '.env.local');
  repo.git('commit', '-m', 'test: fixture');
  repo.git('rm', '.env.local');
  assert.deepEqual(inspectGit({ cwd: repo.cwd }), []);
});
test('gitlink belongs to a separately verified child repository', t => {
  const repo = fixture(t);
  const sha = repo.git('rev-parse', 'HEAD').trim();
  repo.git('update-index', '--add', '--cacheinfo', `160000,${sha},child`);
  assert.deepEqual(inspectGit({ cwd: repo.cwd, commit: true }), []);
  repo.git('commit', '-m', 'test: gitlink fixture');
  assert.deepEqual(inspectGit({ cwd: repo.cwd, tracked: true }), []);
});

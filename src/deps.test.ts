import deepmerge from 'deepmerge';
import { describe, expect, it } from 'vitest';

/** ビルドで使う deepmerge は、CVE-2026-93753 の修正を当てた写し（vendor/deepmerge）に差し替えている。 */
describe('deepmerge（修正を当てた写し）', () => {
  const evil = (): Record<string, unknown> => JSON.parse('{"__proto__":{"polluted":"yes"},"nested":{"__proto__":{"polluted":"yes"}},"ok":1}');
  const protoOf = (v: unknown): unknown => Object.getPrototypeOf(v);

  it('プロトタイプを持たない相手に混ぜても、結果のプロトタイプは差し替わらない', () => {
    const r = deepmerge(Object.create(null) as Record<string, unknown>, evil()) as Record<string, unknown>;
    expect(protoOf(r)).toBe(Object.prototype);
    expect(r.polluted).toBeUndefined();
    expect(r.ok).toBe(1);
  });

  it('入れ子でも差し替わらない', () => {
    const r = deepmerge({ nested: Object.create(null) as Record<string, unknown> }, evil()) as { nested: Record<string, unknown> };
    expect(r.nested.polluted).toBeUndefined();
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('ふつうの深い結合はこれまでどおり', () => {
    expect(deepmerge({ a: { b: 1 }, l: [1] }, { a: { c: 2 }, l: [2] })).toEqual({ a: { b: 1, c: 2 }, l: [1, 2] });
  });
});

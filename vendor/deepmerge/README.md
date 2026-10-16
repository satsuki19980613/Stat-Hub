# deepmerge（修正を当てた写し）

[deepmerge](https://github.com/TehShrike/deepmerge) 4.3.1（MIT。`license.txt`）の `dist/cjs.js` に、
[CVE-2026-93753](https://nvd.nist.gov/vuln/detail/CVE-2026-93753)（`mergeObject` のプロトタイプ汚染）の修正だけを当てたもの。
`__proto__`・`constructor`・`prototype` のキーを写さない（`keyIsForbidden`）。

- 使っているのはビルドのときだけ：`vite-plugin-pwa` → `workbox-build` → `@rollup/plugin-node-resolve` → `deepmerge`。アプリには入らない
- 本家にも、これを使うパッケージにも修正版がまだ無いため、ルートの `package.json` の `overrides` でこの写しに差し替えている
- 本家に修正版が出たら、`overrides` とこのディレクトリを消して `npm install` し直す
- 修正の確認：`src/deps.test.ts`

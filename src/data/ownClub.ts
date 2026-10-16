/**
 * 自分のクラブの名前（メンバー画面で利用者が入力する。'' は入力していない）。端末に保存する。
 * クラブ順位に同じ名前があれば、スタッツのクラブ順位のグラフで公式の累計を使う（src/screens/ClubPanel.tsx）。
 */

import { DEMO } from '../clock';
import { DEMO_OWN_CLUB } from '../demo/ownClub';

const OWN_KEY = 'sh-own-club';

export function readOwnClub(): string {
  try {
    const v = localStorage.getItem(OWN_KEY);
    if (v !== null) return v;
  } catch {
    /* noop */
  }
  return DEMO ? DEMO_OWN_CLUB : '';
}

export function saveOwnClub(name: string): void {
  try {
    localStorage.setItem(OWN_KEY, name);
  } catch {
    /* noop */
  }
}

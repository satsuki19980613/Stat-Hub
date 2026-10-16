/**
 * 自分のクラブの名前（メンバー画面で利用者が入力する。'' は入力していない）。記録と同じく IndexedDB の meta に保存する。
 * クラブ順位に同じ名前があれば、スタッツのクラブ順位のグラフで公式の累計を使う（src/screens/ClubPanel.tsx）。
 */

import { DEMO } from '../clock';
import { DEMO_OWN_CLUB } from '../demo/ownClub';
import { getMeta, setMeta } from './store';

const META_KEY = 'ownClub';
/** 前の版が localStorage に置いていたキー。読み込むときに meta へ移して消す。 */
const LEGACY_KEY = 'sh-own-club';
export const OWN_CLUB_MAX = 40;

/** 保存する形に整える（制御文字を除き、前後の空白を落として 40 文字まで）。 */
export function cleanClubName(raw: string): string {
  return raw.replace(/[\p{Cc}\p{Cf}]/gu, '').trim().slice(0, OWN_CLUB_MAX);
}

function takeLegacy(): string | null {
  try {
    const v = localStorage.getItem(LEGACY_KEY);
    localStorage.removeItem(LEGACY_KEY);
    return v;
  } catch {
    return null;
  }
}

export async function loadOwnClub(): Promise<string> {
  try {
    const v = await getMeta<unknown>(META_KEY);
    if (typeof v === 'string') return v;
    const legacy = takeLegacy();
    if (legacy !== null) {
      const name = cleanClubName(legacy);
      await setMeta(META_KEY, name);
      return name;
    }
  } catch {
    /* 保存が使えない環境（デモのプレビュー等）：未登録として扱う */
  }
  return DEMO ? DEMO_OWN_CLUB : '';
}

export async function saveOwnClub(name: string): Promise<void> {
  await setMeta(META_KEY, cleanClubName(name));
}

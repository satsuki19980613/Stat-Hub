import { describe, expect, it } from 'vitest';
import { OWN_CLUB_MAX, cleanClubName } from './ownClub';

describe('自分のクラブの名前', () => {
  it('前後の空白と制御文字を除き、記号などはそのまま残す', () => {
    expect(cleanClubName('  【γ】 ')).toBe('【γ】');
    expect(cleanClubName('Close it\u0000 にーなな★\n')).toBe('Close it にーなな★');
    expect(cleanClubName('a​b')).toBe('ab');
  });

  it(`${OWN_CLUB_MAX} 文字まで`, () => {
    expect(cleanClubName('あ'.repeat(OWN_CLUB_MAX + 5))).toHaveLength(OWN_CLUB_MAX);
  });
});

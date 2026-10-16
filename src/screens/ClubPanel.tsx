import { useEffect, useState } from 'react';
import { LineChart, type LineSeries } from '../components/charts';
import { ScrollBox } from '../components/ScrollBox';
import { InfoButton, InfoList } from '../components/ui';
import type { ClubState } from '../data/clubData';
import { clubSeries, latestRound, ownSeries, topAverage, type ClubEntry, type ClubRound } from '../domain/clubRanking';
import type { AppData } from '../domain/model';
import { clubAppTotals, clubAxisLabels, clubAxisLength } from '../domain/views';

const PICK_KEY = 'sh-club-pick';
/** 自分のクラブを選んでいないときの線の名前。 */
const OWN_LABEL = '自クラブ';

function readPick(): string {
  try {
    return localStorage.getItem(PICK_KEY) ?? '';
  } catch {
    return '';
  }
}

function fmtAt(ms: number): string {
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const fmtTotal = (v: number): string => String(Math.round(v));

function fmtGain(v: number | null): string {
  if (v == null) return '—';
  if (v > 0) return `+${v}`;
  if (v < 0) return `−${-v}`;
  return '±0';
}

/** 節の得点のクラス（圏外から入ったものは薄く）。 */
function gainClass(v: number | null): string {
  if (v == null) return 'muted';
  if (v > 0) return 'gain';
  if (v < 0) return 'loss';
  return '';
}

/** 前の節からの動き。圏外から入ったクラブは new（第 1 節は比べる節が無いので空）。 */
function moveMark(c: ClubEntry, round: number): string {
  if (c.prev == null) return round > 1 ? 'new' : '';
  if (c.prev > c.rank) return '↑';
  if (c.prev < c.rank) return '↓';
  return '';
}

/** 凡例に添える自分のクラブの順位（入力していなければ、記録の合計であること）。 */
function ownRankText(ownName: string, latest: ClubRound | null, ownNow: ClubEntry | null): string {
  if (ownName === '') return '（記録の合計）';
  if (!latest) return '';
  return ownNow ? ` ${ownNow.rank}位` : ' 圏外';
}

/** 下の一行（読み込み状況・何節までか）。 */
function hintText(club: ClubState, latest: ClubRound | null, season: number): string {
  if (!club.data) return club.error ? `クラブ順位を読み込めませんでした（${club.error}）` : 'クラブ順位はまだ読み込まれていません';
  if (!latest) return `S${season} の順位はまだありません`;
  return `第${latest.round}節まで`;
}

/** 端末に保存してよい値に限る（'' か、いまの一覧にあるクラブ名）。一覧に無いときは undefined で、保存しない。 */
function storablePick(pick: string, picked: ClubEntry | null): string | undefined {
  if (pick === '') return '';
  return picked?.name;
}

/** 順位表の 1 行。自分のクラブの行も他のクラブと同じ見た目（強調も貼りつきもしない）で、押せないだけ。選んだクラブの行をもう一度押すと外れる。 */
function ClubRow(props: Readonly<{ c: ClubEntry; round: number; isOwn: boolean; isPick: boolean; onPick: (name: string) => void }>): JSX.Element {
  const { c, round, isOwn, isPick } = props;
  let cls: string | undefined;
  if (!isOwn) cls = isPick ? 'clk pick-row' : 'clk';
  return (
    <tr className={cls} onClick={isOwn ? undefined : () => props.onPick(isPick ? '' : c.name)}>
      <td>
        {c.rank}
        <span className="mv">{moveMark(c, round)}</span>
      </td>
      <td className="nm">{c.name}</td>
      <td>{c.total}</td>
      <td className={gainClass(c.gain)} title={c.gain == null ? '圏外から入ったクラブ（得点はポストに無い）' : undefined}>
        {fmtGain(c.gain)}
      </td>
    </tr>
  );
}

/**
 * クラブ順位（上位 30）との比較。メンバーのグラフとは別のパネルにして、単位（クラブの累計）を混ぜない。
 * 線は 3 本まで: 自分のクラブ（オレンジ）・選んだクラブ（青）・上位 30 平均（点線）。比べるクラブは右上のプルダウンで選ぶ。
 * 自分のクラブはメンバー画面で名前を登録する。順位表に同じ名前があればその節は公式の値、
 * 無い節と、登録していないときは、このアプリで記録した合計で線を引く。
 */
export function ClubPanel(
  props: Readonly<{ data: AppData; club: ClubState; season: number; today: string; ownClub: string; onRegisterClub: () => void }>,
): JSX.Element {
  const { data, club, season, today, ownClub } = props;
  const ownName = ownClub.trim();
  const [pick, setPick] = useState(readPick);

  const cd = club.data;
  const latest = cd ? latestRound(cd, season) : null;
  const n = clubAxisLength(data, season, today, latest?.round ?? 0);
  const labels = clubAxisLabels(data, season, n);
  const app = clubAppTotals(data, season, n, today);
  const own = cd ? ownSeries(cd, season, ownName, app) : { values: app, official: app.map(() => false) };
  const others = (latest?.clubs ?? []).filter((c) => c.name !== ownName);
  const picked = others.find((c) => c.name === pick) ?? null;
  const ownNow = ownName === '' ? null : (latest?.clubs.find((c) => c.name === ownName) ?? null);
  const ownLabel = ownName || OWN_LABEL;
  // 一覧にあるクラブ名だけを保存する（まだ読み込み前などで一覧に無いときは、保存済みの値をそのまま残す）。
  const stored = storablePick(pick, picked);
  useEffect(() => {
    if (stored === undefined) return;
    try {
      localStorage.setItem(PICK_KEY, stored);
    } catch {
      /* noop */
    }
  }, [stored]);

  const series: LineSeries[] = [{ id: 'own', name: ownLabel, values: own.values, slot: 0, tone: 'own' }];
  if (picked && cd) series.push({ id: 'pick', name: picked.name, values: clubSeries(cd, season, picked.name, n), slot: 0 });
  const avg = cd && latest ? topAverage(cd, season, n) : undefined;

  return (
    <section className="panel club">
      <div className="panel-h">
        <span className="pt">
          <b>クラブ順位 · 上位30</b>
          <InfoButton title="クラブ順位 · 上位30">
            <p>クラブマッチの上位 30 クラブの累計ポイントです。X の @c0pmvd さんが毎節ポストしている集計を取り込んでいます。</p>
            <InfoList
              items={[
                ['自クラブ', 'メンバー画面の「自分のクラブ」で登録したクラブ。上位 30 に入った節は公式の値、圏外の節はこのアプリで記録したポイントの合計です。登録するまでは、すべて記録の合計で線を引きます。'],
                ['選んだクラブ', '右上のプルダウンか、表の行を押して選びます。もう一度押すと外れます。'],
                ['破線', '上位 30 クラブの累計の平均。'],
                ['表', '最新の節の順位。↑↓ は前の節からの上がり下がり、new は圏外から入ったクラブ。「—」は圏外から入ったため、その節の得点がポストに無いものです。'],
              ]}
            />
            <p>ネットにつながったとき（起動時・画面に戻ったとき）に自動で読み込み、オフラインのときは前回の内容を出します。</p>
          </InfoButton>
        </span>
        <label className="club-pick">
          <span className="sr">比べるクラブ</span>
          <select value={picked?.name ?? ''} onChange={(e) => setPick(e.target.value)} disabled={others.length === 0}>
            <option value="">比べるクラブ</option>
            {others.map((c) => (
              <option key={c.name} value={c.name}>
                {c.rank}位 {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <LineChart
        labels={labels}
        series={series}
        average={avg}
        averageLabel={{ name: '上位30平均', short: '上位平均' }}
        format={fmtTotal}
        zero
        ariaLabel={`S${season} のクラブ累計ポイント（自クラブと上位30クラブ）`}
        empty="まだ記録がありません"
      />
      <div className="club-legend">
        <span className="own">
          <i className="key" />
          {ownLabel}
          <span className="muted">{ownRankText(ownName, latest, ownNow)}</span>
        </span>
        {picked && (
          <span className="s1">
            <i className="key" />
            {picked.name}
          </span>
        )}
        {avg && (
          <span className="avg legend-avg">
            <i className="key" />上位30平均
          </span>
        )}
      </div>
      {ownName === '' && (
        <p className="hint own-hint">
          <span>自分のクラブの名前を登録すると、順位表の公式の累計で線を引きます。</span>
          <button type="button" className="lnk" onClick={props.onRegisterClub}>
            メンバー画面で登録
          </button>
        </p>
      )}

      {latest && (
        <ScrollBox className="tbl-scroll fixed club-tbl">
          <table className="tbl stats">
            <thead>
              <tr>
                <th>順位</th>
                <th className="nm">クラブ</th>
                <th>累計</th>
                <th>第{latest.round}節</th>
              </tr>
            </thead>
            <tbody>
              {latest.clubs.map((c) => (
                <ClubRow key={c.name} c={c} round={latest.round} isOwn={c.name === ownName} isPick={c.name === picked?.name} onPick={setPick} />
              ))}
            </tbody>
          </table>
        </ScrollBox>
      )}
      <p className="hint">
        {hintText(club, latest, season)}
        {club.checkedAt != null && cd && <span className="nw muted"> · 確認 {fmtAt(club.checkedAt)}</span>}
      </p>
    </section>
  );
}

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useBackLayer } from './BackLayer';

/** アプリのマーク（アプリアイコンの棒グラフと同じ形。色は PrivateMatch の YOU の青と相手のオレンジ）。 */
export function StatMark(): JSX.Element {
  return (
    <svg viewBox="16 18 68 64" aria-hidden="true">
      <defs>
        <linearGradient id="sh-mb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7DB4CF" />
          <stop offset="1" stopColor="#336B87" />
        </linearGradient>
        <linearGradient id="sh-mo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF9566" />
          <stop offset="1" stopColor="#FE7A47" />
        </linearGradient>
      </defs>
      <rect x="20" y="52" width="16" height="26" fill="url(#sh-mb)" />
      <rect x="42" y="38" width="16" height="40" fill="url(#sh-mb)" />
      <rect x="64" y="22" width="16" height="56" fill="url(#sh-mo)" />
    </svg>
  );
}

export function SunIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </svg>
  );
}

/** 読み込み中の四角いドット。 */
export function Dots(): JSX.Element {
  return (
    <span className="dots" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

/** ← BACK（pane 左上の戻る）。 */
export function Back(props: Readonly<{ label?: string; onClick: () => void }>): JSX.Element {
  return (
    <button type="button" className="back" onClick={props.onClick}>
      ← {props.label ?? 'BACK'}
    </button>
  );
}

/** pane の見出し（eyebrow のタグを和文タイトルの箱に乗せる + 右端の操作）。 */
export function PaneHead(props: Readonly<{ eyebrow: string; title: string; children?: ReactNode }>): JSX.Element {
  return (
    <div className="pane-h">
      <span className="ph-t">
        <span className="eyebrow">{props.eyebrow}</span>
        <b>{props.title}</b>
      </span>
      {props.children && <span className="acts">{props.children}</span>}
    </div>
  );
}

/**
 * ガラスのモーダル（`<dialog>` を showModal で最前面へ）。開いている間だけマウントする前提。
 * Esc はブラウザの cancel（最前面の dialog だけに届く）で、端末の戻るは backLayers で閉じる。
 * 背景（::backdrop）のタップでも閉じる。これはマウス・タッチ向けの近道で、キーボードでは
 * Esc と × ボタンが同じ役目を持つ。
 */
export function Modal(props: Readonly<{
  eyebrow: string;
  title: string;
  onClose: () => void;
  size?: 'sm' | 'wide' | 'guide';
  /** 見出し下の操作（元画像ボタン等）。 */
  headActions?: ReactNode;
  foot?: ReactNode;
  children: ReactNode;
}>): JSX.Element {
  const ref = useRef<HTMLDialogElement>(null);
  const latestClose = useRef(props.onClose);
  latestClose.current = props.onClose;
  useBackLayer(props.onClose);

  useEffect(() => {
    const d = ref.current;
    if (!d) return undefined;
    if (!d.open) d.showModal();
    // 背景のタップ（クリックの的が dialog 自身 = 中身の .dlg の外側）で閉じる。
    const onBackdrop = (e: MouseEvent): void => {
      if (e.target === d) latestClose.current();
    };
    d.addEventListener('click', onBackdrop);
    return () => d.removeEventListener('click', onBackdrop);
  }, []);

  const sizeClass = props.size ? ` ${props.size}` : '';

  return (
    <dialog
      ref={ref}
      className={`glass-dlg${sizeClass}`}
      aria-label={props.title}
      onCancel={(e) => {
        e.preventDefault();
        props.onClose();
      }}
    >
      <div className="dlg">
        <div className="gd-head">
          <span className="eyebrow">{props.eyebrow}</span>
          <h2>{props.title}</h2>
          {props.headActions && <div className="acts">{props.headActions}</div>}
          <button type="button" className="x" aria-label="閉じる" onClick={props.onClose} />
        </div>
        <div className="gd-scroll">{props.children}</div>
        {props.foot && <div className="gd-foot">{props.foot}</div>}
      </div>
    </dialog>
  );
}

/** 確認ダイアログ（削除など）。 */
export function ConfirmDialog(props: Readonly<{
  eyebrow: string;
  title: string;
  body?: string;
  okLabel: string;
  danger?: boolean;
  onOk: () => void;
  onClose: () => void;
}>): JSX.Element {
  return (
    <Modal
      eyebrow={props.eyebrow}
      title={props.title}
      size="sm"
      onClose={props.onClose}
      foot={
        <div className="btns">
          <button type="button" className="btn ghost" onClick={props.onClose}>
            キャンセル
          </button>
          <button
            type="button"
            className={`btn ${props.danger ? 'danger' : 'primary'}`}
            onClick={() => {
              props.onOk();
              props.onClose();
            }}
          >
            {props.okLabel}
          </button>
        </div>
      }
    >
      {props.body && <p>{props.body}</p>}
    </Modal>
  );
}

/**
 * インフォメーションマーク。画面に小さな説明文を並べる代わりに、押すと説明のモーダルを開く。
 * 中身は短い段落・用語と意味の組（InfoList）で、読みやすく書く。
 */
export function InfoButton(props: Readonly<{ title: string; children: ReactNode }>): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="info-btn"
        aria-label={`${props.title}の説明`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="8.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="10" cy="6.2" r="1.25" fill="currentColor" />
          <path d="M10 9v5.6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <Modal eyebrow="INFO" title={props.title} size="sm" onClose={() => setOpen(false)}>
          <div className="info">{props.children}</div>
        </Modal>
      )}
    </>
  );
}

/** 説明モーダルの中の「用語 — 意味」の並び。用語は 1 つのリストの中で重ならない（キーに使う）。 */
export function InfoList(props: Readonly<{ items: readonly (readonly [string, ReactNode])[] }>): JSX.Element {
  return (
    <dl className="info-dl">
      {props.items.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* 表示テーマ（ライト／ダーク）。右上のボタンで選んだものを覚えていればそれに、無ければ端末の設定に従う（src/style.css）。 */
try{const t=localStorage.getItem('sh-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch{/* localStorage が使えない：端末の設定のまま */}

import { useState, useEffect, useCallback } from "react";

// ─── PERSISTENCIA LOCAL ───────────────────────────────────────────────────────
function usePersisted(key, fallback) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; }
    catch { return fallback; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key, val]);
  return [val, setVal];
}

// ─── PALETA ───────────────────────────────────────────────────────────────────
const C = {
  tierra:"#6B4226", barro:"#8B5E3C", paja:"#D4A85A", crema:"#F5EDD6",
  hierba:"#4A7C4E", pasto:"#6BAF6E", cielo:"#7BAFD4", sombra:"#2C1A0E",
  hueso:"#EDE0C4", rojo:"#B03A2E", amarillo:"#E8C547",
};

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lora:ital,wght@0,400;0,600;1,400&family=Roboto+Slab:wght@300;400;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${C.crema};font-family:'Lora',Georgia,serif;color:${C.sombra};min-height:100vh;}
  .app-bg{
    background:radial-gradient(ellipse at 10% 20%,rgba(107,66,38,.08) 0%,transparent 60%),
    radial-gradient(ellipse at 90% 80%,rgba(74,124,78,.10) 0%,transparent 60%),
    repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(107,66,38,.04) 39px,rgba(107,66,38,.04) 40px),
    ${C.crema};min-height:100vh;
  }
  .header{background:linear-gradient(135deg,${C.sombra} 0%,${C.tierra} 60%,${C.barro} 100%);box-shadow:0 4px 20px rgba(44,26,14,.4);position:relative;overflow:hidden;}
  .header::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(45deg,transparent,transparent 20px,rgba(255,255,255,.02) 20px,rgba(255,255,255,.02) 21px);}
  .header-inner{max-width:1280px;margin:0 auto;padding:env(safe-area-inset-top,16px) 24px 16px;display:flex;align-items:center;gap:14px;position:relative;z-index:1;}
  .header-icon{font-size:36px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5));}
  .header-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:900;color:${C.paja};letter-spacing:1px;text-shadow:0 2px 8px rgba(0,0,0,.5);line-height:1.1;}
  .header-sub{font-family:'Lora',serif;font-style:italic;font-size:11px;color:rgba(212,168,90,.7);margin-top:2px;}
  .header-stats{margin-left:auto;display:flex;gap:16px;}
  .hstat{text-align:center;}
  .hstat-num{font-family:'Playfair Display',serif;font-size:19px;font-weight:700;color:${C.paja};}
  .hstat-lbl{font-size:9px;color:rgba(212,168,90,.6);text-transform:uppercase;letter-spacing:1px;}
  /* SYNC BANNER */
  .sync-banner{background:rgba(74,124,78,.15);border-bottom:1px solid rgba(74,124,78,.3);padding:6px 20px;font-size:11.5px;color:#2d5c30;display:flex;align-items:center;gap:8px;font-family:'Roboto Slab',serif;}
  .sync-banner.offline{background:rgba(232,197,71,.15);border-bottom-color:rgba(232,197,71,.4);color:#7a5c00;}
  .sync-banner.syncing{background:rgba(123,175,212,.15);border-bottom-color:rgba(123,175,212,.4);color:#1a5070;}
  /* NAV BOTTOM (iPhone style) */
  .nav-bottom{
    position:fixed;bottom:0;left:0;right:0;
    background:${C.tierra};
    border-top:2px solid ${C.paja};
    display:flex;
    padding-bottom:env(safe-area-inset-bottom,0px);
    z-index:100;
    box-shadow:0 -4px 20px rgba(44,26,14,.3);
  }
  .nav-btn{flex:1;background:none;border:none;padding:8px 4px 6px;cursor:pointer;font-family:'Roboto Slab',serif;font-size:9px;font-weight:400;color:rgba(245,237,214,.55);display:flex;flex-direction:column;align-items:center;gap:3px;transition:all .2s;min-width:0;}
  .nav-btn .nav-icon{font-size:20px;line-height:1;}
  .nav-btn:hover{color:${C.crema};}
  .nav-btn.active{color:${C.paja};font-weight:700;}
  .nav-btn.active .nav-icon{transform:scale(1.15);}
  /* MAIN with bottom nav padding */
  .main{max-width:1280px;margin:0 auto;padding:20px 14px 90px;}
  .card{background:linear-gradient(145deg,#fffdf5,${C.hueso});border:1px solid rgba(107,66,38,.18);border-radius:10px;box-shadow:0 2px 12px rgba(44,26,14,.10),inset 0 1px 0 rgba(255,255,255,.8);padding:16px;margin-bottom:16px;}
  .card-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:${C.tierra};margin-bottom:12px;padding-bottom:9px;border-bottom:2px solid rgba(107,66,38,.12);display:flex;align-items:center;gap:7px;flex-wrap:wrap;}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:11px;}
  .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
  @media(max-width:600px){.grid3,.grid4{grid-template-columns:1fr 1fr;}.header-stats{display:none;}}
  @media(max-width:400px){.grid2{grid-template-columns:1fr;}}
  .statbox{background:linear-gradient(135deg,${C.tierra},${C.barro});border-radius:10px;padding:13px 14px;color:${C.crema};box-shadow:0 3px 10px rgba(44,26,14,.25);position:relative;overflow:hidden;}
  .statbox::after{content:attr(data-icon);position:absolute;right:7px;bottom:-4px;font-size:34px;opacity:.18;}
  .statbox.verde{background:linear-gradient(135deg,${C.hierba},${C.pasto});}
  .statbox.cielo{background:linear-gradient(135deg,#3a7abf,${C.cielo});}
  .statbox.rojo{background:linear-gradient(135deg,${C.rojo},#d45a4e);}
  .statbox.paja{background:linear-gradient(135deg,#b8862a,${C.paja});color:${C.sombra};}
  .statbox.gris{background:linear-gradient(135deg,#666,#888);}
  .statbox-num{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;line-height:1;}
  .statbox-lbl{font-size:10.5px;opacity:.8;margin-top:3px;font-family:'Roboto Slab',serif;letter-spacing:.5px;}
  .statbox-sub{font-size:9.5px;opacity:.65;margin-top:2px;}
  .tbl-wrap{overflow-x:auto;border-radius:8px;border:1px solid rgba(107,66,38,.15);-webkit-overflow-scrolling:touch;}
  table{width:100%;border-collapse:collapse;font-size:12px;}
  th{background:linear-gradient(135deg,${C.tierra},${C.barro});color:${C.paja};padding:8px 10px;text-align:left;font-family:'Roboto Slab',serif;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;}
  td{padding:7px 10px;border-bottom:1px solid rgba(107,66,38,.09);vertical-align:middle;}
  tr:last-child td{border-bottom:none;}
  tr:nth-child(even) td{background:rgba(107,66,38,.04);}
  tr:active td{background:rgba(212,168,90,.12);}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;}
  .form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px;}
  @media(max-width:500px){.form-row-3{grid-template-columns:1fr 1fr;}}
  .field{display:flex;flex-direction:column;gap:3px;}
  .field label{font-size:10px;font-weight:600;color:${C.tierra};text-transform:uppercase;letter-spacing:.5px;font-family:'Roboto Slab',serif;}
  .field input,.field select,.field textarea{padding:9px 11px;border:1.5px solid rgba(107,66,38,.25);border-radius:7px;background:rgba(255,253,245,.95);font-family:'Lora',serif;font-size:14px;color:${C.sombra};outline:none;-webkit-appearance:none;appearance:none;}
  .field input:focus,.field select:focus{border-color:${C.tierra};box-shadow:0 0 0 3px rgba(107,66,38,.10);}
  .btn{padding:11px 18px;border:none;border-radius:8px;cursor:pointer;font-family:'Roboto Slab',serif;font-weight:600;font-size:13px;transition:all .18s;display:inline-flex;align-items:center;gap:5px;-webkit-tap-highlight-color:transparent;}
  .btn-prim{background:linear-gradient(135deg,${C.tierra},${C.barro});color:${C.crema};box-shadow:0 2px 8px rgba(107,66,38,.35);}
  .btn-verde{background:linear-gradient(135deg,${C.hierba},${C.pasto});color:#fff;box-shadow:0 2px 8px rgba(74,124,78,.35);}
  .btn-rojo{background:linear-gradient(135deg,${C.rojo},#c0392b);color:#fff;padding:7px 12px;font-size:12px;}
  .btn-sm{padding:6px 11px;font-size:11px;}
  .btn-ghost{background:transparent;border:1.5px solid rgba(107,66,38,.3);color:${C.tierra};}
  .btn-full{width:100%;justify-content:center;padding:13px;}
  .badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;font-family:'Roboto Slab',serif;letter-spacing:.3px;}
  .badge-verde{background:rgba(74,124,78,.15);color:${C.hierba};border:1px solid rgba(74,124,78,.3);}
  .badge-rojo{background:rgba(176,58,46,.12);color:${C.rojo};border:1px solid rgba(176,58,46,.3);}
  .badge-paja{background:rgba(212,168,90,.2);color:#8a6014;border:1px solid rgba(212,168,90,.4);}
  .badge-cielo{background:rgba(123,175,212,.2);color:#2a6090;border:1px solid rgba(123,175,212,.4);}
  .badge-gris{background:rgba(100,100,100,.1);color:#555;border:1px solid rgba(0,0,0,.12);}
  .badge-morado{background:rgba(120,60,180,.15);color:#6b21a8;border:1px solid rgba(120,60,180,.3);}
  .section-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px;}
  .section-hdr h2{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:${C.tierra};}
  .alert{padding:10px 13px;border-radius:8px;font-size:12px;margin-bottom:10px;display:flex;align-items:flex-start;gap:8px;}
  .alert-warn{background:rgba(232,197,71,.15);border:1px solid rgba(232,197,71,.4);color:#7a5c00;}
  .alert-ok{background:rgba(74,124,78,.12);border:1px solid rgba(74,124,78,.3);color:#2d5c30;}
  .alert-err{background:rgba(176,58,46,.10);border:1px solid rgba(176,58,46,.3);color:${C.rojo};}
  .prog-bar{background:rgba(107,66,38,.12);border-radius:20px;height:7px;overflow:hidden;}
  .prog-fill{height:100%;border-radius:20px;}
  .divider{border:none;border-top:1px solid rgba(107,66,38,.12);margin:12px 0;}
  .txt-muted{color:rgba(44,26,14,.45);font-size:11px;}
  .flex{display:flex;gap:7px;align-items:center;}
  .tab-pills{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px;}
  .tab-pills::-webkit-scrollbar{display:none;}
  .pill{padding:5px 14px;border-radius:20px;border:1.5px solid rgba(107,66,38,.25);background:transparent;cursor:pointer;font-family:'Roboto Slab',serif;font-size:11px;color:${C.tierra};transition:all .15s;white-space:nowrap;-webkit-tap-highlight-color:transparent;}
  .pill.active{background:${C.tierra};color:${C.crema};border-color:${C.tierra};}
  .search-input{padding:9px 12px;border:1.5px solid rgba(107,66,38,.25);border-radius:7px;font-family:'Lora',serif;font-size:14px;width:100%;-webkit-appearance:none;}
  .mb{margin-bottom:14px;} .mt{margin-top:14px;}
  /* Offline indicator pulse */
  @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.5;}}
  .pulse{animation:pulse 2s infinite;}
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const uid = p => `${p}-${Date.now().toString(36).toUpperCase()}`;
const today = () => new Date().toISOString().split("T")[0];
const diffDays = d => { if(!d) return 9999; return Math.round((new Date()-new Date(d))/86400000); };

// ─── DATOS INICIALES ─────────────────────────────────────────────────────────
const ANIMALES_DEFAULT = [
  {id:"V-005",caravana:"5",  nombre:"",categoria:"Vaca",       lote:"General",estado:"Preñada",  obs:"Preñez de Toro"},
  {id:"V-006",caravana:"6",  nombre:"",categoria:"Vaca",       lote:"General",estado:"Preñada",  obs:"Parió 13/08/2025 – H"},
  {id:"V-008",caravana:"8",  nombre:"",categoria:"Vaca",       lote:"General",estado:"Preñada",  obs:"Parió 08/08/2025 – H"},
  {id:"V-009",caravana:"9",  nombre:"",categoria:"Vaca",       lote:"General",estado:"Preñada",  obs:"Parió 13/08/2025 – M · Toro montó 10/10/25"},
  {id:"V-010",caravana:"10", nombre:"",categoria:"Vaca",       lote:"General",estado:"Vacía",    obs:"Parió 07/09/2025 – H·35kg"},
  {id:"V-013",caravana:"13", nombre:"",categoria:"Vaca",       lote:"General",estado:"Descarte", obs:"A descarte luego de parir y destetar"},
  {id:"V-017",caravana:"17", nombre:"",categoria:"Vaca",       lote:"General",estado:"Vacía",    obs:"Parió 06/09/2025 – H · Celo 09/12/2025"},
  {id:"V-019",caravana:"19", nombre:"",categoria:"Vaca",       lote:"General",estado:"Preñada",  obs:"Parió 13/02/2025 · Toro montó 20/10/2025"},
  {id:"V-024",caravana:"24", nombre:"",categoria:"Vaca",       lote:"General",estado:"Vacía",    obs:""},
  {id:"V-026",caravana:"26", nombre:"",categoria:"Vaquilla",   lote:"General",estado:"Preñada",  obs:"Parió 15/09/2025 – H·28kg"},
  {id:"V-031",caravana:"31", nombre:"",categoria:"Vaca",       lote:"General",estado:"Vacía",    obs:"Parió 30/11/2024"},
  {id:"V-032",caravana:"32", nombre:"",categoria:"Ternera",    lote:"Cbo5",   estado:"OK",       obs:""},
  {id:"V-035",caravana:"35", nombre:"",categoria:"Vaquilla",   lote:"General",estado:"Vacía",    obs:"Parió 15/08/2025 – M"},
  {id:"V-037",caravana:"37", nombre:"",categoria:"Ternera",    lote:"Cbo5",   estado:"OK",       obs:""},
  {id:"V-048",caravana:"48", nombre:"",categoria:"Vaca",       lote:"General",estado:"Vacía",    obs:"Parió 03/01/2025 – H·28kg"},
  {id:"T-2149",caravana:"2149",nombre:"",categoria:"Toro",     lote:"Cbo3",   estado:"OK",       obs:"Toro principal"},
  {id:"TN-051",caravana:"51",nombre:"Ternera 51",categoria:"Ternera",lote:"General",estado:"OK",obs:"Nació 07/09/2024"},
  {id:"TN-050",caravana:"50",nombre:"Ternero 50",categoria:"Ternero",lote:"General",estado:"OK",obs:"Nació 29/08/2024"},
  {id:"TN-21",caravana:"21",  nombre:"",categoria:"Ternero",   lote:"General",estado:"OK",       obs:""},
  {id:"TN-40",caravana:"40",  nombre:"",categoria:"Ternero",   lote:"General",estado:"OK",       obs:""},
  {id:"TN-45",caravana:"45",  nombre:"",categoria:"Ternero",   lote:"General",estado:"OK",       obs:""},
  // Cbo4
  ...[["D4-440","440"],["D4-3353","3353"],["D4-3342","3342"],["D4-3312","3312"],["D4-3311","3311"],
      ["D4-328","328"],["D4-401","401"],["D4-252","252"],["D4-2034","2034"],["D4-470","470"],
      ["D4-4266","4266"],["D4-3326","3326"],["D4-489","489"],["D4-3340","3340"],["D4-4285","4-285"],
      ["D4-3390","3390"],["D4-3385","3385"],["D4-3389","3389"],["D4-2036","2036"],["D4-478","478"],
      ["D4-3314","3314"],["D4-3335","3335"],["D4-SC","Sin car"],["D4-412","412"],["D4-449","449"],
      ["D4-448","448"],["D4-3330","3330"],["D4-429","429"],["D4-3395","3395"],["D4-3382","3382"]
  ].map(([id,car])=>({id,caravana:car,nombre:"",categoria:"Desmamante H",lote:"Cbo4",
    estado:["3390","3385","2036","478","3335","412","449","448"].includes(car)?"Preñada":"OK",obs:""})),
  // Cbo5
  ...[["D5-1154","1154"],["D5-1240","1240"],["D5-7729","7729"],["D5-7761","7761"],["D5-7777","7777"],
      ["D5-6458","6458"],["D5-7785","7785"],["D5-1208","1208"],["D5-7749","7749"],["D5-1187","1187"],
      ["D5-8844","8844"],["D5-1247","1247"],["D5-7752","7752"],["D5-377","377"],["D5-7722","7722"],
      ["D5-5336","5336"],["D5-5340","5340"],["D5-5328","5328"],["D5-5343","5343"],["D5-5331","5331"],
      ["D5-5344","5344"],["D5-4637","4637"],["D5-9014","9014"],["D5-5327","5327"]
  ].map(([id,car])=>({id,caravana:car,nombre:"",categoria:"Desmamante H",lote:"Cbo5",estado:"OK",obs:""})),
];

const IATF_DEFAULT = [
  {id:"I-001",caravana:"440",  lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Nando",  resultado:"❌",obs:""},
  {id:"I-002",caravana:"3353", lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Nando",  resultado:"❌",obs:""},
  {id:"I-003",caravana:"3342", lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Nando",  resultado:"✅",obs:""},
  {id:"I-004",caravana:"3312", lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Campero",resultado:"✅",obs:""},
  {id:"I-005",caravana:"3311", lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Eficaz", resultado:"✅",obs:"Sobró: 1 Nando – 1 Fokker"},
  {id:"I-006",caravana:"328",  lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Campero",resultado:"❌",obs:""},
  {id:"I-007",caravana:"401",  lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Fokker", resultado:"✅",obs:""},
  {id:"I-008",caravana:"252",  lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Nando",  resultado:"❌",obs:""},
  {id:"I-009",caravana:"2034", lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Nando",  resultado:"✅",obs:""},
  {id:"I-010",caravana:"470",  lote:"Cbo4",apta:"No Apta",protocolo:"No",toro:"—",     resultado:"❌",obs:"No cicla"},
  {id:"I-011",caravana:"4266", lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Fokker", resultado:"❌",obs:""},
  {id:"I-012",caravana:"3326", lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Campero",resultado:"❌",obs:""},
  {id:"I-013",caravana:"489",  lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Nando",  resultado:"✅",obs:""},
  {id:"I-014",caravana:"3340", lote:"Cbo4",apta:"Apta",  protocolo:"No – Faltó Dispositivo",toro:"—",resultado:"❌",obs:""},
  {id:"I-015",caravana:"4-285",lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Eficaz", resultado:"❌",obs:"Dispositivo Caído"},
  {id:"I-016",caravana:"3390", lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Eficaz", resultado:"✅",obs:"Preñez de Toro"},
  {id:"I-017",caravana:"3385", lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Eficaz", resultado:"✅",obs:""},
  {id:"I-018",caravana:"3389", lote:"Cbo4",apta:"No Apta",protocolo:"No",toro:"—",     resultado:"❌",obs:"Muy chica – no cicla aún"},
  {id:"I-019",caravana:"2036", lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Nando",  resultado:"✅",obs:"Posible preñez de Toro"},
  {id:"I-020",caravana:"478",  lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Fokker", resultado:"✅",obs:""},
  {id:"I-021",caravana:"3314", lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Fokker", resultado:"❌",obs:""},
  {id:"I-022",caravana:"3395", lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Nando",  resultado:"❌",obs:""},
  {id:"I-023",caravana:"Sin car",lote:"Cbo4",apta:"Apta",protocolo:"Si",toro:"Campero",resultado:"❌",obs:""},
  {id:"I-024",caravana:"412",  lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Fokker", resultado:"✅",obs:""},
  {id:"I-025",caravana:"449",  lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Nando",  resultado:"✅",obs:""},
  {id:"I-026",caravana:"448",  lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Fokker", resultado:"✅",obs:"Preñez de Toro"},
  {id:"I-027",caravana:"3330", lote:"Cbo4",apta:"Apta",  protocolo:"No – Enferma",toro:"Campero",resultado:"❌",obs:"Prostaglandina"},
  {id:"I-028",caravana:"429",  lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Eficaz", resultado:"❌",obs:""},
  {id:"I-029",caravana:"3335", lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Fokker", resultado:"✅",obs:""},
  {id:"I-030",caravana:"3382", lote:"Cbo4",apta:"Apta",  protocolo:"Si",toro:"Fokker", resultado:"❌",obs:""},
  {id:"I-031",caravana:"48",   lote:"General",apta:"Apta",protocolo:"Si",toro:"Tabasco",resultado:"✅",obs:""},
  {id:"I-032",caravana:"19",   lote:"General",apta:"Apta",protocolo:"Si",toro:"Tabasco",resultado:"✅",obs:""},
  {id:"I-033",caravana:"31",   lote:"General",apta:"Apta",protocolo:"Si",toro:"Fokker", resultado:"❌",obs:""},
  {id:"I-034",caravana:"8",    lote:"General",apta:"Apta",protocolo:"Si",toro:"Tabasco",resultado:"✅",obs:""},
  {id:"I-035",caravana:"5",    lote:"General",apta:"Apta",protocolo:"No",toro:"—",       resultado:"✅",obs:"Preñez de Toro"},
  {id:"I-036",caravana:"9",    lote:"General",apta:"Apta",protocolo:"No",toro:"—",       resultado:"✅",obs:"Preñez de Toro"},
  {id:"I-037",caravana:"17",   lote:"General",apta:"Apta",protocolo:"No",toro:"—",       resultado:"❌",obs:"Celo 09/12/2025 Toro montó"},
  {id:"I-038",caravana:"10",   lote:"General",apta:"Apta",protocolo:"No",toro:"—",       resultado:"❌",obs:""},
  {id:"I-039",caravana:"35",   lote:"General",apta:"Apta",protocolo:"No",toro:"—",       resultado:"❌",obs:""},
  {id:"I-040",caravana:"6",    lote:"General",apta:"Apta",protocolo:"No",toro:"—",       resultado:"❌",obs:""},
  {id:"I-041",caravana:"26",   lote:"General",apta:"Apta",protocolo:"No",toro:"—",       resultado:"❌",obs:""},
];

const PARICIONES_DEFAULT = [
  {id:"P-001",madreCaravana:"28",fecha:"2024-09-07",tipo:"Normal",terneroCar:"51",terneroSexo:"H",pesoNac:38,estado:"OK",obs:"Madre subfértil"},
  {id:"P-002",madreCaravana:"3", fecha:"2024-08-29",tipo:"Normal",terneroCar:"50",terneroSexo:"M",pesoNac:34,estado:"OK",obs:""},
  {id:"P-003",madreCaravana:"1", fecha:"2024-09-28",tipo:"Normal",terneroCar:"49",terneroSexo:"H",pesoNac:28,estado:"Baja",obs:"Ternera murió"},
  {id:"P-004",madreCaravana:"41",fecha:"2024-10-31",tipo:"Normal",terneroCar:"—", terneroSexo:"H",pesoNac:27,estado:"OK",obs:""},
  {id:"P-005",madreCaravana:"42",fecha:"2024-10-07",tipo:"Normal",terneroCar:"—", terneroSexo:"M",pesoNac:30,estado:"Baja",obs:"Ternero murió 30/10/2024"},
  {id:"P-006",madreCaravana:"31",fecha:"2024-11-30",tipo:"Normal",terneroCar:"—", terneroSexo:"H",pesoNac:28,estado:"OK",obs:""},
  {id:"P-007",madreCaravana:"48",fecha:"2025-01-03",tipo:"Normal",terneroCar:"—", terneroSexo:"H",pesoNac:28,estado:"OK",obs:""},
  {id:"P-008",madreCaravana:"19",fecha:"2025-02-13",tipo:"Normal",terneroCar:"—", terneroSexo:"", pesoNac:0, estado:"OK",obs:""},
  {id:"P-009",madreCaravana:"6", fecha:"2025-08-13",tipo:"Normal",terneroCar:"—", terneroSexo:"H",pesoNac:0, estado:"OK",obs:""},
  {id:"P-010",madreCaravana:"8", fecha:"2025-08-08",tipo:"Normal",terneroCar:"—", terneroSexo:"H",pesoNac:0, estado:"OK",obs:""},
  {id:"P-011",madreCaravana:"9", fecha:"2025-08-13",tipo:"Normal",terneroCar:"—", terneroSexo:"M",pesoNac:0, estado:"OK",obs:""},
  {id:"P-012",madreCaravana:"17",fecha:"2025-09-06",tipo:"Normal",terneroCar:"—", terneroSexo:"H",pesoNac:0, estado:"OK",obs:""},
  {id:"P-013",madreCaravana:"10",fecha:"2025-09-07",tipo:"Normal",terneroCar:"—", terneroSexo:"H",pesoNac:35,estado:"OK",obs:""},
  {id:"P-014",madreCaravana:"26",fecha:"2025-09-15",tipo:"Normal",terneroCar:"—", terneroSexo:"H",pesoNac:28,estado:"OK",obs:""},
  {id:"P-015",madreCaravana:"35",fecha:"2025-08-15",tipo:"Normal",terneroCar:"—", terneroSexo:"M",pesoNac:0, estado:"OK",obs:""},
];

const BAJAS_DEFAULT = [
  {id:"B-001",caravana:"49",  fecha:"2024-10-01",causa:"Muerte",  detalle:"Ternera 49 murió – madre subfértil"},
  {id:"B-002",caravana:"42-T",fecha:"2024-10-30",causa:"Muerte",  detalle:"Ternero de vaca 42 murió 30/10/2024"},
  {id:"B-003",caravana:"24",  fecha:"2024-11-01",causa:"Faena",   detalle:"Vaca 24 faenada"},
  {id:"B-004",caravana:"13",  fecha:"2026-01-01",causa:"Descarte",detalle:"A descarte luego de parir y destetar"},
];

const SANIDAD_DEFAULT = [
  {id:"S-001",fecha:"2024-10-12",lote:"General",producto:"IverFranken 3,5%",tipo:"Antiparasitario",dosis:"10cc",obs:"+ 40ml IMPACTO"},
  {id:"S-002",fecha:"2024-10-12",lote:"General",producto:"Olivitasan",tipo:"Reconstituyente",dosis:"10cc",obs:"+ 40ml IMPACTO"},
  {id:"S-003",fecha:"2024-10-14",lote:"General",producto:"Carbumam",tipo:"Contra la mancha",dosis:"2cc",obs:"Todos los terneros"},
  {id:"S-004",fecha:"2024-10-17",lote:"General",producto:"Raivacelt",tipo:"Antirrabica",dosis:"2cc",obs:""},
  {id:"S-005",fecha:"2024-10-17",lote:"General",producto:"Clostrizan 11",tipo:"Clostridiosis",dosis:"5cc",obs:""},
  {id:"S-006",fecha:"2024-10-26",lote:"General",producto:"IverFranken 3,5%",tipo:"Antiparasitario",dosis:"10cc",obs:"+ 40ml IMPACTO"},
  {id:"S-007",fecha:"2024-10-26",lote:"General",producto:"Olivitasan",tipo:"Reconstituyente",dosis:"10cc",obs:"+ 40ml IMPACTO"},
  {id:"S-008",fecha:"2024-10-29",lote:"General",producto:"Carbumam",tipo:"Contra la mancha",dosis:"2cc",obs:"Todos los terneros"},
  {id:"S-009",fecha:"2024-11-08",lote:"General",producto:"Raivacelt",tipo:"Antirrabica",dosis:"2cc",obs:""},
  {id:"S-010",fecha:"2024-11-08",lote:"General",producto:"Clostrizan 11",tipo:"Clostridiosis",dosis:"5cc",obs:""},
  {id:"S-011",fecha:"2024-11-08",lote:"General",producto:"MOV",tipo:"Reconstituyente",dosis:"10cc",obs:""},
  {id:"S-012",fecha:"2024-11-23",lote:"General",producto:"Iodotonic",tipo:"Reconstituyente",dosis:"10cc",obs:"5cc Olivitasan a terneros"},
  {id:"S-013",fecha:"2024-10-30",lote:"Cbo4",producto:"IverFranken 3,5%",tipo:"Antiparasitario",dosis:"5cc",obs:"Repetir 16/11"},
  {id:"S-014",fecha:"2024-10-30",lote:"Cbo4",producto:"Olivitasan",tipo:"Reconstituyente",dosis:"5cc",obs:""},
  {id:"S-015",fecha:"2024-10-30",lote:"Cbo4",producto:"Raivacelt",tipo:"Antirrabica",dosis:"2cc",obs:""},
  {id:"S-016",fecha:"2024-10-30",lote:"Cbo4",producto:"Clostrizan 11",tipo:"Clostridiosis",dosis:"5cc",obs:""},
  {id:"S-017",fecha:"2024-11-05",lote:"Cbo4",producto:"Zuletel 10%",tipo:"Fasciola Hepática",dosis:"5cc",obs:"Repetir 19/11"},
  {id:"S-018",fecha:"2024-11-16",lote:"Cbo4",producto:"IverFranken 3,5%",tipo:"Antiparasitario",dosis:"5cc",obs:"+ 20ml IMPACTO"},
  {id:"S-019",fecha:"2024-11-19",lote:"Cbo4",producto:"Zuletel 10%",tipo:"Fasciola Hepática",dosis:"5cc",obs:""},
  {id:"S-020",fecha:"2025-03-29",lote:"Cbo4",producto:"Fosfamisol 22,3%",tipo:"Antiparasitario",dosis:"6cc",obs:"+ 20ml IMPACTO"},
  {id:"S-021",fecha:"2025-03-29",lote:"Cbo4",producto:"Olivitasan",tipo:"Reconstituyente",dosis:"5cc",obs:""},
  {id:"S-022",fecha:"2025-04-17",lote:"General",producto:"Raivacelt",tipo:"Vacuna",dosis:"2cc",obs:""},
  {id:"S-023",fecha:"2025-04-17",lote:"General",producto:"Clostrizan 11",tipo:"Clostridiosis",dosis:"5cc",obs:""},
  {id:"S-024",fecha:"2025-05-03",lote:"General",producto:"EctosulesPlus",tipo:"Pour On",dosis:"10cc",obs:"Vacas y Toro"},
  {id:"S-025",fecha:"2025-09-13",lote:"Cbo4",producto:"VACSULES REPRODUCTIVA",tipo:"Vacuna",dosis:"5cc",obs:"Lote Cbo4"},
  {id:"S-026",fecha:"2025-09-13",lote:"Cbo4",producto:"IVERFRANKEN 3,5%",tipo:"Antiparasitario",dosis:"8cc",obs:"Lote Cbo4"},
  {id:"S-027",fecha:"2025-09-13",lote:"Cbo4",producto:"IODOTONIC",tipo:"Reconstituyente",dosis:"10cc",obs:"Lote Cbo4"},
  {id:"S-028",fecha:"2025-09-13",lote:"General",producto:"VACSULES REPRODUCTIVA",tipo:"Vacuna",dosis:"5cc",obs:"Vacas adultas"},
  {id:"S-029",fecha:"2025-09-13",lote:"General",producto:"LEVAMISOL",tipo:"Antiparasitario",dosis:"20cc",obs:"Vacas adultas"},
  {id:"S-030",fecha:"2025-09-13",lote:"General",producto:"IODOTONIC",tipo:"Reconstituyente",dosis:"10cc",obs:"Vacas adultas"},
  {id:"S-031",fecha:"2025-09-13",lote:"Cbo3",producto:"IVERFRANKEN 1%",tipo:"Antiparasitario",dosis:"20cc",obs:"Toro"},
  {id:"S-032",fecha:"2025-10-31",lote:"Cbo5",producto:"Fosfamisol",tipo:"Antiparasitario",dosis:"4cc",obs:""},
  {id:"S-033",fecha:"2025-10-31",lote:"Cbo5",producto:"MOV",tipo:"Reconstituyente",dosis:"5cc",obs:""},
];

const POTREROS_DEFAULT = [
  {id:"P1",nombre:"Potrero 1",lote:"Cbo5",  estado:"Activo",      ultRot:"2026-01-31",prox:"2026-02-04"},
  {id:"P2",nombre:"Potrero 2",lote:"Cbo5",  estado:"Activo",      ultRot:"2026-01-31",prox:"2026-01-31"},
  {id:"P3",nombre:"Potrero 3",lote:"Cbo5",  estado:"Activo",      ultRot:"2026-01-31",prox:"2026-01-31"},
  {id:"P4",nombre:"Potrero 4",lote:"Cbo4",  estado:"Activo",      ultRot:"2026-02-02",prox:"2026-02-07"},
  {id:"P5",nombre:"Potrero 5",lote:"Ambos", estado:"Activo",      ultRot:"2026-02-08",prox:"2026-02-12"},
  {id:"P6",nombre:"Potrero 6",lote:"Ambos", estado:"Activo",      ultRot:"2026-02-13",prox:"2026-02-17"},
  {id:"P7",nombre:"Potrero 7",lote:"Ambos", estado:"Activo",      ultRot:"2026-02-18",prox:"2026-02-21"},
  {id:"P8",nombre:"Potrero 8",lote:"Ambos", estado:"Activo",      ultRot:"2026-02-22",prox:"2026-03-05"},
  {id:"P9",nombre:"Potrero 9",lote:"Cbo5",  estado:"Descansando", ultRot:"2026-03-01",prox:"2026-03-05"},
];

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [online, setOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = usePersisted("fg_lastSync", null);
  const [pendingChanges, setPendingChanges] = usePersisted("fg_pending", 0);

  const [animales, setAnimalesRaw]     = usePersisted("fg_animales",    ANIMALES_DEFAULT);
  const [iatf, setIatfRaw]             = usePersisted("fg_iatf",         IATF_DEFAULT);
  const [pariciones, setParicionesRaw] = usePersisted("fg_pariciones",   PARICIONES_DEFAULT);
  const [bajas, setBajasRaw]           = usePersisted("fg_bajas",        BAJAS_DEFAULT);
  const [sanidad, setSanidadRaw]       = usePersisted("fg_sanidad",      SANIDAD_DEFAULT);
  const [potreros, setPotrerosRaw]     = usePersisted("fg_potreros",     POTREROS_DEFAULT);

  // Wrap setters to track pending changes
  const track = fn => (...args) => { fn(...args); setPendingChanges(p => p + 1); };
  const setAnimales     = track(setAnimalesRaw);
  const setIatf         = track(setIatfRaw);
  const setPariciones   = track(setParicionesRaw);
  const setBajas        = track(setBajasRaw);
  const setSanidad      = track(setSanidadRaw);
  const setPotreros     = track(setPotrerosRaw);

  // Online/offline detection
  useEffect(() => {
    const on  = () => { setOnline(true); };
    const off = () => setOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // Auto-sync when back online (simulated — marks as synced)
  useEffect(() => {
    if (online && pendingChanges > 0) {
      const t = setTimeout(() => {
        setLastSync(new Date().toLocaleString("es-AR"));
        setPendingChanges(0);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [online, pendingChanges]);

  const TABS = [
    {id:"dashboard",  icon:"🏠", label:"Inicio"},
    {id:"hacienda",   icon:"🐄", label:"Hacienda"},
    {id:"iatf",       icon:"🧬", label:"IATF"},
    {id:"prenez",     icon:"🤰", label:"Preñez"},
    {id:"pariciones", icon:"🐣", label:"Partos"},
    {id:"sanidad",    icon:"💉", label:"Sanidad"},
    {id:"potreros",   icon:"🌿", label:"Potreros"},
    {id:"bajas",      icon:"⚰️", label:"Bajas"},
  ];

  const syncMsg = !online
    ? { cls:"offline", icon:"📵", txt:`Sin señal · ${pendingChanges > 0 ? pendingChanges+" cambios pendientes de sync" : "Trabajando offline"}` }
    : pendingChanges > 0
    ? { cls:"syncing", icon:"🔄", txt:`Sincronizando ${pendingChanges} cambios...`, pulse:true }
    : { cls:"",        icon:"✅", txt:`Sincronizado · ${lastSync || "hoy"}` };

  return (
    <>
      <style>{STYLE}</style>
      <div className="app-bg">
        <div className="header">
          <div className="header-inner">
            <span className="header-icon">🐄</span>
            <div>
              <div className="header-title">Estancia Filemón</div>
              <div className="header-sub">Gestión bovina · Corzuela, Chaco</div>
            </div>
            <div className="header-stats">
              <div className="hstat"><div className="hstat-num">{animales.length}</div><div className="hstat-lbl">Cabezas</div></div>
              <div className="hstat"><div className="hstat-num">{animales.filter(a=>a.estado==="Preñada").length}</div><div className="hstat-lbl">Preñadas</div></div>
            </div>
          </div>
        </div>

        {/* Sync banner */}
        <div className={`sync-banner ${syncMsg.cls}`}>
          <span className={syncMsg.pulse?"pulse":""}>{syncMsg.icon}</span>
          <span>{syncMsg.txt}</span>
        </div>

        <div className="main">
          {tab==="dashboard"  && <Dashboard animales={animales} iatf={iatf} pariciones={pariciones} bajas={bajas} sanidad={sanidad} potreros={potreros} setTab={setTab}/>}
          {tab==="hacienda"   && <Hacienda animales={animales} setAnimales={setAnimales}/>}
          {tab==="iatf"       && <IATF iatf={iatf} setIatf={setIatf}/>}
          {tab==="prenez"     && <Prenez animales={animales} pariciones={pariciones} iatf={iatf}/>}
          {tab==="pariciones" && <Pariciones pariciones={pariciones} setPariciones={setPariciones}/>}
          {tab==="sanidad"    && <Sanidad sanidad={sanidad} setSanidad={setSanidad}/>}
          {tab==="potreros"   && <Potreros potreros={potreros} setPotreros={setPotreros}/>}
          {tab==="bajas"      && <Bajas bajas={bajas} setBajas={setBajas} animales={animales} setAnimales={setAnimalesRaw}/>}
        </div>

        {/* Bottom nav – iPhone style */}
        <nav className="nav-bottom">
          {TABS.map(t => (
            <button key={t.id} className={`nav-btn${tab===t.id?" active":""}`} onClick={()=>setTab(t.id)}>
              <span className="nav-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({animales,iatf,pariciones,bajas,sanidad,potreros,setTab}) {
  const loteC = l => animales.filter(a=>a.lote===l).length;
  const prenadas = animales.filter(a=>a.estado==="Preñada").length;
  const iatfPren = iatf.filter(i=>i.resultado==="✅").length;
  const iatfIns  = iatf.filter(i=>i.protocolo==="Si").length;
  const pct = iatfIns>0?((iatfPren/iatfIns)*100).toFixed(1):0;
  const ultPar = [...pariciones].sort((a,b)=>b.fecha.localeCompare(a.fecha)).slice(0,4);
  const toros=["Nando","Fokker","Eficaz","Campero","Tabasco"];

  return (
    <div>
      <div className="section-hdr">
        <h2>🏡 Panel General</h2>
        <span className="txt-muted">{new Date().toLocaleDateString("es-AR",{day:"numeric",month:"short",year:"numeric"})}</span>
      </div>

      <div className="grid4" style={{marginBottom:16}}>
        <div className="statbox" data-icon="🐄"><div className="statbox-num">{animales.length}</div><div className="statbox-lbl">Total cabezas</div></div>
        <div className="statbox verde" data-icon="🤰"><div className="statbox-num">{prenadas}</div><div className="statbox-lbl">Preñadas</div></div>
        <div className="statbox paja" data-icon="🧬"><div className="statbox-num">{pct}%</div><div className="statbox-lbl">% IATF</div></div>
        <div className="statbox cielo" data-icon="🐣"><div className="statbox-num">{pariciones.length}</div><div className="statbox-lbl">Partos</div></div>
      </div>

      {/* Lotes */}
      <div className="card mb">
        <div className="card-title">🐄 Rodeo por Lote</div>
        {[["General","🟤"],["Cbo3","⬛"],["Cbo4","🟢"],["Cbo5","🔵"]].map(([l,ic])=>{
          const n=loteC(l); if(!n) return null;
          return <div key={l} style={{marginBottom:9}}>
            <div className="flex" style={{justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:13}}>{ic} Lote {l}</span>
              <strong style={{fontFamily:"'Playfair Display',serif"}}>{n}</strong>
            </div>
            <div className="prog-bar"><div className="prog-fill" style={{width:`${(n/animales.length)*100}%`,background:`linear-gradient(90deg,${C.tierra},${C.paja})`}}/></div>
          </div>;
        })}
      </div>

      {/* IATF por toro */}
      <div className="card mb">
        <div className="card-title">🧬 IATF por Toro</div>
        {toros.map(t=>{
          const m=iatf.filter(i=>i.toro===t); const p=m.filter(i=>i.resultado==="✅").length;
          const pc=m.length?((p/m.length)*100).toFixed(0):0;
          if(!m.length) return null;
          return <div key={t} style={{marginBottom:9}}>
            <div className="flex" style={{justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:12,fontWeight:600}}>{t}</span>
              <span style={{fontSize:12}}>{p}/{m.length} — <strong>{pc}%</strong></span>
            </div>
            <div className="prog-bar"><div className="prog-fill" style={{width:`${pc}%`,background:pc>=50?C.hierba:C.rojo}}/></div>
          </div>;
        })}
      </div>

      {/* Últimas pariciones */}
      <div className="card mb">
        <div className="card-title">🐣 Últimas Pariciones</div>
        {ultPar.map(p=>(
          <div key={p.id} className="flex" style={{marginBottom:9,paddingBottom:9,borderBottom:"1px solid rgba(107,66,38,.09)"}}>
            <span style={{fontSize:18}}>🐄</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600}}>Madre car. {p.madreCaravana}</div>
              <div className="txt-muted">{p.fecha} · {p.terneroSexo==="H"?"♀":p.terneroSexo==="M"?"♂":"—"} {p.pesoNac>0?`· ${p.pesoNac}kg`:""}</div>
            </div>
            <span className={`badge ${p.estado==="Baja"?"badge-rojo":"badge-verde"}`}>{p.tipo}</span>
          </div>
        ))}
      </div>

      {/* Próximas rotaciones */}
      <div className="card">
        <div className="card-title">🌿 Rotaciones Próximas</div>
        {[...potreros].sort((a,b)=>(a.prox||"9").localeCompare(b.prox||"9")).slice(0,5).map(p=>{
          const dias=p.prox?Math.round((new Date(p.prox)-new Date())/86400000):null;
          return <div key={p.id} className="flex" style={{justifyContent:"space-between",marginBottom:8,paddingBottom:8,borderBottom:"1px solid rgba(107,66,38,.08)"}}>
            <div>
              <div style={{fontSize:12,fontWeight:600}}>{p.nombre}</div>
              <div className="txt-muted">{p.lote} · {p.prox||"—"}</div>
            </div>
            {dias!==null&&<span style={{fontWeight:700,fontSize:13,color:dias<=3?C.rojo:dias<=7?C.amarillo:C.hierba}}>{dias>0?`${dias}d`:dias===0?"¡Hoy!":"Vencido"}</span>}
          </div>;
        })}
      </div>
    </div>
  );
}

// ─── HACIENDA ─────────────────────────────────────────────────────────────────
function Hacienda({animales,setAnimales}) {
  const blank={caravana:"",nombre:"",categoria:"Vaca",lote:"General",estado:"OK",obs:""};
  const [form,setForm]=useState(blank);
  const [edit,setEdit]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const [filtro,setFiltro]=useState("");
  const [loteF,setLoteF]=useState("Todos");

  const guardar=()=>{
    if(!form.caravana) return;
    if(edit){setAnimales(animales.map(a=>a.id===edit?{...form,id:edit}:a));setEdit(null);}
    else setAnimales([...animales,{...form,id:uid("A")}]);
    setForm(blank);setShowForm(false);
  };
  const eliminar=id=>{if(window.confirm("¿Eliminar?"))setAnimales(animales.filter(a=>a.id!==id));};
  const editar=a=>{setForm({...a});setEdit(a.id);setShowForm(true);};

  const rows=animales.filter(a=>{
    const lOk=loteF==="Todos"||a.lote===loteF;
    const bOk=!filtro||a.caravana.toLowerCase().includes(filtro.toLowerCase())||a.categoria.toLowerCase().includes(filtro.toLowerCase());
    return lOk&&bOk;
  });

  const ec={OK:"badge-verde",Preñada:"badge-paja","Vacía":"badge-gris",Descarte:"badge-rojo",Vendida:"badge-gris"};

  return (
    <div>
      <div className="section-hdr">
        <h2>🐄 Hacienda</h2>
        <button className="btn btn-prim btn-sm" onClick={()=>{setShowForm(!showForm);setEdit(null);setForm(blank);}}>{showForm?"✕":"＋ Agregar"}</button>
      </div>

      {showForm&&(
        <div className="card mb">
          <div className="card-title">{edit?"✏️ Editar":"➕ Nuevo"}</div>
          <div className="form-row">
            <div className="field"><label>Caravana</label><input value={form.caravana} onChange={e=>setForm({...form,caravana:e.target.value})}/></div>
            <div className="field"><label>Nombre</label><input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Categoría</label><select value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})}>
              {["Vaca","Vaquilla","Ternera","Ternero","Desmamante H","Toro"].map(c=><option key={c}>{c}</option>)}
            </select></div>
            <div className="field"><label>Lote</label><select value={form.lote} onChange={e=>setForm({...form,lote:e.target.value})}>
              {["General","Cbo3","Cbo4","Cbo5"].map(l=><option key={l}>{l}</option>)}
            </select></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Estado</label><select value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}>
              {["OK","Preñada","Vacía","Descarte","Vendida"].map(s=><option key={s}>{s}</option>)}
            </select></div>
            <div className="field"><label>Obs.</label><input value={form.obs} onChange={e=>setForm({...form,obs:e.target.value})}/></div>
          </div>
          <div className="flex mt"><button className="btn btn-verde" onClick={guardar}>💾 Guardar</button><button className="btn btn-ghost btn-sm" onClick={()=>setShowForm(false)}>Cancelar</button></div>
        </div>
      )}

      <div className="card">
        <div className="tab-pills">
          {["Todos","General","Cbo3","Cbo4","Cbo5"].map(l=><button key={l} className={`pill${loteF===l?" active":""}`} onClick={()=>setLoteF(l)}>{l}</button>)}
        </div>
        <input className="search-input mb" placeholder="🔍 Buscar caravana / categoría..." value={filtro} onChange={e=>setFiltro(e.target.value)}/>
        <div className="txt-muted mb">{rows.length} animales</div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Car.</th><th>Cat.</th><th>Lote</th><th>Estado</th><th>Obs.</th><th>✏️</th></tr></thead>
            <tbody>
              {rows.map(a=>(
                <tr key={a.id}>
                  <td><strong>{a.caravana}</strong></td>
                  <td style={{fontSize:11}}>{a.categoria}</td>
                  <td><span className="badge badge-cielo">{a.lote}</span></td>
                  <td><span className={`badge ${ec[a.estado]||"badge-gris"}`}>{a.estado}</span></td>
                  <td className="txt-muted" style={{maxWidth:100,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.obs||"—"}</td>
                  <td>
                    <div className="flex">
                      <button className="btn btn-prim btn-sm" onClick={()=>editar(a)}>✏️</button>
                      <button className="btn btn-rojo btn-sm" onClick={()=>eliminar(a.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── IATF ─────────────────────────────────────────────────────────────────────
function IATF({iatf,setIatf}) {
  const blank={caravana:"",lote:"Cbo4",apta:"Apta",protocolo:"Si",toro:"Nando",resultado:"❌",obs:""};
  const [form,setForm]=useState(blank);
  const [showForm,setShowForm]=useState(false);
  const [loteF,setLoteF]=useState("Todos");

  const guardar=()=>{if(!form.caravana)return;setIatf([...iatf,{...form,id:uid("I")}]);setForm(blank);setShowForm(false);};
  const eliminar=id=>{if(window.confirm("¿Eliminar?"))setIatf(iatf.filter(i=>i.id!==id));};

  const rows=loteF==="Todos"?iatf:iatf.filter(i=>i.lote===loteF);
  const ins=rows.filter(i=>i.protocolo==="Si").length;
  const pren=rows.filter(i=>i.resultado==="✅").length;

  return (
    <div>
      <div className="section-hdr">
        <h2>🧬 IATF 2025</h2>
        <button className="btn btn-prim btn-sm" onClick={()=>setShowForm(!showForm)}>{showForm?"✕":"＋"}</button>
      </div>
      <div className="tab-pills">
        {["Todos","General","Cbo4"].map(l=><button key={l} className={`pill${loteF===l?" active":""}`} onClick={()=>setLoteF(l)}>{l}</button>)}
      </div>
      <div className="grid4 mb">
        <div className="statbox" data-icon="🐄"><div className="statbox-num">{rows.length}</div><div className="statbox-lbl">Evaluadas</div></div>
        <div className="statbox cielo" data-icon="💉"><div className="statbox-num">{ins}</div><div className="statbox-lbl">Inseminadas</div></div>
        <div className="statbox verde" data-icon="✅"><div className="statbox-num">{pren}</div><div className="statbox-lbl">Preñadas</div></div>
        <div className="statbox paja" data-icon="📊"><div className="statbox-num">{ins>0?((pren/ins)*100).toFixed(0):0}%</div><div className="statbox-lbl">Tasa IATF</div></div>
      </div>

      {showForm&&(
        <div className="card mb">
          <div className="form-row">
            <div className="field"><label>Caravana</label><input value={form.caravana} onChange={e=>setForm({...form,caravana:e.target.value})}/></div>
            <div className="field"><label>Lote</label><select value={form.lote} onChange={e=>setForm({...form,lote:e.target.value})}><option>General</option><option>Cbo4</option></select></div>
          </div>
          <div className="form-row">
            <div className="field"><label>GDR</label><select value={form.apta} onChange={e=>setForm({...form,apta:e.target.value})}><option>Apta</option><option>No Apta</option></select></div>
            <div className="field"><label>Toro</label><select value={form.toro} onChange={e=>setForm({...form,toro:e.target.value})}>{["Nando","Fokker","Eficaz","Campero","Tabasco","—"].map(t=><option key={t}>{t}</option>)}</select></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Resultado</label><select value={form.resultado} onChange={e=>setForm({...form,resultado:e.target.value})}><option>✅</option><option>❌</option></select></div>
            <div className="field"><label>Obs.</label><input value={form.obs} onChange={e=>setForm({...form,obs:e.target.value})}/></div>
          </div>
          <div className="flex mt"><button className="btn btn-verde" onClick={guardar}>💾</button><button className="btn btn-ghost btn-sm" onClick={()=>setShowForm(false)}>Cancelar</button></div>
        </div>
      )}

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Car.</th><th>Lote</th><th>GDR</th><th>Toro</th><th>Res.</th><th>Obs.</th><th></th></tr></thead>
            <tbody>
              {rows.map(i=>(
                <tr key={i.id}>
                  <td><strong>{i.caravana}</strong></td>
                  <td><span className="badge badge-cielo">{i.lote}</span></td>
                  <td><span className={`badge ${i.apta==="Apta"?"badge-verde":"badge-rojo"}`} style={{fontSize:9}}>{i.apta==="Apta"?"✓ Apta":"✗ No"}</span></td>
                  <td style={{fontSize:11}}>{i.toro}</td>
                  <td style={{fontSize:15,textAlign:"center"}}>{i.resultado}</td>
                  <td className="txt-muted" style={{fontSize:10,maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.obs||"—"}</td>
                  <td><button className="btn btn-rojo btn-sm" onClick={()=>eliminar(i.id)}>🗑</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── PREÑEZ ───────────────────────────────────────────────────────────────────
function Prenez({animales,pariciones,iatf}) {
  const hembras=animales.filter(a=>["Vaca","Vaquilla","Desmamante H"].includes(a.categoria));
  return (
    <div>
      <div className="section-hdr"><h2>🤰 Historial de Preñez</h2></div>
      <div className="grid3 mb">
        <div className="statbox" data-icon="🐄"><div className="statbox-num">{hembras.length}</div><div className="statbox-lbl">Hembras</div></div>
        <div className="statbox verde" data-icon="✅"><div className="statbox-num">{animales.filter(a=>a.estado==="Preñada").length}</div><div className="statbox-lbl">Preñadas</div></div>
        <div className="statbox paja" data-icon="📅"><div className="statbox-num">{pariciones.filter(p=>p.fecha.startsWith("2025")).length}</div><div className="statbox-lbl">Partos 2025</div></div>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Car.</th><th>Cat.</th><th>Lote</th><th>Parto 2024</th><th>Parto 2025</th><th>Estado</th><th>IATF</th></tr></thead>
            <tbody>
              {hembras.map(a=>{
                const p24=pariciones.filter(p=>p.madreCaravana===a.caravana&&p.fecha.startsWith("2024"));
                const p25=pariciones.filter(p=>p.madreCaravana===a.caravana&&p.fecha.startsWith("2025"));
                const ir=iatf.find(i=>i.caravana===a.caravana);
                return <tr key={a.id}>
                  <td><strong>{a.caravana}</strong></td>
                  <td style={{fontSize:10}}>{a.categoria}</td>
                  <td><span className="badge badge-cielo">{a.lote}</span></td>
                  <td>{p24.length>0?p24.map(p=><div key={p.id} style={{fontSize:10}}>{p.fecha.slice(5)} {p.terneroSexo==="H"?"♀":"♂"}</div>):<span className="txt-muted">—</span>}</td>
                  <td>{p25.length>0?p25.map(p=><div key={p.id} style={{fontSize:10}}>{p.fecha.slice(5)} {p.terneroSexo==="H"?"♀":"♂"}</div>):<span className="txt-muted">—</span>}</td>
                  <td><span className={`badge ${a.estado==="Preñada"?"badge-verde":a.estado==="Vacía"?"badge-gris":a.estado==="Descarte"?"badge-rojo":"badge-paja"}`}>{a.estado}</span></td>
                  <td style={{fontSize:14,textAlign:"center"}}>{ir?ir.resultado:<span className="txt-muted">—</span>}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── PARICIONES ───────────────────────────────────────────────────────────────
function Pariciones({pariciones,setPariciones}) {
  const blank={madreCaravana:"",fecha:today(),tipo:"Normal",terneroCar:"",terneroSexo:"H",pesoNac:"",estado:"OK",obs:""};
  const [form,setForm]=useState(blank);
  const [showForm,setShowForm]=useState(false);
  const guardar=()=>{if(!form.madreCaravana)return;setPariciones([...pariciones,{...form,id:uid("P"),pesoNac:+form.pesoNac}]);setForm(blank);setShowForm(false);};
  const eliminar=id=>{if(window.confirm("¿Eliminar?"))setPariciones(pariciones.filter(p=>p.id!==id));};
  const vivos=pariciones.filter(p=>p.estado!=="Baja").length;
  return (
    <div>
      <div className="section-hdr"><h2>🐣 Pariciones</h2><button className="btn btn-prim btn-sm" onClick={()=>setShowForm(!showForm)}>{showForm?"✕":"＋"}</button></div>
      <div className="grid3 mb">
        <div className="statbox" data-icon="🐣"><div className="statbox-num">{pariciones.length}</div><div className="statbox-lbl">Total partos</div></div>
        <div className="statbox verde" data-icon="✅"><div className="statbox-num">{vivos}</div><div className="statbox-lbl">Terneros vivos</div></div>
        <div className="statbox rojo" data-icon="💀"><div className="statbox-num">{pariciones.length-vivos}</div><div className="statbox-lbl">Bajas neon.</div></div>
      </div>
      {showForm&&(
        <div className="card mb">
          <div className="form-row">
            <div className="field"><label>Madre car.</label><input value={form.madreCaravana} onChange={e=>setForm({...form,madreCaravana:e.target.value})}/></div>
            <div className="field"><label>Fecha</label><input type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Tipo</label><select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}>{["Normal","Distócico","Cesárea","Gemelar","Mortinato"].map(t=><option key={t}>{t}</option>)}</select></div>
            <div className="field"><label>Ternero car.</label><input value={form.terneroCar} onChange={e=>setForm({...form,terneroCar:e.target.value})}/></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Sexo</label><select value={form.terneroSexo} onChange={e=>setForm({...form,terneroSexo:e.target.value})}><option value="H">♀ Hembra</option><option value="M">♂ Macho</option></select></div>
            <div className="field"><label>Peso nac. kg</label><input type="number" value={form.pesoNac} onChange={e=>setForm({...form,pesoNac:e.target.value})}/></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Estado ternero</label><select value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}><option>OK</option><option>Baja</option></select></div>
            <div className="field"><label>Obs.</label><input value={form.obs} onChange={e=>setForm({...form,obs:e.target.value})}/></div>
          </div>
          <div className="flex mt"><button className="btn btn-verde" onClick={guardar}>💾 Guardar</button><button className="btn btn-ghost btn-sm" onClick={()=>setShowForm(false)}>Cancelar</button></div>
        </div>
      )}
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Madre</th><th>Fecha</th><th>Tipo</th><th>Sex.</th><th>Kg</th><th>Est.</th><th></th></tr></thead>
            <tbody>
              {[...pariciones].sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(p=>(
                <tr key={p.id}>
                  <td><strong>{p.madreCaravana}</strong></td>
                  <td style={{fontSize:11}}>{p.fecha}</td>
                  <td><span className={`badge ${p.tipo==="Normal"?"badge-verde":p.tipo==="Mortinato"?"badge-rojo":"badge-paja"}`} style={{fontSize:9}}>{p.tipo}</span></td>
                  <td>{p.terneroSexo==="H"?"♀":"♂"}</td>
                  <td>{p.pesoNac>0?p.pesoNac:<span className="txt-muted">—</span>}</td>
                  <td><span className={`badge ${p.estado==="Baja"?"badge-rojo":"badge-verde"}`} style={{fontSize:9}}>{p.estado}</span></td>
                  <td><button className="btn btn-rojo btn-sm" onClick={()=>eliminar(p.id)}>🗑</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── SANIDAD ──────────────────────────────────────────────────────────────────
function Sanidad({sanidad,setSanidad}) {
  const blank={fecha:today(),lote:"General",producto:"",tipo:"Vacuna",dosis:"",obs:""};
  const [form,setForm]=useState(blank);
  const [showForm,setShowForm]=useState(false);
  const [loteF,setLoteF]=useState("Todos");
  const tipos=["Vacuna","Antiparasitario","Reconstituyente","Clostridiosis","Antirrabica","Fasciola Hepática","Contra la mancha","Pour On","Otro"];
  const guardar=()=>{if(!form.producto)return;setSanidad([...sanidad,{...form,id:uid("S")}]);setForm(blank);setShowForm(false);};
  const eliminar=id=>{if(window.confirm("¿Eliminar?"))setSanidad(sanidad.filter(s=>s.id!==id));};
  const rows=loteF==="Todos"?sanidad:sanidad.filter(s=>s.lote===loteF);
  return (
    <div>
      <div className="section-hdr"><h2>💉 Sanidad — {sanidad.length} reg.</h2><button className="btn btn-prim btn-sm" onClick={()=>setShowForm(!showForm)}>{showForm?"✕":"＋"}</button></div>
      <div className="tab-pills">{["Todos","General","Cbo3","Cbo4","Cbo5"].map(l=><button key={l} className={`pill${loteF===l?" active":""}`} onClick={()=>setLoteF(l)}>{l}</button>)}</div>
      {showForm&&(
        <div className="card mb">
          <div className="form-row">
            <div className="field"><label>Fecha</label><input type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></div>
            <div className="field"><label>Lote</label><select value={form.lote} onChange={e=>setForm({...form,lote:e.target.value})}><option>General</option><option>Cbo3</option><option>Cbo4</option><option>Cbo5</option></select></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Producto</label><input value={form.producto} onChange={e=>setForm({...form,producto:e.target.value})}/></div>
            <div className="field"><label>Tipo</label><select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}>{tipos.map(t=><option key={t}>{t}</option>)}</select></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Dosis</label><input value={form.dosis} onChange={e=>setForm({...form,dosis:e.target.value})}/></div>
            <div className="field"><label>Obs.</label><input value={form.obs} onChange={e=>setForm({...form,obs:e.target.value})}/></div>
          </div>
          <div className="flex mt"><button className="btn btn-verde" onClick={guardar}>💾</button><button className="btn btn-ghost btn-sm" onClick={()=>setShowForm(false)}>Cancelar</button></div>
        </div>
      )}
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Fecha</th><th>Lote</th><th>Tipo</th><th>Producto</th><th>Dosis</th><th>Obs.</th><th></th></tr></thead>
            <tbody>
              {[...rows].sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(s=>(
                <tr key={s.id}>
                  <td style={{fontSize:11}}>{s.fecha}</td>
                  <td><span className="badge badge-cielo">{s.lote}</span></td>
                  <td><span className="badge badge-paja" style={{fontSize:9}}>{s.tipo}</span></td>
                  <td style={{fontSize:11,fontWeight:600}}>{s.producto}</td>
                  <td style={{fontSize:11}}>{s.dosis}</td>
                  <td className="txt-muted" style={{fontSize:10}}>{s.obs||"—"}</td>
                  <td><button className="btn btn-rojo btn-sm" onClick={()=>eliminar(s.id)}>🗑</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── POTREROS ─────────────────────────────────────────────────────────────────
function Potreros({potreros,setPotreros}) {
  const blank={nombre:"",lote:"Cbo4",estado:"Activo",ultRot:today(),prox:"",obs:""};
  const [form,setForm]=useState(blank);
  const [edit,setEdit]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const guardar=()=>{
    if(!form.nombre)return;
    if(edit){setPotreros(potreros.map(p=>p.id===edit?{...form,id:edit}:p));setEdit(null);}
    else setPotreros([...potreros,{...form,id:uid("PT")}]);
    setForm(blank);setShowForm(false);
  };
  const eliminar=id=>{if(window.confirm("¿Eliminar?"))setPotreros(potreros.filter(p=>p.id!==id));};
  const editar=p=>{setForm({...p});setEdit(p.id);setShowForm(true);};
  const rotar=id=>setPotreros(potreros.map(p=>p.id===id?{...p,estado:p.estado==="Activo"?"Descansando":"Activo",ultRot:today()}:p));
  return (
    <div>
      <div className="section-hdr"><h2>🌿 Potreros</h2><button className="btn btn-prim btn-sm" onClick={()=>{setShowForm(!showForm);setEdit(null);setForm(blank);}}>{showForm?"✕":"＋"}</button></div>
      {showForm&&(
        <div className="card mb">
          <div className="form-row"><div className="field"><label>Nombre</label><input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/></div><div className="field"><label>Lote</label><select value={form.lote} onChange={e=>setForm({...form,lote:e.target.value})}><option>General</option><option>Cbo3</option><option>Cbo4</option><option>Cbo5</option><option>Ambos</option></select></div></div>
          <div className="form-row"><div className="field"><label>Ult. rot.</label><input type="date" value={form.ultRot} onChange={e=>setForm({...form,ultRot:e.target.value})}/></div><div className="field"><label>Próx. rot.</label><input type="date" value={form.prox} onChange={e=>setForm({...form,prox:e.target.value})}/></div></div>
          <div className="flex mt"><button className="btn btn-verde" onClick={guardar}>💾</button><button className="btn btn-ghost btn-sm" onClick={()=>setShowForm(false)}>Cancelar</button></div>
        </div>
      )}
      {potreros.map(p=>{
        const dias=p.prox?Math.round((new Date(p.prox)-new Date())/86400000):null;
        return <div key={p.id} className="card">
          <div className="flex" style={{justifyContent:"space-between",marginBottom:10}}>
            <strong style={{fontFamily:"'Playfair Display',serif"}}>{p.nombre}</strong>
            <span className={`badge ${p.estado==="Activo"?"badge-verde":"badge-paja"}`}>{p.estado}</span>
          </div>
          <div className="grid2" style={{gap:8,marginBottom:10,fontSize:12}}>
            <div><span className="txt-muted">Lote: </span><strong>{p.lote}</strong></div>
            <div><span className="txt-muted">Próx. rot.: </span><strong style={{color:dias!==null&&dias<=3?C.rojo:dias!==null&&dias<=7?C.amarillo:C.hierba}}>{dias!==null?(dias>0?`En ${dias}d`:dias===0?"¡Hoy!":"Vencido"):"—"}</strong></div>
            <div><span className="txt-muted">Ult. rot.: </span><strong>{p.ultRot||"—"}</strong></div>
            <div><span className="txt-muted">Próx: </span><strong>{p.prox||"—"}</strong></div>
          </div>
          <div className="flex">
            <button className="btn btn-prim btn-sm" onClick={()=>editar(p)}>✏️</button>
            <button className={`btn btn-sm ${p.estado==="Activo"?"btn-ghost":"btn-verde"}`} onClick={()=>rotar(p.id)}>🔄 {p.estado==="Activo"?"Descansar":"Activar"}</button>
            <button className="btn btn-rojo btn-sm" onClick={()=>eliminar(p.id)}>🗑</button>
          </div>
        </div>;
      })}
    </div>
  );
}

// ─── BAJAS ────────────────────────────────────────────────────────────────────
function Bajas({bajas,setBajas,animales,setAnimales}) {
  const blank={caravana:"",fecha:today(),causa:"Muerte",detalle:""};
  const [form,setForm]=useState(blank);
  const [showForm,setShowForm]=useState(false);
  const causas=["Muerte","Faena","Venta","Descarte","Robo","Otro"];
  const guardar=()=>{
    if(!form.caravana)return;
    setBajas([...bajas,{...form,id:uid("B")}]);
    setAnimales(animales.map(a=>a.caravana===form.caravana?{...a,estado:form.causa==="Faena"||form.causa==="Venta"?"Vendida":form.causa==="Descarte"?"Descarte":a.estado}:a));
    setForm(blank);setShowForm(false);
  };
  const eliminar=id=>{if(window.confirm("¿Eliminar?"))setBajas(bajas.filter(b=>b.id!==id));};
  const cc={Muerte:"badge-rojo",Faena:"badge-gris",Venta:"badge-verde",Descarte:"badge-paja",Robo:"badge-rojo",Otro:"badge-gris"};
  return (
    <div>
      <div className="section-hdr"><h2>⚰️ Bajas</h2><button className="btn btn-prim btn-sm" onClick={()=>setShowForm(!showForm)}>{showForm?"✕":"＋"}</button></div>
      <div className="grid4 mb">
        {causas.map(c=>{const n=bajas.filter(b=>b.causa===c).length;if(!n)return null;
          return <div key={c} className={`statbox${c==="Muerte"?" rojo":c==="Venta"?" verde":c==="Faena"?" gris":" paja"}`} data-icon={c==="Muerte"?"💀":c==="Venta"?"💰":c==="Faena"?"🔪":"📋"}><div className="statbox-num">{n}</div><div className="statbox-lbl">{c}</div></div>;
        })}
      </div>
      {showForm&&(
        <div className="card mb">
          <div className="form-row">
            <div className="field"><label>Caravana</label>
              <select value={form.caravana} onChange={e=>setForm({...form,caravana:e.target.value})}>
                <option value="">Seleccionar...</option>
                {animales.map(a=><option key={a.id} value={a.caravana}>{a.caravana} — {a.categoria}</option>)}
              </select>
            </div>
            <div className="field"><label>Fecha</label><input type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Causa</label><select value={form.causa} onChange={e=>setForm({...form,causa:e.target.value})}>{causas.map(c=><option key={c}>{c}</option>)}</select></div>
            <div className="field"><label>Detalle</label><input value={form.detalle} onChange={e=>setForm({...form,detalle:e.target.value})}/></div>
          </div>
          <div className="flex mt"><button className="btn btn-verde" onClick={guardar}>💾 Guardar</button><button className="btn btn-ghost btn-sm" onClick={()=>setShowForm(false)}>Cancelar</button></div>
        </div>
      )}
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Car.</th><th>Fecha</th><th>Causa</th><th>Detalle</th><th></th></tr></thead>
            <tbody>
              {[...bajas].sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(b=>(
                <tr key={b.id}>
                  <td><strong>{b.caravana}</strong></td>
                  <td style={{fontSize:11}}>{b.fecha}</td>
                  <td><span className={`badge ${cc[b.causa]||"badge-gris"}`}>{b.causa}</span></td>
                  <td className="txt-muted" style={{fontSize:11}}>{b.detalle||"—"}</td>
                  <td><button className="btn btn-rojo btn-sm" onClick={()=>eliminar(b.id)}>🗑</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDST17QLDfC6VHaqfX6I1un4yWeu9wzg1w",
  authDomain: "estancia-filemon.firebaseapp.com",
  projectId: "estancia-filemon",
  storageBucket: "estancia-filemon.firebasestorage.app",
  messagingSenderId: "375311745269",
  appId: "1:375311745269:web:940ad983c9347e3d4985bc"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
enableIndexedDbPersistence(db).catch(() => {});

function useCollection(colName) {
  const [docs, setDocs] = useState(null);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, colName), snap => {
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [colName]); // eslint-disable-line
  const add    = async (data)     => { const {id:_,...rest}=data; await addDoc(collection(db, colName), rest); };
  const update = async (id, data) => { const {id:_,...rest}=data; await updateDoc(doc(db, colName, id), rest); };
  const remove = async (id)       => { await deleteDoc(doc(db, colName, id)); };
  return [docs, add, update, remove];
}

// localStorage replaced by Firestore useCollection above

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
.modal-overlay{position:fixed;inset:0;background:rgba(44,26,14,.65);z-index:999;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;}
  .modal-box{background:linear-gradient(145deg,#fffdf5,#EDE0C4);border-radius:16px;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;box-shadow:0 24px 80px rgba(44,26,14,.5);padding:24px;position:relative;}
  .modal-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:#6B4226;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid rgba(107,66,38,.12);}
  .modal-close{position:absolute;top:12px;right:12px;background:rgba(107,66,38,.1);border:none;font-size:16px;cursor:pointer;color:#6B4226;padding:4px 9px;border-radius:6px;}
  .error-msg{background:rgba(176,58,46,.1);border:1px solid rgba(176,58,46,.3);color:#B03A2E;padding:7px 11px;border-radius:7px;font-size:12px;margin-bottom:10px;}
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
  {id:"P1",nombre:"P1",lote:"Cbo5",  estado:"Activo",      ultRot:"2026-01-31",prox:"2026-02-04"},
  {id:"P2",nombre:"P2",lote:"Cbo5",  estado:"Activo",      ultRot:"2026-01-31",prox:"2026-01-31"},
  {id:"P3",nombre:"P3",lote:"Cbo5",  estado:"Activo",      ultRot:"2026-01-31",prox:"2026-01-31"},
  {id:"P4",nombre:"P4",lote:"Cbo4",  estado:"Activo",      ultRot:"2026-02-02",prox:"2026-02-07"},
  {id:"P5",nombre:"P5",lote:"Ambos", estado:"Activo",      ultRot:"2026-02-08",prox:"2026-02-12"},
  {id:"P6",nombre:"P6",lote:"Ambos", estado:"Activo",      ultRot:"2026-02-13",prox:"2026-02-17"},
  {id:"P7",nombre:"P7",lote:"Ambos", estado:"Activo",      ultRot:"2026-02-18",prox:"2026-02-21"},
  {id:"P8",nombre:"P8",lote:"Ambos", estado:"Activo",      ultRot:"2026-02-22",prox:"2026-03-05"},
  {id:"P9",nombre:"P9",lote:"Cbo5",  estado:"Descansando", ultRot:"2026-03-01",prox:"2026-03-05"},
];

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const getTabFromHash = () => {
    const hash = window.location.hash.replace("#","");
    const valid = ["dashboard","hacienda","iatf","prenez","pariciones","sanidad","potreros","bajas","reportes"];
    return valid.includes(hash) ? hash : "dashboard";
  };
  const [tab, setTab] = useState(getTabFromHash);
  useEffect(()=>{ window.location.hash = tab; }, [tab]);
  useEffect(()=>{
    const onHash = () => setTab(getTabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const [online, setOnline] = useState(navigator.onLine);

  const [animalesD, addAnimal,   updateAnimal,   removeAnimal]   = useCollection("animales");
  const [iatfD,     addIatf,     updateIatf,     removeIatf]     = useCollection("iatf");
  const [parD,      addPar,      updatePar,      removePar]      = useCollection("pariciones");
  const [bajasD,    addBaja,     updateBaja,     removeBaja]     = useCollection("bajas");
  const [sanD,      addSan,      updateSan,      removeSan]      = useCollection("sanidad");
  const [potD,      addPot,      updatePot,      removePot]      = useCollection("potreros");
  const [pesD,      addPesaje,   updatePesaje,   removePesaje]   = useCollection("pesajes");
  const [torosD,    addToroD,    updateToroD,    removeToroD]    = useCollection("toros");
  const [rotD,      addRotD,     updateRotD,     removeRotD]     = useCollection("rotaciones");
  const [prodD,     addProd,     updateProd,     removeProd]     = useCollection("productos");

  const animales   = animalesD   || [];
  const iatf       = iatfD       || [];
  const pariciones = parD        || [];
  const bajas      = bajasD      || [];
  const sanidad    = sanD        || [];
  const potreros   = potD        || [];
  const pesajes    = pesD        || [];
  const torosDB    = torosD      || [];
  const rotacionesDB = rotD       || [];
  const productosDB  = prodD      || [];

  const loading = !animalesD || !iatfD || !parD || !bajasD || !sanD || !potD || !pesD || !torosD || !rotD || !prodD;
  // Animales activos = excluir los que tienen baja registrada
  const bajasCaravanas = new Set(bajas.map(b=>b.caravana));
  const animalesActivos = animales.filter(a=>!bajasCaravanas.has(a.caravana));

  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const [fichaAnimal, setFichaAnimal] = useState(null);
  const [editandoAnimal, setEditandoAnimal] = useState(null);

  if (loading) return (
    <>
      <style>{STYLE}</style>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#F5EDD6",gap:20}}>
        <span style={{fontSize:60}}>🐄</span>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#6B4226"}}>Estancia Filemón</div>
        <div style={{fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:13,color:"#8B5E3C"}}>{online?"Conectando con Firebase...":"Cargando datos offline..."}</div>
      </div>
    </>
  );

  const TABS = [
    {id:"dashboard",  icon:"🏠", label:"Inicio"},
    {id:"hacienda",   icon:"🐄", label:"Hacienda"},
    {id:"iatf",       icon:"🧬", label:"Servicios"},
    {id:"prenez",     icon:"🤰", label:"Preñez"},
    {id:"pariciones", icon:"🐣", label:"Partos"},
    {id:"sanidad",    icon:"💉", label:"Sanidad"},
    {id:"potreros",   icon:"🌿", label:"Potreros"},
    {id:"bajas",      icon:"⚰️", label:"Bajas"},
    {id:"reportes",    icon:"📄", label:"Reportes"},
  ];

  const syncMsg = !online ? { cls:"offline", icon:"📵", txt:"Sin señal · Offline · Cambios se sincronizan al volver" } : { cls:"", icon:"✅", txt:`Firebase activo · ${animales.length} animales` };

  return (
    <>
      <style>{STYLE}</style>
      <div className="app-bg">
        <div className="header">
          <div className="header-inner">
            <img src="logo.png" alt="Estancia Filemón" style={{height:52,width:52,borderRadius:"50%",objectFit:"cover",boxShadow:"0 2px 8px rgba(0,0,0,.5)"}}/>
            <div>
              <div className="header-title">Estancia Filemón</div>
              <div className="header-sub">Gestión bovina · Ayolas, Paraguay</div>
            </div>
            <div className="header-stats">
              <div className="hstat"><div className="hstat-num">{animalesActivos.length}</div><div className="hstat-lbl">Cabezas</div></div>
              <div className="hstat"><div className="hstat-num">{animalesActivos.filter(a=>a.estado==="Preñada"||a.estado==="Prenada").length}</div><div className="hstat-lbl">Preñadas</div></div>
            </div>
          </div>
        </div>

        {/* Sync banner */}
        <div className={`sync-banner ${syncMsg.cls}`}>
          <span className={syncMsg.pulse?"pulse":""}>{syncMsg.icon}</span>
          <span>{syncMsg.txt}</span>
        </div>

        <div className="main">
          {tab==="dashboard"  && <Dashboard animales={animalesActivos} iatf={iatf} pariciones={pariciones} bajas={bajas} sanidad={sanidad} potreros={potreros} setTab={setTab}/>}
          {tab==="hacienda"   && <Hacienda animales={animalesActivos} addAnimal={addAnimal} updateAnimal={updateAnimal} removeAnimal={removeAnimal} iatf={iatf} pariciones={pariciones} sanidad={sanidad} pesajes={pesajes} addPesaje={addPesaje} removePesaje={removePesaje} setFichaAnimal={setFichaAnimal} editandoAnimal={editandoAnimal} setEditandoAnimal={setEditandoAnimal} addRotD={addRotD}/>}
          {tab==="iatf"       && <IATF iatf={iatf} addIatf={addIatf} removeIatf={removeIatf} updateIatf={updateIatf} animales={animalesActivos} updateAnimal={updateAnimal} setFichaAnimal={setFichaAnimal} torosDB={torosDB} addToroD={addToroD} removeToroD={removeToroD}/>}
          {tab==="prenez"     && <Prenez animales={animalesActivos} pariciones={pariciones} iatf={iatf} setFichaAnimal={setFichaAnimal}/>}
          {tab==="pariciones" && <Pariciones pariciones={pariciones} addPar={addPar} updatePar={updatePar} removePar={removePar} addAnimal={addAnimal} removeAnimal={removeAnimal} updateAnimal={updateAnimal} animales={animalesActivos} setFichaAnimal={setFichaAnimal}/>}
          {tab==="sanidad"    && <Sanidad sanidad={sanidad} addSan={addSan} updateSan={updateSan} removeSan={removeSan} animales={animalesActivos} setFichaAnimal={setFichaAnimal} productosDB={productosDB} addProd={addProd} removeProd={removeProd} addIatf={addIatf} updateAnimal={updateAnimal}/>}
          {tab==="potreros"   && <PiquerotasV2 potreros={potreros} addPot={addPot} updatePot={updatePot} removePot={removePot} animales={animalesActivos} updateAnimal={updateAnimal} rotacionesDB={rotacionesDB} addRotD={addRotD} removeRotD={removeRotD}/>}
          {tab==="bajas"      && <Bajas bajas={bajas} addBaja={addBaja} updateBaja={updateBaja} removeBaja={removeBaja} animales={animales} updateAnimal={updateAnimal} removeAnimal={removeAnimal} setFichaAnimal={setFichaAnimal}/>}
          {tab==="reportes"   && <Reportes animales={animales} iatf={iatf} pariciones={pariciones} sanidad={sanidad} bajas={bajas}/>}
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
      {fichaAnimal && <FichaAnimal
        animal={fichaAnimal}
        animales={animalesActivos}
        iatf={iatf}
        pariciones={pariciones}
        sanidad={sanidad}
        pesajes={pesajes}
        addPesaje={addPesaje}
        removePesaje={removePesaje}
        onEdit={a=>{setFichaAnimal(null);setEditandoAnimal(a);setTab("hacienda");}}
        onClose={()=>setFichaAnimal(null)}
      />}
    </>
  );
}


// ─── SORT HOOK ────────────────────────────────────────────────────────────────
function useSorter(defaultKey="caravana") {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState("asc");
  const toggleSort = (key) => {
    if(key === sortKey) setSortDir(d => d==="asc"?"desc":"asc");
    else { setSortKey(key); setSortDir("asc"); }
  };
  const sortFn = (arr) => [...arr].sort((a,b) => {
    const va = String(a[sortKey]||"").toLowerCase();
    const vb = String(b[sortKey]||"").toLowerCase();
    return sortDir==="asc" ? va.localeCompare(vb) : vb.localeCompare(va);
  });
  const icon = (key) => sortKey===key ? (sortDir==="asc"?" ▲":" ▼") : " ⇅";
  const thStyle = (key) => ({cursor:"pointer", userSelect:"none", whiteSpace:"nowrap",
    background: sortKey===key ? "rgba(212,168,90,.25)" : undefined});
  return {sortKey, sortDir, toggleSort, sortFn, icon, thStyle};
}



// ─── COLUMN FILTER HOOK ───────────────────────────────────────────────────────
function useColumnFilter(data, columns) {
  const [filters, setFilters] = useState({});
  const [openCol, setOpenCol] = useState(null);
  const toggleFilter=(col,val)=>setFilters(f=>{
    const cur=f[col]||[]; const next=cur.includes(val)?cur.filter(x=>x!==val):[...cur,val];
    return {...f,[col]:next};
  });
  const clearFilter=(col)=>setFilters(f=>({...f,[col]:[]}));
  const clearAll=()=>setFilters({});
  const isFiltered=(col)=>(filters[col]||[]).length>0;
  const anyFiltered=Object.values(filters).some(v=>v.length>0);
  const filteredData=data.filter(row=>columns.every(col=>{
    const active=filters[col]||[]; if(!active.length)return true;
    return active.includes(String(row[col]||""));
  }));
  const uniqueVals=(col)=>[...new Set(data.map(r=>String(r[col]||"")))].sort();
  return {filters,filteredData,toggleFilter,clearFilter,clearAll,isFiltered,anyFiltered,openCol,setOpenCol,uniqueVals};
}

function ColHeader({label,col,sorter,cfh,style}) {
  const {toggleSort,icon,thStyle}=sorter;
  const {toggleFilter,clearFilter,isFiltered,openCol,setOpenCol,uniqueVals,filters}=cfh;
  const open=openCol===col;
  const vals=uniqueVals(col);
  const active=filters[col]||[];
  useEffect(()=>{
    if(!open)return;
    const close=(e)=>{if(!e.target.closest(".col-dd"))setOpenCol(null);};
    document.addEventListener("mousedown",close);
    return()=>document.removeEventListener("mousedown",close);
  },[open]);
  return(
    <th style={{...thStyle(col),...(style||{}),position:"relative",whiteSpace:"nowrap"}}>
      <div style={{display:"flex",alignItems:"center",gap:3}}>
        <span style={{cursor:"pointer",flex:1}} onClick={()=>toggleSort(col)}>{label}{icon(col)}</span>
        <button onClick={e=>{e.stopPropagation();setOpenCol(open?null:col);}}
          style={{background:"none",border:"none",cursor:"pointer",padding:"0 2px",
            color:isFiltered(col)?"#4A7C4E":"rgba(44,26,14,.35)",fontSize:11,lineHeight:1}}>▾</button>
      </div>
      {open&&(
        <div className="col-dd" style={{position:"absolute",top:"100%",left:0,zIndex:500,
          background:"#fffdf5",border:"1.5px solid rgba(107,66,38,.2)",borderRadius:10,
          boxShadow:"0 8px 32px rgba(44,26,14,.18)",minWidth:150,maxHeight:240,
          overflowY:"auto",padding:"4px 0"}}>
          <div style={{padding:"4px 10px 6px",borderBottom:"1px solid rgba(107,66,38,.1)",
            display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:10,fontWeight:700,color:"#6B4226",textTransform:"uppercase",letterSpacing:".5px"}}>Filtrar</span>
            {isFiltered(col)&&<button onClick={()=>clearFilter(col)} style={{background:"none",border:"none",cursor:"pointer",fontSize:10,color:"#B03A2E",fontWeight:700}}>Limpiar</button>}
          </div>
          {vals.map(v=>(
            <label key={v} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 10px",
              cursor:"pointer",fontSize:12,fontFamily:"'Lora',serif",color:"#2C1A0E"}}>
              <input type="checkbox" checked={active.includes(v)} onChange={()=>toggleFilter(col,v)}
                style={{accentColor:"#6B4226",width:13,height:13}}/>
              {v||"(vacío)"}
            </label>
          ))}
        </div>
      )}
    </th>
  );
}

// ─── YEAR FILTER HOOK ─────────────────────────────────────────────────────────
const ANO_ACTUAL = String(new Date().getFullYear());

function useYearFilter(data, dateField) {
  const anos = ["Todos", ...new Set(
    data.map(r=>(r[dateField]||"").slice(0,4)).filter(Boolean)
  )].sort((a,b)=>b.localeCompare(a));
  const [anio, setAnio] = useState(
    anos.includes(ANO_ACTUAL) ? ANO_ACTUAL : (anos[1]||"Todos")
  );
  const filtered = anio==="Todos" ? data
    : data.filter(r=>(r[dateField]||"").startsWith(anio));
  const YearPills = ()=>(
    <div className="tab-pills" style={{marginBottom:4}}>
      <span style={{fontSize:10,color:"#8B5E3C",fontFamily:"'Roboto Slab',serif",
        padding:"5px 4px",whiteSpace:"nowrap"}}>Año:</span>
      {anos.map(a=>(
        <button key={a} className={`pill${anio===a?" active":""}`}
          onClick={()=>setAnio(a)}>{a}</button>
      ))}
    </div>
  );
  return {anio, setAnio, filtered, YearPills};
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({animales,iatf,pariciones,bajas,sanidad,potreros,setTab}) {
  const HOY = new Date();
  const ANO = String(HOY.getFullYear());
  
  // ── Rodeo ────────────────────────────────────────────────────────────────
  const total      = animales.length;
  const prenadas   = animales.filter(a=>a.estado==="Preñada"||a.estado==="Prenada").length;
  const pendientes = animales.filter(a=>a.estado==="Pendiente").length;
  const vacías     = animales.filter(a=>a.estado==="Vacía").length;
  const bajasMes   = bajas.filter(b=>(b.fecha||"").startsWith(ANO)).length;

  // ── IATF campaña más reciente ─────────────────────────────────────────────
  const campanias = [...new Set(iatf.map(i=>i.campania||"2025"))].sort((a,b)=>b.localeCompare(a));
  const ultimaCamp = campanias[0] || ANO;
  const iatfCamp   = iatf.filter(i=>(i.campania||"2025")===ultimaCamp);
  const iatfIns    = iatfCamp.filter(i=>i.protocolo==="Si"&&i.apta==="Apta").length;
  const iatfPren   = iatfCamp.filter(i=>i.resultado==="✅"&&i.origenPreniez==="IATF").length;
  const iatfRep    = iatfCamp.filter(i=>i.resultado==="✅"&&i.origenPreniez==="Repaso").length;
  const iatfAptas  = iatfCamp.filter(i=>i.apta==="Apta").length;
  const pct        = iatfIns>0?((iatfPren/iatfIns)*100).toFixed(1):0;
  const pctTotal   = iatfAptas>0?(((iatfPren+iatfRep)/iatfAptas)*100).toFixed(1):0;
  const torosIatf  = [...new Set(iatfCamp.map(i=>i.toro))].filter(Boolean);

  // ── Pariciones año actual ────────────────────────────────────────────────
  const partosAno  = pariciones.filter(p=>(p.fecha||"").startsWith(ANO));
  const ultPar     = [...partosAno].sort((a,b)=>b.fecha.localeCompare(a.fecha)).slice(0,5);

  // ── Partos estimados (gestación 283 días desde dia10 de IATF) ────────────
  const prenIatf = iatfCamp.filter(i=>i.resultado==="✅"&&i.dia10);
  const HOY_STR = `${HOY.getFullYear()}-${String(HOY.getMonth()+1).padStart(2,"0")}-${String(HOY.getDate()).padStart(2,"0")}`;
  // Caravanas que ya parieron en esta campaña
  const yaParieronCamp = new Set(pariciones.filter(p=>p.fecha>=`${ultimaCamp}-09-01`).map(p=>p.madreCaravana));
  const partosEst = prenIatf
    .filter(i=>!yaParieronCamp.has(i.caravana)) // excluir las que ya parieron
    .map(i=>{
      const d = new Date(i.dia10 + "T12:00:00");
      d.setDate(d.getDate()+283);
      const fechaEst = d.toISOString().split("T")[0];
      const hoyD = new Date(HOY_STR+"T12:00:00");
      const diasFaltan = Math.round((d-hoyD)/86400000);
      return {caravana:i.caravana, fechaEst, diasFaltan};
    }).sort((a,b)=>a.fechaEst.localeCompare(b.fechaEst));
  const proxPartosEst = partosEst.filter(p=>p.diasFaltan>=-7).slice(0,6);

  // ── Lotes ────────────────────────────────────────────────────────────────
  const lotes = ["General","Cbo3","Cbo4","Cbo5","Cbo6","Cbo7"].map(l=>({
    l, n:animales.filter(a=>a.lote===l).length
  })).filter(x=>x.n>0);

  // ── Sanidad reciente ─────────────────────────────────────────────────────
  const ultSan = [...sanidad].sort((a,b)=>b.fecha.localeCompare(a.fecha)).slice(0,3);

  return (
    <div>
      <div className="section-hdr">
        <h2>🏡 Panel General</h2>
        <span className="txt-muted">{HOY.toLocaleDateString("es-AR",{day:"numeric",month:"short",year:"numeric"})}</span>
      </div>

      {/* Stats principales */}
      <div className="grid4" style={{marginBottom:16}}>
        <div className="statbox" data-icon="🐄"><div className="statbox-num">{total}</div><div className="statbox-lbl">Total cabezas</div></div>
        <div className="statbox verde" data-icon="🤰"><div className="statbox-num">{prenadas}</div><div className="statbox-lbl">Preñadas</div></div>
        <div className="statbox paja" data-icon="⏳"><div className="statbox-num">{pendientes}</div><div className="statbox-lbl">Pendientes</div></div>
        <div className="statbox cielo" data-icon="🐮"><div className="statbox-num">{vacías}</div><div className="statbox-lbl">Vacías</div></div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        {/* Rodeo por lote */}
        <div className="card">
          <div className="card-title">🐄 Rodeo por Lote</div>
          {lotes.map(({l,n})=>(
            <div key={l} style={{marginBottom:8}}>
              <div className="flex" style={{justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:12,fontWeight:600}}>{l}</span>
                <strong style={{fontFamily:"'Playfair Display',serif"}}>{n}</strong>
              </div>
              <div className="prog-bar"><div className="prog-fill" style={{width:`${(n/total)*100}%`,background:`linear-gradient(90deg,${C.tierra},${C.paja})`}}/></div>
            </div>
          ))}
        </div>

        {/* IATF campaña más reciente */}
        <div className="card">
          <div className="card-title">🧬 Servicios {ultimaCamp}</div>
          <div className="grid2" style={{gap:8,marginBottom:10}}>
            <div style={{textAlign:"center",padding:"8px 4px",background:"rgba(74,124,78,.1)",borderRadius:8}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:C.hierba}}>{pct}%</div>
              <div style={{fontSize:10,color:"#8B5E3C"}}>% IATF</div>
            </div>
            <div style={{textAlign:"center",padding:"8px 4px",background:"rgba(212,168,90,.1)",borderRadius:8}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:C.paja}}>{pctTotal}%</div>
              <div style={{fontSize:10,color:"#8B5E3C"}}>% Total</div>
            </div>
          </div>
          {torosIatf.map(t=>{
            const m=iatfCamp.filter(i=>i.toro===t);
            const ins=m.filter(i=>i.protocolo==="Si"&&i.apta==="Apta").length;
            const p=m.filter(i=>i.resultado==="✅"&&i.origenPreniez==="IATF").length;
            const pc=ins>0?Math.round((p/ins)*100):0;
            return <div key={t} style={{marginBottom:6}}>
              <div className="flex" style={{justifyContent:"space-between",marginBottom:2}}>
                <span style={{fontSize:11,fontWeight:600}}>{t}</span>
                <span style={{fontSize:11}}>{p}/{ins} — <strong>{pc}%</strong></span>
              </div>
              <div className="prog-bar"><div className="prog-fill" style={{width:`${pc}%`,background:pc>=50?C.hierba:C.rojo}}/></div>
            </div>;
          })}
        </div>
      </div>

      {/* Partos estimados */}
      {proxPartosEst.length>0&&(
        <div className="card mb">
          <div className="card-title">🗓️ Partos Estimados — gestación 283 días desde IATF {ultimaCamp}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>
            {proxPartosEst.map(p=>(
              <div key={p.caravana} style={{background:p.diasFaltan<=30?"rgba(176,58,46,.08)":p.diasFaltan<=60?"rgba(212,168,90,.1)":"rgba(74,124,78,.08)",
                borderRadius:10,padding:"10px 12px",textAlign:"center",
                border:`1px solid ${p.diasFaltan<=30?"rgba(176,58,46,.2)":p.diasFaltan<=60?"rgba(212,168,90,.3)":"rgba(74,124,78,.2)"}`}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700,color:C.tierra}}>Car. {p.caravana}</div>
                <div style={{fontSize:11,color:"#8B5E3C",margin:"3px 0"}}>{p.fechaEst}</div>
                <div style={{fontSize:12,fontWeight:700,color:p.diasFaltan<=30?C.rojo:p.diasFaltan<=60?C.paja:C.hierba}}>
                  {p.diasFaltan<0?`${Math.abs(p.diasFaltan)}d atraso`:p.diasFaltan===0?"¡Hoy!":p.diasFaltan===1?"Mañana":`${p.diasFaltan} días`}
                </div>
              </div>
            ))}
          </div>
          {partosEst.length>6&&<div className="txt-muted" style={{fontSize:11,marginTop:8}}>+{partosEst.length-6} más — ver módulo Preñez</div>}
        </div>
      )}

      {/* Últimos partos del año */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div className="card">
          <div className="card-title">🐣 Últimos Partos {ANO}</div>
          {ultPar.length===0&&<div className="txt-muted" style={{fontSize:12}}>Sin partos registrados este año</div>}
          {ultPar.map(p=>(
            <div key={p.id} className="flex" style={{marginBottom:8,paddingBottom:8,borderBottom:"1px solid rgba(107,66,38,.08)"}}>
              <span style={{fontSize:16}}>🐄</span>
              <div style={{flex:1,marginLeft:8}}>
                <div style={{fontSize:12,fontWeight:600}}>Madre car. {p.madreCaravana}</div>
                <div className="txt-muted" style={{fontSize:11}}>{p.fecha} · {p.terneroSexo==="H"?"♀":"♂"}{p.pesoNac>0?` · ${p.pesoNac}kg`:""}</div>
              </div>
              <span className={`badge ${p.estado==="Baja"?"badge-rojo":"badge-verde"}`} style={{fontSize:9}}>{p.tipo}</span>
            </div>
          ))}
          {partosAno.length>0&&<div style={{fontSize:11,color:C.tierra,fontWeight:600,marginTop:4}}>Total {ANO}: {partosAno.length} partos</div>}
        </div>

        {/* Sanidad reciente */}
        <div className="card">
          <div className="card-title">💉 Sanidad Reciente</div>
          {ultSan.length===0&&<div className="txt-muted" style={{fontSize:12}}>Sin registros</div>}
          {ultSan.map(s=>(
            <div key={s.id} style={{marginBottom:8,paddingBottom:8,borderBottom:"1px solid rgba(107,66,38,.08)"}}>
              <div style={{fontSize:12,fontWeight:600}}>{s.producto}</div>
              <div className="txt-muted" style={{fontSize:11}}>{s.fecha} · {s.lote}{s.caravana?` · Car.${s.caravana}`:""}</div>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" style={{marginTop:4,fontSize:11}} onClick={()=>setTab("sanidad")}>Ver todo →</button>
        </div>
      </div>
    </div>
  );
}

function Hacienda({animales,addAnimal,updateAnimal,removeAnimal,iatf,pariciones,sanidad,pesajes,addPesaje,removePesaje,setFichaAnimal,editandoAnimal,setEditandoAnimal,addRotD}) {
  const blank={caravana:"",nombre:"",categoria:"Vaca",lote:"General",ubicacion:"",estado:"OK",toroPreñez:"",fechaNac:"",madreCaravana:"",padreCaravana:"",pesoInicial:"",obs:""};
  const [form,setForm]=useState(blank);
  const [edit,setEdit]=useState(null);
  const [showModal,setShowModal]=useState(false);
  const [filtro,setFiltro]=useState("");
  const [loteF,setLoteF]=useState("Todos");
  const [error,setError]=useState("");
  const [showMoverLote,setShowMoverLote]=useState(false);
  const [moverLoteForm,setMoverLoteForm]=useState({lote:"",ubicacion:"",entrada:today()});
  const [showCambiarCat,setShowCambiarCat]=useState(false);
  const [cambiarCatForm,setCambiarCatForm]=useState({lote:"",categoriaOrigen:"",categoriaDestino:""});
  const vacas=animales.filter(a=>["Vaca","Vaquilla"].includes(a.categoria));
  const {sortFn:hSort,toggleSort:hToggle,icon:hIcon,thStyle:hTh}=useSorter("caravana");
  const hBase=hSort(animales.filter(a=>{
    const lOk=loteF==="Todos"||a.lote===loteF;
    const bOk=!filtro||a.caravana.toLowerCase().includes(filtro.toLowerCase())||a.categoria.toLowerCase().includes(filtro.toLowerCase());
    return lOk&&bOk;
  }));
  const hCfh=useColumnFilter(hBase,["caravana","categoria","lote","estado","fechaNac"]);

  const abrirNuevo=()=>{setForm(blank);setEdit(null);setError("");setShowModal(true);};
  const abrirEditar=a=>{setForm({...a,toroPreñez:a.toroPreñez||""});setEdit(a.id);setError("");setShowModal(true);};
  const cambiarCategoriaLote=async()=>{
    const{lote,categoriaOrigen,categoriaDestino}=cambiarCatForm;
    if(!lote||!categoriaDestino)return;
    const animalesFiltrados=animales.filter(a=>a.lote===lote&&(categoriaOrigen===""||a.categoria===categoriaOrigen));
    if(!animalesFiltrados.length){alert("No hay animales con esos criterios");return;}
    if(!window.confirm(`¿Cambiar categoría de ${animalesFiltrados.length} animales del lote ${lote}${categoriaOrigen?` (${categoriaOrigen})`:""}  →  ${categoriaDestino}?`))return;
    for(const a of animalesFiltrados){
      await updateAnimal(a.id,{...a,categoria:categoriaDestino});
    }
    alert(`✅ ${animalesFiltrados.length} animales → ${categoriaDestino}`);
    setShowCambiarCat(false);
    setCambiarCatForm({lote:"",categoriaOrigen:"",categoriaDestino:""});
  };

  const moverLoteCompleto=async()=>{
    const{lote,ubicacion,entrada}=moverLoteForm;
    if(!lote||!ubicacion)return;
    const animalesLote=animales.filter(a=>a.lote===lote);
    if(!animalesLote.length){alert("No hay animales en ese lote");return;}
    if(!window.confirm(`¿Mover ${animalesLote.length} animales del lote ${lote} a ${ubicacion}?`))return;
    for(const a of animalesLote){
      await updateAnimal(a.id,{...a,ubicacion});
    }
    const UBIC_MAP={"Campo Grande":11,"Escuela":10,"P1":1,"P2":2,"P3":3,"P4":4,"P5":5,"P6":6,"P7":7,"P8":8,"P9":9};
    if(addRotD){
      const piqDestId=UBIC_MAP[ubicacion]||0;
      const rotActivaDest=rotacionesDB&&rotacionesDB.find(r=>r.piqueteId===piqDestId&&(!r.salida||new Date(r.salida)>=new Date()));
      if(!rotActivaDest&&piqDestId){
        await addRotD({piqueteId:piqDestId,lote,entrada,salida:"",obs:`Lote ${lote} → ${ubicacion}`});
      }
      // Cerrar piquetes origen que quedaron vacíos
      const ubicsAnteriores=[...new Set(animalesLote.map(a=>a.ubicacion).filter(Boolean).filter(u=>u!==ubicacion))];
      for(const ubAnterior of ubicsAnteriores){
        const piqAnteriorId=UBIC_MAP[ubAnterior]||0;
        const animRestantes=animales.filter(a=>a.ubicacion===ubAnterior&&!animalesLote.find(x=>x.id===a.id));
        if(animRestantes.length===0&&piqAnteriorId){
          const rotAnterior=rotacionesDB&&rotacionesDB.find(r=>r.piqueteId===piqAnteriorId&&(!r.salida||new Date(r.salida)>=new Date()));
          if(rotAnterior){
            await removeRotD(rotAnterior.id);
            await addRotD({...rotAnterior,id:undefined,salida:today(),obs:`Cerrado — lote ${lote} mudado a ${ubicacion}`});
          }
        }
      }
    }
    alert(`✅ ${animalesLote.length} animales del lote ${lote} → ${ubicacion}`);
    setShowMoverLote(false);
    setMoverLoteForm({lote:"",ubicacion:"",entrada:today()});
  };
  useEffect(()=>{if(editandoAnimal){abrirEditar(editandoAnimal);setEditandoAnimal(null);}},[editandoAnimal]);
  const cerrar=()=>{setShowModal(false);setEdit(null);setError("");};

  const guardar=async()=>{
    if(!form.caravana.trim()){setError("La caravana es obligatoria.");return;}
    const dup=animales.find(a=>a.caravana.trim().toLowerCase()===form.caravana.trim().toLowerCase()&&a.id!==edit);
    if(dup){setError(`⚠️ Ya existe un animal con caravana "${form.caravana}".`);return;}
    if(edit){
      const animal=animales.find(a=>a.id===edit);
      await updateAnimal(edit, form);
      if(form.ubicacion&&form.ubicacion!==(animal?.ubicacion||"")&&addRotD){
        const UBIC_MAP2={"Campo Grande":11,"Escuela":10,"P1":1,"P2":2,"P3":3,"P4":4,"P5":5,"P6":6,"P7":7,"P8":8,"P9":9};
        const ubicAnterior=animal?.ubicacion||"";
        const piqId2=UBIC_MAP2[form.ubicacion]||0;
        // Solo crear rotación en destino si no hay una activa
        const rotActiva2=rotacionesDB&&rotacionesDB.find(r=>r.piqueteId===piqId2&&(!r.salida||new Date(r.salida)>=new Date()));
        if(!rotActiva2&&piqId2){
          await addRotD({piqueteId:piqId2,lote:form.lote,entrada:today(),salida:"",obs:`${form.caravana} → ${form.ubicacion}`});
        }
        // Si el piquete origen quedó vacío → cerrar su rotación automáticamente
        if(ubicAnterior){
          const piqOrigenId=UBIC_MAP2[ubicAnterior]||0;
          const animRestantes=animales.filter(a=>a.ubicacion===ubicAnterior&&a.id!==animal.id);
          if(animRestantes.length===0&&piqOrigenId){
            const rotOrigen=rotacionesDB&&rotacionesDB.find(r=>r.piqueteId===piqOrigenId&&(!r.salida||new Date(r.salida)>=new Date()));
            if(rotOrigen){
              await removeRotD(rotOrigen.id);
              await addRotD({...rotOrigen,id:undefined,salida:today(),obs:"Cerrado automáticamente — piquete vacío"});
            }
          }
        }
      }
    } else await addAnimal(form);
    cerrar();
  };

  const eliminar=async id=>{if(window.confirm("¿Eliminar este animal?")) await removeAnimal(id);};

  const rows=hCfh.filteredData;

  const ec={OK:"badge-verde",Preñada:"badge-paja","Vacía":"badge-gris",Descarte:"badge-rojo",Vendida:"badge-gris"};
  const MODAL_STYLE=``;

  return (
    <div>
      <style>{MODAL_STYLE}</style>

      {showModal&&(
        <div className="modal-overlay" onClick={e=>{if(e.target.className.includes("modal-overlay"))cerrar();}}>
          <div className="modal-box">
            <button className="modal-close" onClick={cerrar}>✕</button>
            <div className="modal-title">{edit?"✏️ Editar Animal":"➕ Nuevo Animal"}</div>
            {error&&<div className="error-msg">{error}</div>}
            <div className="form-row">
              <div className="field"><label>Caravana *</label><input value={form.caravana} onChange={e=>{setForm({...form,caravana:e.target.value});setError("");}}/></div>
              <div className="field"><label>Nombre</label><input value={form.nombre||""} onChange={e=>setForm({...form,nombre:e.target.value})}/></div>
            </div>
            <div className="form-row">
              <div className="field"><label>Categoría</label><select value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})}>
                {["Vaca","Vaquilla","Ternera","Ternero","Desmamante H","Toro"].map(c=><option key={c}>{c}</option>)}
              </select></div>
              <div className="field"><label>Lote</label><select value={form.lote} onChange={e=>setForm({...form,lote:e.target.value})}>
                {["General","Campo Grande","Rotación","Cbo3","Cbo4","Cbo5","Cbo6","Cbo7"].map(l=><option key={l}>{l}</option>)}
              </select></div>
            </div>
            <div className="form-row">
              <div className="field"><label>Estado</label><select value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})}>
                {["OK","Preñada","Vacía","Apta","No Apta","Descarte","Vendida"].map(s=><option key={s}>{s}</option>)}
              </select></div>
              <div className="field"><label>{form.estado==="Preñada"?"🐂 Toro de preñez":"Obs."}</label>
                {form.estado==="Preñada"
                  ? <select value={form.toroPreñez||""} onChange={e=>setForm({...form,toroPreñez:e.target.value})}>
                      <option value="">Sin asignar</option>
                      {["Nando","Fokker","Eficaz","Campero","Tabasco","Toro propio","Otro"].map(t=><option key={t}>{t}</option>)}
                    </select>
                  : <input value={form.obs||""} onChange={e=>setForm({...form,obs:e.target.value})}/>
                }
              </div>
            </div>
            <div className="form-row">
              <div className="field"><label>📍 Ubicación actual</label>
                <select value={form.ubicacion||""} onChange={e=>setForm({...form,ubicacion:e.target.value})}>
                  <option value="">— Sin asignar —</option>
                  <option>Campo Grande</option>
                  <option>P1</option><option>P2</option><option>P3</option>
                  <option>P4</option><option>P5</option><option>P6</option>
                  <option>P7</option><option>P8</option><option>P9</option>
                  <option>Escuela</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field"><label>📅 Fecha nacimiento</label><input type="date" value={form.fechaNac||""} onChange={e=>setForm({...form,fechaNac:e.target.value})}/></div>
              <div className="field"><label>🐄 Madre</label>
                <select value={form.madreCaravana||""} onChange={e=>setForm({...form,madreCaravana:e.target.value})}>
                  <option value="">Sin asignar</option>
                  {vacas.map(v=><option key={v.id} value={v.caravana}>Car. {v.caravana}{v.nombre?" – "+v.nombre:""}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field"><label>🐂 Padre (toro)</label>
                <select value={form.padreCaravana||""} onChange={e=>setForm({...form,padreCaravana:e.target.value})}>
                  <option value="">Sin asignar</option>
                  {animales.filter(a=>a.categoria==="Toro").map(t=><option key={t.id} value={t.caravana}>Car. {t.caravana}{t.nombre?" – "+t.nombre:""}</option>)}
                  {["Nando","Fokker","Eficaz","Campero","Tabasco","Toro propio"].map(t=><option key={t} value={t}>{t} (IATF)</option>)}
                </select>
              </div>
              <div className="field"><label>⚖️ Peso inicial (kg)</label>
                <input type="number" min="0" placeholder="kg" value={form.pesoInicial||""} onChange={e=>setForm({...form,pesoInicial:e.target.value})}/>
              </div>
            </div>
            {form.estado==="Preñada"&&(
              <div className="field" style={{marginBottom:12}}>
                <label>Obs.</label>
                <input value={form.obs||""} onChange={e=>setForm({...form,obs:e.target.value})}/>
              </div>
            )}
            <div className="flex mt">
              <button className="btn btn-verde" onClick={guardar}>💾 Guardar</button>
              <button className="btn btn-ghost btn-sm" onClick={cerrar}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showCambiarCat&&(
        <div className="modal-overlay" onClick={e=>{if(e.target.className.includes("modal-overlay"))setShowCambiarCat(false);}}>
          <div className="modal-box">
            <div className="modal-title">🔄 Cambiar Categoría al Lote</div>
            <div className="form-row">
              <div className="field"><label>Lote</label>
                <select value={cambiarCatForm.lote} onChange={e=>setCambiarCatForm({...cambiarCatForm,lote:e.target.value})}>
                  <option value="">Seleccionar...</option>
                  {["General","Cbo3","Cbo4","Cbo5","Cbo6","Cbo7"].map(l=><option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="field"><label>Categoría actual (opcional)</label>
                <select value={cambiarCatForm.categoriaOrigen} onChange={e=>setCambiarCatForm({...cambiarCatForm,categoriaOrigen:e.target.value})}>
                  <option value="">Todas las categorías</option>
                  {["Vaca","Vaquilla","Toro","Novillo","Ternero","Ternera","Desmamante Macho","Desmamante Hembra"].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field"><label>Nueva categoría</label>
                <select value={cambiarCatForm.categoriaDestino} onChange={e=>setCambiarCatForm({...cambiarCatForm,categoriaDestino:e.target.value})}>
                  <option value="">Seleccionar...</option>
                  {["Vaca","Vaquilla","Toro","Novillo","Ternero","Ternera","Desmamante Macho","Desmamante Hembra"].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="field" style={{justifyContent:"flex-end",display:"flex",alignItems:"flex-end"}}>
                {cambiarCatForm.lote&&<div style={{fontSize:11,color:"#6B4226",fontWeight:600}}>
                  {animales.filter(a=>a.lote===cambiarCatForm.lote&&(cambiarCatForm.categoriaOrigen===""||a.categoria===cambiarCatForm.categoriaOrigen)).length} animales a cambiar
                </div>}
              </div>
            </div>
            <div className="flex mt">
              <button className="btn btn-verde" onClick={cambiarCategoriaLote}>🔄 Cambiar</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowCambiarCat(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {showMoverLote&&(
        <div className="modal-overlay" onClick={e=>{if(e.target.className.includes("modal-overlay"))setShowMoverLote(false);}}>
          <div className="modal-box">
            <div className="modal-title">📍 Mover Lote Completo</div>
            <div className="form-row">
              <div className="field"><label>Lote a mover</label>
                <select value={moverLoteForm.lote} onChange={e=>setMoverLoteForm({...moverLoteForm,lote:e.target.value})}>
                  <option value="">Seleccionar...</option>
                  {["General","Cbo3","Cbo4","Cbo5","Cbo6","Cbo7"].map(l=><option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="field"><label>Ubicación destino</label>
                <select value={moverLoteForm.ubicacion} onChange={e=>setMoverLoteForm({...moverLoteForm,ubicacion:e.target.value})}>
                  <option value="">Seleccionar...</option>
                  {["Campo Grande","P1","P2","P3","P4","P5","P6","P7","P8","P9","Escuela"].map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field"><label>📅 Fecha de ingreso</label>
                <input type="date" value={moverLoteForm.entrada} onChange={e=>setMoverLoteForm({...moverLoteForm,entrada:e.target.value})}/>
              </div>
              <div className="field" style={{justifyContent:"flex-end",display:"flex",alignItems:"flex-end"}}>
                {moverLoteForm.lote&&<div style={{fontSize:11,color:"#6B4226",fontWeight:600}}>
                  {animales.filter(a=>a.lote===moverLoteForm.lote).length} animales a mover
                </div>}
              </div>
            </div>
            <div className="flex mt">
              <button className="btn btn-verde" onClick={moverLoteCompleto}>📍 Mover</button>
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowMoverLote(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      <div className="section-hdr">
        <h2>🐄 Hacienda</h2>
        <button className="btn btn-prim btn-sm" onClick={abrirNuevo}>＋ Agregar</button>
        <button className="btn btn-ghost btn-sm" onClick={()=>setShowMoverLote(true)}>📍 Mover lote</button>
        <button className="btn btn-ghost btn-sm" onClick={()=>setShowCambiarCat(true)}>🔄 Categoría</button>
      </div>
      <div className="card">
        <div className="tab-pills">
          {["Todos","General","Cbo3","Cbo4","Cbo5","Cbo6","Cbo7"].map(l=><button key={l} className={`pill${loteF===l?" active":""}`} onClick={()=>setLoteF(l)}>{l}</button>)}
        </div>
        <input className="search-input mb" placeholder="🔍 Buscar caravana / categoría..." value={filtro} onChange={e=>setFiltro(e.target.value)}/>

        <div className="txt-muted mb">{rows.length} animales</div>
        <div className="tbl-wrap">
          <table>
            <thead><tr>
                    <th style={hTh("caravana")} onClick={()=>hToggle("caravana")}>Car.{hIcon("caravana")}</th>
                    <th style={hTh("categoria")} onClick={()=>hToggle("categoria")}>Cat.{hIcon("categoria")}</th>
                    <th style={hTh("lote")} onClick={()=>hToggle("lote")}>Lote{hIcon("lote")}</th>
                    <th style={hTh("estado")} onClick={()=>hToggle("estado")}>Estado{hIcon("estado")}</th>
                    <th>Madre</th><th style={hTh("fechaNac")} onClick={()=>hToggle("fechaNac")}>Nació{hIcon("fechaNac")}</th>
                    <th>Toro</th><th>Obs.</th><th></th>
                  </tr></thead>
            <tbody>
              {rows.map(a=>(
                <tr key={a.id}>
                  <td><button className="btn btn-ghost btn-sm" style={{padding:"2px 8px",fontWeight:700,fontSize:12}} onClick={()=>setFichaAnimal(a)}>{a.caravana}</button></td>
                  <td style={{fontSize:11}}>{a.categoria}</td>
                  <td><span className="badge badge-cielo">{a.lote}</span>{a.ubicacion&&<span className="badge badge-paja" style={{fontSize:9,marginLeft:3}}>📍{a.ubicacion}</span>}{a.servicioAsignado&&<span className={`badge ${a.servicioAsignado==="Sin servicio"?"badge-rojo":a.servicioAsignado==="TE"?"badge-paja":"badge-verde"}`} style={{fontSize:8,marginLeft:3}}>{a.servicioAsignado}</span>}</td>
                  <td><span className={`badge ${ec[a.estado]||"badge-gris"}`}>{a.estado}</span></td>
                  <td style={{fontSize:11}}>{a.madreCaravana?<button className="btn btn-ghost btn-sm" style={{padding:"2px 8px",fontSize:10}} onClick={()=>setMadreF(a.madreCaravana)}>🔍 {a.madreCaravana}</button>:<span className="txt-muted">—</span>}</td>
                  <td style={{fontSize:11,color:"rgba(44,26,14,.5)"}}>{a.fechaNac||"—"}</td>
                  <td style={{fontSize:11,color:a.toroPreñez?"#6B4226":"rgba(44,26,14,.35)"}}>{a.toroPreñez||"—"}</td>
                  <td className="txt-muted" style={{maxWidth:90,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.obs||"—"}</td>
                  <td>
                    <div className="flex">
                      <button className="btn btn-prim btn-sm" onClick={()=>abrirEditar(a)}>✏️</button>
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
function IATF({iatf,addIatf,removeIatf,updateIatf,animales,updateAnimal,setFichaAnimal,torosDB,addToroD,removeToroD}) {
  const blank={caravana:"",lote:"Cbo4",apta:"Apta",protocolo:"Si",toro:"",tipoServicio:"IATF",resultado:"❌",origenPreniez:"",obs:"",campania:"2026",dia0:"",dia8:"",dia10:""};
  const [editandoId,setEditandoId]=useState(null);
  const [form,setForm]=useState(blank);
  const [showForm,setShowForm]=useState(false);
  const torosDefault=["Nando","Fokker","Eficaz","Campero","Tabasco","Toro propio"];
  const [nuevoToro,setNuevoToro]=useState("");
  const [showAddToro,setShowAddToro]=useState(false);
  // Merge default + DB toros, deduplicated
  const torosExtra=torosDB.map(t=>t.nombre).filter(n=>!torosDefault.includes(n));
  const toros=[...torosDefault,...torosExtra];
  const agregarToro=async()=>{
    const t=nuevoToro.trim();
    if(!t||toros.includes(t))return;
    await addToroD({nombre:t});
    setForm(f=>({...f,toro:t}));
    setNuevoToro("");
    setShowAddToro(false);
  };
  const eliminarToro=async(nombre)=>{
    if(torosDefault.includes(nombre))return;
    const doc=torosDB.find(t=>t.nombre===nombre);
    if(doc) await removeToroD(doc.id);
  };
  const [loteF,setLoteF]=useState("Todos");

  // Sync animal estado in Hacienda based on IATF result
  const sincronizarAnimal=async(f)=>{
    const animal=animales.find(a=>a.caravana===f.caravana);
    if(!animal) return;
    if(f.resultado==="✅") {
      await updateAnimal(animal.id,{...animal, estado:"Preñada", toroPreñez:f.toro});
    } else if(f.resultado==="❌") {
      await updateAnimal(animal.id,{...animal, estado:"Vacía"});
    }
    // ⏳ = no change
  };

  const guardar=async()=>{
    if(!form.caravana)return;
    if(editandoId){
      const {id:_,...rest}=form;
      await updateIatf(editandoId,rest);
      await sincronizarAnimal(rest);
      setEditandoId(null);
    } else {
      await addIatf(form);
      await sincronizarAnimal(form);
    }
    setForm(blank);setShowForm(false);
  };
  const cancelar=()=>{setForm(blank);setEditandoId(null);setShowForm(false);};
  const eliminar=async id=>{if(window.confirm("¿Eliminar?")) await removeIatf(id);};
  const abrirEditar=(i)=>{
    setForm({...blank,...i});
    setEditandoId(i.id);
    setShowForm(true);
  };

  const {sortFn:iSort,toggleSort:iToggle,icon:iIcon,thStyle:iTh}=useSorter("caravana");
  const [campaniaF,setCampaniaF]=useState(()=>{
    // Default to most recent campaign in data, fallback to current year
    const years=[...new Set(iatf.map(i=>i.campania||"2025"))].sort((a,b)=>b.localeCompare(a));
    return years[0]||ANO_ACTUAL;
  });
  const campanias=[...new Set(iatf.map(i=>i.campania||"2025"))].sort((a,b)=>b.localeCompare(a));
  const rowsF=(loteF==="Todos"?iatf:iatf.filter(i=>i.lote===loteF))
    .filter(i=>campaniaF==="Todas"||(i.campania||"2025")===campaniaF);
  const rows=iSort(rowsF);
  const aptas        = rows.filter(i=>i.apta==="Apta").length;
  const inseminadas  = rows.filter(i=>i.protocolo==="Si"&&i.apta==="Apta").length;
  const aptasNoIatf  = rows.filter(i=>i.apta==="Apta"&&i.protocolo==="No").length;
  const pend         = rows.filter(i=>i.resultado==="⏳").length;
  const prenIatf     = rows.filter(i=>i.resultado==="✅"&&i.origenPreniez==="IATF").length;
  const prenRepaso   = rows.filter(i=>i.resultado==="✅"&&i.origenPreniez==="Repaso").length;
  const prenTotal    = rows.filter(i=>i.resultado==="✅").length;
  const pren         = prenIatf;

  return (
    <div>
      {showForm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(44,26,14,.7)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",overflow:"auto"}} onClick={e=>{if(e.target===e.currentTarget)cancelar();}}>
        <div style={{background:"linear-gradient(145deg,#fffdf5,#EDE0C4)",borderRadius:16,width:"100%",maxWidth:540,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(44,26,14,.6)",padding:"20px",position:"relative"}}>
          <div className="card-title" style={{marginBottom:12}}>{editandoId?"✏️ Editando servicio":"➕ Nuevo servicio"}</div>
          <div className="form-row">
            <div className="field"><label>Caravana</label><input value={form.caravana} onChange={e=>setForm({...form,caravana:e.target.value})}/></div>
            <div className="field"><label>Lote</label><select value={form.lote} onChange={e=>setForm({...form,lote:e.target.value})}><option>General</option><option>Cbo4</option><option>Cbo5</option></select></div>
          </div>
          <div className="form-row">
            <div className="field"><label>📅 Campaña</label><input value={form.campania||""} onChange={e=>setForm({...form,campania:e.target.value})} placeholder="ej: 2026"/></div>
            <div className="field"><label>GDR</label><select value={form.apta} onChange={e=>setForm({...form,apta:e.target.value,protocolo:e.target.value==="No Apta"?"No":form.protocolo})}><option>Apta</option><option>No Apta</option></select></div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>💉 Se realizó la IATF</label>
              <select value={form.protocolo} onChange={e=>setForm({...form,protocolo:e.target.value,resultado:e.target.value==="No"?"❌":form.resultado,origenPreniez:e.target.value==="No"?"":form.origenPreniez})} disabled={form.apta==="No Apta"} style={{opacity:form.apta==="No Apta"?0.4:1}}>
                <option value="Si">✅ Sí — se inseminó</option>
                <option value="No">❌ No — faltó dispositivo / otro motivo</option>
              </select>
            </div>
            <div className="field"><label>Motivo si no se hizo</label>
              <input value={form.motivoNoIatf||""} onChange={e=>setForm({...form,motivoNoIatf:e.target.value})} placeholder="ej: faltó dispositivo" disabled={form.protocolo!=="No"} style={{opacity:form.protocolo!=="No"?0.4:1}}/>
            </div>
          </div>
          <div className="form-row">
            <div className="field"><label>📅 Día 0 (dispositivo)</label><input type="date" value={form.dia0||""} onChange={e=>setForm({...form,dia0:e.target.value})}/></div>
            <div className="field"><label>📅 Día 8 (retiro)</label><input type="date" value={form.dia8||""} onChange={e=>setForm({...form,dia8:e.target.value})}/></div>
          </div>
          <div className="form-row">
            <div className="field"><label>📅 Día 10 (inseminación)</label><input type="date" value={form.dia10||""} onChange={e=>setForm({...form,dia10:e.target.value})}/></div>
            <div className="field"><label>🐂 Toro</label>
              <div style={{display:"flex",gap:6,flexDirection:"column"}}>
                <select value={form.tipoServicio||"IATF"} onChange={e=>setForm({...form,tipoServicio:e.target.value})}
                  style={{fontSize:12,padding:"6px 10px",borderRadius:8,border:"1.5px solid rgba(107,66,38,.2)",background:"rgba(255,253,245,.9)",fontFamily:"'Lora',serif"}}>
                  <option value="IATF">💉 IATF</option>
                  <option value="TE">🧬 TE (Transferencia de Embriones)</option>
                  <option value="Repaso toro">🐂 Repaso con toro</option>
                </select>
                <select style={{flex:1}} value={form.toro} onChange={e=>setForm({...form,toro:e.target.value})}>
                  {toros.map(t=><option key={t}>{t}</option>)}
                </select>
                <button type="button" className="btn btn-ghost btn-sm" style={{padding:"4px 10px",fontSize:16,lineHeight:1}} onClick={()=>setShowAddToro(v=>!v)} title="Agregar toro">＋</button>
              </div>
              {showAddToro&&(
                <div style={{marginTop:6,display:"flex",gap:6,flexWrap:"wrap"}}>
                  <input style={{flex:1,minWidth:120,padding:"6px 10px",borderRadius:7,border:"1.5px solid rgba(107,66,38,.3)",fontFamily:"'Lora',serif",fontSize:13}} placeholder="Nombre del toro / semen" value={nuevoToro} onChange={e=>setNuevoToro(e.target.value)} onKeyDown={e=>e.key==="Enter"&&agregarToro()}/>
                  <button className="btn btn-verde btn-sm" onClick={agregarToro}>Agregar</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setShowAddToro(false)}>✕</button>
                </div>
              )}
              {showAddToro&&toros.filter(t=>!torosDefault.includes(t)).length>0&&(
                <div style={{marginTop:6,display:"flex",gap:4,flexWrap:"wrap"}}>
                  {toros.filter(t=>!torosDefault.includes(t)).map(t=>(
                    <span key={t} style={{background:"rgba(107,66,38,.1)",borderRadius:20,padding:"2px 8px",fontSize:11,display:"flex",gap:4,alignItems:"center",fontFamily:"'Lora',serif"}}>
                      {t}
                      <button onClick={()=>eliminarToro(t)} style={{background:"none",border:"none",cursor:"pointer",color:"#B03A2E",fontSize:12,padding:0,lineHeight:1}}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="field"><label>Resultado tacto</label>
              <select value={form.resultado} onChange={e=>setForm({...form,resultado:e.target.value,origenPreniez:e.target.value==="✅"?form.origenPreniez||"IATF":""})}>
                <option value="⏳">⏳ Pendiente</option>
                <option value="✅">✅ Preñada</option>
                <option value="❌">❌ Vacía</option>
              </select>
            </div>
            <div className="field"><label>Origen preñez</label>
              <select value={form.origenPreniez||""} onChange={e=>setForm({...form,origenPreniez:e.target.value})} disabled={form.resultado!=="✅"} style={{opacity:form.resultado!=="✅"?0.4:1}}>
                <option value="">—</option>
                <option value="IATF">✅ IATF (inseminación)</option>
                <option value="Repaso">🐂 Repaso (toro)</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="field"><label>Obs.</label><input value={form.obs} onChange={e=>setForm({...form,obs:e.target.value})}/></div>
          </div>
          <div className="flex mt"><button className="btn btn-verde" onClick={guardar}>{editandoId?"💾 Guardar cambios":"💾 Guardar"}</button><button className="btn btn-ghost btn-sm" onClick={cancelar}>Cancelar</button></div>
        </div>
        </div>
      )}
      <div className="section-hdr">
        <h2>🧬 Servicios</h2>
        <button className="btn btn-prim btn-sm" onClick={()=>setShowForm(!showForm)}>{showForm?"✕":"＋"}</button>
      </div>
      <div className="tab-pills" style={{marginBottom:4}}>
        <span style={{fontSize:10,color:"#8B5E3C",fontFamily:"'Roboto Slab',serif",padding:"5px 4px",whiteSpace:"nowrap"}}>Lote:</span>
        {["Todos","General","Cbo4"].map(l=><button key={l} className={`pill${loteF===l?" active":""}`} onClick={()=>setLoteF(l)}>{l}</button>)}
      </div>
      <div className="tab-pills">
        <span style={{fontSize:10,color:"#8B5E3C",fontFamily:"'Roboto Slab',serif",padding:"5px 4px",whiteSpace:"nowrap"}}>Campaña:</span>
        {["Todas",...campanias].map(c=><button key={c} className={`pill${campaniaF===c?" active":""}`} onClick={()=>setCampaniaF(c)}>{c==="Todas"?"Todas":c}</button>)}
      </div>
      <div className="grid4 mb">
        <div className="statbox"      data-icon="🐄"><div className="statbox-num">{rows.length}</div><div className="statbox-lbl">Evaluadas GDR</div></div>
        <div className="statbox cielo" data-icon="✅"><div className="statbox-num">{aptas}</div><div className="statbox-lbl">Aptas GDR</div></div>
        <div className="statbox paja"  data-icon="❌"><div className="statbox-num">{aptasNoIatf}</div><div className="statbox-lbl">Aptas sin IATF</div></div>
        <div className="statbox cielo" data-icon="💉"><div className="statbox-num">{inseminadas}</div><div className="statbox-lbl">Inseminadas</div></div>
        <div className="statbox verde" data-icon="🧬"><div className="statbox-num">{prenIatf}</div><div className="statbox-lbl">Preñ. IATF</div></div>
        <div className="statbox paja"  data-icon="🐂"><div className="statbox-num">{prenRepaso}</div><div className="statbox-lbl">Preñ. Repaso</div></div>
        <div className="statbox paja"  data-icon="⏳"><div className="statbox-num">{pend}</div><div className="statbox-lbl">Pendientes</div></div>
        <div className="statbox paja"  data-icon="📊"><div className="statbox-num">{inseminadas>0?((prenIatf/inseminadas)*100).toFixed(0):0}%</div><div className="statbox-lbl">% Preñez IATF</div></div>
        <div className="statbox cielo" data-icon="📊"><div className="statbox-num">{aptas>0?(((prenIatf+prenRepaso)/aptas)*100).toFixed(0):0}%</div><div className="statbox-lbl">% Total preñez</div></div>
      </div>


      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr>
                    <th style={iTh("campania")} onClick={()=>iToggle("campania")}>Campaña{iIcon("campania")}</th>
                    <th style={iTh("caravana")} onClick={()=>iToggle("caravana")}>Car.{iIcon("caravana")}</th>
                    <th style={iTh("lote")} onClick={()=>iToggle("lote")}>Lote{iIcon("lote")}</th>
                    <th style={iTh("apta")} onClick={()=>iToggle("apta")}>GDR{iIcon("apta")}</th>
                    <th style={iTh("protocolo")} onClick={()=>iToggle("protocolo")}>IATF{iIcon("protocolo")}</th>
                    <th>Día 0</th><th>Día 10</th>
                    <th style={iTh("toro")} onClick={()=>iToggle("toro")}>Toro{iIcon("toro")}</th>
                    <th style={iTh("resultado")} onClick={()=>iToggle("resultado")}>Resultado{iIcon("resultado")}</th>
                    <th style={iTh("origenPreniez")} onClick={()=>iToggle("origenPreniez")}>Origen{iIcon("origenPreniez")}</th>
                    <th>Obs.</th><th></th>
                  </tr></thead>
            <tbody>
              {rows.map(i=>{
                const anim=animales.find(a=>a.caravana===i.caravana);
                return <tr key={i.id}>
                  <td><span className="badge badge-cielo" style={{fontSize:9}}>{i.campania||"2025"}</span></td>
                  <td>{anim?<button className="btn btn-ghost btn-sm" style={{padding:"2px 8px",fontWeight:700,fontSize:12}} onClick={()=>setFichaAnimal(anim)}>{i.caravana}</button>:<strong>{i.caravana}</strong>}</td>
                  <td><span className="badge badge-cielo">{i.lote}</span></td>
                  <td><span className={`badge ${i.apta==="Apta"?"badge-verde":"badge-rojo"}`} style={{fontSize:9}}>{i.apta==="Apta"?"✓ Apta":"✗ No"}</span></td>
                  <td style={{textAlign:"center"}}>
                    {i.apta==="No Apta"
                      ? <span style={{color:"rgba(44,26,14,.3)",fontSize:11}}>—</span>
                      : i.protocolo==="No"
                        ? <span className="badge badge-rojo" style={{fontSize:9}} title={i.motivoNoIatf||""}>✗ No</span>
                        : <span className="badge badge-verde" style={{fontSize:9}}>💉 Sí</span>}
                  </td>
                  <td style={{fontSize:10,color:"rgba(44,26,14,.6)"}}>{i.dia0||"—"}</td>
                  <td style={{fontSize:10,color:"rgba(44,26,14,.6)"}}>{i.dia10||"—"}</td>
                  <td><span className={`badge ${(i.tipoServicio||"IATF")==="TE"?"badge-rojo":(i.tipoServicio||"IATF")==="Repaso toro"?"badge-paja":"badge-cielo"}`} style={{fontSize:8}}>{i.tipoServicio||"IATF"}</span></td>
                  <td style={{fontSize:11}}>{i.toro}</td>
                  <td style={{fontSize:13,textAlign:"center"}}>
                    {i.resultado==="⏳"?"⏳ Pend.":i.resultado==="✅"?"✅ Preñada":"❌ Vacía"}
                  </td>
                  <td style={{fontSize:11,textAlign:"center"}}>
                    {i.resultado==="✅"
                      ? i.origenPreniez==="Repaso"
                        ? <span className="badge badge-paja" style={{fontSize:9}}>🐂 Repaso</span>
                        : <span className="badge badge-verde" style={{fontSize:9}}>💉 IATF</span>
                      : <span style={{color:"rgba(44,26,14,.3)"}}>—</span>}
                  </td>
                  <td className="txt-muted" style={{fontSize:10,maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{i.obs||"—"}</td>
                  <td style={{display:"flex",gap:4}}>
                    <button className="btn btn-ghost btn-sm" style={{fontSize:12,padding:"3px 8px"}} onClick={()=>abrirEditar(i)}>✏️</button>
                    <button className="btn btn-rojo btn-sm" onClick={()=>eliminar(i.id)}>🗑</button>
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── PREÑEZ ───────────────────────────────────────────────────────────────────
function Prenez({animales,pariciones,iatf,setFichaAnimal}) {
  const {anio:pAnio, YearPills:PrenYearPills} = useYearFilter(pariciones, "fecha");
  const hembrasAll=animales.filter(a=>["Vaca","Vaquilla","Desmamante H"].includes(a.categoria));
  const {sortFn:pSort,toggleSort:pToggle,icon:pIcon,thStyle:pTh}=useSorter("caravana");
  const hembras=pSort(pAnio==="Todos" ? hembrasAll : hembrasAll.filter(a=>{
    const tieneParto=pariciones.some(p=>p.madreCaravana===a.caravana&&(p.fecha||"").startsWith(pAnio));
    const tieneIatf=iatf.some(i=>i.caravana===a.caravana&&(i.campania||"2025")===pAnio);
    return tieneParto||tieneIatf;
  }));
  const partosAnio=pariciones.filter(p=>pAnio==="Todos"||(p.fecha||"").startsWith(pAnio));
  const prenAnio=iatf.filter(i=>(pAnio==="Todos"||(i.campania||"2025")===pAnio)&&i.resultado==="✅").length;
  return (
    <div>
      <div className="section-hdr"><h2>🤰 Historial de Preñez</h2></div>
      <PrenYearPills/>
      <div className="grid3 mb">
        <div className="statbox" data-icon="🐄"><div className="statbox-num">{hembras.length}</div><div className="statbox-lbl">Hembras</div></div>
        <div className="statbox verde" data-icon="✅"><div className="statbox-num">{prenAnio}</div><div className="statbox-lbl">Preñadas {pAnio}</div></div>
        <div className="statbox paja" data-icon="📅"><div className="statbox-num">{partosAnio.length}</div><div className="statbox-lbl">Partos {pAnio}</div></div>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr>
                    <th style={pTh("caravana")} onClick={()=>pToggle("caravana")}>Car.{pIcon("caravana")}</th>
                    <th style={pTh("categoria")} onClick={()=>pToggle("categoria")}>Cat.{pIcon("categoria")}</th>
                    <th style={pTh("lote")} onClick={()=>pToggle("lote")}>Lote{pIcon("lote")}</th>
                    <th>Partos {pAnio}</th>
                    <th>Ternero</th>
                    <th style={pTh("estado")} onClick={()=>pToggle("estado")}>Estado{pIcon("estado")}</th>
                    <th>IATF {pAnio}</th>
                  </tr></thead>
            <tbody>
              {hembras.map(a=>{
                const misPartos=pariciones.filter(p=>p.madreCaravana===a.caravana&&(pAnio==="Todos"||(p.fecha||"").startsWith(pAnio)));
                const terneros=animales.filter(t=>t.madreCaravana===a.caravana&&(pAnio==="Todos"||(t.fechaNac||"").startsWith(pAnio)));
                const ir=iatf.find(i=>i.caravana===a.caravana&&(pAnio==="Todos"||(i.campania||"2025")===pAnio));
                return <tr key={a.id}>
                  <td><button className="btn btn-ghost btn-sm" style={{padding:"2px 8px",fontWeight:700,fontSize:12}} onClick={()=>setFichaAnimal(a)}>{a.caravana}</button></td>
                  <td style={{fontSize:10}}>{a.categoria}</td>
                  <td><span className="badge badge-cielo">{a.lote}</span></td>
                  <td>{misPartos.length>0?misPartos.map(p=><div key={p.id} style={{fontSize:10}}>{p.fecha.slice(5)} {p.terneroSexo==="H"?"♀":"♂"}</div>):<span className="txt-muted">—</span>}</td>
                  <td>{terneros.length>0?terneros.map(t=><button key={t.id} className="btn btn-ghost btn-sm" style={{padding:"2px 6px",fontSize:11,fontWeight:700,display:"block",marginBottom:2}} onClick={()=>setFichaAnimal(t)}>🐄 {t.caravana}</button>):<span className="txt-muted">—</span>}</td>
                  <td><span className={`badge ${a.estado==="Preñada"?"badge-verde":a.estado==="Vacía"?"badge-gris":a.estado==="Descarte"?"badge-rojo":"badge-paja"}`}>{a.estado}</span></td>
                  <td style={{textAlign:"center"}}>{ir?<span className={`badge ${ir.resultado==="✅"?"badge-verde":ir.resultado==="⏳"?"badge-paja":"badge-rojo"}`} style={{fontSize:10}}>{ir.resultado==="✅"?"Preñada":ir.resultado==="⏳"?"Pend.":"Vacía"}</span>:<span className="txt-muted">—</span>}</td>
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
function Pariciones({pariciones,addPar,updatePar,removePar,addAnimal,removeAnimal,updateAnimal,animales,setFichaAnimal}) {
  const blank={madreCaravana:"",fecha:today(),tipo:"Normal",terneroCar:"",terneroSexo:"H",pesoNac:"",estado:"OK",obs:""};
  const [form,setForm]=useState(blank);
  const [editId,setEditId]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const {anio:parAnio, filtered:parFiltradas, YearPills:ParYearPills}=useYearFilter(pariciones,"fecha");
  const {sortFn:parSort,toggleSort:parToggle,icon:parIcon,thStyle:parTh}=useSorter("fecha");
  const parRows=parSort(parFiltradas);
  const guardar=async()=>{
    if(!form.madreCaravana)return;
    if(editId){
      const {id:_,...rest}=form;
      await updatePar(editId,{...rest,pesoNac:+form.pesoNac});
      setEditId(null);setForm(blank);setShowForm(false);
      return;
    }
    // Guardar el parto
    await addPar({...form,pesoNac:+form.pesoNac});

    // Auto-agregar ternero a Hacienda si tiene caravana y no es mortinato
    if(form.tipo!=="Mortinato"&&form.terneroCar&&form.terneroCar.trim()!==""&&form.terneroCar!=="—"){
      const yaExiste=animales.find(a=>a.caravana.trim().toLowerCase()===form.terneroCar.trim().toLowerCase());
      if(!yaExiste){
        // Obtener ubicación de la madre para saber dónde nació el ternero
        const madre=animales.find(a=>a.caravana===form.madreCaravana);
        await addAnimal({
          caravana:form.terneroCar.trim(),
          nombre:"",
          categoria:form.terneroSexo==="H"?"Ternera":"Ternero",
          lote:"Cbo7",
          ubicacion:madre?.ubicacion||"",
          estado:"OK",
          toroPreñez:"",
          fechaNac:form.fecha,
          madreCaravana:form.madreCaravana,
          padreCaravana:madre?.toroPreñez||"",
          pesoInicial:form.pesoNac||"",
          obs:"Nació "+form.fecha
        });
      }
    }

    // Auto-cambiar estado de la madre a "Vacía"
    const madre=animales.find(a=>a.caravana===form.madreCaravana);
    if(madre&&(madre.estado==="Preñada"||madre.estado==="Prenada"||madre.estado==="Pendiente")){
      await updateAnimal(madre.id,{...madre,estado:"Vacía"});
    }

    setForm(blank);setShowForm(false);
  };
  const abrirEditar=(p)=>{setForm({...blank,...p,pesoNac:p.pesoNac||""});setEditId(p.id);setShowForm(true);};
  const eliminar=async id=>{
    if(!window.confirm("¿Eliminar este parto?")) return;
    const parto=pariciones.find(p=>p.id===id);
    await removePar(id);
    // Find ternero in Hacienda
    const ternero=animales.find(a=>
      (parto?.terneroCar&&a.caravana===parto.terneroCar)||(a.madreCaravana===parto?.madreCaravana&&a.fechaNac===parto?.fecha)
    );
    if(ternero&&window.confirm(`¿También eliminar al ternero Car. ${ternero.caravana} de Hacienda?`)){
      await removeAnimal(ternero.id);
    }
  };
  const vivos=parFiltradas.filter(p=>p.estado!=="Baja").length;
  return (
    <div>
      <div className="section-hdr"><h2>🐣 Pariciones</h2><button className="btn btn-prim btn-sm" onClick={()=>setShowForm(!showForm)}>{showForm?"✕":"＋"}</button></div>
      <ParYearPills/>
      <div className="grid3 mb">
        <div className="statbox" data-icon="🐣"><div className="statbox-num">{parFiltradas.length}</div><div className="statbox-lbl">Total partos</div></div>
        <div className="statbox verde" data-icon="✅"><div className="statbox-num">{vivos}</div><div className="statbox-lbl">Terneros vivos</div></div>
        <div className="statbox rojo" data-icon="💀"><div className="statbox-num">{parFiltradas.length-vivos}</div><div className="statbox-lbl">Bajas neon.</div></div>
      </div>

      {/* ── CATÁLOGO DE PRODUCTOS ─────────────────────────────────────────── */}
      {showCatalogo&&(
        <div className="modal-overlay" onClick={e=>{if(e.target.className.includes("modal-overlay"))setShowCatalogo(false);}}>
          <div className="modal-box" style={{maxWidth:600}}>
            <div className="modal-title">📦 Catálogo de Productos</div>
            <div className="card mb" style={{padding:12}}>
              <div className="form-row">
                <div className="field"><label>Nombre comercial</label><input value={formProd.nombre} onChange={e=>setFormProd({...formProd,nombre:e.target.value})} placeholder="Ej: Doramectina Gold"/></div>
                <div className="field"><label>Categoría</label>
                  <select value={formProd.categoria} onChange={e=>setFormProd({...formProd,categoria:e.target.value})}>
                    {CATS_PROD.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field"><label>Dosis estándar</label><input value={formProd.dosis} onChange={e=>setFormProd({...formProd,dosis:e.target.value})} placeholder="Ej: 1ml/50kg"/></div>
                <div className="field"><label>Unidad</label>
                  <select value={formProd.unidad} onChange={e=>setFormProd({...formProd,unidad:e.target.value})}>
                    {["ml","cc","comprimido","sachet","dosis","g"].map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field" style={{flex:2}}><label>Descripción / Principio activo</label><input value={formProd.descripcion} onChange={e=>setFormProd({...formProd,descripcion:e.target.value})} placeholder="Ej: Ivermectina 1%"/></div>
              </div>
              <div className="flex mt">
                <button className="btn btn-verde" onClick={async()=>{
                  if(!formProd.nombre)return;
                  await addProd(formProd);
                  setFormProd({nombre:"",categoria:"Vacuna",descripcion:"",dosis:"",unidad:"ml"});
                }}>💾 Agregar producto</button>
              </div>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Nombre</th><th>Categoría</th><th>Dosis</th><th>Descripción</th><th></th></tr></thead>
                <tbody>
                  {(productosDB||[]).map(p=>(
                    <tr key={p.id}>
                      <td><strong>{p.nombre}</strong></td>
                      <td><span className="badge badge-cielo" style={{fontSize:9}}>{p.categoria}</span></td>
                      <td style={{fontSize:11}}>{p.dosis} {p.unidad}</td>
                      <td style={{fontSize:11}}>{p.descripcion||"—"}</td>
                      <td><button className="btn btn-rojo btn-sm" onClick={()=>removeProd(p.id)}>🗑</button></td>
                    </tr>
                  ))}
                  {!(productosDB||[]).length&&<tr><td colSpan="5" className="txt-muted" style={{textAlign:"center",padding:12}}>Sin productos. Agregá el primero arriba.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex mt"><button className="btn btn-ghost btn-sm" onClick={()=>setShowCatalogo(false)}>Cerrar</button></div>
          </div>
        </div>
      )}

      {/* ── EVENTO DE MANEJO ──────────────────────────────────────────────── */}
      {showEvento&&(
        <div className="modal-overlay" onClick={e=>{if(e.target.className.includes("modal-overlay"))setShowEvento(false);}}>
          <div className="modal-box" style={{maxWidth:640}}>
            <div className="modal-title">⚡ Evento de Manejo
              <span style={{fontSize:11,fontWeight:400,marginLeft:8,color:"#8B5E3C"}}>
                Paso {eventoStep} de 3
              </span>
            </div>

            {/* Paso 1: Datos básicos */}
            {eventoStep===1&&<>
              <div className="form-row">
                <div className="field"><label>📅 Fecha</label><input type="date" value={eventoForm.fecha} onChange={e=>setEventoForm({...eventoForm,fecha:e.target.value})}/></div>
                <div className="field"><label>Lote / Grupo</label>
                  <select value={eventoForm.lote} onChange={e=>setEventoForm({...eventoForm,lote:e.target.value,asignaciones:{}})}>
                    {["General","Campo Grande","Rotación","Cbo3","Cbo4","Cbo5","Cbo6","Cbo7"].map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field"><label>Campaña de servicio</label>
                  <select value={eventoForm.campania} onChange={e=>setEventoForm({...eventoForm,campania:e.target.value})}>
                    {["2026","2025","2024"].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field"><label>Obs. general</label><input value={eventoForm.obs} onChange={e=>setEventoForm({...eventoForm,obs:e.target.value})} placeholder="Ej: Pre-servicio 2026"/></div>
              </div>
              <div style={{marginTop:8,fontSize:12,color:"#6B4226",fontWeight:600}}>
                {animales.filter(a=>a.lote===eventoForm.lote).length} animales en lote {eventoForm.lote}
              </div>
              <div className="flex mt">
                <button className="btn btn-prim" onClick={()=>setEventoStep(2)}>Siguiente → Productos</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setShowEvento(false)}>Cancelar</button>
              </div>
            </>}

            {/* Paso 2: Productos aplicados */}
            {eventoStep===2&&(()=>{
              const animLote=animales.filter(a=>a.lote===eventoForm.lote&&["Vaca","Vaquilla"].includes(a.categoria));
              const toggleProd=(p)=>{
                const cur=eventoForm.productos;
                const sel=cur.find(x=>x.productoId===p.id);
                if(sel){setEventoForm({...eventoForm,productos:cur.filter(x=>x.productoId!==p.id)});}
                else{setEventoForm({...eventoForm,productos:[...cur,{productoId:p.id,nombre:p.nombre,dosis:p.dosis,tipo:p.categoria,alcance:"lote",caravanas:animLote.map(a=>a.caravana)}]});}
              };
              const toggleCar=(prodId,car)=>{
                const prods=eventoForm.productos.map(x=>{
                  if(x.productoId!==prodId) return x;
                  const cur=x.caravanas||[];
                  const updated=cur.includes(car)?cur.filter(c=>c!==car):[...cur,car];
                  return {...x,caravanas:updated,alcance:"individual"};
                });
                setEventoForm({...eventoForm,productos:prods});
              };
              const setTodas=(prodId,todas)=>{
                const prods=eventoForm.productos.map(x=>{
                  if(x.productoId!==prodId) return x;
                  return {...x,caravanas:todas?animLote.map(a=>a.caravana):[],alcance:todas?"lote":"individual"};
                });
                setEventoForm({...eventoForm,productos:prods});
              };
              return <>
              <div style={{marginBottom:12,fontSize:12,color:"#6B4226"}}>Seleccioná los productos y a qué animales se los aplicaron:</div>
              {!animLote.length&&<div className="txt-muted" style={{fontSize:12,marginBottom:8}}>No hay vacas/vaquillas en lote {eventoForm.lote}</div>}
              {!(productosDB||[]).length&&(
                <div className="txt-muted" style={{fontSize:12,marginBottom:12}}>
                  No tenés productos en el catálogo. <button className="btn btn-ghost btn-sm" onClick={()=>{setShowEvento(false);setShowCatalogo(true);}}>Ir al catálogo →</button>
                </div>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
                {(productosDB||[]).map(p=>{
                  const sel = eventoForm.productos.find(x=>x.productoId===p.id);
                  return(
                    <div key={p.id} style={{borderRadius:10,border:`1.5px solid ${sel?"#4A7C4E":"rgba(107,66,38,.15)"}`,
                      background:sel?"rgba(74,124,78,.05)":"rgba(255,253,245,.5)",marginBottom:4,overflow:"hidden"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",cursor:"pointer"}}
                        onClick={()=>toggleProd(p)}>
                        <div style={{fontSize:18,userSelect:"none"}}>{sel?"✅":"⬜"}</div>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:700,fontSize:13}}>{p.nombre}</div>
                          <div style={{fontSize:11,color:"#8B5E3C"}}>{p.categoria} · {p.dosis} {p.unidad}</div>
                        </div>
                        {sel&&<span style={{fontSize:11,fontWeight:700,color:"#4A7C4E",whiteSpace:"nowrap"}}>
                          {(sel.caravanas||[]).length}/{animLote.length} animales
                        </span>}
                      </div>
                      {sel&&<div style={{padding:"8px 12px 12px",borderTop:"1px solid rgba(74,124,78,.15)",background:"rgba(74,124,78,.03)"}}>
                        <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                          <span style={{fontSize:11,color:"#4A7C4E",fontWeight:600}}>Aplicado a:</span>
                          <button className="btn btn-ghost btn-sm" style={{fontSize:10,padding:"2px 8px"}}
                            onClick={e=>{e.stopPropagation();setTodas(p.id,true);}}>✓ Todas ({animLote.length})</button>
                          <button className="btn btn-ghost btn-sm" style={{fontSize:10,padding:"2px 8px"}}
                            onClick={e=>{e.stopPropagation();setTodas(p.id,false);}}>✗ Ninguna</button>
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:4,maxHeight:120,overflowY:"auto"}}>
                          {animLote.map(a=>{
                            const isSel=(sel.caravanas||[]).includes(a.caravana);
                            return(
                              <label key={a.id} style={{display:"flex",alignItems:"center",gap:4,
                                padding:"3px 8px",borderRadius:16,cursor:"pointer",fontSize:11,userSelect:"none",
                                background:isSel?"rgba(74,124,78,.18)":"rgba(107,66,38,.06)",
                                border:`1px solid ${isSel?"#4A7C4E":"rgba(107,66,38,.15)"}`,
                                color:isSel?"#4A7C4E":"#2C1A0E",transition:"all .12s"}}>
                                <input type="checkbox" checked={isSel}
                                  onChange={()=>toggleCar(p.id,a.caravana)}
                                  style={{accentColor:"#4A7C4E",width:11,height:11}}/>
                                {a.caravana}{a.nombre?` ${a.nombre}`:""}
                              </label>
                            );
                          })}
                        </div>
                      </div>}
                    </div>
                  );
                })}
              </div>
              <div className="flex mt">
                <button className="btn btn-ghost btn-sm" onClick={()=>setEventoStep(1)}>← Atrás</button>
                <button className="btn btn-prim" onClick={()=>setEventoStep(3)}>Siguiente → Asignación</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setShowEvento(false)}>Cancelar</button>
              </div>
            </>;
            })()}

            {/* Paso 3: Asignación de servicio por animal */}
            {eventoStep===3&&(()=>{
              const animalesLote = animales.filter(a=>a.lote===eventoForm.lote&&["Vaca","Vaquilla"].includes(a.categoria));
              const asignar=(car,tipo)=>setEventoForm({...eventoForm,asignaciones:{...eventoForm.asignaciones,[car]:tipo}});
              const asignarTodos=(tipo)=>{
                const todas={};
                animalesLote.forEach(a=>{todas[a.caravana]=tipo;});
                setEventoForm({...eventoForm,asignaciones:todas});
              };
              const conteo={IATF:0,TE:0,"Sin servicio":0,Repaso:0};
              animalesLote.forEach(a=>{const t=eventoForm.asignaciones[a.caravana]||"IATF";conteo[t]=(conteo[t]||0)+1;});

              const guardarEvento=async()=>{
                // 1. Registrar sanidad por cada producto
                for(const prod of eventoForm.productos){
                  if(prod.alcance==="individual"&&prod.caravanas?.length>0){
                    // Un registro por cada animal específico
                    for(const car of prod.caravanas){
                      const anim=animales.find(a=>a.caravana===car);
                      await addSan({
                        fecha:eventoForm.fecha,lote:anim?.lote||eventoForm.lote,
                        producto:prod.nombre,tipo:prod.tipo||"Vacuna",dosis:prod.dosis||"",
                        alcance:"individual",caravana:car,caravanas:[car],
                        obs:`Pre-servicio ${eventoForm.campania}. ${eventoForm.obs||""}`.trim()
                      });
                    }
                  } else {
                    // Registro para todo el lote
                    await addSan({
                      fecha:eventoForm.fecha,lote:eventoForm.lote,
                      producto:prod.nombre,tipo:prod.tipo||"Vacuna",dosis:prod.dosis||"",
                      alcance:"lote",caravanas:[],
                      obs:`Pre-servicio ${eventoForm.campania}. ${eventoForm.obs||""}`.trim()
                    });
                  }
                }
                // 2. Guardar pre-asignación de servicio en cada animal de Hacienda
                // NO crea registros en Servicios IATF — eso se hace cuando se ejecute el servicio
                for(const a of animalesLote){
                  const tipoServ=eventoForm.asignaciones[a.caravana]||"IATF";
                  await updateAnimal(a.id,{
                    ...a,
                    servicioAsignado:tipoServ,
                    campaniaPrevista:eventoForm.campania,
                    fechaPreServicio:eventoForm.fecha,
                  });
                }
                const resumen=Object.entries(
                  animalesLote.reduce((acc,a)=>{
                    const t=eventoForm.asignaciones[a.caravana]||"IATF";
                    acc[t]=(acc[t]||0)+1;return acc;
                  },{})
                ).map(([k,v])=>`${k}: ${v}`).join(" · ");
                alert(`✅ Evento registrado:\n• ${eventoForm.productos.length} producto(s) → Sanidad\n• ${animalesLote.length} animales pre-asignados (${resumen})\n\nLos registros de Servicios IATF se crearán cuando ejecuten el servicio.`);
                setShowEvento(false);
                setEventoForm({fecha:today(),lote:"General",campania:"2026",productos:[],asignaciones:{},obs:""});
                setEventoStep(1);
              };

              return <>
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:12,color:"#6B4226",marginBottom:8}}>Asigná el tipo de servicio a cada animal de {eventoForm.lote}:</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                    {["IATF","TE","Repaso","Sin servicio"].map(t=>(
                      <button key={t} className="btn btn-ghost btn-sm" style={{fontSize:11}}
                        onClick={()=>asignarTodos(t)}>Todos → {t}</button>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                    {Object.entries(conteo).filter(([,v])=>v>0).map(([k,v])=>(
                      <span key={k} className={`badge ${k==="Sin servicio"?"badge-rojo":k==="TE"?"badge-paja":k==="IATF"?"badge-verde":"badge-cielo"}`}>
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{maxHeight:320,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
                  {animalesLote.map(a=>{
                    const asig=eventoForm.asignaciones[a.caravana]||"IATF";
                    return(
                      <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",
                        borderRadius:8,background:"rgba(255,253,245,.8)",border:"1px solid rgba(107,66,38,.1)"}}>
                        <div style={{flex:1,fontSize:13,fontWeight:700}}>{a.caravana}</div>
                        <div style={{fontSize:11,color:"#8B5E3C"}}>{a.nombre||""}</div>
                        <div style={{display:"flex",gap:4}}>
                          {["IATF","TE","Repaso","Sin servicio"].map(t=>(
                            <button key={t} onClick={()=>asignar(a.caravana,t)}
                              style={{padding:"3px 8px",borderRadius:6,fontSize:10,cursor:"pointer",fontWeight:600,
                                border:`1.5px solid ${asig===t?"#4A7C4E":"rgba(107,66,38,.2)"}`,
                                background:asig===t?(t==="Sin servicio"?"rgba(176,58,46,.15)":t==="TE"?"rgba(212,168,90,.2)":"rgba(74,124,78,.15)"):"rgba(255,253,245,.5)",
                                color:asig===t?(t==="Sin servicio"?"#B03A2E":t==="TE"?"#8B5E3C":"#4A7C4E"):"#8B5E3C"}}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {!animalesLote.length&&<div className="txt-muted" style={{textAlign:"center",padding:16,fontSize:12}}>No hay vacas/vaquillas en lote {eventoForm.lote}</div>}
                </div>
                <div className="flex mt">
                  <button className="btn btn-ghost btn-sm" onClick={()=>setEventoStep(2)}>← Atrás</button>
                  <button className="btn btn-verde" style={{flex:1}} onClick={guardarEvento}>
                    💾 Registrar pre-servicio ({eventoForm.productos.length} productos · {animalesLote.length} animales)
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setShowEvento(false)}>Cancelar</button>
                </div>
              </>;
            })()}
          </div>
        </div>
      )}

      {showForm&&(
        <div className="modal-overlay" onClick={e=>{if(e.target.className.includes("modal-overlay")){setForm(blank);setEditId&&setEditId(null);setShowForm(false);}}}>
        <div className="modal-box">
          <div className="modal-title">🐣 Registrar Parto</div>
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
          <div className="flex mt"><button className="btn btn-verde" onClick={guardar}>{editId?"💾 Guardar cambios":"💾 Guardar"}</button><button className="btn btn-ghost btn-sm" onClick={()=>{setForm(blank);setEditId(null);setShowForm(false);}}>Cancelar</button></div>
        </div>
        </div>
      )}
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr>
                    <th style={parTh("madreCaravana")} onClick={()=>parToggle("madreCaravana")}>Madre{parIcon("madreCaravana")}</th>
                    <th style={parTh("fecha")} onClick={()=>parToggle("fecha")}>Fecha{parIcon("fecha")}</th>
                    <th>Tipo</th>
                    <th style={parTh("terneroSexo")} onClick={()=>parToggle("terneroSexo")}>Sex.{parIcon("terneroSexo")}</th>
                    <th>Kg</th>
                    <th>Ternero</th>
                    <th style={parTh("estado")} onClick={()=>parToggle("estado")}>Est.{parIcon("estado")}</th>
                    <th></th>
                  </tr></thead>
            <tbody>
              {parRows.map(p=>{
                const madre=animales.find(a=>a.caravana===p.madreCaravana);
                return <tr key={p.id}>
                  <td>{madre?<button className="btn btn-ghost btn-sm" style={{padding:"2px 8px",fontWeight:700,fontSize:12}} onClick={()=>setFichaAnimal(madre)}>{p.madreCaravana}</button>:<strong>{p.madreCaravana}</strong>}</td>
                  <td style={{fontSize:11}}>{p.fecha}</td>
                  <td><span className={`badge ${p.tipo==="Normal"?"badge-verde":p.tipo==="Mortinato"?"badge-rojo":"badge-paja"}`} style={{fontSize:9}}>{p.tipo}</span></td>
                  <td>{p.terneroSexo==="H"?"♀":"♂"}</td>
                  <td>{p.pesoNac>0?p.pesoNac:<span className="txt-muted">—</span>}</td>
                  <td style={{fontSize:11,fontWeight:600}}>{(()=>{const t=animales.find(a=>a.madreCaravana===p.madreCaravana&&a.fechaNac===p.fecha);if(t)return <button className="btn btn-ghost btn-sm" style={{padding:"2px 6px",fontSize:11,fontWeight:700}} onClick={()=>setFichaAnimal(t)}>🐄 {t.caravana}</button>;if(p.terneroCar&&p.terneroCar!=="—"&&p.terneroCar.trim()!=="")return <span>🐄 {p.terneroCar}</span>;return <span className="txt-muted">—</span>;})()}</td>
                  <td><span className={`badge ${p.estado==="Baja"?"badge-rojo":"badge-verde"}`} style={{fontSize:9}}>{p.estado}</span></td>
                  <td style={{display:"flex",gap:4}}><button className="btn btn-ghost btn-sm" style={{fontSize:12,padding:"3px 8px"}} onClick={()=>abrirEditar(p)}>✏️</button><button className="btn btn-rojo btn-sm" onClick={()=>eliminar(p.id)}>🗑</button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── SANIDAD ──────────────────────────────────────────────────────────────────
function Sanidad({sanidad,addSan,updateSan,removeSan,animales,setFichaAnimal,productosDB,addProd,removeProd,addIatf,updateAnimal}) {
  const blank={fecha:today(),lote:"General",producto:"",tipo:"Vacuna",dosis:"",obs:"",alcance:"lote",caravanas:[]};
  const [form,setForm]=useState(blank);
  const [editId,setEditId]=useState(null);
  const [showForm,setShowForm]=useState(false);
  // Catálogo de productos
  const [showCatalogo,setShowCatalogo]=useState(false);
  const [blankProd]=[{nombre:"",categoria:"Vacuna",descripcion:"",dosis:"",unidad:"ml"}];
  const [formProd,setFormProd]=useState({nombre:"",categoria:"Vacuna",descripcion:"",dosis:"",unidad:"ml"});
  // Evento de manejo
  const [showEvento,setShowEvento]=useState(false);
  const CATS_PROD=["Antiparasitario","Vacuna","Vitamina / Reconstituyente","Antibiótico","Hormona / Protocolo IATF","Otro"];
  const [eventoForm,setEventoForm]=useState({
    fecha:today(),lote:"General",campania:"2026",
    productos:[],    // [{productoId, nombre, dosis}]
    asignaciones:{}, // {caravana: "IATF"|"TE"|"Sin servicio"|"Repaso"}
    obs:""
  });
  const [eventoStep,setEventoStep]=useState(1); // 1=datos básicos, 2=productos, 3=asignación servicio
  const [loteF,setLoteF]=useState("Todos");
  const [busqCar,setBusqCar]=useState("");
  const tipos=["Vacuna","Antiparasitario","Reconstituyente","Clostridiosis","Antirrabica","Fasciola Hepática","Contra la mancha","Pour On","Otro"];
  const {sortFn:sSort,toggleSort:sToggle,icon:sIcon,thStyle:sTh}=useSorter("fecha");

  // Animals available for individual selection (from selected lote)
  const animalesLote=animales.filter(a=>a.lote===form.lote||form.lote==="Todos");
  const animalesFiltrados=busqCar
    ? animalesLote.filter(a=>a.caravana.toLowerCase().includes(busqCar.toLowerCase())||(a.nombre||"").toLowerCase().includes(busqCar.toLowerCase()))
    : animalesLote;
  const toggleCaravana=(car)=>{
    const cur=form.caravanas||[];
    setForm({...form, caravanas: cur.includes(car)?cur.filter(c=>c!==car):[...cur,car]});
  };

  const abrirEditar=(s)=>{setForm({...blank,...s,alcance:s.caravana?"individual":"lote",caravanas:s.caravana?[s.caravana]:[]});setEditId(s.id);setShowForm(true);};
  const guardar=async()=>{
    if(!form.producto)return;
    if(editId){
      const {id:_,...rest}=form;
      await updateSan(editId,{...rest,caravanas:[]});
      setEditId(null);setForm(blank);setShowForm(false);return;
    }
    if(form.alcance==="lote"){
      // One record for the whole lote
      await addSan({...form,caravanas:[]});
    } else {
      // One record per selected animal
      if(!form.caravanas||form.caravanas.length===0){alert("Seleccioná al menos un animal");return;}
      for(const car of form.caravanas){
        const anim=animales.find(a=>a.caravana===car);
        await addSan({...form,caravanas:[car],lote:anim?.lote||form.lote,caravana:car});
      }
    }
    setForm(blank);setBusqCar("");setShowForm(false);
  };
  const eliminar=async id=>{if(window.confirm("¿Eliminar?")) await removeSan(id);};
  const esGeneral=(l)=>!l||l==="Todos"||l==="Toda la Hacienda"||l==="todos";
  const rowsLote=loteF==="Todos"?sanidad:sanidad.filter(s=>s.lote===loteF||esGeneral(s.lote));
  const {anio:sanAnio, filtered:rows, YearPills:SanYearPills}=useYearFilter(rowsLote,"fecha");
  return (
    <div>
      <div className="section-hdr">
        <h2>💉 Sanidad — {sanidad.length} reg.</h2>
        <div style={{display:"flex",gap:6}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>{setShowCatalogo(true);setShowEvento(false);setShowForm(false);}}>📦 Catálogo</button>
          <button className="btn btn-ghost btn-sm" style={{background:"linear-gradient(135deg,rgba(74,124,78,.15),rgba(74,124,78,.08))",color:"#4A7C4E",border:"1px solid rgba(74,124,78,.3)"}}
            onClick={()=>{setShowEvento(true);setShowCatalogo(false);setShowForm(false);setEventoStep(1);}}>⚡ Evento de Manejo</button>
          <button className="btn btn-prim btn-sm" onClick={()=>{setShowForm(!showForm);setShowEvento(false);setShowCatalogo(false);}}>{showForm?"✕":"＋"}</button>
        </div>
      </div>
      <div className="tab-pills">{["Todos","General","Cbo3","Cbo4","Cbo5","Cbo6","Cbo7"].map(l=><button key={l} className={`pill${loteF===l?" active":""}`} onClick={()=>setLoteF(l)}>{l}</button>)}</div>
      <SanYearPills/>

      {/* ── CATÁLOGO DE PRODUCTOS ─────────────────────────────────────────── */}
      {showCatalogo&&(
        <div className="modal-overlay" onClick={e=>{if(e.target.className.includes("modal-overlay"))setShowCatalogo(false);}}>
          <div className="modal-box" style={{maxWidth:600}}>
            <div className="modal-title">📦 Catálogo de Productos</div>
            <div className="card mb" style={{padding:12}}>
              <div className="form-row">
                <div className="field"><label>Nombre comercial</label><input value={formProd.nombre} onChange={e=>setFormProd({...formProd,nombre:e.target.value})} placeholder="Ej: Doramectina Gold"/></div>
                <div className="field"><label>Categoría</label>
                  <select value={formProd.categoria} onChange={e=>setFormProd({...formProd,categoria:e.target.value})}>
                    {CATS_PROD.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field"><label>Dosis estándar</label><input value={formProd.dosis} onChange={e=>setFormProd({...formProd,dosis:e.target.value})} placeholder="Ej: 1ml/50kg"/></div>
                <div className="field"><label>Unidad</label>
                  <select value={formProd.unidad} onChange={e=>setFormProd({...formProd,unidad:e.target.value})}>
                    {["ml","cc","comprimido","sachet","dosis","g"].map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field" style={{flex:2}}><label>Descripción / Principio activo</label><input value={formProd.descripcion} onChange={e=>setFormProd({...formProd,descripcion:e.target.value})} placeholder="Ej: Ivermectina 1%"/></div>
              </div>
              <div className="flex mt">
                <button className="btn btn-verde" onClick={async()=>{
                  if(!formProd.nombre)return;
                  await addProd(formProd);
                  setFormProd({nombre:"",categoria:"Vacuna",descripcion:"",dosis:"",unidad:"ml"});
                }}>💾 Agregar producto</button>
              </div>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Nombre</th><th>Categoría</th><th>Dosis</th><th>Descripción</th><th></th></tr></thead>
                <tbody>
                  {(productosDB||[]).map(p=>(
                    <tr key={p.id}>
                      <td><strong>{p.nombre}</strong></td>
                      <td><span className="badge badge-cielo" style={{fontSize:9}}>{p.categoria}</span></td>
                      <td style={{fontSize:11}}>{p.dosis} {p.unidad}</td>
                      <td style={{fontSize:11}}>{p.descripcion||"—"}</td>
                      <td><button className="btn btn-rojo btn-sm" onClick={()=>removeProd(p.id)}>🗑</button></td>
                    </tr>
                  ))}
                  {!(productosDB||[]).length&&<tr><td colSpan="5" className="txt-muted" style={{textAlign:"center",padding:12}}>Sin productos. Agregá el primero arriba.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex mt"><button className="btn btn-ghost btn-sm" onClick={()=>setShowCatalogo(false)}>Cerrar</button></div>
          </div>
        </div>
      )}

      {/* ── EVENTO DE MANEJO ──────────────────────────────────────────────── */}
      {showEvento&&(
        <div className="modal-overlay" onClick={e=>{if(e.target.className.includes("modal-overlay"))setShowEvento(false);}}>
          <div className="modal-box" style={{maxWidth:640}}>
            <div className="modal-title">⚡ Evento de Manejo
              <span style={{fontSize:11,fontWeight:400,marginLeft:8,color:"#8B5E3C"}}>
                Paso {eventoStep} de 3
              </span>
            </div>

            {/* Paso 1: Datos básicos */}
            {eventoStep===1&&<>
              <div className="form-row">
                <div className="field"><label>📅 Fecha</label><input type="date" value={eventoForm.fecha} onChange={e=>setEventoForm({...eventoForm,fecha:e.target.value})}/></div>
                <div className="field"><label>Lote / Grupo</label>
                  <select value={eventoForm.lote} onChange={e=>setEventoForm({...eventoForm,lote:e.target.value,asignaciones:{}})}>
                    {["General","Campo Grande","Rotación","Cbo3","Cbo4","Cbo5","Cbo6","Cbo7"].map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field"><label>Campaña de servicio</label>
                  <select value={eventoForm.campania} onChange={e=>setEventoForm({...eventoForm,campania:e.target.value})}>
                    {["2026","2025","2024"].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field"><label>Obs. general</label><input value={eventoForm.obs} onChange={e=>setEventoForm({...eventoForm,obs:e.target.value})} placeholder="Ej: Pre-servicio 2026"/></div>
              </div>
              <div style={{marginTop:8,fontSize:12,color:"#6B4226",fontWeight:600}}>
                {animales.filter(a=>a.lote===eventoForm.lote).length} animales en lote {eventoForm.lote}
              </div>
              <div className="flex mt">
                <button className="btn btn-prim" onClick={()=>setEventoStep(2)}>Siguiente → Productos</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setShowEvento(false)}>Cancelar</button>
              </div>
            </>}

            {/* Paso 2: Productos aplicados */}
            {eventoStep===2&&<>
              <div style={{marginBottom:12,fontSize:12,color:"#6B4226"}}>Seleccioná los productos aplicados en este evento:</div>
              {!(productosDB||[]).length&&(
                <div className="txt-muted" style={{fontSize:12,marginBottom:12}}>
                  No tenés productos en el catálogo. <button className="btn btn-ghost btn-sm" onClick={()=>{setShowEvento(false);setShowCatalogo(true);}}>Ir al catálogo →</button>
                </div>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
                {(productosDB||[]).map(p=>{
                  const sel = eventoForm.productos.find(x=>x.productoId===p.id);
                  return(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",
                      borderRadius:10,border:`1.5px solid ${sel?"#4A7C4E":"rgba(107,66,38,.15)"}`,
                      background:sel?"rgba(74,124,78,.08)":"rgba(255,253,245,.5)",cursor:"pointer"}}
                      onClick={()=>{
                        const cur=eventoForm.productos;
                        if(sel){setEventoForm({...eventoForm,productos:cur.filter(x=>x.productoId!==p.id)});}
                        else{setEventoForm({...eventoForm,productos:[...cur,{productoId:p.id,nombre:p.nombre,dosis:p.dosis,tipo:p.categoria}]});}
                      }}>
                      <div style={{fontSize:18}}>{sel?"✅":"⬜"}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:13}}>{p.nombre}</div>
                        <div style={{fontSize:11,color:"#8B5E3C"}}>{p.categoria} · {p.dosis} {p.unidad}</div>
                      </div>
                      {sel&&<input type="text" value={sel.dosis||p.dosis} placeholder="Dosis"
                        style={{width:80,padding:"4px 8px",borderRadius:6,border:"1px solid #4A7C4E",fontSize:12}}
                        onClick={e=>e.stopPropagation()}
                        onChange={e=>{
                          const updated=eventoForm.productos.map(x=>x.productoId===p.id?{...x,dosis:e.target.value}:x);
                          setEventoForm({...eventoForm,productos:updated});
                        }}/>}
                    </div>
                  );
                })}
              </div>
              <div className="flex mt">
                <button className="btn btn-ghost btn-sm" onClick={()=>setEventoStep(1)}>← Atrás</button>
                <button className="btn btn-prim" onClick={()=>setEventoStep(3)}>Siguiente → Asignación</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setShowEvento(false)}>Cancelar</button>
              </div>
            </>}

            {/* Paso 3: Asignación de servicio por animal */}
            {eventoStep===3&&(()=>{
              const animalesLote = animales.filter(a=>a.lote===eventoForm.lote&&["Vaca","Vaquilla"].includes(a.categoria));
              const asignar=(car,tipo)=>setEventoForm({...eventoForm,asignaciones:{...eventoForm.asignaciones,[car]:tipo}});
              const asignarTodos=(tipo)=>{
                const todas={};
                animalesLote.forEach(a=>{todas[a.caravana]=tipo;});
                setEventoForm({...eventoForm,asignaciones:todas});
              };
              const conteo={IATF:0,TE:0,"Sin servicio":0,Repaso:0};
              animalesLote.forEach(a=>{const t=eventoForm.asignaciones[a.caravana]||"IATF";conteo[t]=(conteo[t]||0)+1;});

              const guardarEvento=async()=>{
                // 1. Registrar sanidad por cada producto seleccionado
                for(const prod of eventoForm.productos){
                  await addSan({
                    fecha:eventoForm.fecha,
                    lote:eventoForm.lote,
                    producto:prod.nombre,
                    tipo:prod.tipo||"Vacuna",
                    dosis:prod.dosis||"",
                    alcance:"lote",
                    caravanas:[],
                    obs:`Evento: ${eventoForm.obs||"Manejo"}`
                  });
                }
                // 2. Registrar asignación de servicio (GDR pre-IATF) por animal
                for(const a of animalesLote){
                  const tipoServ=eventoForm.asignaciones[a.caravana]||"IATF";
                  if(tipoServ!=="Sin servicio"){
                    await addIatf({
                      caravana:a.caravana,
                      lote:a.lote,
                      campania:eventoForm.campania,
                      apta:"Apta",
                      protocolo:"No",
                      toro:"",
                      tipoServicio:tipoServ==="Repaso"?"Repaso toro":tipoServ,
                      resultado:"⏳",
                      origenPreniez:"",
                      obs:`Pre-servicio ${eventoForm.fecha}. ${eventoForm.obs}`,
                      dia0:"",dia8:"",dia10:"",
                      fechaPreServicio:eventoForm.fecha,
                    });
                  } else {
                    // Sin servicio → marcar como "No Apta" o agregar nota
                    await addIatf({
                      caravana:a.caravana,
                      lote:a.lote,
                      campania:eventoForm.campania,
                      apta:"No",
                      protocolo:"No",
                      toro:"",
                      tipoServicio:"Sin servicio",
                      resultado:"❌",
                      origenPreniez:"",
                      obs:`Sin servicio ${eventoForm.fecha}. ${eventoForm.obs}`,
                      dia0:"",dia8:"",dia10:"",
                      fechaPreServicio:eventoForm.fecha,
                    });
                  }
                }
                alert(`✅ Evento registrado:\n• ${eventoForm.productos.length} producto(s) en Sanidad\n• ${animalesLote.length} animales asignados en Servicios`);
                setShowEvento(false);
                setEventoForm({fecha:today(),lote:"General",campania:"2026",productos:[],asignaciones:{},obs:""});
                setEventoStep(1);
              };

              return <>
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:12,color:"#6B4226",marginBottom:8}}>Asigná el tipo de servicio a cada animal de {eventoForm.lote}:</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                    {["IATF","TE","Repaso","Sin servicio"].map(t=>(
                      <button key={t} className="btn btn-ghost btn-sm" style={{fontSize:11}}
                        onClick={()=>asignarTodos(t)}>Todos → {t}</button>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                    {Object.entries(conteo).filter(([,v])=>v>0).map(([k,v])=>(
                      <span key={k} className={`badge ${k==="Sin servicio"?"badge-rojo":k==="TE"?"badge-paja":k==="IATF"?"badge-verde":"badge-cielo"}`}>
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{maxHeight:320,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
                  {animalesLote.map(a=>{
                    const asig=eventoForm.asignaciones[a.caravana]||"IATF";
                    return(
                      <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",
                        borderRadius:8,background:"rgba(255,253,245,.8)",border:"1px solid rgba(107,66,38,.1)"}}>
                        <div style={{flex:1,fontSize:13,fontWeight:700}}>{a.caravana}</div>
                        <div style={{fontSize:11,color:"#8B5E3C"}}>{a.nombre||""}</div>
                        <div style={{display:"flex",gap:4}}>
                          {["IATF","TE","Repaso","Sin servicio"].map(t=>(
                            <button key={t} onClick={()=>asignar(a.caravana,t)}
                              style={{padding:"3px 8px",borderRadius:6,fontSize:10,cursor:"pointer",fontWeight:600,
                                border:`1.5px solid ${asig===t?"#4A7C4E":"rgba(107,66,38,.2)"}`,
                                background:asig===t?(t==="Sin servicio"?"rgba(176,58,46,.15)":t==="TE"?"rgba(212,168,90,.2)":"rgba(74,124,78,.15)"):"rgba(255,253,245,.5)",
                                color:asig===t?(t==="Sin servicio"?"#B03A2E":t==="TE"?"#8B5E3C":"#4A7C4E"):"#8B5E3C"}}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {!animalesLote.length&&<div className="txt-muted" style={{textAlign:"center",padding:16,fontSize:12}}>No hay vacas/vaquillas en lote {eventoForm.lote}</div>}
                </div>
                <div className="flex mt">
                  <button className="btn btn-ghost btn-sm" onClick={()=>setEventoStep(2)}>← Atrás</button>
                  <button className="btn btn-verde" style={{flex:1}} onClick={guardarEvento}>
                    💾 Registrar pre-servicio ({eventoForm.productos.length} productos · {animalesLote.length} animales)
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setShowEvento(false)}>Cancelar</button>
                </div>
              </>;
            })()}
          </div>
        </div>
      )}

      {showForm&&(
        <div className="modal-overlay" onClick={e=>{if(e.target.className.includes("modal-overlay")){setForm(blank);setEditId&&setEditId(null);setShowForm(false);}}}>
        <div className="modal-box">
          <div className="form-row">
            <div className="field"><label>Fecha</label><input type="date" value={form.fecha} onChange={e=>setForm({...form,fecha:e.target.value})}/></div>
            <div className="field"><label>Lote</label><select value={form.lote} onChange={e=>setForm({...form,lote:e.target.value,caravanas:[]})}><option value="Todos">🐄 Toda la hacienda</option><option>General</option><option>Cbo3</option><option>Cbo4</option><option>Cbo5</option><option>Cbo6</option><option>Cbo7</option></select></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Producto</label><input value={form.producto} onChange={e=>setForm({...form,producto:e.target.value})}/></div>
            <div className="field"><label>Tipo</label><select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value})}>{tipos.map(t=><option key={t}>{t}</option>)}</select></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Dosis</label><input value={form.dosis} onChange={e=>setForm({...form,dosis:e.target.value})}/></div>
            <div className="field"><label>Obs.</label><input value={form.obs} onChange={e=>setForm({...form,obs:e.target.value})}/></div>
          </div>
          <div className="form-row">
            <div className="field" style={{flex:2}}>
              <label>Aplica a</label>
              <div style={{display:"flex",gap:12,marginTop:4}}>
                <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontFamily:"'Lora',serif",fontSize:13}}>
                  <input type="radio" checked={form.alcance==="lote"} onChange={()=>setForm({...form,alcance:"lote",caravanas:[]})} style={{accentColor:"#6B4226"}}/> 🐄 Lote completo
                </label>
                <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontFamily:"'Lora',serif",fontSize:13}}>
                  <input type="radio" checked={form.alcance==="individual"} onChange={()=>setForm({...form,alcance:"individual",caravanas:[]})} style={{accentColor:"#6B4226"}}/> 🎯 Animales específicos
                </label>
              </div>
            </div>
          </div>
          {form.alcance==="individual"&&(
            <div className="card mb" style={{background:"rgba(107,66,38,.04)",border:"1px solid rgba(107,66,38,.15)",padding:12}}>
              <div style={{marginBottom:8,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <input placeholder="Buscar caravana..." value={busqCar} onChange={e=>setBusqCar(e.target.value)}
                  style={{flex:1,minWidth:120,padding:"6px 10px",borderRadius:7,border:"1.5px solid rgba(107,66,38,.25)",fontFamily:"'Lora',serif",fontSize:12}}/>
                <button className="btn btn-ghost btn-sm" onClick={()=>setForm({...form,caravanas:animalesLote.map(a=>a.caravana)})}>✓ Todos</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setForm({...form,caravanas:[]})}>✗ Ninguno</button>
                <span style={{fontSize:11,color:"#6B4226",fontWeight:600}}>{(form.caravanas||[]).length} seleccionados</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,maxHeight:180,overflowY:"auto"}}>
                {animalesFiltrados.map(a=>{
                  const sel=(form.caravanas||[]).includes(a.caravana);
                  return(
                    <label key={a.id} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",
                      borderRadius:20,cursor:"pointer",fontSize:12,fontFamily:"'Lora',serif",
                      background:sel?"rgba(74,124,78,.15)":"rgba(107,66,38,.06)",
                      border:`1px solid ${sel?"#4A7C4E":"rgba(107,66,38,.15)"}`,
                      color:sel?"#4A7C4E":"#2C1A0E",transition:"all .15s"}}>
                      <input type="checkbox" checked={sel} onChange={()=>toggleCaravana(a.caravana)}
                        style={{accentColor:"#4A7C4E",width:12,height:12}}/>
                      {a.caravana}{a.nombre?` — ${a.nombre}`:""}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          <div className="flex mt"><button className="btn btn-verde" onClick={guardar}>💾 {form.alcance==="individual"?`Guardar (${(form.caravanas||[]).length} animales)`:"Guardar"}</button><button className="btn btn-ghost btn-sm" onClick={()=>{setShowForm(false);setBusqCar("");}}>Cancelar</button></div>
        </div>
        </div>
      )}
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr>
                    <th style={sTh("fecha")} onClick={()=>sToggle("fecha")}>Fecha{sIcon("fecha")}</th>
                    <th style={sTh("lote")} onClick={()=>sToggle("lote")}>Lote{sIcon("lote")}</th>
                    <th>Animal</th>
                    <th style={sTh("tipo")} onClick={()=>sToggle("tipo")}>Tipo{sIcon("tipo")}</th>
                    <th style={sTh("producto")} onClick={()=>sToggle("producto")}>Producto{sIcon("producto")}</th>
                    <th>Dosis</th><th>Obs.</th><th></th>
                  </tr></thead>
            <tbody>
              {sSort(rows).map(s=>(
                <tr key={s.id}>
                  <td style={{fontSize:11}}>{s.fecha}</td>
                  <td><span className="badge badge-cielo">{s.lote}</span></td>
                  <td style={{fontSize:11}}>{s.caravana?<button className="btn btn-ghost btn-sm" style={{padding:"2px 6px",fontSize:11,fontWeight:700}} onClick={()=>{const a=animales.find(x=>x.caravana===s.caravana);if(a)setFichaAnimal(a);}}>🐄 {s.caravana}</button>:<span className="txt-muted" style={{fontSize:10}}>Lote</span>}</td>
                  <td><span className="badge badge-paja" style={{fontSize:9}}>{s.tipo}</span></td>
                  <td style={{fontSize:11,fontWeight:600}}>{s.producto}</td>
                  <td style={{fontSize:11}}>{s.dosis}</td>
                  <td className="txt-muted" style={{fontSize:10}}>{s.obs||"—"}</td>
                  <td style={{display:"flex",gap:4}}><button className="btn btn-ghost btn-sm" style={{fontSize:12,padding:"3px 8px"}} onClick={()=>abrirEditar(s)}>✏️</button><button className="btn btn-rojo btn-sm" onClick={()=>eliminar(s.id)}>🗑</button></td>
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
function Potreros({potreros,addPot,updatePot,removePot}) {
  const blank={nombre:"",lote:"Cbo4",estado:"Activo",ultRot:today(),prox:"",obs:""};
  const [form,setForm]=useState(blank);
  const [edit,setEdit]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const guardar=async()=>{
    if(!form.nombre)return;
    if(edit){ await updatePot(edit,form); setEdit(null); }
    else await addPot(form);
    setForm(blank);setShowForm(false);
  };
  const eliminar=async id=>{if(window.confirm("¿Eliminar?")) await removePot(id);};
  const editar=p=>{setForm({...p});setEdit(p.id);setShowForm(true);};
  const rotar=async p=>{ await updatePot(p.id,{...p,estado:p.estado==="Activo"?"Descansando":"Activo",ultRot:today()}); };
  return (
    <div>
      <div className="section-hdr"><h2>🌿 Potreros</h2><button className="btn btn-prim btn-sm" onClick={()=>{setShowForm(!showForm);setEdit(null);setForm(blank);}}>{showForm?"✕":"＋"}</button></div>
      {showForm&&(
        <div className="card mb">
          <div className="form-row"><div className="field"><label>Nombre</label><input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/></div><div className="field"><label>Lote</label><select value={form.lote} onChange={e=>setForm({...form,lote:e.target.value})}><option>General</option><option>Cbo3</option><option>Cbo4</option><option>Cbo5</option><option>Cbo6</option><option>Cbo7</option><option>Ambos</option></select></div></div>
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
            <button className={`btn btn-sm ${p.estado==="Activo"?"btn-ghost":"btn-verde"}`} onClick={()=>rotar(p)}>🔄 {p.estado==="Activo"?"Descansar":"Activar"}</button>
            <button className="btn btn-rojo btn-sm" onClick={()=>eliminar(p.id)}>🗑</button>
          </div>
        </div>;
      })}
    </div>
  );
}

// ─── BAJAS ────────────────────────────────────────────────────────────────────
function Bajas({bajas,addBaja,removeBaja,animales,updateAnimal,removeAnimal,setFichaAnimal}) {
  const blank={caravana:"",fecha:today(),causa:"Muerte",detalle:""};
  const [form,setForm]=useState(blank);
  const [showForm,setShowForm]=useState(false);
  const causas=["Muerte","Faena","Venta","Descarte","Robo","Otro"];
  const guardar=async()=>{
    if(!form.caravana)return;
    if(editId){const {id:_,...rest}=form;await updateBaja(editId,rest);setEditId(null);setForm(blank);setShowForm(false);return;}
    const anim=animales.find(a=>a.caravana===form.caravana);
    // Guardar baja con snapshot completo del animal
    await addBaja({...form, animalSnapshot: anim ? JSON.stringify(anim) : null});
    // Eliminar de hacienda
    if(anim) await removeAnimal(anim.id);
    setForm(blank);setShowForm(false);
  };
  const eliminar=async id=>{if(window.confirm("¿Eliminar?")) await removeBaja(id);};
  const {sortFn:bSort,toggleSort:bToggle,icon:bIcon,thStyle:bTh}=useSorter("fecha");
  const [editId,setEditId]=useState(null);
  const abrirEditar=(b)=>{setForm({...blank,...b});setEditId(b.id);setShowForm(true);};
  const cc={Muerte:"badge-rojo",Faena:"badge-gris",Venta:"badge-verde",Descarte:"badge-paja",Robo:"badge-rojo",Otro:"badge-gris"};
  return (
    <div>
      <div className="section-hdr"><h2>⚰️ Bajas</h2><button className="btn btn-prim btn-sm" onClick={()=>setShowForm(!showForm)}>{showForm?"✕":"＋"}</button></div>
      <div className="grid4 mb">
        {causas.map(c=>{const n=bajas.filter(b=>b.causa===c).length;if(!n)return null;
          return <div key={c} className={`statbox${c==="Muerte"?" rojo":c==="Venta"?" verde":c==="Faena"?" gris":" paja"}`} data-icon={c==="Muerte"?"💀":c==="Venta"?"💰":c==="Faena"?"🔪":"📋"}><div className="statbox-num">{n}</div><div className="statbox-lbl">{c}</div></div>;
        })}
      </div>

      {/* ── CATÁLOGO DE PRODUCTOS ─────────────────────────────────────────── */}
      {showCatalogo&&(
        <div className="modal-overlay" onClick={e=>{if(e.target.className.includes("modal-overlay"))setShowCatalogo(false);}}>
          <div className="modal-box" style={{maxWidth:600}}>
            <div className="modal-title">📦 Catálogo de Productos</div>
            <div className="card mb" style={{padding:12}}>
              <div className="form-row">
                <div className="field"><label>Nombre comercial</label><input value={formProd.nombre} onChange={e=>setFormProd({...formProd,nombre:e.target.value})} placeholder="Ej: Doramectina Gold"/></div>
                <div className="field"><label>Categoría</label>
                  <select value={formProd.categoria} onChange={e=>setFormProd({...formProd,categoria:e.target.value})}>
                    {CATS_PROD.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field"><label>Dosis estándar</label><input value={formProd.dosis} onChange={e=>setFormProd({...formProd,dosis:e.target.value})} placeholder="Ej: 1ml/50kg"/></div>
                <div className="field"><label>Unidad</label>
                  <select value={formProd.unidad} onChange={e=>setFormProd({...formProd,unidad:e.target.value})}>
                    {["ml","cc","comprimido","sachet","dosis","g"].map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field" style={{flex:2}}><label>Descripción / Principio activo</label><input value={formProd.descripcion} onChange={e=>setFormProd({...formProd,descripcion:e.target.value})} placeholder="Ej: Ivermectina 1%"/></div>
              </div>
              <div className="flex mt">
                <button className="btn btn-verde" onClick={async()=>{
                  if(!formProd.nombre)return;
                  await addProd(formProd);
                  setFormProd({nombre:"",categoria:"Vacuna",descripcion:"",dosis:"",unidad:"ml"});
                }}>💾 Agregar producto</button>
              </div>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Nombre</th><th>Categoría</th><th>Dosis</th><th>Descripción</th><th></th></tr></thead>
                <tbody>
                  {(productosDB||[]).map(p=>(
                    <tr key={p.id}>
                      <td><strong>{p.nombre}</strong></td>
                      <td><span className="badge badge-cielo" style={{fontSize:9}}>{p.categoria}</span></td>
                      <td style={{fontSize:11}}>{p.dosis} {p.unidad}</td>
                      <td style={{fontSize:11}}>{p.descripcion||"—"}</td>
                      <td><button className="btn btn-rojo btn-sm" onClick={()=>removeProd(p.id)}>🗑</button></td>
                    </tr>
                  ))}
                  {!(productosDB||[]).length&&<tr><td colSpan="5" className="txt-muted" style={{textAlign:"center",padding:12}}>Sin productos. Agregá el primero arriba.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex mt"><button className="btn btn-ghost btn-sm" onClick={()=>setShowCatalogo(false)}>Cerrar</button></div>
          </div>
        </div>
      )}

      {/* ── EVENTO DE MANEJO ──────────────────────────────────────────────── */}
      {showEvento&&(
        <div className="modal-overlay" onClick={e=>{if(e.target.className.includes("modal-overlay"))setShowEvento(false);}}>
          <div className="modal-box" style={{maxWidth:640}}>
            <div className="modal-title">⚡ Evento de Manejo
              <span style={{fontSize:11,fontWeight:400,marginLeft:8,color:"#8B5E3C"}}>
                Paso {eventoStep} de 3
              </span>
            </div>

            {/* Paso 1: Datos básicos */}
            {eventoStep===1&&<>
              <div className="form-row">
                <div className="field"><label>📅 Fecha</label><input type="date" value={eventoForm.fecha} onChange={e=>setEventoForm({...eventoForm,fecha:e.target.value})}/></div>
                <div className="field"><label>Lote / Grupo</label>
                  <select value={eventoForm.lote} onChange={e=>setEventoForm({...eventoForm,lote:e.target.value,asignaciones:{}})}>
                    {["General","Campo Grande","Rotación","Cbo3","Cbo4","Cbo5","Cbo6","Cbo7"].map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field"><label>Campaña de servicio</label>
                  <select value={eventoForm.campania} onChange={e=>setEventoForm({...eventoForm,campania:e.target.value})}>
                    {["2026","2025","2024"].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field"><label>Obs. general</label><input value={eventoForm.obs} onChange={e=>setEventoForm({...eventoForm,obs:e.target.value})} placeholder="Ej: Pre-servicio 2026"/></div>
              </div>
              <div style={{marginTop:8,fontSize:12,color:"#6B4226",fontWeight:600}}>
                {animales.filter(a=>a.lote===eventoForm.lote).length} animales en lote {eventoForm.lote}
              </div>
              <div className="flex mt">
                <button className="btn btn-prim" onClick={()=>setEventoStep(2)}>Siguiente → Productos</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setShowEvento(false)}>Cancelar</button>
              </div>
            </>}

            {/* Paso 2: Productos aplicados */}
            {eventoStep===2&&<>
              <div style={{marginBottom:12,fontSize:12,color:"#6B4226"}}>Seleccioná los productos aplicados en este evento:</div>
              {!(productosDB||[]).length&&(
                <div className="txt-muted" style={{fontSize:12,marginBottom:12}}>
                  No tenés productos en el catálogo. <button className="btn btn-ghost btn-sm" onClick={()=>{setShowEvento(false);setShowCatalogo(true);}}>Ir al catálogo →</button>
                </div>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
                {(productosDB||[]).map(p=>{
                  const sel = eventoForm.productos.find(x=>x.productoId===p.id);
                  return(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",
                      borderRadius:10,border:`1.5px solid ${sel?"#4A7C4E":"rgba(107,66,38,.15)"}`,
                      background:sel?"rgba(74,124,78,.08)":"rgba(255,253,245,.5)",cursor:"pointer"}}
                      onClick={()=>{
                        const cur=eventoForm.productos;
                        if(sel){setEventoForm({...eventoForm,productos:cur.filter(x=>x.productoId!==p.id)});}
                        else{setEventoForm({...eventoForm,productos:[...cur,{productoId:p.id,nombre:p.nombre,dosis:p.dosis,tipo:p.categoria}]});}
                      }}>
                      <div style={{fontSize:18}}>{sel?"✅":"⬜"}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:13}}>{p.nombre}</div>
                        <div style={{fontSize:11,color:"#8B5E3C"}}>{p.categoria} · {p.dosis} {p.unidad}</div>
                      </div>
                      {sel&&<input type="text" value={sel.dosis||p.dosis} placeholder="Dosis"
                        style={{width:80,padding:"4px 8px",borderRadius:6,border:"1px solid #4A7C4E",fontSize:12}}
                        onClick={e=>e.stopPropagation()}
                        onChange={e=>{
                          const updated=eventoForm.productos.map(x=>x.productoId===p.id?{...x,dosis:e.target.value}:x);
                          setEventoForm({...eventoForm,productos:updated});
                        }}/>}
                    </div>
                  );
                })}
              </div>
              <div className="flex mt">
                <button className="btn btn-ghost btn-sm" onClick={()=>setEventoStep(1)}>← Atrás</button>
                <button className="btn btn-prim" onClick={()=>setEventoStep(3)}>Siguiente → Asignación</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setShowEvento(false)}>Cancelar</button>
              </div>
            </>}

            {/* Paso 3: Asignación de servicio por animal */}
            {eventoStep===3&&(()=>{
              const animalesLote = animales.filter(a=>a.lote===eventoForm.lote&&["Vaca","Vaquilla"].includes(a.categoria));
              const asignar=(car,tipo)=>setEventoForm({...eventoForm,asignaciones:{...eventoForm.asignaciones,[car]:tipo}});
              const asignarTodos=(tipo)=>{
                const todas={};
                animalesLote.forEach(a=>{todas[a.caravana]=tipo;});
                setEventoForm({...eventoForm,asignaciones:todas});
              };
              const conteo={IATF:0,TE:0,"Sin servicio":0,Repaso:0};
              animalesLote.forEach(a=>{const t=eventoForm.asignaciones[a.caravana]||"IATF";conteo[t]=(conteo[t]||0)+1;});

              const guardarEvento=async()=>{
                // 1. Registrar sanidad por cada producto seleccionado
                for(const prod of eventoForm.productos){
                  await addSan({
                    fecha:eventoForm.fecha,
                    lote:eventoForm.lote,
                    producto:prod.nombre,
                    tipo:prod.tipo||"Vacuna",
                    dosis:prod.dosis||"",
                    alcance:"lote",
                    caravanas:[],
                    obs:`Evento: ${eventoForm.obs||"Manejo"}`
                  });
                }
                // 2. Registrar asignación de servicio (GDR pre-IATF) por animal
                for(const a of animalesLote){
                  const tipoServ=eventoForm.asignaciones[a.caravana]||"IATF";
                  if(tipoServ!=="Sin servicio"){
                    await addIatf({
                      caravana:a.caravana,
                      lote:a.lote,
                      campania:eventoForm.campania,
                      apta:"Apta",
                      protocolo:"No",
                      toro:"",
                      tipoServicio:tipoServ==="Repaso"?"Repaso toro":tipoServ,
                      resultado:"⏳",
                      origenPreniez:"",
                      obs:`Pre-servicio ${eventoForm.fecha}. ${eventoForm.obs}`,
                      dia0:"",dia8:"",dia10:"",
                      fechaPreServicio:eventoForm.fecha,
                    });
                  } else {
                    // Sin servicio → marcar como "No Apta" o agregar nota
                    await addIatf({
                      caravana:a.caravana,
                      lote:a.lote,
                      campania:eventoForm.campania,
                      apta:"No",
                      protocolo:"No",
                      toro:"",
                      tipoServicio:"Sin servicio",
                      resultado:"❌",
                      origenPreniez:"",
                      obs:`Sin servicio ${eventoForm.fecha}. ${eventoForm.obs}`,
                      dia0:"",dia8:"",dia10:"",
                      fechaPreServicio:eventoForm.fecha,
                    });
                  }
                }
                alert(`✅ Evento registrado:\n• ${eventoForm.productos.length} producto(s) en Sanidad\n• ${animalesLote.length} animales asignados en Servicios`);
                setShowEvento(false);
                setEventoForm({fecha:today(),lote:"General",campania:"2026",productos:[],asignaciones:{},obs:""});
                setEventoStep(1);
              };

              return <>
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:12,color:"#6B4226",marginBottom:8}}>Asigná el tipo de servicio a cada animal de {eventoForm.lote}:</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                    {["IATF","TE","Repaso","Sin servicio"].map(t=>(
                      <button key={t} className="btn btn-ghost btn-sm" style={{fontSize:11}}
                        onClick={()=>asignarTodos(t)}>Todos → {t}</button>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                    {Object.entries(conteo).filter(([,v])=>v>0).map(([k,v])=>(
                      <span key={k} className={`badge ${k==="Sin servicio"?"badge-rojo":k==="TE"?"badge-paja":k==="IATF"?"badge-verde":"badge-cielo"}`}>
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{maxHeight:320,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
                  {animalesLote.map(a=>{
                    const asig=eventoForm.asignaciones[a.caravana]||"IATF";
                    return(
                      <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",
                        borderRadius:8,background:"rgba(255,253,245,.8)",border:"1px solid rgba(107,66,38,.1)"}}>
                        <div style={{flex:1,fontSize:13,fontWeight:700}}>{a.caravana}</div>
                        <div style={{fontSize:11,color:"#8B5E3C"}}>{a.nombre||""}</div>
                        <div style={{display:"flex",gap:4}}>
                          {["IATF","TE","Repaso","Sin servicio"].map(t=>(
                            <button key={t} onClick={()=>asignar(a.caravana,t)}
                              style={{padding:"3px 8px",borderRadius:6,fontSize:10,cursor:"pointer",fontWeight:600,
                                border:`1.5px solid ${asig===t?"#4A7C4E":"rgba(107,66,38,.2)"}`,
                                background:asig===t?(t==="Sin servicio"?"rgba(176,58,46,.15)":t==="TE"?"rgba(212,168,90,.2)":"rgba(74,124,78,.15)"):"rgba(255,253,245,.5)",
                                color:asig===t?(t==="Sin servicio"?"#B03A2E":t==="TE"?"#8B5E3C":"#4A7C4E"):"#8B5E3C"}}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {!animalesLote.length&&<div className="txt-muted" style={{textAlign:"center",padding:16,fontSize:12}}>No hay vacas/vaquillas en lote {eventoForm.lote}</div>}
                </div>
                <div className="flex mt">
                  <button className="btn btn-ghost btn-sm" onClick={()=>setEventoStep(2)}>← Atrás</button>
                  <button className="btn btn-verde" style={{flex:1}} onClick={guardarEvento}>
                    💾 Registrar pre-servicio ({eventoForm.productos.length} productos · {animalesLote.length} animales)
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setShowEvento(false)}>Cancelar</button>
                </div>
              </>;
            })()}
          </div>
        </div>
      )}

      {showForm&&(
        <div className="modal-overlay" onClick={e=>{if(e.target.className.includes("modal-overlay")){setForm(blank);setEditId&&setEditId(null);setShowForm(false);}}}>
        <div className="modal-box">
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
        </div>
      )}
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead><tr>
                    <th style={bTh("caravana")} onClick={()=>bToggle("caravana")}>Car.{bIcon("caravana")}</th>
                    <th style={bTh("fecha")} onClick={()=>bToggle("fecha")}>Fecha{bIcon("fecha")}</th>
                    <th style={bTh("causa")} onClick={()=>bToggle("causa")}>Causa{bIcon("causa")}</th>
                    <th>Detalle</th><th></th>
                  </tr></thead>
            <tbody>
              {bSort(bajas).map(b=>{
                const snap=b.animalSnapshot?JSON.parse(b.animalSnapshot):null;
                return <tr key={b.id}>
                  <td>{snap?<button className="btn btn-ghost btn-sm" style={{padding:"2px 8px",fontWeight:700,fontSize:12}} onClick={()=>setFichaAnimal(snap)}>{b.caravana}</button>:<strong>{b.caravana}</strong>}</td>
                  <td style={{fontSize:11}}>{b.fecha}</td>
                  <td><span className={`badge ${cc[b.causa]||"badge-gris"}`}>{b.causa}</span></td>
                  <td className="txt-muted" style={{fontSize:11}}>{b.detalle||"—"}</td>
                  <td style={{display:"flex",gap:4}}><button className="btn btn-ghost btn-sm" style={{fontSize:12,padding:"3px 8px"}} onClick={()=>abrirEditar(b)}>✏️</button><button className="btn btn-rojo btn-sm" onClick={()=>eliminar(b.id)}>🗑</button></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── REPORTES ─────────────────────────────────────────────────────────────────
function Reportes({animales, iatf, pariciones, sanidad, bajas}) {
  const ANO_ACTUAL = String(new Date().getFullYear());
  const [generando, setGenerando] = useState(null);
  const [tipoReporte, setTipoReporte] = useState("hacienda");
  const [filtCat, setFiltCat]     = useState("Todas");
  const [filtLote, setFiltLote]   = useState("Todos");
  const [filtEstado, setFiltEstado] = useState("Todos");
  const [filtUbic, setFiltUbic]   = useState("Todas");
  const [filtCamp, setFiltCamp]   = useState("Todas");
  const [filtAnio, setFiltAnio]   = useState(ANO_ACTUAL);

  const cats    = ["Todas",...new Set(animales.map(a=>a.categoria).filter(Boolean))].sort();
  const lotes   = ["Todos",...new Set(animales.map(a=>a.lote).filter(Boolean))].sort();
  const estados = ["Todos",...new Set(animales.map(a=>a.estado).filter(Boolean))].sort();
  const ubics   = ["Todas",...new Set(animales.map(a=>a.ubicacion).filter(Boolean))].sort();
  const camps   = ["Todas",...new Set(iatf.map(i=>i.campania||"2025"))].sort((a,b)=>b.localeCompare(a));
  const anios   = ["Todos",...new Set(pariciones.map(p=>(p.fecha||"").slice(0,4)).filter(Boolean))].sort((a,b)=>b.localeCompare(a));

  const datosHacienda = animales.filter(a=>{
    if(filtCat!=="Todas"   && a.categoria!==filtCat)  return false;
    if(filtLote!=="Todos"  && a.lote!==filtLote)       return false;
    if(filtEstado!=="Todos"&& a.estado!==filtEstado)   return false;
    if(filtUbic!=="Todas"  && a.ubicacion!==filtUbic)  return false;
    return true;
  }).sort((a,b)=>(a.lote+a.categoria+a.caravana).localeCompare(b.lote+b.categoria+b.caravana));

  const datosIatf = iatf.filter(i=>filtCamp==="Todas"||(i.campania||"2025")===filtCamp)
    .sort((a,b)=>((a.campania||"")+(a.caravana||"")).localeCompare((b.campania||"")+(b.caravana||"")));

  const datosPariciones = pariciones.filter(p=>filtAnio==="Todos"||(p.fecha||"").startsWith(filtAnio))
    .sort((a,b)=>b.fecha.localeCompare(a.fecha));

  const TIERRA=[107,66,38],PAJA=[212,168,90],CREMA=[245,237,214];
  const HIERBA=[74,124,78],ROJO=[176,58,46],HUESO=[237,224,196],BARRO=[139,94,60];
  const HOY_STR = new Date().toLocaleDateString("es-AR");
  const HOY_FILE = new Date().toISOString().split("T")[0];

  const pdfHeader=(doc,titulo)=>{
    const W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight();
    doc.setFillColor(...TIERRA);doc.rect(0,0,W,18,"F");
    doc.setFillColor(...PAJA);doc.rect(0,18,W,0.8,"F");
    doc.setTextColor(...CREMA);doc.setFont("helvetica","bold");doc.setFontSize(15);
    doc.text("Estancia Filemón",12,8);
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(...PAJA);
    doc.text(titulo,12,14);
    doc.text(`${HOY_STR} — Pág. ${doc.internal.getCurrentPageInfo().pageNumber}`,W-12,14,{align:"right"});
    doc.setFillColor(...TIERRA);doc.rect(0,H-7,W,7,"F");
    doc.setTextColor(...PAJA);doc.setFontSize(7);
    doc.text("Estancia Filemón  |  Ayolas, Misiones, Py  |  Gestión Bovina",W/2,H-2.5,{align:"center"});
  };

  const descargarPDF=async(tipo)=>{
    if(!window.jspdf?.jsPDF){alert("Librería PDF no disponible, recargá la página");return;}
    setGenerando(tipo);
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"});
    const W=doc.internal.pageSize.getWidth();

    if(tipo==="hacienda"){
      pdfHeader(doc,"Reporte de Hacienda");
      doc.setTextColor(...BARRO);doc.setFont("helvetica","bold");doc.setFontSize(11);
      doc.text(`Hacienda — ${datosHacienda.length} animales`,12,25);
      const filtDesc=[filtCat!=="Todas"?`Cat:${filtCat}`:"",filtLote!=="Todos"?`Lote:${filtLote}`:"",filtEstado!=="Todos"?`Estado:${filtEstado}`:"",filtUbic!=="Todas"?`Ubic:${filtUbic}`:""].filter(Boolean).join(" | ")||"Todos";
      doc.setFont("helvetica","normal");doc.setFontSize(8);doc.text(filtDesc,12,31);
      doc.autoTable({
        head:[["Car.","Nombre","Categoría","Lote","Estado","Ubicación","Nacimiento","Madre","Padre","Obs."]],
        body:datosHacienda.map(a=>[a.caravana||"",a.nombre||"—",a.categoria||"",a.lote||"",a.estado||"",a.ubicacion||"—",a.fechaNac||"—",a.madreCaravana||"—",a.padreCaravana||"—",(a.obs||"—").slice(0,30)]),
        startY:34,margin:{left:12,right:12,bottom:12},
        styles:{font:"helvetica",fontSize:7,cellPadding:2,textColor:[44,26,14],lineColor:HUESO,lineWidth:0.2},
        headStyles:{fillColor:TIERRA,textColor:PAJA,fontStyle:"bold",fontSize:7.5},
        alternateRowStyles:{fillColor:[251,246,236]},
        columnStyles:{0:{cellWidth:14},1:{cellWidth:22},2:{cellWidth:22},3:{cellWidth:16},4:{cellWidth:18},5:{cellWidth:20},6:{cellWidth:20},7:{cellWidth:14},8:{cellWidth:14},9:{cellWidth:"auto"}},
        didDrawPage:()=>pdfHeader(doc,"Reporte de Hacienda"),
      });
      // Resumen
      const fy=doc.lastAutoTable.finalY+8;
      if(fy<doc.internal.pageSize.getHeight()-30){
        const byLote={},byCat={},byEst={};
        datosHacienda.forEach(a=>{byLote[a.lote]=(byLote[a.lote]||0)+1;byCat[a.categoria]=(byCat[a.categoria]||0)+1;byEst[a.estado]=(byEst[a.estado]||0)+1;});
        const cols=[
          [{label:"TOTALES",h:true},{label:"Total",value:String(datosHacienda.length)},{label:"Preñadas",value:String(datosHacienda.filter(a=>a.estado==="Preñada"||a.estado==="Prenada").length),c:HIERBA},{label:"Pendientes",value:String(datosHacienda.filter(a=>a.estado==="Pendiente").length)},{label:"Vacías",value:String(datosHacienda.filter(a=>a.estado==="Vacía").length)}],
          [{label:"POR CATEGORÍA",h:true},...Object.entries(byCat).sort().map(([k,v])=>({label:k,value:String(v)}))],
          [{label:"POR LOTE",h:true},...Object.entries(byLote).sort().map(([k,v])=>({label:k,value:String(v)}))],
        ];
        const cw=62,gap=6,sx=[12,12+cw+gap,12+(cw+gap)*2];
        cols.forEach((col,ci)=>{
          let y=fy;
          col.forEach((row,i)=>{
            if(row.h){doc.setFillColor(...TIERRA);doc.rect(sx[ci],y,cw,6,"F");doc.setTextColor(...PAJA);doc.setFont("helvetica","bold");doc.setFontSize(7.5);doc.text(row.label,sx[ci]+cw/2,y+4.2,{align:"center"});y+=6;}
            else{if(i%2===1){doc.setFillColor(...HUESO);doc.rect(sx[ci],y,cw,5.5,"F");}doc.setFont("helvetica","bold");doc.setFontSize(7.5);doc.setTextColor(...(row.c||TIERRA));doc.text(String(row.label),sx[ci]+2,y+3.8);doc.setFont("helvetica","normal");doc.setTextColor(...(row.c||BARRO));doc.text(String(row.value||""),sx[ci]+cw-2,y+3.8,{align:"right"});doc.setDrawColor(...HUESO);doc.line(sx[ci],y+5.5,sx[ci]+cw,y+5.5);y+=5.5;}
          });
          doc.setDrawColor(...BARRO);doc.setLineWidth(0.4);doc.rect(sx[ci],fy,cw,y-fy,"S");
        });
      }
      doc.save(`Filemon_Hacienda_${HOY_FILE}.pdf`);
    }
    else if(tipo==="iatf"){
      pdfHeader(doc,"Reporte de Servicios IATF");
      doc.setTextColor(...BARRO);doc.setFont("helvetica","bold");doc.setFontSize(11);
      doc.text(`Servicios IATF — Campaña: ${filtCamp} — ${datosIatf.length} registros`,12,25);
      const aptas=datosIatf.filter(i=>i.apta==="Apta").length;
      const ins=datosIatf.filter(i=>i.protocolo==="Si"&&i.apta==="Apta").length;
      const pren=datosIatf.filter(i=>i.resultado==="✅").length;
      doc.setFont("helvetica","normal");doc.setFontSize(8);
      doc.text(`Aptas: ${aptas} | Inseminadas: ${ins} | Preñadas: ${pren} | Tasa: ${ins>0?Math.round(pren/ins*100):0}%`,12,31);
      doc.autoTable({
        head:[["Campaña","Car.","Lote","GDR","IATF","Toro","Día 0","Día 10","Resultado","Origen","Obs."]],
        body:datosIatf.map(i=>[i.campania||"2025",i.caravana||"",i.lote||"",i.apta||"",i.protocolo==="Si"?"Sí":"No",i.toro||"",i.dia0||"—",i.dia10||"—",i.resultado==="✅"?"Preñada":i.resultado==="⏳"?"Pendiente":"Vacía",i.origenPreniez||"—",(i.obs||"—").slice(0,25)]),
        startY:34,margin:{left:12,right:12,bottom:12},
        styles:{font:"helvetica",fontSize:7,cellPadding:2,textColor:[44,26,14],lineColor:HUESO,lineWidth:0.2},
        headStyles:{fillColor:TIERRA,textColor:PAJA,fontStyle:"bold",fontSize:7},
        alternateRowStyles:{fillColor:[251,246,236]},
        didDrawPage:()=>pdfHeader(doc,"Reporte de Servicios IATF"),
      });
      doc.save(`Filemon_IATF_${filtCamp}_${HOY_FILE}.pdf`);
    }
    else if(tipo==="pariciones"){
      pdfHeader(doc,"Reporte de Pariciones");
      doc.setTextColor(...BARRO);doc.setFont("helvetica","bold");doc.setFontSize(11);
      doc.text(`Pariciones ${filtAnio} — ${datosPariciones.length} registros`,12,25);
      const vivos=datosPariciones.filter(p=>p.estado!=="Baja").length;
      doc.setFont("helvetica","normal");doc.setFontSize(8);
      doc.text(`Terneros vivos: ${vivos} | Bajas: ${datosPariciones.length-vivos}`,12,31);
      doc.autoTable({
        head:[["Fecha","Madre Car.","Tipo","Ternero Car.","Sexo","Peso nac.","Estado","Obs."]],
        body:datosPariciones.map(p=>[p.fecha||"",p.madreCaravana||"",p.tipo||"",p.terneroCar||"—",p.terneroSexo==="H"?"♀ Hembra":"♂ Macho",p.pesoNac>0?p.pesoNac+" kg":"—",p.estado||"",(p.obs||"—").slice(0,30)]),
        startY:34,margin:{left:12,right:12,bottom:12},
        styles:{font:"helvetica",fontSize:7.5,cellPadding:2,textColor:[44,26,14],lineColor:HUESO,lineWidth:0.2},
        headStyles:{fillColor:TIERRA,textColor:PAJA,fontStyle:"bold"},
        alternateRowStyles:{fillColor:[251,246,236]},
        didDrawPage:()=>pdfHeader(doc,"Reporte de Pariciones"),
      });
      doc.save(`Filemon_Pariciones_${filtAnio}_${HOY_FILE}.pdf`);
    }
    else if(tipo==="preservicio"){
      pdfHeader(doc,"Reporte Pre-Servicio");
      doc.setTextColor(...BARRO);doc.setFont("helvetica","bold");doc.setFontSize(11);
      doc.text(`Pre-Servicio — ${datosPreServicio.length} animales — Campaña ref.: ${filtPSCamp}`,12,25);
      const {porServicio,porProducto,totalVV}=resumenPreServicio;
      const resServ=Object.entries(porServicio).filter(([,v])=>v>0).map(([k,v])=>`${k}: ${v}`).join(" | ");
      const resProd=Object.values(porProducto).map(p=>`${p.nombre}: ${p.animales.size}`).join(" | ");
      doc.setFont("helvetica","normal");doc.setFontSize(8);
      doc.text(`Servicio asignado — ${resServ}`,12,29);
      if(resProd) doc.text(`Vacunas — ${resProd}`,12,34);
      doc.autoTable({
        head:[["Car.","Nombre","Cat.","Lote",`Resultado ${filtPSCamp}`,"Toro","Estado actual","Ternero","Fecha parto"]],
        body:datosPreServicio.map(a=>[
          a.caravana,a.nombre||"—",a.categoria,a.lote,
          a.resultCamp,a.toro,a.estado,
          a.terneroCar||"—",a.fechaParto||"—"
        ]),
        startY:34,margin:{left:8,right:8,bottom:12},
        styles:{font:"helvetica",fontSize:7,cellPadding:2,textColor:[44,26,14],lineColor:HUESO,lineWidth:0.2},
        headStyles:{fillColor:TIERRA,textColor:PAJA,fontStyle:"bold",fontSize:7},
        alternateRowStyles:{fillColor:[251,246,236]},
        didDrawPage:()=>pdfHeader(doc,"Reporte Pre-Servicio"),
        didParseCell:(data)=>{
          if(data.section==="body"){
            const row=datosPreServicio[data.row.index];
            if(row?.estado==="Vacía") data.cell.styles.textColor=BARRO;
            else if(row?.estado==="Preñada"||row?.estado==="Prenada") data.cell.styles.textColor=HIERBA;
          }
        }
      });
      doc.save(`Filemon_PreServicio_${filtPSCamp}_${HOY_FILE}.pdf`);
    }
    else if(tipo==="seguimiento"){
      pdfHeader(doc,"Seguimiento de Pariciones");
      doc.setTextColor(...BARRO);doc.setFont("helvetica","bold");doc.setFontSize(11);
      doc.text(`Seguimiento Pariciones Campaña ${filtSeguCamp} — ${datosSeguimiento.length} preñadas`,12,25);
      doc.setFont("helvetica","normal");doc.setFontSize(8);
      doc.text(`Paridas: ${segParidas} | Pendientes: ${segPendiente} | Con retraso: ${segRetraso}`,12,31);
      doc.autoTable({
        head:[["Car.","Lote","Origen","Toro","Fecha IATF","Parto Est.","Días","Estado","Fecha Parto","Ternero","Sexo","Peso"]],
        body:datosSeguimiento.map(s=>[
          s.caravana,s.lote,s.origenPreniez||"IATF",s.toro||"—",s.dia10||"—",s.fechaEst||"—",
          s.diasRestantes===null?"—":s.estado==="parió"?"✅ Parió":s.diasRestantes<0?`${Math.abs(s.diasRestantes)}d atraso`:s.diasRestantes===0?"Hoy":`${s.diasRestantes}d`,
          s.estado==="parió"?"✅ Parió":s.estado==="retraso"?"🔴 Retraso":"⏳ Pendiente",
          s.fechaParto||"—",s.terneroCar||"—",
          s.terneroSexo?"H"===s.terneroSexo||s.terneroSexo==="H"?"♀ Hembra":"♂ Macho":"—",
          s.pesoNac>0?s.pesoNac+" kg":"—"
        ]),
        startY:34,margin:{left:8,right:8,bottom:12},
        styles:{font:"helvetica",fontSize:6.5,cellPadding:1.8,textColor:[44,26,14],lineColor:HUESO,lineWidth:0.2},
        headStyles:{fillColor:TIERRA,textColor:PAJA,fontStyle:"bold",fontSize:7},
        alternateRowStyles:{fillColor:[251,246,236]},
        didDrawPage:()=>pdfHeader(doc,"Seguimiento de Pariciones"),
        didParseCell:(data)=>{
          if(data.section==="body"){
            const row=datosSeguimiento[data.row.index];
            if(row?.estado==="retraso") data.cell.styles.textColor=ROJO;
            else if(row?.estado==="parió") data.cell.styles.textColor=HIERBA;
          }
        }
      });
      doc.save(`Filemon_Seguimiento_${filtSeguCamp}_${HOY_FILE}.pdf`);
    }
    setTimeout(()=>setGenerando(null),800);
  };

  // ── Seguimiento de pariciones ─────────────────────────────────────────────
  // Fecha de hoy en hora local (no UTC) para evitar desfase de timezone
  const hoyDate = new Date();
  const hoyStr = `${hoyDate.getFullYear()}-${String(hoyDate.getMonth()+1).padStart(2,"0")}-${String(hoyDate.getDate()).padStart(2,"0")}`;
  const campsDisp = ["Todas",...new Set(iatf.map(i=>i.campania||"2025"))].sort((a,b)=>b.localeCompare(a));
  const [filtSeguCamp, setFiltSeguCamp] = useState(campsDisp[1]||"2025");
  const datosSeguimiento = (() => {
    // Filtrar preñadas por campaña seleccionada
    const prenadas = iatf.filter(i=>i.resultado==="✅"&&(filtSeguCamp==="Todas"||(i.campania||"2025")===filtSeguCamp));
    return prenadas.map(i=>{
      // Solo contar partos posteriores a la fecha de IATF (dia10) de esta campaña
      // Así no confundimos con partos de campañas anteriores
      // Parto válido = al menos 240 días después del dia10 (o de inicio de campaña)
      // Esto evita confundir partos de campañas anteriores
      const campAnio = parseInt(i.campania||"2025");
      const fechaMinParto = (() => {
        if(i.dia10){
          const d = new Date(i.dia10+"T12:00:00");
          d.setDate(d.getDate()+240); // min 240 días de gestación
          return d.toISOString().split("T")[0];
        }
        return `${campAnio+1}-03-01`; // sin dia10: mínimo marzo del año siguiente
      })();
      const parto = pariciones.find(p=>
        p.madreCaravana===i.caravana && p.fecha >= fechaMinParto
      );
      const animal = animales.find(a=>a.caravana===i.caravana);
      // Fecha estimada parto = dia10 + 283 días
      let fechaEst = null, diasRestantes = null;
      if(i.dia10){
        const d = new Date(i.dia10 + "T12:00:00"); // noon to avoid timezone shift
        d.setDate(d.getDate()+283);
        fechaEst = d.toISOString().split("T")[0];
        // Comparar fechas como strings YYYY-MM-DD para evitar timezone
        diasRestantes = fechaEst > hoyStr ? Math.round((d - new Date(hoyStr+"T12:00:00"))/86400000) :
                        fechaEst === hoyStr ? 0 :
                        -Math.round((new Date(hoyStr+"T12:00:00") - d)/86400000);
      }
      let estado;
      if(parto) estado = "parió";
      else if(fechaEst && diasRestantes < 0) estado = "retraso";
      else estado = "pendiente";
      return {
        caravana: i.caravana,
        lote: i.lote||animal?.lote||"",
        toro: i.toro||"",
        origenPreniez: i.origenPreniez||"IATF",
        dia10: i.dia10||"",
        fechaEst,
        diasRestantes,
        estado,
        // Datos del parto si ya parió
        fechaParto: parto?.fecha||"",
        tipoParto: parto?.tipo||"",
        terneroCar: parto?.terneroCar||"",
        terneroSexo: parto?.terneroSexo||"",
        pesoNac: parto?.pesoNac||"",
      };
    }).sort((a,b)=>{
      // Orden: retraso primero, luego pendientes por fecha est, luego ya parieron
      const ord = {retraso:0,pendiente:1,parió:2};
      if(ord[a.estado]!==ord[b.estado]) return ord[a.estado]-ord[b.estado];
      return (a.fechaEst||"").localeCompare(b.fechaEst||"");
    });
  })();
  const segParidas   = datosSeguimiento.filter(s=>s.estado==="parió").length;
  const segPendiente = datosSeguimiento.filter(s=>s.estado==="pendiente").length;
  const segRetraso   = datosSeguimiento.filter(s=>s.estado==="retraso").length;

  // ── Pre-Servicio ──────────────────────────────────────────────────────────
  const [filtPSCamp, setFiltPSCamp] = useState(campsDisp[1]||"2025");
  const datosPreServicio = (() => {
    // Todas las vacas y vaquillas activas
    const vacasVaquillas = animales.filter(a=>["Vaca","Vaquilla"].includes(a.categoria));
    return vacasVaquillas.map(a=>{
      // Buscar su registro IATF de la campaña seleccionada
      const regIatf = iatf.find(i=>i.caravana===a.caravana&&(i.campania||"2025")===filtPSCamp);
      // Buscar si tuvo repaso (resultado ✅ con origenPreniez Repaso)
      const tuvoRepaso = regIatf?.origenPreniez==="Repaso";
      // Resultado campaña anterior
      let resultCamp = "—";
      if(regIatf){
        if(regIatf.resultado==="✅") resultCamp = tuvoRepaso?"✅ Repaso":"✅ IATF";
        else if(regIatf.resultado==="⏳") resultCamp = "⏳ Pendiente";
        else resultCamp = "❌ Vacía";
      }
      // Si ya parió en esta campaña
      const campAnio = parseInt(filtPSCamp||"2025");
      const fechaMinP = regIatf?.dia10
        ? (() => { const d=new Date(regIatf.dia10+"T12:00:00"); d.setDate(d.getDate()+240); return d.toISOString().split("T")[0]; })()
        : `${campAnio+1}-03-01`;
      const parto = pariciones.find(p=>p.madreCaravana===a.caravana&&p.fecha>=fechaMinP);
      return {
        id: a.id,
        caravana: a.caravana,
        nombre: a.nombre||"",
        categoria: a.categoria,
        lote: a.lote||"",
        ubicacion: a.ubicacion||"",
        estado: a.estado||"",
        resultCamp,
        toro: regIatf?.toro||"—",
        terneroCar: parto?.terneroCar||"",
        fechaParto: parto?.fecha||"",
      };
    }).sort((a,b)=>(a.lote+a.caravana).localeCompare(b.lote+b.caravana));
  })();

  // ── Resumen Pre-Servicio ─────────────────────────────────────────────────
  const resumenPreServicio = (() => {
    const campAnio = filtPSCamp;
    // Animales con servicioAsignado de esta campaña
    const conAsignacion = animales.filter(a=>
      ["Vaca","Vaquilla"].includes(a.categoria) && a.campaniaPrevista===campAnio
    );
    // Conteo por tipo de servicio asignado
    const porServicio = {IATF:0, TE:0, Repaso:0, "Sin servicio":0, "Sin asignar":0};
    animales.filter(a=>["Vaca","Vaquilla"].includes(a.categoria)).forEach(a=>{
      if(a.campaniaPrevista===campAnio && a.servicioAsignado){
        porServicio[a.servicioAsignado]=(porServicio[a.servicioAsignado]||0)+1;
      } else {
        porServicio["Sin asignar"]++;
      }
    });
    // Vacunas aplicadas en pre-servicio (sanidad con obs que contiene "Pre-servicio {campAnio}")
    const sanPS = sanidad.filter(s=>
      (s.obs||"").includes(`Pre-servicio ${campAnio}`) ||
      (s.obs||"").includes("Pre-servicio") && (s.fecha||"").startsWith(campAnio)
    );
    // Agrupar por producto
    const porProducto = {};
    sanPS.forEach(s=>{
      if(!porProducto[s.producto]) porProducto[s.producto]={nombre:s.producto,tipo:s.tipo,registros:0,animales:new Set()};
      porProducto[s.producto].registros++;
      if(s.caravana) porProducto[s.producto].animales.add(s.caravana);
      else if(s.lote){
        // Lote completo — contar animales del lote
        animales.filter(a=>a.lote===s.lote&&["Vaca","Vaquilla"].includes(a.categoria))
          .forEach(a=>porProducto[s.producto].animales.add(a.caravana));
      }
    });
    return {porServicio, porProducto, totalVV: animales.filter(a=>["Vaca","Vaquilla"].includes(a.categoria)).length};
  })();

  const datos = tipoReporte==="hacienda"?datosHacienda:tipoReporte==="iatf"?datosIatf:tipoReporte==="seguimiento"?datosSeguimiento:tipoReporte==="preservicio"?datosPreServicio:datosPariciones;
  const prenadas=animales.filter(a=>a.estado==="Preñada"||a.estado==="Prenada").length;
  const showSeguimientoStats = tipoReporte==="seguimiento";

  return (
    <div>
      <div className="section-hdr"><h2>📄 Reportes</h2></div>

      {/* Tipo */}
      <div className="card mb">
        <div className="card-title">📊 Tipo de Reporte</div>
        <div className="tab-pills">
          {[["hacienda","🐄 Hacienda"],["iatf","🧬 Servicios IATF"],["pariciones","🐣 Pariciones"],["seguimiento","📊 Seguimiento Partos"],["preservicio","🐄 Pre-Servicio"]].map(([id,lbl])=>(
            <button key={id} className={`pill${tipoReporte===id?" active":""}`} onClick={()=>setTipoReporte(id)}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {!showSeguimientoStats&&<div className="grid4 mb">
        <div className="statbox" data-icon="🐄"><div className="statbox-num">{animales.length}</div><div className="statbox-lbl">Total cabezas</div></div>
        <div className="statbox verde" data-icon="🤰"><div className="statbox-num">{prenadas}</div><div className="statbox-lbl">Preñadas</div></div>
        <div className="statbox cielo" data-icon="🐮"><div className="statbox-num">{animales.filter(a=>["Vaca","Vaquilla"].includes(a.categoria)).length}</div><div className="statbox-lbl">Vacas/Vaquillas</div></div>
        <div className="statbox paja" data-icon="🐣"><div className="statbox-num">{pariciones.length}</div><div className="statbox-lbl">Partos reg.</div></div>
      </div>}
      {showSeguimientoStats&&<div className="grid4 mb">
        <div className="statbox" data-icon="🤰"><div className="statbox-num">{datosSeguimiento.length}</div><div className="statbox-lbl">Total preñadas</div></div>
        <div className="statbox verde" data-icon="✅"><div className="statbox-num">{segParidas}</div><div className="statbox-lbl">Ya parieron</div></div>
        <div className="statbox paja" data-icon="⏳"><div className="statbox-num">{segPendiente}</div><div className="statbox-lbl">Pendientes</div></div>
        <div className="statbox rojo" data-icon="🔴"><div className="statbox-num">{segRetraso}</div><div className="statbox-lbl">Con retraso</div></div>
      </div>}

      {/* Filtros */}
      <div className="card mb">
        <div className="card-title">🔍 Filtros</div>
        {tipoReporte==="hacienda"&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,marginBottom:8}}>
            <div className="field"><label>Categoría</label><select value={filtCat} onChange={e=>setFiltCat(e.target.value)}>{cats.map(c=><option key={c}>{c}</option>)}</select></div>
            <div className="field"><label>Lote</label><select value={filtLote} onChange={e=>setFiltLote(e.target.value)}>{lotes.map(l=><option key={l}>{l}</option>)}</select></div>
            <div className="field"><label>Estado</label><select value={filtEstado} onChange={e=>setFiltEstado(e.target.value)}>{estados.map(s=><option key={s}>{s}</option>)}</select></div>
            <div className="field"><label>Ubicación</label><select value={filtUbic} onChange={e=>setFiltUbic(e.target.value)}>{ubics.map(u=><option key={u}>{u}</option>)}</select></div>
          </div>
        )}
        {tipoReporte==="iatf"&&(
          <div className="field" style={{maxWidth:200}}>
            <label>Campaña</label>
            <select value={filtCamp} onChange={e=>setFiltCamp(e.target.value)}>{camps.map(c=><option key={c}>{c}</option>)}</select>
          </div>
        )}
        {tipoReporte==="pariciones"&&(
          <div className="field" style={{maxWidth:200}}>
            <label>Año</label>
            <select value={filtAnio} onChange={e=>setFiltAnio(e.target.value)}>{anios.map(a=><option key={a}>{a}</option>)}</select>
          </div>
        )}
        {tipoReporte==="seguimiento"&&(
          <div className="field" style={{maxWidth:220}}>
            <label>Campaña IATF</label>
            <select value={filtSeguCamp} onChange={e=>setFiltSeguCamp(e.target.value)}>
              {campsDisp.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        )}
        {tipoReporte==="preservicio"&&(
          <div className="field" style={{maxWidth:220}}>
            <label>Campaña anterior</label>
            <select value={filtPSCamp} onChange={e=>setFiltPSCamp(e.target.value)}>
              {campsDisp.filter(c=>c!=="Todas").map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
        )}
        <div style={{marginTop:6,fontSize:12,color:"#6B4226",fontWeight:600}}>{datos.length} registros encontrados</div>
      </div>

      {/* Descargar */}
      <div className="card mb">
        <div className="card-title">⬇️ Exportar PDF</div>
        <button className="btn btn-prim" onClick={()=>descargarPDF(tipoReporte)} disabled={!!generando}
          style={{background:generando?"":undefined}}>
          {generando?"⏳ Generando...":"⬇️ Descargar PDF"}
        </button>
      </div>

      {/* Vista previa */}
      <div className="card">
        <div className="card-title">👁️ Vista previa — {datos.length} registros</div>
        <div className="tbl-wrap">
          <table>
            {tipoReporte==="hacienda"&&<>
              <thead><tr><th>Car.</th><th>Nombre</th><th>Cat.</th><th>Lote</th><th>Estado</th><th>Ubicación</th><th>Nacimiento</th><th>Madre</th></tr></thead>
              <tbody>{datosHacienda.map(a=>(
                <tr key={a.id}>
                  <td><strong>{a.caravana}</strong></td><td>{a.nombre||"—"}</td>
                  <td style={{fontSize:11}}>{a.categoria}</td>
                  <td><span className="badge badge-cielo">{a.lote}</span></td>
                  <td><span className={`badge ${a.estado==="Preñada"||a.estado==="Prenada"?"badge-paja":a.estado==="Vacía"?"badge-gris":a.estado==="Descarte"?"badge-rojo":"badge-verde"}`} style={{fontSize:9}}>{a.estado}</span></td>
                  <td style={{fontSize:11}}>{a.ubicacion||"—"}</td>
                  <td style={{fontSize:11}}>{a.fechaNac||"—"}</td>
                  <td style={{fontSize:11}}>{a.madreCaravana||"—"}</td>
                </tr>
              ))}</tbody>
            </>}
            {tipoReporte==="iatf"&&<>
              <thead><tr><th>Camp.</th><th>Car.</th><th>Lote</th><th>GDR</th><th>IATF</th><th>Toro</th><th>Día 10</th><th>Resultado</th><th>Origen</th></tr></thead>
              <tbody>{datosIatf.map(i=>(
                <tr key={i.id}>
                  <td><span className="badge badge-cielo" style={{fontSize:9}}>{i.campania||"2025"}</span></td>
                  <td><strong>{i.caravana}</strong></td><td>{i.lote}</td>
                  <td><span className={`badge ${i.apta==="Apta"?"badge-verde":"badge-rojo"}`} style={{fontSize:9}}>{i.apta==="Apta"?"✓":"✗"}</span></td>
                  <td>{i.protocolo==="Si"?"💉":"—"}</td>
                  <td style={{fontSize:11}}>{i.toro}</td><td style={{fontSize:11}}>{i.dia10||"—"}</td>
                  <td><span className={`badge ${i.resultado==="✅"?"badge-verde":i.resultado==="⏳"?"badge-paja":"badge-rojo"}`} style={{fontSize:9}}>{i.resultado==="✅"?"Preñada":i.resultado==="⏳"?"Pend.":"Vacía"}</span></td>
                  <td style={{fontSize:11}}>{i.origenPreniez||"—"}</td>
                </tr>
              ))}</tbody>
            </>}
            {tipoReporte==="pariciones"&&<>
              <thead><tr><th>Fecha</th><th>Madre</th><th>Tipo</th><th>Ternero</th><th>Sexo</th><th>Peso</th><th>Estado</th></tr></thead>
              <tbody>{datosPariciones.map(p=>(
                <tr key={p.id}>
                  <td style={{fontSize:11}}>{p.fecha}</td><td><strong>{p.madreCaravana}</strong></td>
                  <td style={{fontSize:11}}>{p.tipo}</td><td style={{fontSize:11}}>{p.terneroCar||"—"}</td>
                  <td>{p.terneroSexo==="H"?"♀":"♂"}</td>
                  <td style={{fontSize:11}}>{p.pesoNac>0?p.pesoNac+" kg":"—"}</td>
                  <td><span className={`badge ${p.estado==="Baja"?"badge-rojo":"badge-verde"}`} style={{fontSize:9}}>{p.estado}</span></td>
                </tr>
              ))}</tbody>
            </>}
            {tipoReporte==="preservicio"&&<>
              {/* Resumen pre-servicio */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                <div style={{background:"linear-gradient(145deg,rgba(74,124,78,.08),rgba(74,124,78,.03))",borderRadius:12,padding:14,border:"1px solid rgba(74,124,78,.2)"}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:"#4A7C4E",marginBottom:10}}>🐄 Asignación de servicio {filtPSCamp}</div>
                  {Object.entries(resumenPreServicio.porServicio).map(([tipo,cnt])=>(
                    <div key={tipo} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid rgba(74,124,78,.1)"}}>
                      <span style={{fontSize:12,fontFamily:"'Lora',serif"}}>{tipo==="IATF"?"💉 IATF":tipo==="TE"?"🧬 TE":tipo==="Repaso"?"🐂 Repaso":tipo==="Sin servicio"?"❌ Sin servicio":"⬜ Sin asignar"}</span>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{height:6,borderRadius:3,background:tipo==="IATF"?"#4A7C4E":tipo==="TE"?"#D4A85A":tipo==="Sin servicio"?"#B03A2E":"#8B5E3C",
                          width:Math.round((cnt/Math.max(resumenPreServicio.totalVV,1))*80)}}/>
                        <strong style={{fontSize:14,fontFamily:"'Playfair Display',serif",minWidth:24,textAlign:"right"}}>{cnt}</strong>
                        <span style={{fontSize:10,color:"#8B5E3C"}}>{resumenPreServicio.totalVV>0?Math.round(cnt/resumenPreServicio.totalVV*100):0}%</span>
                      </div>
                    </div>
                  ))}
                  <div style={{marginTop:8,fontSize:11,color:"#8B5E3C",fontStyle:"italic"}}>Total vacas/vaquillas: {resumenPreServicio.totalVV}</div>
                </div>
                <div style={{background:"linear-gradient(145deg,rgba(212,168,90,.08),rgba(212,168,90,.03))",borderRadius:12,padding:14,border:"1px solid rgba(212,168,90,.2)"}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:14,fontWeight:700,color:"#8B5E3C",marginBottom:10}}>💉 Vacunas aplicadas</div>
                  {Object.values(resumenPreServicio.porProducto).length===0&&<div style={{fontSize:12,color:"#8B5E3C",fontStyle:"italic"}}>Sin registros de pre-servicio {filtPSCamp}</div>}
                  {Object.values(resumenPreServicio.porProducto).map(p=>(
                    <div key={p.nombre} style={{padding:"5px 0",borderBottom:"1px solid rgba(212,168,90,.1)"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:12,fontWeight:600,fontFamily:"'Lora',serif"}}>{p.nombre}</span>
                        <strong style={{fontSize:14,fontFamily:"'Playfair Display',serif",color:"#6B4226"}}>{p.animales.size}</strong>
                      </div>
                      <div style={{fontSize:10,color:"#8B5E3C"}}>{p.tipo}</div>
                    </div>
                  ))}
                </div>
              </div>
              <thead><tr>
                <th>Car.</th><th>Nombre</th><th>Cat.</th><th>Lote</th>
                <th>Servicio {filtPSCamp}</th><th>Resultado {filtPSCamp}</th><th>Toro</th>
                <th>Estado actual</th><th>Ternero</th>
              </tr></thead>
              <tbody>{datosPreServicio.map(a=>(
                <tr key={a.id}>
                  <td><strong>{a.caravana}</strong></td>
                  <td style={{fontSize:11}}>{a.nombre||"—"}</td>
                  <td style={{fontSize:11}}>{a.categoria}</td>
                  <td><span className="badge badge-cielo" style={{fontSize:9}}>{a.lote}</span></td>
                  <td>{(() => {
                      const asig = animales.find(x=>x.caravana===a.caravana)?.servicioAsignado;
                      if(!asig) return <span className="badge badge-gris" style={{fontSize:8}}>—</span>;
                      return <span className={`badge ${asig==="IATF"?"badge-verde":asig==="TE"?"badge-paja":asig==="Sin servicio"?"badge-rojo":"badge-cielo"}`} style={{fontSize:8}}>{asig}</span>;
                    })()}</td>
                  <td><span className={`badge ${a.resultCamp.includes("✅")?"badge-verde":a.resultCamp.includes("❌")?"badge-rojo":"badge-paja"}`} style={{fontSize:9}}>{a.resultCamp}</span></td>
                  <td style={{fontSize:11}}>{a.toro}</td>
                  <td><span className={`badge ${a.estado==="Preñada"||a.estado==="Prenada"?"badge-paja":a.estado==="Vacía"?"badge-gris":a.estado==="Descarte"?"badge-rojo":"badge-verde"}`} style={{fontSize:9}}>{a.estado}</span></td>
                  <td style={{fontSize:11,fontWeight:a.terneroCar?700:400,color:a.terneroCar?"#4A7C4E":"#999"}}>{a.terneroCar||"—"}</td>
                </tr>
              ))}</tbody>
            </>}
            {tipoReporte==="seguimiento"&&<>
              <thead><tr>
                <th>Car.</th><th>Lote</th><th>Origen</th><th>Toro</th>
                <th>Fecha IATF</th><th>Parto Est.</th><th>Días</th>
                <th>Estado</th><th>Fecha Parto</th><th>Ternero</th><th>Sexo</th><th>Peso</th>
              </tr></thead>
              <tbody>{datosSeguimiento.map((s,i)=>(
                <tr key={i} style={{background:s.estado==="retraso"?"rgba(176,58,46,.06)":s.estado==="parió"?"rgba(74,124,78,.04)":""}}>
                  <td><strong>{s.caravana}</strong></td>
                  <td><span className="badge badge-cielo" style={{fontSize:9}}>{s.lote}</span></td>
                  <td style={{fontSize:10}}>{s.origenPreniez}</td>
                  <td style={{fontSize:11}}>{s.toro||"—"}</td>
                  <td style={{fontSize:11}}>{s.dia10||"—"}</td>
                  <td style={{fontSize:11,fontWeight:600}}>{s.fechaEst||"—"}</td>
                  <td style={{textAlign:"center",fontWeight:700,fontSize:12,
                    color:s.diasRestantes===null?"#999":s.diasRestantes<0?"#B03A2E":s.diasRestantes<=15?"#D4A85A":"#4A7C4E"}}>
                    {s.diasRestantes===null?"—":s.estado==="parió"?"✅":s.diasRestantes<0?`${Math.abs(s.diasRestantes)}d atraso`:s.diasRestantes===0?"¡Hoy!":s.diasRestantes===1?"Mañana":`${s.diasRestantes}d`}
                  </td>
                  <td>{s.estado==="parió"?<span className="badge badge-verde" style={{fontSize:9}}>✅ Parió</span>:s.estado==="retraso"?<span className="badge badge-rojo" style={{fontSize:9}}>🔴 Retraso</span>:<span className="badge badge-paja" style={{fontSize:9}}>⏳ Pendiente</span>}</td>
                  <td style={{fontSize:11}}>{s.fechaParto||"—"}</td>
                  <td style={{fontSize:11}}>{s.terneroCar||"—"}</td>
                  <td>{s.terneroSexo?"♀"===s.terneroSexo||s.terneroSexo==="H"?"♀":"♂":"—"}</td>
                  <td style={{fontSize:11}}>{s.pesoNac>0?s.pesoNac+" kg":"—"}</td>
                </tr>
              ))}</tbody>
            </>}
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── FICHA ANIMAL ──────────────────────────────────────────────────────────────
const FICHA_STYLE = `
  .ficha-overlay{position:fixed;inset:0;background:rgba(44,26,14,.7);z-index:300;display:flex;align-items:center;justify-content:center;padding:12px;}
  .ficha-box{background:linear-gradient(145deg,#fffdf5,#EDE0C4);border-radius:16px;width:100%;max-width:560px;max-height:92vh;overflow-y:auto;box-shadow:0 24px 80px rgba(44,26,14,.6);position:relative;display:flex;flex-direction:column;}
  .ficha-header{background:linear-gradient(135deg,#2C1A0E,#6B4226);padding:18px 20px 14px;border-radius:16px 16px 0 0;position:sticky;top:0;z-index:10;}
  .ficha-car{font-family:'Playfair Display',serif;font-size:28px;font-weight:900;color:#D4A85A;line-height:1;}
  .ficha-sub{font-size:12px;color:rgba(212,168,90,.75);margin-top:3px;font-family:'Lora',serif;font-style:italic;}
  .ficha-close{position:absolute;top:14px;right:14px;background:rgba(255,255,255,.12);border:none;font-size:18px;cursor:pointer;color:#D4A85A;padding:4px 10px;border-radius:8px;}
  .ficha-body{padding:16px 20px 20px;}
  .ficha-section{margin-bottom:16px;}
  .ficha-section-title{font-family:'Playfair Display',serif;font-size:13px;font-weight:700;color:#6B4226;margin-bottom:8px;padding-bottom:5px;border-bottom:1.5px solid rgba(107,66,38,.15);display:flex;align-items:center;gap:6px;}
  .ficha-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
  .ficha-dato{background:rgba(107,66,38,.06);border-radius:8px;padding:8px 10px;}
  .ficha-dato-lbl{font-size:9px;font-weight:700;color:#8B5E3C;text-transform:uppercase;letter-spacing:.5px;font-family:'Roboto Slab',serif;margin-bottom:2px;}
  .ficha-dato-val{font-size:13px;color:#2C1A0E;font-family:'Lora',serif;font-weight:600;}
  .ficha-hist-row{display:flex;gap:8px;align-items:flex-start;padding:6px 0;border-bottom:1px solid rgba(107,66,38,.08);font-size:12px;}
  .ficha-hist-row:last-child{border-bottom:none;}
  .ficha-empty{color:rgba(44,26,14,.4);font-size:12px;font-style:italic;padding:6px 0;}
  .pesaje-form{display:flex;gap:8px;align-items:flex-end;margin-bottom:10px;flex-wrap:wrap;}
`;

function FichaAnimal({animal,animales,iatf,pariciones,sanidad,pesajes,addPesaje,removePesaje,onEdit,onClose}) {
  const [nuevoPeso,setNuevoPeso] = useState({fecha:new Date().toISOString().split("T")[0],peso:""});
  const [guardando,setGuardando] = useState(false);

  const misIatf       = iatf.filter(i=>i.caravana===animal.caravana);
  const misPartos     = pariciones.filter(p=>p.madreCaravana===animal.caravana);
  const miSanidad     = sanidad.filter(s=>(s.caravana===animal.caravana)||(s.lote===animal.lote&&!s.caravana)||(s.lote==="Todos"&&!s.caravana)||(s.lote==="Toda la hacienda"&&!s.caravana));
  const misPesajes    = pesajes.filter(p=>p.animalId===animal.id).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  const madre         = animal.madreCaravana ? animales.find(a=>a.caravana===animal.madreCaravana) : null;
  const hijos         = animales.filter(a=>a.madreCaravana===animal.caravana);

  const ultimoPeso    = misPesajes[0]?.peso || animal.pesoInicial || null;

  const ec={OK:"badge-verde","Preñada":"badge-paja","Prenada":"badge-paja","Vacía":"badge-gris","Vacia":"badge-gris",Descarte:"badge-rojo",Vendida:"badge-gris",Apta:"badge-verde","No Apta":"badge-rojo"};

  const guardarPeso = async () => {
    if(!nuevoPeso.peso||!nuevoPeso.fecha) return;
    setGuardando(true);
    await addPesaje({animalId:animal.id, caravana:animal.caravana, fecha:nuevoPeso.fecha, peso:+nuevoPeso.peso});
    setNuevoPeso({fecha:new Date().toISOString().split("T")[0],peso:""});
    setGuardando(false);
  };

  return (
    <>
      <style>{FICHA_STYLE}</style>
      <div className="ficha-overlay" onClick={e=>{if(e.target.className.includes("ficha-overlay"))onClose();}}>
        <div className="ficha-box">
          <div className="ficha-header">
            <button className="ficha-close" onClick={onClose}>✕</button>
            <div className="ficha-car">🐄 Car. {animal.caravana}</div>
            <div className="ficha-sub">
              {animal.nombre||""} · {animal.categoria} · Lote {animal.lote}
            </div>
            <div style={{marginTop:10,display:"flex",gap:8,flexWrap:"wrap"}}>
              <span className={`badge ${ec[animal.estado]||"badge-gris"}`}>{animal.estado}</span>
              {ultimoPeso && <span className="badge badge-cielo">⚖️ {ultimoPeso} kg</span>}
              <button className="btn btn-sm" style={{background:"rgba(212,168,90,.2)",color:"#D4A85A",border:"1px solid rgba(212,168,90,.4)",padding:"3px 10px",fontSize:11}} onClick={()=>onEdit(animal)}>✏️ Editar</button>
            </div>
          </div>

          <div className="ficha-body">

            {/* Datos base */}
            <div className="ficha-section">
              <div className="ficha-section-title">📋 Datos del Animal</div>
              <div className="ficha-grid">
                <div className="ficha-dato"><div className="ficha-dato-lbl">Caravana</div><div className="ficha-dato-val">{animal.caravana}</div></div>
                <div className="ficha-dato"><div className="ficha-dato-lbl">Categoría</div><div className="ficha-dato-val">{animal.categoria}</div></div>
                <div className="ficha-dato"><div className="ficha-dato-lbl">Lote</div><div className="ficha-dato-val">{animal.lote}</div></div>
                <div className="ficha-dato"><div className="ficha-dato-lbl">Estado</div><div className="ficha-dato-val">{animal.estado}</div></div>
                <div className="ficha-dato"><div className="ficha-dato-lbl">Nació</div><div className="ficha-dato-val">{animal.fechaNac||"—"}</div></div>
                <div className="ficha-dato"><div className="ficha-dato-lbl">Peso inicial</div><div className="ficha-dato-val">{animal.pesoInicial?`${animal.pesoInicial} kg`:"—"}</div></div>
                <div className="ficha-dato">
                  <div className="ficha-dato-lbl">Madre</div>
                  <div className="ficha-dato-val">{madre?`Car. ${madre.caravana} (${madre.categoria})`:animal.madreCaravana||"—"}</div>
                </div>
                <div className="ficha-dato"><div className="ficha-dato-lbl">Padre / Toro</div><div className="ficha-dato-val">{animal.padreCaravana||animal.toroPreñez||"—"}</div></div>
              </div>
              {animal.obs && <div style={{marginTop:8,fontSize:12,color:"#8B5E3C",fontStyle:"italic",background:"rgba(107,66,38,.06)",borderRadius:7,padding:"6px 10px"}}>📝 {animal.obs}</div>}
            </div>

            {/* Hijos */}
            {hijos.length > 0 && (
              <div className="ficha-section">
                <div className="ficha-section-title">🐣 Crias ({hijos.length})</div>
                {hijos.map(h=>(
                  <div key={h.id} className="ficha-hist-row">
                    <span>🐄</span>
                    <div style={{flex:1}}>
                      <strong>Car. {h.caravana}</strong> — {h.categoria}
                      {h.fechaNac && <span className="txt-muted"> · Nació {h.fechaNac}</span>}
                    </div>
                    <span className={`badge ${ec[h.estado]||"badge-gris"}`} style={{fontSize:9}}>{h.estado}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Pesajes */}
            <div className="ficha-section">
              <div className="ficha-section-title">⚖️ Pesajes</div>
              <div className="pesaje-form">
                <div className="field" style={{flex:1,minWidth:120}}>
                  <label style={{fontSize:10,fontWeight:600,color:"#6B4226",textTransform:"uppercase",letterSpacing:".5px",fontFamily:"'Roboto Slab',serif"}}>Fecha</label>
                  <input type="date" value={nuevoPeso.fecha} onChange={e=>setNuevoPeso({...nuevoPeso,fecha:e.target.value})} style={{padding:"7px 10px",border:"1.5px solid rgba(107,66,38,.25)",borderRadius:7,fontFamily:"'Lora',serif",fontSize:13}}/>
                </div>
                <div className="field" style={{flex:1,minWidth:80}}>
                  <label style={{fontSize:10,fontWeight:600,color:"#6B4226",textTransform:"uppercase",letterSpacing:".5px",fontFamily:"'Roboto Slab',serif"}}>Peso (kg)</label>
                  <input type="number" min="0" placeholder="ej: 320" value={nuevoPeso.peso} onChange={e=>setNuevoPeso({...nuevoPeso,peso:e.target.value})} style={{padding:"7px 10px",border:"1.5px solid rgba(107,66,38,.25)",borderRadius:7,fontFamily:"'Lora',serif",fontSize:13}}/>
                </div>
                <button className="btn btn-verde btn-sm" onClick={guardarPeso} disabled={guardando} style={{marginBottom:1}}>
                  {guardando?"...":"➕ Registrar"}
                </button>
              </div>
              {misPesajes.length===0 && animal.pesoInicial &&
                <div className="ficha-hist-row"><span>⚖️</span><div style={{flex:1}}><strong>{animal.pesoInicial} kg</strong> — Peso inicial al alta</div></div>
              }
              {misPesajes.map(p=>(
                <div key={p.id} className="ficha-hist-row">
                  <span>⚖️</span>
                  <div style={{flex:1}}><strong>{p.peso} kg</strong><span className="txt-muted"> · {p.fecha}</span></div>
                  <button className="btn btn-rojo btn-sm" style={{padding:"2px 7px",fontSize:10}} onClick={()=>removePesaje(p.id)}>🗑</button>
                </div>
              ))}
              {misPesajes.length===0 && !animal.pesoInicial && <div className="ficha-empty">Sin pesajes registrados</div>}
            </div>

            {/* IATF */}
            {misIatf.length > 0 && (
              <div className="ficha-section">
                <div className="ficha-section-title">🧬 IATF ({misIatf.length} registros)</div>
                {misIatf.map(i=>(
                  <div key={i.id} className="ficha-hist-row">
                    <span style={{fontSize:15}}>{i.resultado}</span>
                    <div style={{flex:1}}>
                      <strong>Toro: {i.toro}</strong>
                      <span className="badge badge-cielo" style={{fontSize:9,marginLeft:4}}>{i.campania||"2025"}</span>
                      <span className="txt-muted"> · {i.lote} · GDR: {i.apta}</span>
                      {i.apta==="Apta" && <span className="txt-muted"> · IATF: {i.protocolo==="No"?`No (${i.motivoNoIatf||"sin detalle"})`:"Sí"}</span>}
                      {(i.dia0||i.dia10) && <div className="txt-muted">Día 0: {i.dia0||"—"} · Ins: {i.dia10||"—"}</div>}
                      {i.resultado==="✅" && <div style={{fontSize:11,fontWeight:700,color:i.origenPreniez==="Repaso"?"#8B5E3C":"#4A7C4E"}}>
                        {i.origenPreniez==="Repaso"?"🐂 Preñó de repaso":"💉 Preñó de IATF"}
                      </div>}
                      {i.resultado==="❌" && i.protocolo==="No" && <div style={{fontSize:11,color:"#8B5E3C",fontStyle:"italic"}}>No inseminada — {i.motivoNoIatf||"sin IATF"}</div>}
                      {i.obs && <div className="txt-muted">{i.obs}</div>}
                    </div>
                    <span className={`badge ${i.resultado==="✅"?"badge-verde":"badge-rojo"}`} style={{fontSize:9}}>{i.resultado==="✅"?"Preñada":"Vacía"}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Pariciones */}
            {misPartos.length > 0 && (
              <div className="ficha-section">
                <div className="ficha-section-title">🐣 Partos ({misPartos.length})</div>
                {[...misPartos].sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(p=>(
                  <div key={p.id} className="ficha-hist-row">
                    <span>🐄</span>
                    <div style={{flex:1}}>
                      <strong>{p.fecha}</strong> — {p.tipo}
                      <span className="txt-muted"> · {p.terneroSexo==="H"?"♀ Hembra":"♂ Macho"}{p.pesoNac>0?` · ${p.pesoNac}kg`:""}</span>
                      {p.terneroCar && p.terneroCar!=="—" && <span className="txt-muted"> · Car. {p.terneroCar}</span>}
                      {p.obs && <div className="txt-muted">{p.obs}</div>}
                    </div>
                    <span className={`badge ${p.estado==="Baja"?"badge-rojo":"badge-verde"}`} style={{fontSize:9}}>{p.estado}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Sanidad del lote */}
            {miSanidad.length > 0 && (
              <div className="ficha-section">
                <div className="ficha-section-title">💉 Sanidad — Lote {animal.lote} ({miSanidad.length} reg.)</div>
                {[...miSanidad].sort((a,b)=>b.fecha.localeCompare(a.fecha)).slice(0,8).map(s=>(
                  <div key={s.id} className="ficha-hist-row">
                    <span>💉</span>
                    <div style={{flex:1}}>
                      <strong>{s.producto}</strong>
                      <span className="txt-muted"> · {s.fecha} · {s.dosis}</span>
                      {s.obs && <div className="txt-muted">{s.obs}</div>}
                    </div>
                    <span className="badge badge-paja" style={{fontSize:9}}>{s.tipo}</span>
                  </div>
                ))}
                {miSanidad.length>8 && <div className="ficha-empty">+{miSanidad.length-8} registros más en el módulo Sanidad</div>}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

// ─── POTREROS V2 (reemplaza función anterior) ─────────────────────────────────
// Datos fijos de los piquetes
const PIQUETES_DATA = [
  {id:1,  nombre:"P1", ha:3.5, dias:4,  color:"rgba(74,124,78,0.55)"},
  {id:2,  nombre:"P2", ha:4.0, dias:4,  color:"rgba(74,124,78,0.55)"},
  {id:3,  nombre:"P3", ha:3.2, dias:4,  color:"rgba(74,124,78,0.55)"},
  {id:4,  nombre:"P4", ha:3.0, dias:3,  color:"rgba(74,124,78,0.55)"},
  {id:5,  nombre:"P5", ha:3.0, dias:3,  color:"rgba(74,124,78,0.55)"},
  {id:6,  nombre:"P6", ha:3.0, dias:3,  color:"rgba(74,124,78,0.55)"},
  {id:7,  nombre:"P7", ha:3.0, dias:3,  color:"rgba(74,124,78,0.55)"},
  {id:8,  nombre:"P8", ha:2.5, dias:3,  color:"rgba(74,124,78,0.55)"},
  {id:9,  nombre:"P9", ha:7.5, dias:8,  color:"rgba(74,124,78,0.55)"},
  {id:10, nombre:"Escuela", ha:4.5, dias:5, color:"rgba(139,94,60,0.55)"},
  {id:11, nombre:"Campo Grande", ha:null, dias:null, color:"rgba(107,66,38,0.55)"},
];

// Coordenadas SVG aproximadas de cada piquete (viewBox 0 0 800 600)
const PIQUETE_SHAPES = {
  // P1 - bottom left, horizontal rectangle
  1:  [[130,490],[265,490],[265,540],[130,540]],
  // P2 - bottom center-left, horizontal rectangle
  2:  [[265,490],[390,490],[390,555],[265,555]],
  // P3 - center, irregular shape with bebedero area
  3:  [[390,430],[470,415],[490,480],[440,510],[390,510]],
  // P4 - left column, 4th from bottom
  4:  [[100,420],[265,420],[265,490],[100,490]],
  // P5 - left column, 5th from bottom
  5:  [[100,360],[260,360],[260,420],[100,420]],
  // P6 - left column, 6th from bottom
  6:  [[100,300],[258,300],[258,360],[100,360]],
  // P7 - left column, 7th from bottom
  7:  [[105,255],[256,255],[256,300],[105,300]],
  // P8 - left column, 8th from bottom
  8:  [[108,215],[254,215],[254,255],[108,255]],
  // P9 - top, wider shape
  9:  [[108,130],[350,110],[350,215],[108,215]],
  // Escuela - right side, irregular purple zone
  10: [[560,430],[700,400],[720,520],[620,560],[490,545],[490,480]],
  // Campo Grande - large pink/magenta zone top right (not a piquete, open field)
  11: [[480,80],[720,60],[760,390],[700,400],[560,430],[490,480],[390,430],[350,110],[480,80]],
};

function PiqueMap({rotaciones, animales, onSelect, seleccionado}) {
  const hoy = new Date();
  
  const PIQUETE_NOMBRE = {1:"P1",2:"P2",3:"P3",4:"P4",5:"P5",6:"P6",7:"P7",8:"P8",9:"P9",10:"Escuela",11:"Campo Grande"};
  const getEstado = (id) => {
    const nombre = PIQUETE_NOMBRE[id]||"";
    // Animales como fuente de verdad
    if(animales && animales.some(a=>a.ubicacion===nombre)) return {estado:"ocupado", rot:null};
    const rots = rotaciones.filter(r=>r.piqueteId===id||(r.ubicacion&&r.ubicacion===nombre))
      .sort((a,b)=>b.entrada.localeCompare(a.entrada));
    if(!rots.length) return {estado:"libre", rot:null};
    const last = rots[0];
    const salida = last.salida ? new Date(last.salida) : null;
    if(!salida || hoy <= salida) return {estado:"ocupado", rot:last};
    return {estado:"libre", rot:last};
  };

  const COLORS = {
    libre:    "rgba(74,124,78,0.50)",
    ocupado:  "rgba(212,168,90,0.65)",
    escuela:  "rgba(139,94,60,0.50)",
    campo:    "rgba(180,80,180,0.30)",
    selected: "rgba(255,255,255,0.25)",
  };

  return (
    <div style={{position:"relative",width:"100%",borderRadius:12,overflow:"hidden",
      background:"#3a5a2a",boxShadow:"0 4px 20px rgba(0,0,0,.3)"}}>
      <svg viewBox="0 0 800 580" style={{width:"100%",display:"block"}}>
        {/* Satellite-like background gradient */}
        <defs>
          <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2d4a1e"/>
            <stop offset="40%" stopColor="#3d5e28"/>
            <stop offset="70%" stopColor="#4a6832"/>
            <stop offset="100%" stopColor="#5a7040"/>
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.4"/>
          </filter>
        </defs>
        <rect width="800" height="580" fill="url(#bg1)"/>
        {/* Road - diagonal line bottom right */}
        <line x1="750" y1="60" x2="680" y2="580" stroke="rgba(180,160,120,0.6)" strokeWidth="12"/>
        <line x1="750" y1="60" x2="680" y2="580" stroke="rgba(200,180,140,0.4)" strokeWidth="8"/>

        {/* Outer border of the field */}
        <polygon points="108,130 350,110 480,80 720,60 760,390 700,400 720,520 620,560 490,545 130,540 100,420 100,130"
          fill="none" stroke="rgba(255,80,80,0.8)" strokeWidth="2.5" strokeDasharray="none"/>

        {PIQUETES_DATA.map(p=>{
          const shape = PIQUETE_SHAPES[p.id];
          if(!shape) return null;
          const {estado} = getEstado(p.id);
          const isSelected = seleccionado === p.id;
          const isCampo = p.id === 11;
          const isEscuela = p.id === 10;
          
          let fill = isCampo ? COLORS.campo : isEscuela ? COLORS.escuela :
                     estado==="ocupado" ? COLORS.ocupado : COLORS.libre;
          
          const pts = shape.map(([x,y])=>`${x},${y}`).join(" ");
          const cx = Math.round(shape.reduce((s,[x])=>s+x,0)/shape.length);
          const cy = Math.round(shape.reduce((s,[,y])=>s+y,0)/shape.length);
          
          return (
            <g key={p.id} onClick={()=>onSelect(p.id)} style={{cursor:"pointer"}}
              filter={isSelected?"url(#shadow)":undefined}>
              <polygon points={pts} fill={fill}
                stroke={isSelected?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.45)"}
                strokeWidth={isSelected?2.5:1.5}/>
              {isSelected&&<polygon points={pts} fill="rgba(255,255,255,0.12)"/>}
              
              {/* Label */}
              <text x={cx} y={cy-(p.ha?6:0)} textAnchor="middle" fill="white"
                fontSize={p.id===11?"12":"13"} fontWeight="bold"
                style={{pointerEvents:"none",fontFamily:"sans-serif",
                  textShadow:"1px 1px 3px rgba(0,0,0,.9)"}}>
                {p.id<=9?`P${p.id}`:p.nombre}
              </text>
              {p.ha&&<text x={cx} y={cy+9} textAnchor="middle"
                fill="rgba(255,255,255,0.85)" fontSize="10"
                style={{pointerEvents:"none",fontFamily:"sans-serif",
                  textShadow:"1px 1px 2px rgba(0,0,0,.8)"}}>
                {p.ha}ha · {p.dias}d
              </text>}
              
              {/* Ocupado indicator */}
              {estado==="ocupado"&&!isCampo&&(
                <circle cx={cx+16} cy={cy-16} r="5" fill="#D4A85A"
                  stroke="white" strokeWidth="1"/>
              )}
            </g>
          );
        })}

        {/* Bebederos */}
        <circle cx="445" cy="460" r="6" fill="#4488ff" stroke="white" strokeWidth="1.5"/>
        <text x="445" y="450" textAnchor="middle" fill="white" fontSize="8"
          style={{fontFamily:"sans-serif",textShadow:"1px 1px 2px rgba(0,0,0,.8)"}}>Beb.1</text>
        <circle cx="430" cy="410" r="6" fill="#4488ff" stroke="white" strokeWidth="1.5"/>
        <text x="430" y="400" textAnchor="middle" fill="white" fontSize="8"
          style={{fontFamily:"sans-serif",textShadow:"1px 1px 2px rgba(0,0,0,.8)"}}>Beb.2</text>

        {/* Legend */}
        <rect x="8" y="8" width="135" height="72" rx="6" fill="rgba(0,0,0,0.55)"/>
        <rect x="18" y="18" width="12" height="12" rx="2" fill={COLORS.libre}
          stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
        <text x="36" y="28" fill="white" fontSize="11" fontFamily="sans-serif">Libre</text>
        <rect x="18" y="36" width="12" height="12" rx="2" fill={COLORS.ocupado}
          stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
        <text x="36" y="46" fill="white" fontSize="11" fontFamily="sans-serif">Ocupado</text>
        <rect x="18" y="54" width="12" height="12" rx="2" fill={COLORS.campo}
          stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
        <text x="36" y="64" fill="white" fontSize="11" fontFamily="sans-serif">Campo Grande</text>
      </svg>
    </div>
  );
}


function PiquerotasV2({potreros,addPot,updatePot,removePot,animales,updateAnimal,rotacionesDB,addRotD,removeRotD}) {
  const [selPiquete, setSelPiquete] = useState(null);
  const [showForm, setShowForm] = useState(false);       // nueva rotación
  const [showMover, setShowMover] = useState(false);     // mover lote entre potreros
  const rotaciones = rotacionesDB || [];

  const blankForm = {piqueteId:"",lote:"Todos",entrada:today(),salida:"",obs:""};
  const blankMover = {origen:"",destino:"",fecha:today()};
  const [form, setForm] = useState(blankForm);
  const [moverForm, setMoverForm] = useState(blankMover);

  const calcSalida = (entrada, dias) => {
    if(!entrada||!dias) return "";
    const d = new Date(entrada); d.setDate(d.getDate()+dias);
    return d.toISOString().split("T")[0];
  };

  const UBIC_MAP = {"Campo Grande":11,"Escuela":10,"P1":1,"P2":2,"P3":3,"P4":4,"P5":5,"P6":6,"P7":7,"P8":8,"P9":9};

  // ── getEstado: rotación activa de un piquete ─────────────────────────────
  const getNombre = (id) => PIQUETES_DATA.find(p=>p.id===id)?.nombre||"";

  // Estado = animales que están ahí + fecha de entrada del historial más reciente
  const getEstado = (id) => {
    const nombre = getNombre(id);
    const animEnPiquete = animales.filter(a=>a.ubicacion===nombre);
    if(!animEnPiquete.length) return null; // sin animales = libre
    // Buscar la rotación activa para obtener la fecha de entrada
    const rots = rotaciones.filter(r=>r.piqueteId===id)
      .sort((a,b)=>b.entrada.localeCompare(a.entrada));
    const rotActiva = rots.find(r=>!r.salida||new Date(r.salida)>=new Date());
    return {
      entrada: rotActiva?.entrada || "—",
      salida:  rotActiva?.salida  || "",
      lote:    rotActiva?.lote    || animEnPiquete[0]?.lote || "—",
      id:      rotActiva?.id,
      obs:     rotActiva?.obs || "",
    };
  };

  // ── Registrar nueva rotación (solo si el piquete está libre) ─────────────
  const guardar = async() => {
    if(!form.piqueteId||!form.entrada) return;
    const piq = PIQUETES_DATA.find(p=>p.id===+form.piqueteId);
    const piqId = +form.piqueteId;
    const rotActiva = getEstado(piqId);
    if(rotActiva){
      alert(`⚠️ ${piq?.nombre} ya tiene una rotación activa desde el ${rotActiva.entrada}. Primero cerrá esa rotación o usá "Mover lote".`);
      return;
    }
    const salida = form.salida||(piq?.dias?calcSalida(form.entrada,piq.dias):"");
    await addRotD({...form, piqueteId:piqId, salida});
    // Actualizar ubicacion de animales del lote
    const ubicNueva = piq?.nombre||"";
    if(ubicNueva&&form.lote!=="Todos"){
      const animalesLote = animales.filter(a=>a.lote===form.lote);
      for(const a of animalesLote) await updateAnimal(a.id,{...a,ubicacion:ubicNueva});
      if(animalesLote.length>0) alert(`✅ ${animalesLote.length} animales del lote ${form.lote} → ${ubicNueva}`);
    }
    setForm(blankForm); setShowForm(false);
  };

  // ── Mover lote completo de un piquete a otro ─────────────────────────────
  const moverLote = async() => {
    const {origen, destino, fecha} = moverForm;
    if(!origen||!destino||origen===destino){alert("Seleccioná origen y destino distintos");return;}
    const piqOrigen  = PIQUETES_DATA.find(p=>p.nombre===origen);
    const piqDestino = PIQUETES_DATA.find(p=>p.nombre===destino);
    if(!piqOrigen||!piqDestino) return;

    // Buscar animales en el origen — independientemente de si hay rotación activa
    const animalesEnOrigen = animales.filter(a=>a.ubicacion===origen);
    if(!animalesEnOrigen.length){alert(`No hay animales registrados en ${origen}`);return;}

    if(!window.confirm(`¿Mover ${animalesEnOrigen.length} animales de ${origen} a ${destino}?`)) return;

    // 1. Cerrar rotación activa en origen si existe (buscar en colección rotaciones)
    const rotOrigenRec = rotaciones.filter(r=>r.piqueteId===piqOrigen.id)
      .sort((a,b)=>b.entrada.localeCompare(a.entrada))
      .find(r=>!r.salida||new Date(r.salida)>=new Date());
    if(rotOrigenRec?.id){
      await removeRotD(rotOrigenRec.id);
      await addRotD({piqueteId:rotOrigenRec.piqueteId,lote:rotOrigenRec.lote,
        entrada:rotOrigenRec.entrada,salida:fecha,obs:`Lote mudado a ${destino}`});
    }

    // 2. Crear rotación en destino solo si no hay una activa
    const rotDestinoRec = rotaciones.filter(r=>r.piqueteId===piqDestino.id)
      .find(r=>!r.salida||new Date(r.salida)>=new Date());
    if(!rotDestinoRec){
      const loteOrigen = animalesEnOrigen[0]?.lote || "General";
      const salida = piqDestino.dias?calcSalida(fecha,piqDestino.dias):"";
      await addRotD({piqueteId:piqDestino.id,lote:loteOrigen,entrada:fecha,salida,obs:`Recibido desde ${origen}`});
    }

    // 3. Actualizar ubicacion de todos los animales
    for(const a of animalesEnOrigen){
      await updateAnimal(a.id,{...a,ubicacion:destino});
    }

    alert(`✅ ${animalesEnOrigen.length} animales mudados de ${origen} → ${destino}`);
    setMoverForm(blankMover); setShowMover(false); setSelPiquete(piqDestino.id);
  };

  const piquete = PIQUETES_DATA.find(p=>p.id===selPiquete);
  const rots = selPiquete ? rotaciones.filter(r=>r.piqueteId===selPiquete)
    .sort((a,b)=>a.entrada.localeCompare(b.entrada)) : [];
  const hoy = new Date();
  const ocupados = PIQUETES_DATA.filter(p=>getEstado(p.id));
  const libres   = PIQUETES_DATA.filter(p=>!getEstado(p.id)&&p.id<=9);

  // Nombres de piquetes ocupados para el selector de origen
  const piquetesOcupados = PIQUETES_DATA.filter(p=>getEstado(p.id)).map(p=>p.nombre);
  const todosNombres     = PIQUETES_DATA.map(p=>p.nombre);

  return (
    <div>
      <div className="section-hdr">
        <h2>🌿 Potreros</h2>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>{setShowMover(true);setShowForm(false);}}>🔄 Mover lote</button>
          <button className="btn btn-prim btn-sm" onClick={()=>{setShowForm(v=>!v);setShowMover(false);}}>＋ Nueva rotación</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid3 mb">
        <div className="statbox verde" data-icon="🌿"><div className="statbox-num">{ocupados.length}</div><div className="statbox-lbl">Ocupados hoy</div></div>
        <div className="statbox" data-icon="✅"><div className="statbox-num">{libres.length}</div><div className="statbox-lbl">Libres</div></div>
        <div className="statbox paja" data-icon="📅"><div className="statbox-num">{PIQUETES_DATA.filter(p=>p.id<=9).reduce((s,p)=>s+(p.dias||0),0)}d</div><div className="statbox-lbl">Ciclo completo</div></div>
      </div>

      {/* Modal: Nueva rotación */}

      {/* ── CATÁLOGO DE PRODUCTOS ─────────────────────────────────────────── */}
      {showCatalogo&&(
        <div className="modal-overlay" onClick={e=>{if(e.target.className.includes("modal-overlay"))setShowCatalogo(false);}}>
          <div className="modal-box" style={{maxWidth:600}}>
            <div className="modal-title">📦 Catálogo de Productos</div>
            <div className="card mb" style={{padding:12}}>
              <div className="form-row">
                <div className="field"><label>Nombre comercial</label><input value={formProd.nombre} onChange={e=>setFormProd({...formProd,nombre:e.target.value})} placeholder="Ej: Doramectina Gold"/></div>
                <div className="field"><label>Categoría</label>
                  <select value={formProd.categoria} onChange={e=>setFormProd({...formProd,categoria:e.target.value})}>
                    {CATS_PROD.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field"><label>Dosis estándar</label><input value={formProd.dosis} onChange={e=>setFormProd({...formProd,dosis:e.target.value})} placeholder="Ej: 1ml/50kg"/></div>
                <div className="field"><label>Unidad</label>
                  <select value={formProd.unidad} onChange={e=>setFormProd({...formProd,unidad:e.target.value})}>
                    {["ml","cc","comprimido","sachet","dosis","g"].map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field" style={{flex:2}}><label>Descripción / Principio activo</label><input value={formProd.descripcion} onChange={e=>setFormProd({...formProd,descripcion:e.target.value})} placeholder="Ej: Ivermectina 1%"/></div>
              </div>
              <div className="flex mt">
                <button className="btn btn-verde" onClick={async()=>{
                  if(!formProd.nombre)return;
                  await addProd(formProd);
                  setFormProd({nombre:"",categoria:"Vacuna",descripcion:"",dosis:"",unidad:"ml"});
                }}>💾 Agregar producto</button>
              </div>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Nombre</th><th>Categoría</th><th>Dosis</th><th>Descripción</th><th></th></tr></thead>
                <tbody>
                  {(productosDB||[]).map(p=>(
                    <tr key={p.id}>
                      <td><strong>{p.nombre}</strong></td>
                      <td><span className="badge badge-cielo" style={{fontSize:9}}>{p.categoria}</span></td>
                      <td style={{fontSize:11}}>{p.dosis} {p.unidad}</td>
                      <td style={{fontSize:11}}>{p.descripcion||"—"}</td>
                      <td><button className="btn btn-rojo btn-sm" onClick={()=>removeProd(p.id)}>🗑</button></td>
                    </tr>
                  ))}
                  {!(productosDB||[]).length&&<tr><td colSpan="5" className="txt-muted" style={{textAlign:"center",padding:12}}>Sin productos. Agregá el primero arriba.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="flex mt"><button className="btn btn-ghost btn-sm" onClick={()=>setShowCatalogo(false)}>Cerrar</button></div>
          </div>
        </div>
      )}

      {/* ── EVENTO DE MANEJO ──────────────────────────────────────────────── */}
      {showEvento&&(
        <div className="modal-overlay" onClick={e=>{if(e.target.className.includes("modal-overlay"))setShowEvento(false);}}>
          <div className="modal-box" style={{maxWidth:640}}>
            <div className="modal-title">⚡ Evento de Manejo
              <span style={{fontSize:11,fontWeight:400,marginLeft:8,color:"#8B5E3C"}}>
                Paso {eventoStep} de 3
              </span>
            </div>

            {/* Paso 1: Datos básicos */}
            {eventoStep===1&&<>
              <div className="form-row">
                <div className="field"><label>📅 Fecha</label><input type="date" value={eventoForm.fecha} onChange={e=>setEventoForm({...eventoForm,fecha:e.target.value})}/></div>
                <div className="field"><label>Lote / Grupo</label>
                  <select value={eventoForm.lote} onChange={e=>setEventoForm({...eventoForm,lote:e.target.value,asignaciones:{}})}>
                    {["General","Campo Grande","Rotación","Cbo3","Cbo4","Cbo5","Cbo6","Cbo7"].map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="field"><label>Campaña de servicio</label>
                  <select value={eventoForm.campania} onChange={e=>setEventoForm({...eventoForm,campania:e.target.value})}>
                    {["2026","2025","2024"].map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="field"><label>Obs. general</label><input value={eventoForm.obs} onChange={e=>setEventoForm({...eventoForm,obs:e.target.value})} placeholder="Ej: Pre-servicio 2026"/></div>
              </div>
              <div style={{marginTop:8,fontSize:12,color:"#6B4226",fontWeight:600}}>
                {animales.filter(a=>a.lote===eventoForm.lote).length} animales en lote {eventoForm.lote}
              </div>
              <div className="flex mt">
                <button className="btn btn-prim" onClick={()=>setEventoStep(2)}>Siguiente → Productos</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setShowEvento(false)}>Cancelar</button>
              </div>
            </>}

            {/* Paso 2: Productos aplicados */}
            {eventoStep===2&&<>
              <div style={{marginBottom:12,fontSize:12,color:"#6B4226"}}>Seleccioná los productos aplicados en este evento:</div>
              {!(productosDB||[]).length&&(
                <div className="txt-muted" style={{fontSize:12,marginBottom:12}}>
                  No tenés productos en el catálogo. <button className="btn btn-ghost btn-sm" onClick={()=>{setShowEvento(false);setShowCatalogo(true);}}>Ir al catálogo →</button>
                </div>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
                {(productosDB||[]).map(p=>{
                  const sel = eventoForm.productos.find(x=>x.productoId===p.id);
                  return(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",
                      borderRadius:10,border:`1.5px solid ${sel?"#4A7C4E":"rgba(107,66,38,.15)"}`,
                      background:sel?"rgba(74,124,78,.08)":"rgba(255,253,245,.5)",cursor:"pointer"}}
                      onClick={()=>{
                        const cur=eventoForm.productos;
                        if(sel){setEventoForm({...eventoForm,productos:cur.filter(x=>x.productoId!==p.id)});}
                        else{setEventoForm({...eventoForm,productos:[...cur,{productoId:p.id,nombre:p.nombre,dosis:p.dosis,tipo:p.categoria}]});}
                      }}>
                      <div style={{fontSize:18}}>{sel?"✅":"⬜"}</div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:13}}>{p.nombre}</div>
                        <div style={{fontSize:11,color:"#8B5E3C"}}>{p.categoria} · {p.dosis} {p.unidad}</div>
                      </div>
                      {sel&&<input type="text" value={sel.dosis||p.dosis} placeholder="Dosis"
                        style={{width:80,padding:"4px 8px",borderRadius:6,border:"1px solid #4A7C4E",fontSize:12}}
                        onClick={e=>e.stopPropagation()}
                        onChange={e=>{
                          const updated=eventoForm.productos.map(x=>x.productoId===p.id?{...x,dosis:e.target.value}:x);
                          setEventoForm({...eventoForm,productos:updated});
                        }}/>}
                    </div>
                  );
                })}
              </div>
              <div className="flex mt">
                <button className="btn btn-ghost btn-sm" onClick={()=>setEventoStep(1)}>← Atrás</button>
                <button className="btn btn-prim" onClick={()=>setEventoStep(3)}>Siguiente → Asignación</button>
                <button className="btn btn-ghost btn-sm" onClick={()=>setShowEvento(false)}>Cancelar</button>
              </div>
            </>}

            {/* Paso 3: Asignación de servicio por animal */}
            {eventoStep===3&&(()=>{
              const animalesLote = animales.filter(a=>a.lote===eventoForm.lote&&["Vaca","Vaquilla"].includes(a.categoria));
              const asignar=(car,tipo)=>setEventoForm({...eventoForm,asignaciones:{...eventoForm.asignaciones,[car]:tipo}});
              const asignarTodos=(tipo)=>{
                const todas={};
                animalesLote.forEach(a=>{todas[a.caravana]=tipo;});
                setEventoForm({...eventoForm,asignaciones:todas});
              };
              const conteo={IATF:0,TE:0,"Sin servicio":0,Repaso:0};
              animalesLote.forEach(a=>{const t=eventoForm.asignaciones[a.caravana]||"IATF";conteo[t]=(conteo[t]||0)+1;});

              const guardarEvento=async()=>{
                // 1. Registrar sanidad por cada producto seleccionado
                for(const prod of eventoForm.productos){
                  await addSan({
                    fecha:eventoForm.fecha,
                    lote:eventoForm.lote,
                    producto:prod.nombre,
                    tipo:prod.tipo||"Vacuna",
                    dosis:prod.dosis||"",
                    alcance:"lote",
                    caravanas:[],
                    obs:`Evento: ${eventoForm.obs||"Manejo"}`
                  });
                }
                // 2. Registrar asignación de servicio (GDR pre-IATF) por animal
                for(const a of animalesLote){
                  const tipoServ=eventoForm.asignaciones[a.caravana]||"IATF";
                  if(tipoServ!=="Sin servicio"){
                    await addIatf({
                      caravana:a.caravana,
                      lote:a.lote,
                      campania:eventoForm.campania,
                      apta:"Apta",
                      protocolo:"No",
                      toro:"",
                      tipoServicio:tipoServ==="Repaso"?"Repaso toro":tipoServ,
                      resultado:"⏳",
                      origenPreniez:"",
                      obs:`Pre-servicio ${eventoForm.fecha}. ${eventoForm.obs}`,
                      dia0:"",dia8:"",dia10:"",
                      fechaPreServicio:eventoForm.fecha,
                    });
                  } else {
                    // Sin servicio → marcar como "No Apta" o agregar nota
                    await addIatf({
                      caravana:a.caravana,
                      lote:a.lote,
                      campania:eventoForm.campania,
                      apta:"No",
                      protocolo:"No",
                      toro:"",
                      tipoServicio:"Sin servicio",
                      resultado:"❌",
                      origenPreniez:"",
                      obs:`Sin servicio ${eventoForm.fecha}. ${eventoForm.obs}`,
                      dia0:"",dia8:"",dia10:"",
                      fechaPreServicio:eventoForm.fecha,
                    });
                  }
                }
                alert(`✅ Evento registrado:\n• ${eventoForm.productos.length} producto(s) en Sanidad\n• ${animalesLote.length} animales asignados en Servicios`);
                setShowEvento(false);
                setEventoForm({fecha:today(),lote:"General",campania:"2026",productos:[],asignaciones:{},obs:""});
                setEventoStep(1);
              };

              return <>
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:12,color:"#6B4226",marginBottom:8}}>Asigná el tipo de servicio a cada animal de {eventoForm.lote}:</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                    {["IATF","TE","Repaso","Sin servicio"].map(t=>(
                      <button key={t} className="btn btn-ghost btn-sm" style={{fontSize:11}}
                        onClick={()=>asignarTodos(t)}>Todos → {t}</button>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                    {Object.entries(conteo).filter(([,v])=>v>0).map(([k,v])=>(
                      <span key={k} className={`badge ${k==="Sin servicio"?"badge-rojo":k==="TE"?"badge-paja":k==="IATF"?"badge-verde":"badge-cielo"}`}>
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{maxHeight:320,overflowY:"auto",display:"flex",flexDirection:"column",gap:4}}>
                  {animalesLote.map(a=>{
                    const asig=eventoForm.asignaciones[a.caravana]||"IATF";
                    return(
                      <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",
                        borderRadius:8,background:"rgba(255,253,245,.8)",border:"1px solid rgba(107,66,38,.1)"}}>
                        <div style={{flex:1,fontSize:13,fontWeight:700}}>{a.caravana}</div>
                        <div style={{fontSize:11,color:"#8B5E3C"}}>{a.nombre||""}</div>
                        <div style={{display:"flex",gap:4}}>
                          {["IATF","TE","Repaso","Sin servicio"].map(t=>(
                            <button key={t} onClick={()=>asignar(a.caravana,t)}
                              style={{padding:"3px 8px",borderRadius:6,fontSize:10,cursor:"pointer",fontWeight:600,
                                border:`1.5px solid ${asig===t?"#4A7C4E":"rgba(107,66,38,.2)"}`,
                                background:asig===t?(t==="Sin servicio"?"rgba(176,58,46,.15)":t==="TE"?"rgba(212,168,90,.2)":"rgba(74,124,78,.15)"):"rgba(255,253,245,.5)",
                                color:asig===t?(t==="Sin servicio"?"#B03A2E":t==="TE"?"#8B5E3C":"#4A7C4E"):"#8B5E3C"}}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {!animalesLote.length&&<div className="txt-muted" style={{textAlign:"center",padding:16,fontSize:12}}>No hay vacas/vaquillas en lote {eventoForm.lote}</div>}
                </div>
                <div className="flex mt">
                  <button className="btn btn-ghost btn-sm" onClick={()=>setEventoStep(2)}>← Atrás</button>
                  <button className="btn btn-verde" style={{flex:1}} onClick={guardarEvento}>
                    💾 Registrar pre-servicio ({eventoForm.productos.length} productos · {animalesLote.length} animales)
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setShowEvento(false)}>Cancelar</button>
                </div>
              </>;
            })()}
          </div>
        </div>
      )}

      {showForm&&(
        <div className="modal-overlay" onClick={e=>{if(e.target.className.includes("modal-overlay"))setShowForm(false);}}>
        <div className="modal-box">
          <div className="modal-title">📅 Nueva Rotación</div>
          <div className="form-row">
            <div className="field"><label>Piquete</label>
              <select value={form.piqueteId} onChange={e=>{
                const piq=PIQUETES_DATA.find(p=>p.id===+e.target.value);
                setForm({...form,piqueteId:e.target.value,salida:piq?.dias?calcSalida(form.entrada,piq.dias):""});
              }}>
                <option value="">Seleccionar...</option>
                {PIQUETES_DATA.map(p=><option key={p.id} value={p.id}>{p.nombre}{p.ha?` (${p.ha}ha·${p.dias}d)`:""}</option>)}
              </select>
            </div>
            <div className="field"><label>Lote</label>
              <select value={form.lote} onChange={e=>setForm({...form,lote:e.target.value})}>
                <option>Todos</option><option>General</option><option>Cbo3</option><option>Cbo4</option><option>Cbo5</option><option>Cbo6</option><option>Cbo7</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="field"><label>📅 Fecha entrada</label>
              <input type="date" value={form.entrada} onChange={e=>{
                const piq=PIQUETES_DATA.find(p=>p.id===+form.piqueteId);
                setForm({...form,entrada:e.target.value,salida:piq?.dias?calcSalida(e.target.value,piq.dias):""});
              }}/>
            </div>
            <div className="field"><label>📅 Salida estimada</label>
              <input type="date" value={form.salida} onChange={e=>setForm({...form,salida:e.target.value})}/>
            </div>
          </div>
          <div className="form-row">
            <div className="field"><label>Obs.</label><input value={form.obs} onChange={e=>setForm({...form,obs:e.target.value})}/></div>
          </div>
          <div className="flex mt">
            <button className="btn btn-verde" onClick={guardar}>💾 Guardar</button>
            <button className="btn btn-ghost btn-sm" onClick={()=>setShowForm(false)}>Cancelar</button>
          </div>
        </div>
        </div>
      )}

      {/* Modal: Mover lote entre potreros */}
      {showMover&&(
        <div className="modal-overlay" onClick={e=>{if(e.target.className.includes("modal-overlay"))setShowMover(false);}}>
        <div className="modal-box">
          <div className="modal-title">🔄 Mover Lote entre Potreros</div>
          <div className="form-row">
            <div className="field"><label>🐄 Origen (piquete actual)</label>
              <select value={moverForm.origen} onChange={e=>setMoverForm({...moverForm,origen:e.target.value})}>
                <option value="">Seleccionar...</option>
                {piquetesOcupados.map(n=><option key={n}>{n}</option>)}
              </select>
              {moverForm.origen&&<div style={{fontSize:11,color:"#4A7C4E",marginTop:4,fontWeight:600}}>
                {animales.filter(a=>a.ubicacion===moverForm.origen).length} animales en {moverForm.origen}
              </div>}
            </div>
            <div className="field"><label>📍 Destino</label>
              <select value={moverForm.destino} onChange={e=>setMoverForm({...moverForm,destino:e.target.value})}>
                <option value="">Seleccionar...</option>
                {todosNombres.filter(n=>n!==moverForm.origen).map(n=><option key={n}>{n}</option>)}
              </select>
              {moverForm.destino&&getEstado(PIQUETES_DATA.find(p=>p.nombre===moverForm.destino)?.id)&&(
                <div style={{fontSize:11,color:"#D4A85A",marginTop:4,fontWeight:600}}>
                  ⚠️ Ya ocupado — se mantiene fecha de entrada original
                </div>
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="field"><label>📅 Fecha de mudanza</label>
              <input type="date" value={moverForm.fecha} onChange={e=>setMoverForm({...moverForm,fecha:e.target.value})}/>
            </div>
          </div>
          <div className="flex mt">
            <button className="btn btn-verde" onClick={moverLote}>🔄 Mover</button>
            <button className="btn btn-ghost btn-sm" onClick={()=>setShowMover(false)}>Cancelar</button>
          </div>
        </div>
        </div>
      )}

      {/* Mapa */}
      <div className="card mb">
        <div className="card-title">🗺️ Mapa de Piquetes — tocá uno para ver el historial</div>
        <PiqueMap rotaciones={rotaciones} animales={animales} onSelect={setSelPiquete} seleccionado={selPiquete}/>
      </div>

      {/* Detalle piquete seleccionado */}
      {piquete&&(
        <div className="card mb" style={{borderLeft:"4px solid #4A7C4E"}}>
          <div className="card-title">
            🌿 {piquete.nombre}
            {piquete.ha&&<span className="txt-muted" style={{fontWeight:400,fontSize:12,marginLeft:8}}>{piquete.ha} ha · {piquete.dias} días recomendados</span>}
          </div>
          {getEstado(piquete.id)?(
            <div style={{background:"rgba(212,168,90,.12)",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:12,fontFamily:"'Lora',serif",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <div style={{flex:1}}>
                <strong>🐄 Ocupado</strong> — Lote: {getEstado(piquete.id).lote} · 
                Entrada: <strong>{getEstado(piquete.id).entrada}</strong> · 
                Salida est.: {getEstado(piquete.id).salida||"—"} · 
                Animales: {animales.filter(a=>a.ubicacion===piquete.nombre).length}
              </div>
              <button className="btn btn-ghost btn-sm" style={{fontSize:11,whiteSpace:"nowrap"}}
                onClick={async()=>{
                  if(!window.confirm(`¿Cerrar rotación activa en ${piquete.nombre}? El piquete quedará libre.`)) return;
                  const rot=getEstado(piquete.id);
                  if(rot){
                    await removeRotD(rot.id);
                    await addRotD({...rot,id:undefined,salida:today(),obs:"Cerrado manualmente"});
                  }
                }}>
                ✅ Cerrar rotación
              </button>
            </div>
          ):(
            <div style={{background:"rgba(74,124,78,.1)",borderRadius:8,padding:"8px 14px",marginBottom:12,fontSize:12,color:"#4A7C4E",fontFamily:"'Lora',serif"}}>
              ✅ Libre
            </div>
          )}
          {/* Animales en este piquete */}
          {animales.filter(a=>a.ubicacion===piquete.nombre).length>0&&(
            <div style={{marginBottom:12}}>
              <div className="card-title" style={{fontSize:12,marginBottom:6}}>🐄 Animales en {piquete.nombre}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {animales.filter(a=>a.ubicacion===piquete.nombre).map(a=>(
                  <span key={a.id} className="badge badge-cielo" style={{fontSize:10}}>{a.caravana}</span>
                ))}
              </div>
            </div>
          )}
          <div className="card-title" style={{fontSize:12,marginBottom:8}}>📋 Historial de rotaciones</div>
          {rots.length===0&&<div className="txt-muted" style={{fontSize:12,fontStyle:"italic"}}>Sin registros</div>}
          {rots.map(r=>(
            <div key={r.id} style={{display:"flex",gap:10,alignItems:"center",padding:"6px 0",borderBottom:"1px solid rgba(107,66,38,.08)",fontSize:12,fontFamily:"'Lora',serif"}}>
              <span>📅</span>
              <div style={{flex:1}}>
                <strong>{r.entrada}</strong>{r.salida?` → ${r.salida}`:""} · Lote: {r.lote}
                {r.obs&&<div className="txt-muted">{r.obs}</div>}
              </div>
              <button className="btn btn-rojo btn-sm" style={{padding:"2px 8px",fontSize:11}} onClick={()=>removeRotD(r.id)}>🗑</button>
            </div>
          ))}
        </div>
      )}

      {/* Tabla estado actual */}
      <div className="card">
        <div className="card-title">📋 Estado actual de todos los piquetes</div>
        <div className="tbl-wrap">
          <table>
            <thead><tr>
              <th>Piquete</th><th>Área</th><th>Días rec.</th><th>Estado</th><th>Lote</th><th>Entrada</th><th>Salida est.</th><th>Animales</th>
            </tr></thead>
            <tbody>
              {PIQUETES_DATA.map(p=>{
                const est=getEstado(p.id);
                const nAnim=animales.filter(a=>a.ubicacion===p.nombre).length;
                return <tr key={p.id} style={{cursor:"pointer"}} onClick={()=>setSelPiquete(p.id)}>
                  <td style={{fontWeight:700}}>{p.nombre}</td>
                  <td>{p.ha?`${p.ha} ha`:"—"}</td>
                  <td style={{textAlign:"center"}}>{p.dias||"—"}</td>
                  <td>{est?<span className="badge badge-paja">🐄 Ocupado</span>:<span className="badge badge-verde">✅ Libre</span>}</td>
                  <td>{est?.lote||"—"}</td>
                  <td style={{fontSize:11,fontWeight:600,color:"#4A7C4E"}}>{est?.entrada||"—"}</td>
                  <td style={{fontSize:11}}>{est?.salida||"—"}</td>
                  <td style={{textAlign:"center",fontWeight:700}}>{nAnim||"—"}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


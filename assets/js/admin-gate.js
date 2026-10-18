/* 🔐 Sanskriti Admin Gate v1 — username/password ताला (static hosting deterrent)
   असली server-side सुरक्षा orders/data आने पर लगेगी। */
const GATE_HASH='11c4aec333a15d9325096554ac59948f01cf12276f3ba06a6f9802673f46b2eb';
async function _sha(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function gateOK(){try{return localStorage.getItem('sk_gate')==='1'||sessionStorage.getItem('sk_gate')==='1'}catch(e){return false}}
async function gateTry(u,p){try{const h=await _sha(u.trim().toLowerCase()+':'+p);if(h===GATE_HASH){localStorage.setItem('sk_gate','1');return true}}catch(e){}return false}
function gateRequire(){if(!gateOK())location.replace('admin.html')}
function gateLogout(){try{localStorage.removeItem('sk_gate');sessionStorage.removeItem('sk_gate')}catch(e){}location.replace('index.html')}

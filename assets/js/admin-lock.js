/* === Admin Lock (17-10) — Photo/Card/Doc Studio सिर्फ़ दुकानदार के लिए ===
   Dev: "in 3 ko admin admin password se bahar rakhna he"
   username: admin · password: admin (बदलना हो तो नीचे बदलो) — tab बंद = फिर lock */
window.ADMINLOCK=(()=>{
 const U='admin', P='admin';
 const ok=()=>sessionStorage.getItem('sc_admin')==='1';
 function gate(){
  if(ok())return;
  const d=document.createElement('div');
  d.id='admlk';
  d.innerHTML=`<style>#admlk{position:fixed;inset:0;background:#FBF7F0;z-index:99999;display:flex;align-items:center;justify-content:center;font-family:Mukta,sans-serif}
   #admlk .box{background:#fff;border:2px solid #8E2A32;border-radius:16px;padding:24px;width:320px;text-align:center}
   #admlk input{width:100%;padding:12px;margin:6px 0;border:1.5px solid #ddd;border-radius:10px;font-size:15px;box-sizing:border-box}
   #admlk button{width:100%;padding:12px;margin-top:10px;background:#8E2A32;color:#fff;border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer}
   #admlk .msg{color:#c00;font-size:13px;min-height:18px;margin-top:6px}
   #admlk a{display:inline-block;margin-top:10px;font-size:13px;color:#8E2A32}</style>
   <div class="box"><div style="font-size:44px">🔒</div>
   <h2 style="margin:6px 0">Admin Area</h2>
   <p style="font-size:13.5px;color:#666;margin:0 0 8px">यह tool सिर्फ़ दुकानदार के लिए है</p>
   <input id="alu" placeholder="👤 Username" autocomplete="off">
   <input id="alp" type="password" placeholder="🔑 Password">
   <button id="alb">खोलें →</button>
   <div class="msg" id="alm"></div>
   <a href="category.html?c=cyber">← Cyber Cafe पर वापस</a></div>`;
  document.body.appendChild(d);
  const go=()=>{ if(document.getElementById('alu').value.trim()===U && document.getElementById('alp').value===P){
    sessionStorage.setItem('sc_admin','1'); d.remove();
   } else { document.getElementById('alm').textContent='❌ गलत username या password'; } };
  document.getElementById('alb').onclick=go;
  document.getElementById('alp').addEventListener('keydown',e=>{if(e.key==='Enter')go()});
 }
 return {gate};
})();

/* === Cyber Cafe — Registration Gate + OTP + Usage Tracking (17-10) ===
   नियम: regApi खाली = direct mode (testing) · regApi भरा = email OTP ज़रूरी
   user: {id:'SC-1001', name, phone, email} → localStorage sc_user */
window.SC=(()=>{
 const KEY='sc_user'; let _api;
 const user=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}};
 const save=u=>localStorage.setItem(KEY,JSON.stringify(u));
 const logout=()=>{localStorage.removeItem(KEY);location.reload()};
 async function api(){ if(_api!==undefined)return _api;
  _api=(window.CFG&&CFG.site&&CFG.site.regApi)||'';
  if(!_api){try{const s=await (await fetch('config/site.json?v='+Date.now())).json();_api=s.regApi||''}catch(e){_api=''}}
  return _api; }
 async function post(d){ const r=await fetch(await api(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(d)}); return r.json(); }
 async function sendOtp(name,phone,email){ const a=await api();
  if(!a){ const id='SC-'+(1000+Math.floor(Math.random()*9000)); const u={id,name,phone,email,t:Date.now()}; save(u); return {ok:true,direct:true,user:u}; }
  return await post({action:'send',name,phone,email}); }
 async function verifyOtp(name,phone,email,otp){ const r=await post({action:'verify',email,otp});
  if(r.ok){ const u={id:r.userId,name:r.name||name,phone,email,t:Date.now()}; save(u); return {ok:true,user:u}; } return r; }
 async function track(tool,what){ const u=user(); if(!u)return; const a=await api(); if(!a)return;
  try{navigator.sendBeacon(a,new Blob([JSON.stringify({action:'use',userId:u.id,name:u.name,tool,what:what||''})],{type:'text/plain'}))}catch(e){} }
 function guard(tool){ if(!user()){ location.replace('category.html?c=cyber&need=1'); return true; } track(tool,'open'); return false; }
 async function sendSupport(tool,problem,userId,name){ const a=await api(); if(!a)return;
  try{navigator.sendBeacon(a,new Blob([JSON.stringify({action:'support',userId:userId||'',name:name||'',tool,problem})],{type:'text/plain'}))}catch(e){} }
 return {user,logout,sendOtp,verifyOtp,track,guard,sendSupport};
})();

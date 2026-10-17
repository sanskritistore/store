/* === Sanskriti Help Box — हर page पर 💬 मदद (HB.init('tool-name')) === */
const HB=(()=>{let faqs=null,fallback='',tool='',built=false;
const css=`#hbbtn{position:fixed;right:14px;bottom:14px;z-index:9999;background:#8E2A32;color:#fff;border:none;border-radius:50px;padding:12px 18px;font-size:16px;font-weight:700;box-shadow:0 4px 14px rgba(0,0,0,.3);cursor:pointer;font-family:inherit}
#hbpanel{position:fixed;right:0;bottom:0;left:0;top:auto;height:70vh;max-height:520px;z-index:10000;background:#fff;border-radius:18px 18px 0 0;box-shadow:0 -4px 24px rgba(0,0,0,.25);display:none;flex-direction:column;font-family:inherit}
@media(min-width:700px){#hbpanel{left:auto;right:16px;bottom:16px;width:380px;height:480px;border-radius:16px}}
#hbpanel.open{display:flex}
.hbh{background:#8E2A32;color:#fff;padding:14px 16px;border-radius:18px 18px 0 0;display:flex;justify-content:space-between;align-items:center;font-weight:700}
.hbh button{background:none;border:none;color:#fff;font-size:22px;cursor:pointer;line-height:1}
.hbm{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
.hbmsg{max-width:85%;padding:9px 12px;border-radius:14px;font-size:14px;line-height:1.5;white-space:pre-wrap}
.hbmsg.me{align-self:flex-end;background:#8E2A32;color:#fff;border-bottom-right-radius:4px}
.hbmsg.bot{align-self:flex-start;background:#f3ece7;color:#333;border-bottom-left-radius:4px}
.hbchips{display:flex;gap:6px;flex-wrap:wrap;padding:0 12px 8px}
.hbchip{border:1.5px solid #8E2A32;color:#8E2A32;background:#fff;border-radius:20px;padding:6px 12px;font-size:12.5px;cursor:pointer;font-family:inherit}
.hbi{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #eee}
.hbi input{flex:1;border:1.5px solid #ddd;border-radius:24px;padding:10px 14px;font-size:15px;font-family:inherit;outline:none}
.hbi button{background:#8E2A32;color:#fff;border:none;border-radius:50%;width:44px;height:44px;font-size:18px;cursor:pointer}`;
function build(){
 const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
 const btn=document.createElement('button');btn.id='hbbtn';btn.innerHTML='💬 मदद';btn.onclick=()=>toggle();document.body.appendChild(btn);
 const p=document.createElement('div');p.id='hbpanel';p.innerHTML=`<div class="hbh"><span>💬 Sanskriti मदद</span><button onclick="HB.toggle()">✕</button></div>
 <div class="hbm" id="hbmsgs"></div>
 <div class="hbchips" id="hbchips"></div>
 <div class="hbi"><input id="hbinput" placeholder="अपनी problem यहाँ लिखें..." enterkeyhint="send"><button onclick="HB.send()">➤</button></div>`;
 document.body.appendChild(p);
 p.querySelector('#hbinput').addEventListener('keydown',e=>{if(e.key==='Enter')HB.send();});
 const chips=['पासपोर्ट फोटो कैसे?','ID card कैसे?','OTP नहीं आया','print का rate'];
 document.getElementById('hbchips').innerHTML=chips.map(c=>`<button class="hbchip" onclick="HB.ask('${c}')">${c}</button>`).join('');
 bot(`नमस्ते! 🙏 मैं Sanskriti मदद हूँ। ${tool?('<b>'+tool+'</b> में'):'software use करने में'} कोई problem हो तो पूछिए — तुरंत जवाब मिलेगा।`);
 built=true;}
function toggle(){const p=document.getElementById('hbpanel');p.classList.toggle('open');}
function add(html,who){const m=document.getElementById('hbmsgs');const d=document.createElement('div');d.className='hbmsg '+who;d.innerHTML=html;m.appendChild(d);m.scrollTop=m.scrollHeight;}
function bot(h){add(h,'bot');}
async function loadFaqs(){if(faqs)return;try{const r=await fetch('config/faq.json?v='+Date.now());const j=await r.json();faqs=j.faqs;fallback=j.fallback;}catch(e){faqs=[];fallback='अभी जवाब नहीं मिल पाया — WhatsApp करें: 9873152325';}}
function match(q){
 const t=q.toLowerCase();let best=null,bestScore=0;
 for(const f of faqs){let s=0;for(const k of f.keys){if(t.includes(k.toLowerCase()))s+=k.length;}
  if(s>bestScore){bestScore=s;best=f;}}
 return bestScore>=3?best:null;}
async function answer(q){
 await loadFaqs();
 const f=match(q);
 if(f){bot(f.a);if(typeof SC!=='undefined'&&SC.track)SC.track(tool||'help','faq:'+q.slice(0,40));}
 else{bot(fallback);
  if(typeof SC!=='undefined'&&SC.sendSupport){const u=SC.user()||{};SC.sendSupport(tool||'general',q,u.userId||'',u.name||'');}}}
return{init(t){tool=t||'';if(!built)build();},
 toggle,ask(q){document.getElementById('hbpanel').classList.add('open');add(q,'me');answer(q);},
 send(){const i=document.getElementById('hbinput');const q=i.value.trim();if(!q)return;i.value='';add(q,'me');setTimeout(()=>answer(q),300);}}})();

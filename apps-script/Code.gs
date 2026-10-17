/* === Sanskriti Cyber Cafe — Registration Backend (Google Apps Script) ===
   काम: email OTP भेजना/जाँचना, User ID देना, usage लिखना, admin report दिखाना
   डेटा: तुम्हारे Gmail की Google Sheet में (अपने आप बन जाती है) — पूरा अधिकार तुम्हारे पास
   Setup: SETUP.md देखो (10 मिनट, एक बार) */
const ADMIN_KEY = 'sanskriti786'; // admin report खोलने का password (बदल सकते हो)

function ss(){ const p=PropertiesService.getScriptProperties(); let id=p.getProperty('sid');
  if(!id){ const s=SpreadsheetApp.create('Sanskriti Cyber Cafe — Users'); id=s.getId(); p.setProperty('sid',id); }
  return SpreadsheetApp.openById(id); }
function sheet(name,cols){ const s=ss(); let sh=s.getSheetByName(name);
  if(!sh){ sh=s.insertSheet(name); sh.appendRow(cols); } return sh; }
function json(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function doPost(e){
  let d={}; try{ d=JSON.parse(e.postData.contents); }catch(err){ return json({ok:false,msg:'गलत request'}); }

  if(d.action==='send'){
    if(!d.name || !d.phone || !d.email) return json({ok:false,msg:'नाम, phone, email — तीनों ज़रूरी'});
    const email=(''+d.email).trim().toLowerCase();
    const otp=''+Math.floor(100000+Math.random()*900000);
    CacheService.getScriptCache().put('otp_'+email, JSON.stringify({otp:otp,name:d.name,phone:d.phone}), 600); // 10 मिनट
    MailApp.sendEmail(email, 'Sanskriti Cyber Cafe — OTP: '+otp,
      'नमस्ते '+d.name+'!\n\nआपका OTP है: '+otp+'\n(10 मिनट तक valid)\n\n— संस्कृति Store, Cyber Cafe');
    return json({ok:true});
  }

  if(d.action==='verify'){
    const email=(''+d.email||'').trim().toLowerCase();
    const rec=CacheService.getScriptCache().get('otp_'+email);
    if(!rec) return json({ok:false,msg:'OTP expire हो गया — दोबारा भेजें'});
    const r=JSON.parse(rec);
    if(r.otp!==(''+d.otp).trim()) return json({ok:false,msg:'गलत OTP — फिर देखो'});
    const us=sheet('Users',['userId','name','phone','email','time']);
    const rows=us.getDataRange().getValues();
    for(let i=1;i<rows.length;i++){
      if((''+rows[i][3]).toLowerCase()===email) return json({ok:true,userId:rows[i][0],name:rows[i][1]}); // पुराना user
    }
    const id='SC-'+(1000+rows.length); // SC-1001, SC-1002...
    us.appendRow([id, r.name, r.phone, email, new Date()]);
    return json({ok:true, userId:id, name:r.name});
  }

  if(d.action==='use'){
    sheet('Usage',['userId','name','tool','what','time']).appendRow([d.userId||'', d.name||'', d.tool||'', d.what||'', new Date()]);
    return json({ok:true});
  }

  return json({ok:false,msg:'unknown action'});
}

/* Admin report — browser में खोलो:  SCRIPT_URL?admin=sanskriti786 */
function doGet(e){
  if((e.parameter.admin||'')!==ADMIN_KEY) return ContentService.createTextOutput('❌ गलत key');
  const us=sheet('Users',['userId','name','phone','email','time']).getDataRange().getValues();
  const ug=sheet('Usage',['userId','name','tool','what','time']).getDataRange().getValues();
  let h='<meta name="viewport" content="width=device-width,initial-scale=1"><style>'
    +'body{font-family:sans-serif;padding:14px;background:#FBF7F0;color:#241A13}'
    +'table{border-collapse:collapse;width:100%;margin:8px 0 20px;background:#fff}'
    +'td,th{border:1px solid #e0d6c8;padding:7px;font-size:13px;text-align:left}th{background:#8E2A32;color:#fff}'
    +'h1{font-size:20px}h2{font-size:16px;margin:18px 0 6px}.chip{display:inline-block;background:#fff;border:1px solid #e0d6c8;border-radius:10px;padding:8px 14px;margin:3px;font-weight:700}</style>';
  h+='<h1>🖨️ Cyber Cafe — Admin Report</h1><div>'
    +'<span class="chip">👥 Users: '+(us.length-1)+'</span>'
    +'<span class="chip">📊 Usage: '+(ug.length-1)+'</span></div>';
  h+='<h2>👥 Registered Users</h2><table><tr><th>User ID</th><th>नाम</th><th>Phone</th><th>Email</th><th>समय</th></tr>';
  for(let i=1;i<us.length;i++) h+='<tr><td><b>'+us[i][0]+'</b></td><td>'+us[i][1]+'</td><td>'+us[i][2]+'</td><td>'+us[i][3]+'</td><td>'+us[i][4]+'</td></tr>';
  h+='</table><h2>📊 Usage — किसने क्या किया (नए पहले)</h2><table><tr><th>User</th><th>नाम</th><th>Tool</th><th>क्या किया</th><th>समय</th></tr>';
  for(let i=ug.length-1;i>=1 && i>ug.length-300;i--) h+='<tr><td><b>'+ug[i][0]+'</b></td><td>'+ug[i][1]+'</td><td>'+ug[i][2]+'</td><td>'+ug[i][3]+'</td><td>'+ug[i][4]+'</td></tr>';
  return HtmlService.createHtmlOutput(h+'</table>');
}

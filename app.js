const EX='<span class="ex">Example data</span>';
const P=new URLSearchParams(location.search);
const S={tenant:P.get('tenant')||'colby',role:P.get('role')||'client',view:P.get('view')||'dashboard',openThread:P.get('thread')};
const $=s=>document.querySelector(s);
const T=()=>TENANTS.find(t=>t.id===S.tenant);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function toast(m){const t=$('#toast');t.textContent=m;t.classList.remove('hidden');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.add('hidden'),2000);}
function now(){return 'Just now';}
function log(t,type,text,thread){t.log.unshift({t:now(),type,text,thread:thread||[]});}

const CLIENT_NAV=[['dashboard','Dashboard'],['approvals','Approvals','approvals'],['questions','Bot questions','questions'],['confirm','Confirm details','confirms'],['flags','Flagged items','flags'],['activity','Activity log'],['later','Coming later']];
const ADMIN_NAV=[['overview','All tenants'],['settings','Bot settings'],['schedule','Schedule'],['rules','Approval rules'],['integrations','Integrations'],['tenantview','Client’s view (preview)']];

function render(){
  $('#tenantSel').innerHTML=TENANTS.map(t=>`<option value="${t.id}" ${t.id===S.tenant?'selected':''}>${esc(t.name)}</option>`).join('');
  document.querySelectorAll('#roleSeg button').forEach(b=>b.classList.toggle('on',b.dataset.role===S.role));
  const nav=S.role==='client'?CLIENT_NAV:ADMIN_NAV;
  if(!nav.some(n=>n[0]===S.view))S.view=nav[0][0];
  const t=T();
  $('#nav').innerHTML=`<div class="sec">${S.role==='client'?'Client portal':'Admin (Andy only)'}</div>`+nav.map(([k,l,c])=>{const n=c?t[c].length:0;return `<a data-v="${k}" class="${k===S.view?'on':''}">${l}${n?`<span class="cnt">${n}</span>`:''}</a>`}).join('');
  $('#main').innerHTML=(VIEWS[S.view]||(()=>''))(t);
  window.scrollTo(0,0);
}
document.addEventListener('click',e=>{
  const a=e.target.closest('[data-v]');if(a){S.view=a.dataset.v;render();return;}
  const b=e.target.closest('[data-act]');if(b){ACT[b.dataset.act](b.dataset.id,b);}
});
$('#tenantSel').onchange=e=>{S.tenant=e.target.value;render();};
$('#roleSeg').onclick=e=>{const b=e.target.closest('button');if(!b)return;S.role=b.dataset.role;S.view=S.role==='client'?'dashboard':'overview';render();};

function head(t,title,sub){
  return `${S.role==='admin'?'<div class="banner admin small">Admin view — visible to Andy only. The client never sees these controls.</div>':''}
  ${t.paused?'<div class="banner paused small"><b>Bot paused.</b> Missed calls are not being texted back right now.</div>':''}
  <h1>${title}</h1><p class="sub">${esc(t.name)} · ${esc(t.loc)}${t.fake?' <span class="tag gray">Fake example tenant</span>':''}${sub?' — '+sub:''}</p>`;
}
const card=(inner,cls='')=>`<div class="card ${cls}">${inner}</div>`;
function thread(th){return th&&th.length?`<div class="sms">${th.map(([d,m,w])=>`<div class="msg ${d}">${esc(m)}<small>${w}</small></div>`).join('')}</div>`:'';}

const VIEWS={
 dashboard(t){
  const booked=t.log.filter(l=>l.type==='Booked').length, texts=t.log.filter(l=>l.type==='Text-back'||l.type==='Booked').length;
  const pend=t.approvals.length+t.questions.length+t.confirms.length+t.flags.length;
  return head(t,'Dashboard','what the bot did and what needs you')+
  `<div class="card"><b>Running for you:</b> ${esc(t.workflow)}. Business line only — your personal phone stays out of it.</div>
  <div class="grid">
   ${card(`<div class="stat"><div class="n">${texts}</div><div class="l">Missed calls texted back ${EX}</div></div>`)}
   ${card(`<div class="stat"><div class="n">${booked}</div><div class="l">Windows booked on calendar ${EX}</div></div>`)}
   ${card(`<div class="stat"><div class="n">${pend}</div><div class="l">Things waiting on you ${EX}</div></div>`)}
   ${card(`<div class="stat"><div class="n">${t.bookings.length}</div><div class="l">Upcoming visits ${EX}</div></div>`)}
  </div>
  <h2>Needs you</h2>
  ${[['approvals','approval',t.approvals.length],['questions','bot question',t.questions.length],['confirm','detail to confirm',t.confirms.length],['flags','flagged item',t.flags.length]].map(([v,l,n])=>n?card(`<div class="row"><div><b>${n}</b> ${n>1?l.replace('detail to confirm','details to confirm').replace(/(approval|question|item)$/,'$1s'):l} ${EX}</div><button class="b" data-v="${v}">Open</button></div>`):'').join('')||card('<div class="empty">All caught up.</div>')}
  <h2>Done (reported only)</h2>
  ${card(t.log.slice(0,4).map(l=>`<div class="row" style="padding:6px 0;border-bottom:1px solid var(--line)"><div><span class="tag ${tagc(l.type)}">${l.type}</span>${esc(l.text)} ${EX}</div><span class="muted small">${l.t}</span></div>`).join('')||'<div class="empty">No activity yet.</div>')}
  <h2>Upcoming booked windows</h2>${bookingsTable(t)}`;
 },
 approvals(t){
  return head(t,'Approvals','unusual items wait for your OK. Routine missed-call texts and bookings are just reported.')+
  (t.approvals.length?t.approvals.map(a=>card(`<div class="row"><div><span class="tag warn">${a.kind}</span> <b>${a.from}</b> ${EX}</div><span class="muted small">${a.when}</span></div>
   <p style="margin:8px 0">${esc(a.ask)}</p><div class="small muted">Bot’s proposed reply:</div>
   <div id="d-${a.id}" class="sms"><div class="msg out">${esc(a.draft)}</div></div>
   <div class="btns"><button class="b p" data-act="approve" data-id="${a.id}">Approve & send</button><button class="b" data-act="edit" data-id="${a.id}">Edit</button><button class="b r" data-act="reject" data-id="${a.id}">Reject</button></div>`)).join(''):card('<div class="empty">Nothing waiting for approval. 👍</div>'));
 },
 questions(t){
  return head(t,'Bot questions','the bot isn’t sure — your answer becomes the rule going forward')+
  (t.questions.length?t.questions.map(q=>card(`<b>${esc(q.q)}</b> ${EX}<div class="btns">${q.opts.map((o,i)=>`<button class="b" data-act="answer" data-id="${q.id}|${i}">${esc(o)}</button>`).join('')}</div>`)).join(''):card('<div class="empty">No open questions.</div>'));
 },
 confirm(t){
  return head(t,'Confirm details','make sure the bot has these right')+
  (t.confirms.length?t.confirms.map(c=>card(`<div class="small muted">${esc(c.label)}</div><div style="margin:4px 0 0"><b>${esc(c.val)}</b> ${EX}</div><div class="btns"><button class="b p" data-act="confirmOk" data-id="${c.id}">Looks right</button><button class="b" data-act="confirmFix" data-id="${c.id}">Needs a change</button></div>`)).join(''):card('<div class="empty">Everything confirmed.</div>'));
 },
 flags(t){
  return head(t,'Flagged items','things the bot stopped on')+
  (t.flags.length?t.flags.map(f=>card(`<span class="tag ${f.sev}">${f.sev==='bad'?'Needs attention':'Check'}</span><b>${esc(f.title)}</b> ${EX}<p class="muted" style="margin:6px 0">${esc(f.body)}</p><div class="btns"><button class="b" data-act="flag" data-id="${f.id}|ignore">Ignore — not a customer</button><button class="b" data-act="flag" data-id="${f.id}|callback">I’ll call them back</button><button class="b" data-act="flag" data-id="${f.id}|andy">Ask Andy to fix the bot</button></div>`)).join(''):card('<div class="empty">No flagged items.</div>'));
 },
 activity(t){
  return head(t,'Activity log','every text and booking, newest first')+
  (t.log.length?t.log.map((l,i)=>card(`<div class="row"><div><span class="tag ${tagc(l.type)}">${l.type}</span>${esc(l.text)} ${EX}</div><span class="muted small">${l.t}</span></div>${l.thread.length?`<details ${S.openThread==i?'open':''}><summary class="small muted" style="cursor:pointer;margin-top:6px">SMS thread (${l.thread.length} messages)</summary>${thread(l.thread)}</details>`:''}`)).join(''):card('<div class="empty">No activity yet.</div>'))+
  `<h2>Booked windows</h2>${bookingsTable(t)}`;
 },
 later(t){
  return head(t,'Coming later','only added if they’re actually useful')+
  card(`<span class="tag">Now (pilot)</span> <b>Missed call → text → calendar</b><div class="muted small">Business line only.</div>`)+
  LATER.map(l=>card(`<span class="tag gray">Coming later</span> <b>${l.name}</b><div class="muted small">${l.desc}</div>`,'later')).join('')+
  card(`<div class="muted small">Not part of this: payments, bookkeeping, personal texts, lead buying.</div>`);
 },
 // ---------- ADMIN ----------
 overview(){
  return `<div class="banner admin small">Admin view — visible to Andy only.</div><h1>All tenants</h1><p class="sub">Cross-tenant overview. Bots belong to Andy and run on each client’s behalf.</p>
  <div class="card tw"><table><tr><th>Tenant</th><th>Status</th><th>Bot</th><th>Approvals</th><th>Questions</th><th>Flags</th><th>Log entries</th><th></th></tr>
  ${TENANTS.map(t=>`<tr><td><b>${esc(t.name)}</b><div class="small muted">${esc(t.loc)}</div></td><td>${t.fake?'<span class="tag gray">Fake example</span>':'<span class="tag">'+t.status+'</span>'}</td>
  <td><label class="sw"><input type="checkbox" ${t.paused?'':'checked'} data-act="pause" data-id="${t.id}"><span></span></label> <span class="small">${t.paused?'Paused':'Running'}</span></td>
  <td>${t.approvals.length} ${EX}</td><td>${t.questions.length}</td><td>${t.flags.length}</td><td>${t.log.length}</td><td><button class="b" data-act="goTenant" data-id="${t.id}">Manage</button></td></tr>`).join('')}</table></div>
  <div class="card small muted">No pricing or billing shown — not decided. Payments and bookkeeping are out of scope.</div>`;
 },
 settings(t){const s=t.settings;
  return head(t,'Bot settings','per-tenant')+
  card(`<div class="row"><div><b>Bot status</b><div class="small muted">Pause stops all text-backs for this tenant.</div></div><label class="sw"><input type="checkbox" ${t.paused?'':'checked'} data-act="pause" data-id="${t.id}"><span></span></label></div>`)+
  card(`<b>Workflow:</b> ${esc(t.workflow)}<h2>Text-back</h2>
   <label class="small muted">Send text within (minutes)</label><br><input type="number" id="delay" value="${s.delay}" style="width:80px"> ${EX}<br><br>
   <label><input type="checkbox" id="vm" ${s.vmPrompt?'checked':''}> Optional voicemail prompt (“leave a message, or hang up and you’ll get a text”)</label><br><br>
   <label class="small muted">First text (sent from the business number)</label><textarea id="greet">${esc(s.greeting)}</textarea>
   <h2>Job types offered</h2>${s.jobTypes.map(j=>`<span class="tag blue">${esc(j)}</span>`).join('')}
   <div class="btns"><button class="b p" data-act="saveSettings">Save</button></div>`)+
  `<h2>Add-ons</h2>`+LATER.map(l=>card(`<div class="row"><div><b>${l.name}</b> <span class="tag gray">Coming later</span></div><label class="sw"><input type="checkbox" disabled><span></span></label></div>`,'later')).join('');
 },
 schedule(t){const s=t.settings;
  return head(t,'Schedule','when the bot runs and which windows it offers')+
  card(`<label class="small muted">Bot active hours</label><br><input id="hrs" value="${esc(s.hours)}" style="width:100%"> ${EX}
  <h2>Bookable windows</h2><div id="wins">${s.windows.map((w,i)=>`<div class="row" style="padding:4px 0"><span>${esc(w)} ${EX}</span><button class="b r" data-act="delWin" data-id="${i}">Remove</button></div>`).join('')}</div>
  <div class="btns"><input id="newWin" placeholder="e.g. Sat 8–11am"><button class="b" data-act="addWin">Add window</button></div>
  <div class="btns"><button class="b p" data-act="saveSched">Save</button></div>`);
 },
 rules(t){const r=t.rules;
  const rows=[['routineText','Routine missed-call text-back'],['routineBooking','Routine booking into an open window'],['pricing','Pricing questions'],['complaint','Complaints'],['reschedule','Reschedules'],['review','Review asks'],['unknown','Unknown / vendor / spam']];
  return head(t,'Approval rules','default: routine items are reported, unusual items need approval')+
  card(`<div class="tw"><table><tr><th>Item</th><th>Handling</th></tr>${rows.map(([k,l])=>`<tr><td>${l}</td><td><select data-rule="${k}">${[['report','Do it & report'],['approve','Needs client approval'],['flag','Stop & flag']].map(([v,n])=>`<option value="${v}" ${r[k]===v?'selected':''}>${n}</option>`).join('')}</select></td></tr>`).join('')}</table></div>
  <div class="btns"><button class="b p" data-act="saveRules">Save rules</button><button class="b" data-act="resetRules">Reset to default</button></div>`)+
  card(`<span class="tag warn">Open decision</span> Still to agree with ${t.fake?'this client':'Colby'}: auto-book vs. confirm first, and which items need his OK.`);
 },
 integrations(t){const s=t.settings;
  return head(t,'Integrations & credentials','placeholders only — nothing connected in this prototype')+
  card(`<div class="row"><div><b>Phone line</b><div class="small muted">${esc(s.line)}</div><div class="small">Provider: <span class="ph">TBD</span> · Number: <span class="ph">TBD</span> · API key: <span class="ph">••••••••</span></div></div><span class="tag gray">Not connected</span></div><div class="btns"><button class="b" data-act="stub">Connect phone line</button></div>`)+
  card(`<div class="row"><div><b>Calendar</b><div class="small muted">${esc(s.calendar)}</div><div class="small">Calendar: <span class="ph">TBD</span> · Access: <span class="ph">TBD</span></div></div><span class="tag gray">Not connected</span></div><div class="btns"><button class="b" data-act="stub">Connect calendar</button></div>`)+
  card(`<div class="small muted">Personal phone and personal texts are never connected.</div>`);
 },
 tenantview(t){S.role='client';S.view='dashboard';setTimeout(render);return '';}
};
function tagc(t){return {Booked:'',"Text-back":'blue',Approved:'',Rejected:'bad',Answered:'blue',Flag:'warn',Confirmed:''}[t]||'gray';}
function bookingsTable(t){return t.bookings.length?card(`<div class="tw"><table><tr><th>Caller</th><th>Job type</th><th>Window</th><th>Status</th></tr>${t.bookings.map(b=>`<tr><td>${b.who} ${EX}</td><td>${esc(b.type)}</td><td>${b.win}</td><td><span class="tag">${b.st}</span></td></tr>`).join('')}</table></div>`):card('<div class="empty">No upcoming windows.</div>');}

function modal(html){$('#mbox').innerHTML=html;$('#modal').classList.remove('hidden');}
function close(){$('#modal').classList.add('hidden');}
$('#modal').onclick=e=>{if(e.target.id==='modal')close();};
const take=(arr,id)=>{const i=arr.findIndex(x=>x.id===id);return i<0?null:arr.splice(i,1)[0];};
const ACT={
 approve(id){const t=T(),a=take(t.approvals,id);log(t,'Approved',`${a.kind} (${a.from}) — reply sent`,[['in',a.ask.replace(/[“”]/g,''),a.when],['out',a.draft,'Just now']]);toast('Approved — reply sent & logged');render();},
 reject(id){modal(`<h1>Reject this?</h1><p class="muted">Nothing will be sent. Optional note for Andy:</p><textarea id="rn"></textarea><div class="btns"><button class="b r" data-act="doReject" data-id="${id}">Reject</button><button class="b" data-act="cancel">Cancel</button></div>`);},
 doReject(id){const t=T(),a=take(t.approvals,id),n=$('#rn').value;log(t,'Rejected',`${a.kind} (${a.from}) — not sent${n?' · note: '+n:''}`);close();toast('Rejected & logged');render();},
 edit(id){const a=T().approvals.find(x=>x.id===id);modal(`<h1>Edit reply</h1><p class="muted small">${esc(a.ask)}</p><textarea id="ed">${esc(a.draft)}</textarea><div class="btns"><button class="b p" data-act="doEdit" data-id="${id}">Save & send</button><button class="b" data-act="cancel">Cancel</button></div>`);},
 doEdit(id){const a=T().approvals.find(x=>x.id===id);a.draft=$('#ed').value;close();ACT.approve(id);},
 cancel:close,
 answer(v){const[id,i]=v.split('|'),t=T(),q=take(t.questions,id);log(t,'Answered',`Bot question: “${q.q}” → ${q.opts[i]}`);toast('Thanks — the bot will use that');render();},
 confirmOk(id){const t=T(),c=take(t.confirms,id);log(t,'Confirmed',`${c.label}: confirmed`);toast('Confirmed');render();},
 confirmFix(id){const c=T().confirms.find(x=>x.id===id);modal(`<h1>What should it be?</h1><p class="muted small">${esc(c.label)}</p><textarea id="cf"></textarea><div class="btns"><button class="b p" data-act="doFix" data-id="${id}">Send to Andy</button><button class="b" data-act="cancel">Cancel</button></div>`);},
 doFix(id){const t=T(),c=take(t.confirms,id);log(t,'Confirmed',`${c.label}: change requested — “${$('#cf').value}”`);close();toast('Sent to Andy');render();},
 flag(v){const[id,how]=v.split('|'),t=T(),f=take(t.flags,id);const m={ignore:'ignored (not a customer)',callback:'client will call back',andy:'sent to Andy to fix'};log(t,'Flag',`${f.title} — ${m[how]}`);toast('Logged');render();},
 pause(id,el){const t=TENANTS.find(x=>x.id===id);t.paused=!el.checked;toast(`${t.name}: ${t.paused?'paused':'running'}`);render();},
 goTenant(id){S.tenant=id;S.view='settings';render();},
 saveSettings(){const s=T().settings;s.delay=+$('#delay').value;s.vmPrompt=$('#vm').checked;s.greeting=$('#greet').value;toast('Settings saved (in memory)');},
 addWin(){const v=$('#newWin').value.trim();if(v){T().settings.windows.push(v);render();}},
 delWin(i){T().settings.windows.splice(+i,1);render();},
 saveSched(){T().settings.hours=$('#hrs').value;toast('Schedule saved (in memory)');},
 saveRules(){document.querySelectorAll('[data-rule]').forEach(s=>T().rules[s.dataset.rule]=s.value);toast('Rules saved (in memory)');},
 resetRules(){Object.assign(T().rules,{routineText:'report',routineBooking:'report',pricing:'approve',complaint:'approve',reschedule:'approve',review:'approve',unknown:'flag'});render();toast('Reset to default');},
 stub(){toast('Placeholder — no real connection in prototype');}
};
if(!window.__ext)render();

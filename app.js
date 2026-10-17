// Core app: state, rendering, client views, admin views. All data is EXAMPLE DATA (data.js).
// Per-value example mark (subtle) + one banner per screen.
const EX='<sup class="exm" title="Example data — made up for the prototype">ex</sup>';
const EXBANNER='<div class="exbanner small"><b>Example data.</b> Every number and record here is made up for the prototype; values marked <sup class="exm">ex</sup> are examples.</div>';
const P=new URLSearchParams(location.search);
const S={tenant:P.get('tenant')||'colby',role:P.get('role')||'client',view:P.get('view')||'dashboard',openThread:P.get('thread'),demo:!!P.get('demo')};
if(S.demo){S.tenant='avery';S.role='client';}

// Who may do what. Andy's decisions of 2026-10-17 (audit items 3 & 4). Flip a flag to change behaviour.
const POLICY={
  clientCanEditReplies:false,   // 3a: false = client gets "Suggest a change" (goes to Andy, never sent). true = old "Edit → Save & send".
  clientEntersBaseline:false,   // 3b: false = Andy enters starting numbers (admin); client confirms or flags them.
  clientMarksAndySteps:false,   // 3c: false = Andy-owned setup steps are read-only status for the client.
  revenueVisibleTo:['admin']    // 4: roles that see the "Est. revenue saved" tile. Never add 'client' (demo is a client view).
};

const $=s=>document.querySelector(s);
const T=()=>TENANTS.find(t=>t.id===S.tenant);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tel=n=>`<span class="tel">${esc(n)}</span>`;
const pct=(a,b)=>b?Math.round(100*a/b):0;
const plural=(n,one,many)=>n===1?one:many;
function toast(m,undo){const t=$('#toast');t.innerHTML=`<span>${esc(m)}</span>`+(undo?'<button class="b sm undo" id="undoBtn">Undo</button>':'');t.classList.remove('hidden');
  clearTimeout(toast.h);if(undo)$('#undoBtn').onclick=()=>{undo();t.classList.add('hidden');};toast.h=setTimeout(()=>t.classList.add('hidden'),undo?6000:2500);}
// by: 'you' (client decision), 'andy', 'bot'
function log(t,type,text,thread,by){const e={t:'Just now',type,text,thread:thread||[],by:by||'you'};t.log.unshift(e);return e;}

// ---- Single source of truth: everything numeric is derived from t.leads ----
function stats(t){
  const wk=t.leads.filter(l=>l.wk===t.pilot.week), bk=wk.filter(l=>l.bookedAt);
  const caught=wk.length, replied=wk.filter(l=>l.replied).length;
  return {week:wk,caught,texted:wk.filter(l=>l.reply).length,replied,noReply:caught-replied,booked:bk.length,bookings:bk,
    bookedSoFar:t.leads.filter(l=>l.bookedAt).length};
}
function botLog(t){return t.leads.map(l=>({t:l.when,by:'bot',thread:l.thread||[],type:l.bookedAt?'Booked':'Text-back',
  text:l.bookedAt?`Estimate window booked: ${l.win}${l.type?` (${l.type})`:''}`:`Missed call → text sent${l.replied?' · caller replied, no booking yet':' · no reply yet'}`}));}
const allLog=t=>[...t.log,...botLog(t)];
const pendingCount=t=>t.approvals.length+t.questions.length+t.confirms.length+t.flags.length;
const openRequests=()=>TENANTS.reduce((n,t)=>n+t.requests.filter(r=>r.status==='Open').length,0);

const CLIENT_NAV=[['dashboard','Dashboard'],['approvals','Approvals','approvals'],['questions','Bot questions','questions'],['confirm','Confirm details','confirms'],['flags','Flagged items','flags'],['activity','Activity log'],['later','Coming later']];
const ADMIN_NAV=[['overview','All tenants'],['requests','Client requests',openRequests],['settings','Bot settings'],['schedule','Schedule'],['rules','Approval rules'],['integrations','Integrations'],['tenantview','Client’s view (preview)']];

function render(){
  const list=S.demo?TENANTS.filter(t=>t.demo):TENANTS; // demo never lists (or leaks) other tenants
  if(!list.some(t=>t.id===S.tenant))S.tenant=list[0].id;
  $('#tenantSel').innerHTML=list.map(t=>`<option value="${t.id}" ${t.id===S.tenant?'selected':''}>${esc(t.name)}${t.demo?' (demo)':t.fake?' (example)':''}</option>`).join('');
  document.querySelectorAll('#roleSeg button').forEach(b=>b.classList.toggle('on',b.dataset.role===S.role));
  document.body.classList.toggle('demo',S.demo);
  $('#demoBtn').classList.toggle('hidden',S.role!=='admin'||S.demo);$('#exitDemo').classList.toggle('hidden',!S.demo);
  const nav=S.role==='client'?CLIENT_NAV:ADMIN_NAV;
  if(!nav.some(n=>n[0]===S.view))S.view=nav[0][0];
  const t=T();
  $('#nav').innerHTML=`<div class="sec">${S.role==='client'?'Client portal':'Admin (Andy only)'}</div>`+nav.map(([k,l,c])=>{const n=typeof c==='function'?c():c?t[c].length:0;return `<a data-v="${k}" class="${k===S.view?'on':''}">${l}${n?`<span class="cnt">${n}</span>`:''}</a>`}).join('');
  $('#main').innerHTML=(VIEWS[S.view]||(()=>''))(t);
  window.scrollTo(0,0);navScroll();
}
// Phone: keep the active tab in view and show an edge fade when the tab row scrolls.
function navScroll(){const n=$('#nav'),a=n.querySelector('a.on');if(a&&n.scrollWidth>n.clientWidth)n.scrollLeft=a.offsetLeft-(n.clientWidth-a.offsetWidth)/2;navFade();}
function navFade(){const n=$('#nav'),over=n.scrollWidth>n.clientWidth+1;n.classList.toggle('fl',over&&n.scrollLeft>2);n.classList.toggle('fr',over&&n.scrollLeft+n.clientWidth<n.scrollWidth-2);}
$('#nav').addEventListener('scroll',navFade);window.addEventListener('resize',navScroll);
document.addEventListener('click',e=>{
  const a=e.target.closest('[data-v]');if(a){S.view=a.dataset.v;$('.top').classList.remove('open');render();return;}
  const b=e.target.closest('[data-act]');if(b){ACT[b.dataset.act](b.dataset.id,b);}
});
$('#tenantSel').onchange=e=>{S.tenant=e.target.value;render();};
$('#roleSeg').onclick=e=>{const b=e.target.closest('button');if(!b)return;S.role=b.dataset.role;S.view=S.role==='client'?'dashboard':'overview';render();};
$('#menuBtn').onclick=()=>{const o=$('.top').classList.toggle('open');$('#menuBtn').setAttribute('aria-expanded',o);};

function tenantTag(t){return t.demo?' <span class="tag gray">Demo</span>':t.fake?' <span class="tag gray">Example tenant</span>':'';}
function head(t,title,sub){
  return `${S.role==='admin'?'<div class="banner admin small">Admin view — visible to Andy only. The client never sees these controls.</div>':''}
  ${t.paused?'<div class="banner paused small"><b>Bot paused.</b> Missed calls are not being texted back right now.</div>':''}
  <h1>${title}</h1><p class="sub">${esc(t.name)} · ${esc(t.loc)}${tenantTag(t)}${sub?' — '+sub:''}</p>${EXBANNER}`;
}
function adminHead(title,sub){return `<div class="banner admin small">Admin view — visible to Andy only.</div><h1>${title}</h1><p class="sub">${sub}</p>${EXBANNER}`;}
const card=(inner,cls='')=>`<div class="card ${cls}">${inner}</div>`;
const stat=(k,n,l)=>card(`<div class="stat" data-k="${k}"><div class="n"><span class="v">${n}</span>${EX}</div><div class="l">${l}</div></div>`);
function thread(th){return th&&th.length?`<div class="sms">${th.map(([d,m,w])=>`<div class="msg ${d}">${esc(m)}<small>${w}</small></div>`).join('')}</div>`:'';}
function logRow(l){return `<span class="tag ${tagc(l.type)}">${l.type}</span>${esc(l.text)}${EX}`;}

const FLAG_OPTS={
  vendor:[['ignore','Not a customer — ignore'],['callback','It’s a customer — I’ll call back']],
  personal:[['callback','I’ll call them back'],['andy','Ask Andy how the bot should handle these']],
  unknown:[['callback','I’ll call them back'],['ignore','Not a customer — ignore'],['andy','Ask Andy to fix the bot']]
};
const FLAG_MSG={ignore:'ignored (not a customer)',callback:'you’ll call them back',andy:'sent to Andy'};

const VIEWS={
 dashboard(t){const s=stats(t),pend=pendingCount(t);
  const needs=[['approvals',t.approvals.length,'approval','approvals'],['questions',t.questions.length,'bot question','bot questions'],['confirm',t.confirms.length,'detail to confirm','details to confirm'],['flags',t.flags.length,'flagged item','flagged items']];
  return head(t,'Dashboard','what the bot did and what needs you')+
  `<div class="card"><b>Running for you:</b> ${esc(t.workflow)}. Business line only — your personal phone stays out of it.</div>
  <div class="grid">${stat('texted',s.texted,'Missed calls texted back this week')}${stat('booked',s.booked,'Windows booked on calendar this week')}${stat('waiting',pend,'Things waiting on you')}${stat('upcoming',s.bookings.length,'Upcoming visits')}</div>
  <h2>Needs you</h2>
  ${needs.map(([v,n,one,many])=>n?card(`<div class="row"><div><b>${n}</b>${EX} ${plural(n,one,many)}</div><button class="b" data-v="${v}">Open</button></div>`):'').join('')||card('<div class="empty">All caught up.</div>')}
  <h2>Done by the bot (reported only)</h2>
  ${card(botLog(t).slice(0,4).map(l=>`<div class="row logrow"><div>${logRow(l)}</div><span class="muted small">${l.t}</span></div>`).join('')||'<div class="empty">No activity yet.</div>')}
  <h2>Upcoming booked windows</h2>${bookingsTable(t)}`;
 },
 approvals(t){
  return head(t,'Approvals','unusual items wait for your OK. Routine missed-call texts and bookings are just reported.')+
  (t.approvals.length?t.approvals.map(a=>card(`<div class="row"><div><span class="tag warn">${a.kind}</span> ${tel(a.from)}${EX}</div><span class="muted small">${a.when}</span></div>
   ${a.src==='system'?`<p class="muted" style="margin:8px 0">Event: ${esc(a.ask)}</p>`:`<p style="margin:8px 0">${esc(a.ask)}</p>`}<div class="small muted">Bot’s proposed reply:</div>
   <div id="d-${a.id}" class="sms"><div class="msg out">${esc(a.draft)}</div></div>
   <div class="btns"><button class="b p" data-act="approve" data-id="${a.id}">Approve & send</button>${POLICY.clientCanEditReplies?`<button class="b" data-act="edit" data-id="${a.id}">Edit</button>`:`<button class="b" data-act="suggest" data-id="${a.id}">Suggest a change</button>`}<button class="b r" data-act="reject" data-id="${a.id}">Reject</button>${fb('Approval',a.id)}</div>`)).join(''):card('<div class="empty">Nothing waiting for approval. 👍</div>'));
 },
 questions(t){
  return head(t,'Bot questions','the bot isn’t sure — your answer becomes the rule going forward')+
  (t.questions.length?t.questions.map(q=>card(`<b>${esc(q.q)}</b>${EX}<div class="btns">${q.opts.map((o,i)=>`<button class="b" data-act="answer" data-id="${q.id}|${i}">${esc(o)}</button>`).join('')}</div>`)).join(''):card('<div class="empty">No open questions.</div>'));
 },
 confirm(t){
  return head(t,'Confirm details','make sure the bot has these right')+
  (t.confirms.length?t.confirms.map(c=>card(`<div class="small muted">${esc(c.label)}</div><div style="margin:4px 0 0"><b>${esc(c.val)}</b>${EX}</div><div class="btns"><button class="b p" data-act="confirmOk" data-id="${c.id}">Looks right</button><button class="b" data-act="confirmFix" data-id="${c.id}">Needs a change</button></div>`)).join(''):card('<div class="empty">Everything confirmed.</div>'));
 },
 flags(t){
  return head(t,'Flagged items','things the bot stopped on')+
  (t.flags.length?t.flags.map(f=>card(`<span class="tag ${f.sev}">${f.sev==='bad'?'Needs attention':'Check'}</span><b>${esc(f.title)}</b>${EX}<p class="muted" style="margin:6px 0">${esc(f.body)}</p><div class="btns">${(FLAG_OPTS[f.type]||FLAG_OPTS.unknown).map(([k,l])=>`<button class="b" data-act="flag" data-id="${f.id}|${k}">${l}</button>`).join('')}</div>`)).join(''):card('<div class="empty">No flagged items.</div>'));
 },
 activity(t){const L=allLog(t);
  return head(t,'Activity log','every text, booking and decision, newest first')+
  (L.length?L.map((l,i)=>card(`<div class="row"><div>${logRow(l)}</div><span class="muted small">${l.t}</span></div>${l.thread.length?`<details ${S.openThread==i?'open':''}><summary class="small muted">SMS thread (${l.thread.length} messages)</summary>${thread(l.thread)}</details>`:''}`)).join(''):card('<div class="empty">No activity yet.</div>'))+
  `<h2>Booked windows</h2>${bookingsTable(t)}`;
 },
 // ---------- ADMIN ----------
 overview(){
  return adminHead('All tenants','Cross-tenant overview. Bots belong to Andy and run on each client’s behalf.')+
  `<div class="card tw"><table><tr><th>Tenant</th><th>Status</th><th>Bot</th><th>Approvals</th><th>Questions</th><th>Flags</th><th>Requests</th><th>Log entries</th><th></th></tr>
  ${TENANTS.map(t=>`<tr><td><b>${esc(t.name)}</b>${tenantTag(t)}<div class="small muted">${esc(t.loc)}</div></td><td><span class="tag ${t.fake?'gray':''}">${t.status}</span></td>
  <td><label class="sw"><input type="checkbox" ${t.paused?'':'checked'} data-act="pause" data-id="${t.id}" aria-label="Bot running"><span></span></label> <span class="small">${t.paused?'Paused':'Running'}</span></td>
  <td>${t.approvals.length}${EX}</td><td>${t.questions.length}${EX}</td><td>${t.flags.length}${EX}</td><td>${t.requests.filter(r=>r.status==='Open').length}${EX}</td><td>${allLog(t).length}${EX}</td><td><button class="b" data-act="goTenant" data-id="${t.id}">Manage</button></td></tr>`).join('')}</table></div>
  <div class="card small muted">No pricing or billing shown — not decided. Payments and bookkeeping are out of scope.</div>`;
 },
 requests(){const rows=TENANTS.flatMap(t=>t.requests.map(r=>({...r,t})));
  return adminHead('Client requests','Suggested reply changes, baseline flags and detail changes from clients. Nothing here was sent to a customer.')+
  (rows.length?rows.map(r=>card(`<div class="row"><div><span class="tag warn">${r.kind}</span><b>${esc(r.t.name)}</b> · ${esc(r.ref)}${EX}</div><span class="tag ${r.status==='Open'?'blue':''}">${r.status}</span></div>
   ${r.draft?`<div class="small muted" style="margin-top:6px">Bot’s draft (not sent):</div><div class="sms"><div class="msg out">${esc(r.draft)}</div></div>`:''}
   <p style="margin:8px 0 0"><span class="small muted">Client’s note:</span> ${esc(r.note||'—')}</p><div class="small muted">${r.when}</div>
   ${r.status==='Open'?`<div class="btns"><button class="b p" data-act="reqDone" data-id="${r.t.id}|${r.id}">Mark handled</button></div>`:''}`)).join(''):card('<div class="empty">No client requests.</div>'));
 },
 settings(t){const s=t.settings;
  return head(t,'Bot settings','per-tenant')+
  card(`<div class="row"><div><b>Bot status</b><div class="small muted">Pause stops all text-backs for this tenant.</div></div><label class="sw"><input type="checkbox" ${t.paused?'':'checked'} data-act="pause" data-id="${t.id}" aria-label="Bot running"><span></span></label></div>`)+
  card(`<b>Workflow:</b> ${esc(t.workflow)}<h2>Text-back</h2>
   <label class="small muted" for="delay">Send text within (minutes)</label><br><input type="number" id="delay" value="${s.delay}" style="width:90px">${EX}<br><br>
   <label class="chk"><input type="checkbox" id="vm" ${s.vmPrompt?'checked':''}> Optional voicemail prompt (“leave a message, or hang up and you’ll get a text”)</label><br><br>
   <label class="small muted" for="greet">First text (sent from the business number)</label><textarea id="greet">${esc(s.greeting)}</textarea>
   <h2>Job types offered</h2>${s.jobTypes.map(j=>`<span class="tag blue">${esc(j)}</span>`).join('')}${EX}
   <div class="btns"><button class="b p" data-act="saveSettings">Save</button></div>`)+
  `<h2>Add-ons</h2>`+LATER.map(l=>card(`<div class="row"><div><b>${l.name}</b> <span class="tag gray">Coming later</span></div><label class="sw"><input type="checkbox" disabled aria-label="${l.name}"><span></span></label></div>`,'later')).join('');
 },
 schedule(t){const s=t.settings;
  return head(t,'Schedule','when the bot runs and which windows it offers')+
  card(`<label class="small muted" for="hrs">Bot active hours</label><br><input id="hrs" value="${esc(s.hours)}" style="width:100%">
  <h2>Bookable windows</h2><div id="wins">${s.windows.map((w,i)=>`<div class="row" style="padding:4px 0"><span>${esc(w)}${EX}</span><button class="b r" data-act="delWin" data-id="${i}">Remove</button></div>`).join('')}</div>
  <div class="btns"><input id="newWin" placeholder="e.g. Sat 8–11am"><button class="b" data-act="addWin">Add window</button></div>
  <div class="btns"><button class="b p" data-act="saveSched">Save</button></div>`);
 },
 rules(t){const r=t.rules;
  const rows=[['routineText','Routine missed-call text-back'],['routineBooking','Routine booking into an open window'],['pricing','Pricing questions'],['complaint','Complaints'],['reschedule','Reschedules'],['review','Review asks'],['unknown','Unknown / vendor / spam']];
  return head(t,'Approval rules','default: routine items are reported, unusual items need approval')+
  card(`<div class="tw"><table><tr><th>Item</th><th>Handling</th></tr>${rows.map(([k,l])=>`<tr><td>${l}</td><td><select data-rule="${k}" aria-label="${l}">${[['report','Do it & report'],['approve','Needs client approval'],['flag','Stop & flag']].map(([v,n])=>`<option value="${v}" ${r[k]===v?'selected':''}>${n}</option>`).join('')}</select></td></tr>`).join('')}</table></div>
  <div class="btns"><button class="b p" data-act="saveRules">Save rules</button><button class="b" data-act="resetRules">Reset to default</button></div>`)+
  card(`<span class="tag warn">Open decision</span> Still to agree with ${esc(t.owner)}: auto-book vs. confirm first, and which items need ${t.their} OK.`);
 },
 integrations(t){const s=t.settings;
  return head(t,'Integrations & credentials','placeholders only — nothing connected in this prototype')+
  card(`<div class="row"><div><b>Phone line</b><div class="small muted">${esc(s.line)}</div><div class="small">Provider: <span class="ph">TBD</span> · Number: <span class="ph">TBD</span> · API key: <span class="ph">••••••••</span></div></div><span class="tag gray">Not connected</span></div><div class="btns"><button class="b" data-act="stub">Connect phone line</button></div>`)+
  card(`<div class="row"><div><b>Calendar</b><div class="small muted">${esc(s.calendar)}</div><div class="small">Calendar: <span class="ph">TBD</span> · Access: <span class="ph">TBD</span></div></div><span class="tag gray">Not connected</span></div><div class="btns"><button class="b" data-act="stub">Connect calendar</button></div>`)+
  card(`<div class="small muted">Personal phone and personal texts are never connected.</div>`);
 },
 tenantview(t){S.role='client';S.view='dashboard';setTimeout(render);return '';}
};
function tagc(t){return {Booked:'',"Text-back":'blue',Approved:'',Rejected:'bad',Answered:'blue','You decided':'warn',Confirmed:'','Change requested':'warn',Setup:'gray'}[t]??'gray';}
function bookingsTable(t){const b=stats(t).bookings;return b.length?card(`<div class="tw"><table class="bookings"><tr><th>Caller</th><th>Job type</th><th>Window</th><th>Status</th></tr>${b.map(l=>`<tr class="bk"><td>${tel(l.who)}${EX}</td><td>${esc(l.type||'—')}</td><td class="nw">${esc(l.win)}</td><td><span class="tag">Booked</span></td></tr>`).join('')}</table></div>`):card('<div class="empty">No upcoming windows.</div>');}
const fb=(kind,ref)=>S.role==='client'?`<span class="fb"><button class="b sm" data-act="fb" data-id="${kind}|${ref}|up" title="Good" aria-label="Good">👍</button><button class="b sm" data-act="fb" data-id="${kind}|${ref}|down" title="Not right" aria-label="Not right">👎</button></span>`:'';

// ---- Modals: auto-sized textareas, Esc closes ----
function autosize(el){el.style.height='auto';el.style.height=(el.scrollHeight+2)+'px';}
function modal(html){$('#mbox').innerHTML=html;$('#modal').classList.remove('hidden');
  $('#mbox').querySelectorAll('textarea').forEach(a=>{autosize(a);a.addEventListener('input',()=>autosize(a));});
  const f=$('#mbox textarea');if(f)f.focus();}
function close(){$('#modal').classList.add('hidden');}
$('#modal').onclick=e=>{if(e.target.id==='modal')close();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modal').classList.contains('hidden'))close();});
const take=(arr,id)=>{const i=arr.findIndex(x=>x.id===id);return i<0?null:arr.splice(i,1)[0];};
const ref=a=>`${a.kind} · ${a.from}`;
function addRequest(t,r){t.requests.unshift(Object.assign({id:'r'+(++addRequest.n),when:'Just now',status:'Open'},r));}
addRequest.n=0;

const ACT={
 approve(id){const t=T(),a=take(t.approvals,id);
  // Only a real customer message becomes an inbound bubble; system events (e.g. review asks) are logged as events.
  const th=a.src==='system'?[['sys',a.ask,a.when],['out',a.draft,'Just now']]:[['in',a.ask.replace(/[“”]/g,''),a.when],['out',a.draft,'Just now']];
  log(t,'Approved',`${ref(a)} — ${a.kind==='Review ask'?'review request sent':'reply sent'}`,th);toast('Approved — sent & logged');render();},
 reject(id){modal(`<h1>Reject this?</h1><p class="muted">Nothing will be sent. Optional note for Andy:</p><textarea id="rn"></textarea><div class="btns"><button class="b r" data-act="doReject" data-id="${id}">Reject</button><button class="b" data-act="cancel">Cancel</button></div>`);},
 doReject(id){const t=T(),a=take(t.approvals,id),n=$('#rn').value;log(t,'Rejected',`${ref(a)} — not sent${n?' · note: '+n:''}`);close();toast('Rejected & logged');render();},
 // 3a: client suggests a change → request for Andy (admin "Client requests"); nothing goes to the customer.
 suggest(id){const a=T().approvals.find(x=>x.id===id);modal(`<h1>Suggest a change</h1><p class="muted small">Andy will update the reply. Nothing is sent to the customer from here.</p><div class="small muted">Bot’s proposed reply:</div><div class="sms"><div class="msg out">${esc(a.draft)}</div></div><label class="small muted" for="sg">What should be different?</label><textarea id="sg" placeholder="e.g. Mention we’re booked out until next week"></textarea><div class="btns"><button class="b p" data-act="doSuggest" data-id="${id}">Send to Andy</button><button class="b" data-act="cancel">Cancel</button></div>`);},
 doSuggest(id){const t=T(),a=take(t.approvals,id),note=$('#sg').value.trim();addRequest(t,{kind:'Reply change',ref:ref(a),note,draft:a.draft,item:a});
  log(t,'Change requested',`${ref(a)} — change suggested to Andy (nothing sent)`);close();toast('Sent to Andy — nothing was sent to the customer');render();},
 // Only reachable if POLICY.clientCanEditReplies is turned back on.
 edit(id){const a=T().approvals.find(x=>x.id===id);modal(`<h1>Edit reply</h1><p class="muted small">${esc(a.ask)}</p><textarea id="ed">${esc(a.draft)}</textarea><div class="btns"><button class="b p" data-act="doEdit" data-id="${id}">Save & send</button><button class="b" data-act="cancel">Cancel</button></div>`);},
 doEdit(id){const a=T().approvals.find(x=>x.id===id);a.draft=$('#ed').value;close();ACT.approve(id);},
 cancel:close,
 answer(v){const[id,i]=v.split('|'),t=T(),q=take(t.questions,id);log(t,'Answered',`Bot question: “${q.q}” → ${q.opts[i]}`);toast('Thanks — the bot will use that');render();},
 confirmOk(id){const t=T(),c=take(t.confirms,id);log(t,'Confirmed',`${c.label}: confirmed`);toast('Confirmed');render();},
 confirmFix(id){const c=T().confirms.find(x=>x.id===id);modal(`<h1>What should it be?</h1><p class="muted small">${esc(c.label)}</p><textarea id="cf"></textarea><div class="btns"><button class="b p" data-act="doFix" data-id="${id}">Send to Andy</button><button class="b" data-act="cancel">Cancel</button></div>`);},
 doFix(id){const t=T(),c=take(t.confirms,id),n=$('#cf').value;addRequest(t,{kind:'Detail change',ref:c.label,note:n});log(t,'Change requested',`${c.label} — “${n}”`);close();toast('Sent to Andy');render();},
 flag(v){const[id,how]=v.split('|'),t=T(),i=t.flags.findIndex(x=>x.id===id),f=t.flags.splice(i,1)[0];
  const e=log(t,'You decided',`${f.title} — ${FLAG_MSG[how]}`);
  toast('Logged: '+FLAG_MSG[how],()=>{t.flags.splice(i,0,f);const j=t.log.indexOf(e);if(j>=0)t.log.splice(j,1);render();});render();},
 pause(id,el){const t=TENANTS.find(x=>x.id===id);t.paused=!el.checked;toast(`${t.name}: ${t.paused?'paused':'running'}`);render();},
 goTenant(id){S.tenant=id;S.view='settings';render();},
 reqDone(v){const[tid,rid]=v.split('|'),t=TENANTS.find(x=>x.id===tid),r=t.requests.find(x=>x.id===rid);r.status='Handled';toast('Marked handled');render();},
 saveSettings(){const s=T().settings;s.delay=+$('#delay').value;s.vmPrompt=$('#vm').checked;s.greeting=$('#greet').value;toast('Settings saved (in memory)');},
 addWin(){const v=$('#newWin').value.trim();if(v){T().settings.windows.push(v);render();}},
 delWin(i){T().settings.windows.splice(+i,1);render();},
 saveSched(){T().settings.hours=$('#hrs').value;toast('Schedule saved (in memory)');},
 saveRules(){document.querySelectorAll('[data-rule]').forEach(s=>T().rules[s.dataset.rule]=s.value);toast('Rules saved (in memory)');},
 resetRules(){Object.assign(T().rules,DEFAULT_RULES);render();toast('Reset to default');},
 stub(){toast('Placeholder — no real connection in prototype');}
};
if(!window.__ext)render();

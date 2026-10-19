// Core app: state, rendering and client views (admin views live in admin.js). All data is EXAMPLE DATA (data.js).
// Per-value example mark (subtle) + one banner per screen.
const EX='<sup class="exm" title="Example data — made up for the prototype">ex</sup>';
const EXBANNER='<div class="exbanner small"><b>Example data.</b> Every number and record here is made up for the prototype; values marked <sup class="exm">ex</sup> are examples.</div>';
const P=new URLSearchParams(location.search);
// Client-safe defaults. Role/tenant/demo come only from admin.js in the prototype; a client copy is fixed to its one tenant.
const S={tenant:TENANTS[0].id,role:'client',view:P.get('view')||'dashboard',openThread:P.get('thread'),demo:false};

// Who may do what. Andy's decisions of 2026-10-17 (audit items 3 & 4). Flip a flag to change behaviour.
const POLICY={
  clientCanEditReplies:false,   // 3a: false = client gets "Suggest a change" (goes to Andy, never sent). true = old "Edit → Save & send".
  clientEntersBaseline:false,   // 3b: false = Andy enters starting numbers (admin); client confirms or flags them.
  clientMarksAndySteps:false,   // 3c: false = Andy-owned setup steps are read-only status for the client.
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

const CLIENT_NAV=[['dashboard','Dashboard'],['approvals','Approvals','approvals'],['questions','Bot questions','questions'],['confirm','Confirm details','confirms'],['flags','Flagged items','flags'],['activity','Activity log'],['later','Coming later']];
// Extension points. admin.js (prototype only) fills these in; client copies keep the client-only defaults.
const HOOKS={controls(){},nav:()=>CLIENT_NAV,navLabel:()=>'Client portal',banner:()=>'',extraTiles:()=>'',pilotExtra:()=>''};
function render(){
  HOOKS.controls();
  const nav=HOOKS.nav();
  if(!nav.some(n=>n[0]===S.view))S.view=nav[0][0];
  const t=T();
  $('#nav').innerHTML=`<div class="sec">${HOOKS.navLabel()}</div>`+nav.map(([k,l,c])=>{const n=typeof c==='function'?c():c?t[c].length:0;return `<a data-v="${k}" class="${k===S.view?'on':''}">${l}${n?`<span class="cnt">${n}</span>`:''}</a>`}).join('');
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

function tenantTag(t){return t.demo?' <span class="tag gray">Demo</span>':t.fake?' <span class="tag gray">Example tenant</span>':'';}
function head(t,title,sub){
  return `${HOOKS.banner()}
  ${t.paused?'<div class="banner paused small"><b>Bot paused.</b> Missed calls are not being texted back right now.</div>':''}
  <h1>${title}</h1><p class="sub">${esc(t.name)} · ${esc(t.loc)}${tenantTag(t)}${sub?' — '+sub:''}</p>${EXBANNER}`;
}
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
};
function tagc(t){return {Booked:'',"Text-back":'blue',Approved:'',Rejected:'bad',Answered:'blue','You decided':'warn',Confirmed:'','Change requested':'warn',Setup:'gray'}[t]??'gray';}
function bookingsTable(t){const b=stats(t).bookings;return b.length?card(`<div class="tw"><table class="bookings"><tr><th>Caller</th><th>Job type</th><th>Window</th><th class="st">Status</th></tr>${b.map(l=>`<tr class="bk"><td>${tel(l.who)}${EX}</td><td>${esc(l.type||'—')}</td><td class="nw">${esc(l.win)}</td><td class="st"><span class="tag">Booked</span></td></tr>`).join('')}</table></div>`):card('<div class="empty">No upcoming windows.</div>');}
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
};

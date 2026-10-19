// Admin + prototype-only code (Andy's controls, tenant picker, role switcher, demo mode).
// Loaded only by the prototype's index.html. scripts/build_client.js leaves this file OUT of client copies.
// URL params that pick role/tenant/demo exist only in the prototype; client copies ignore them.
S.tenant=P.get('tenant')||'colby';S.role=P.get('role')||'client';S.demo=!!P.get('demo');
if(S.demo){S.tenant='avery';S.role='client';}
POLICY.revenueVisibleTo=['admin']; // item 4: roles that see the "Est. revenue saved" tile. Never add 'client' (demo is a client view).
const openRequests=()=>TENANTS.reduce((n,t)=>n+t.requests.filter(r=>r.status==='Open').length,0);
const ADMIN_NAV=[['overview','All tenants'],['requests','Client requests',openRequests],['settings','Bot settings'],['schedule','Schedule'],['rules','Approval rules'],['integrations','Integrations'],['tenantview','Client’s view (preview)']];
ADMIN_NAV.splice(2,0,['pilot','Pilot scorecard'],['baselineAdmin','Starting numbers'],['onboardAdmin','Onboarding progress'],['feedback','Client feedback']);
function adminHead(title,sub){return `<div class="banner admin small">Admin view — visible to Andy only.</div><h1>${title}</h1><p class="sub">${sub}</p>${EXBANNER}`;}
// Item 4: revenue estimate (booked × assumed job value) is admin-only.
HOOKS.extraTiles=function(t){if(!POLICY.revenueVisibleTo.includes(S.role))return '';const s=stats(t);
  return stat('revenue','$'+(s.bookedSoFar*t.jobValue).toLocaleString(),'Est. revenue saved, pilot to date (admin only — rough estimate: booked × assumed job value)');}
HOOKS.nav=()=>S.role==='client'?CLIENT_NAV:ADMIN_NAV;
HOOKS.navLabel=()=>S.role==='client'?'Client portal':'Admin (Andy only)';
HOOKS.banner=()=>S.role==='admin'?'<div class="banner admin small">Admin view — visible to Andy only. The client never sees these controls.</div>':'';
HOOKS.controls=function(){
  const list=S.demo?TENANTS.filter(t=>t.demo):TENANTS; // demo never lists (or leaks) other tenants
  if(!list.some(t=>t.id===S.tenant))S.tenant=list[0].id;
  $('#tenantSel').innerHTML=list.map(t=>`<option value="${t.id}" ${t.id===S.tenant?'selected':''}>${esc(t.name)}${t.demo?' (demo)':t.fake?' (example)':''}</option>`).join('');
  document.querySelectorAll('#roleSeg button').forEach(b=>b.classList.toggle('on',b.dataset.role===S.role));
  document.body.classList.toggle('demo',S.demo);
  $('#demoBtn').classList.toggle('hidden',S.role!=='admin'||S.demo);$('#exitDemo').classList.toggle('hidden',!S.demo);
};
HOOKS.pilotExtra=t=>{const p=t.pilot;return S.role==='admin'?card(`<b>Edit pilot (admin)</b><div class="btns"><label class="small">Weeks <input id="pw" type="number" value="${p.weeks}" style="width:70px"></label><label class="small">Current week <input id="pc" type="number" value="${p.week}" style="width:70px"></label><label class="small">Goal <input id="pg" type="number" value="${p.goal}" style="width:70px"></label><button class="b p" data-act="savePilot">Save</button></div>`):'';};
$('#tenantSel').onchange=e=>{S.tenant=e.target.value;render();};
$('#roleSeg').onclick=e=>{const b=e.target.closest('button');if(!b)return;S.role=b.dataset.role;S.view=S.role==='client'?'dashboard':'overview';render();};
$('#menuBtn').onclick=()=>{const o=$('.top').classList.toggle('open');$('#menuBtn').setAttribute('aria-expanded',o);};
Object.assign(VIEWS,{
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
 tenantview(t){S.role='client';S.view='dashboard';setTimeout(render);return '';},
 baselineAdmin(t){const b=t.baseline||{};
  const status=!t.baseline?'<span class="tag gray">Not entered</span>':t.baseline.confirmed?'<span class="tag">Client confirmed</span>':t.baseline.flagged?'<span class="tag warn">Client says wrong</span>':'<span class="tag blue">Waiting on client</span>';
  return head(t,'Starting numbers','Andy enters the baseline; the client confirms it or flags it')+
  card(`<div class="row"><b>Baseline for ${esc(t.name)}</b>${status}</div>
   <label class="small muted" for="bRate">Share of business calls that go unanswered today (%)</label><br><input id="bRate" type="number" value="${b.rate??''}"><br><br>
   <label class="small muted" for="bCb">Typical callback time today (minutes)</label><br><input id="bCb" type="number" value="${b.cb??''}">
   <div class="btns"><button class="b p" data-act="saveBase">Save & ask client to confirm</button></div>`);
 },
 onboardAdmin(){
  return adminHead('Onboarding progress','Per tenant. Click a step to toggle it (Andy only).')+card(`<div class="tw"><table><tr><th>Tenant</th>${STEPS.map(s=>`<th>${s.l}</th>`).join('')}<th>Done</th></tr>${TENANTS.map(t=>`<tr><td><b>${esc(t.name)}</b>${tenantTag(t)}</td>${STEPS.map(s=>`<td>${s.k==='baseline'?(stepDone(t,s.k)?'✅':'⬜'):`<button class="b sm" data-act="adminStep" data-id="${t.id}|${s.k}" aria-label="${s.l}">${stepDone(t,s.k)?'✅':'⬜'}</button>`}</td>`).join('')}<td>${STEPS.filter(s=>stepDone(t,s.k)).length}/${STEPS.length}${EX}</td></tr>`).join('')}</table></div>`);
 },
 feedback(){const all=TENANTS.flatMap(t=>t.feedback.map(f=>({...f,tn:t.name})));
  const seed=[{tn:TENANTS[0].name,kind:'Lead',ref:'(515) 555-0199',v:'down',note:'Text sounded a little stiff',t:'Yesterday'},{tn:TENANTS[0].name,kind:'Weekly summary',ref:'week',v:'up',note:'',t:'Mon'}];
  const rows=[...all,...seed];
  return adminHead('Client feedback','Thumbs up/down from all tenants, newest first')+card(`<div class="tw"><table><tr><th></th><th>Tenant</th><th>On</th><th>Note</th><th>When</th></tr>${rows.map(f=>`<tr><td>${f.v==='up'?'👍':'👎'}</td><td>${esc(f.tn)}</td><td>${esc(f.kind)} · <span class="tel">${esc(f.ref)}</span>${EX}</td><td>${esc(f.note||'—')}</td><td>${f.t}</td></tr>`).join('')}</table></div>`);
 },
});
Object.assign(ACT,{
 pause(id,el){const t=TENANTS.find(x=>x.id===id);t.paused=!el.checked;toast(`${t.name}: ${t.paused?'paused':'running'}`);render();},
 goTenant(id){S.tenant=id;S.view='settings';render();},
 reqDone(v){const[tid,rid]=v.split('|'),t=TENANTS.find(x=>x.id===tid),r=t.requests.find(x=>x.id===rid);r.status='Handled';toast('Marked handled');render();},
 saveSettings(){const s=T().settings;s.delay=+$('#delay').value;s.vmPrompt=$('#vm').checked;s.greeting=$('#greet').value;toast('Settings saved (in memory)');},
 addWin(){const v=$('#newWin').value.trim();if(v){T().settings.windows.push(v);render();}},
 delWin(i){T().settings.windows.splice(+i,1);render();},
 saveSched(){T().settings.hours=$('#hrs').value;toast('Schedule saved (in memory)');},
 saveRules(){document.querySelectorAll('[data-rule]').forEach(s=>T().rules[s.dataset.rule]=s.value);toast('Rules saved (in memory)');},
 resetRules(){Object.assign(T().rules,DEFAULT_RULES);render();toast('Reset to default');},
 stub(){toast('Placeholder — no real connection in prototype');},
 saveBase(){const t=T(),r=$('#bRate').value,c=$('#bCb').value;if(r===''||c===''){toast('Enter both numbers');return;}
  t.baseline={rate:+r,cb:+c,confirmed:false,flagged:false};log(t,'Setup','Andy recorded starting numbers — waiting on your OK',[],'andy');toast('Saved — client will be asked to confirm');render();},
 savePilot(){const p=T().pilot;p.weeks=+$('#pw').value;p.week=+$('#pc').value;p.goal=+$('#pg').value;toast('Pilot updated');render();},
 adminStep(v){const[tid,k]=v.split('|'),t=TENANTS.find(x=>x.id===tid),s=STEPS.find(x=>x.k===k);t.steps[k]=!t.steps[k];log(t,'Setup',`Andy marked “${s.l}” ${t.steps[k]?'done':'not done'}`,[],'andy');render();},
 demo(){S.demo=true;S.tenant='avery';S.role='client';S.view='weekly';render();},
 exitDemo(){S.demo=false;S.tenant='colby';S.role='admin';S.view='overview';render();}
});
$('#demoBtn').onclick=()=>ACT.demo();$('#exitDemo').onclick=()=>ACT.exitDemo();

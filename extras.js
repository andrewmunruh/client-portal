// Added features (all EXAMPLE DATA). Loaded after app.js. Every count comes from stats(t) (app.js), never a separate number.
CLIENT_NAV.splice(1,0,['weekly','Weekly summary'],['leads','Saved leads'],['pilot','Pilot scorecard'],['baseline','Before / after']);
CLIENT_NAV.push(['onboarding','Getting set up']);
ADMIN_NAV.splice(2,0,['pilot','Pilot scorecard'],['baselineAdmin','Starting numbers'],['onboardAdmin','Onboarding progress'],['feedback','Client feedback']);

const stepDone=(t,k)=>k==='baseline'?!!(t.baseline&&t.baseline.confirmed):!!t.steps[k];
// Item 4: revenue estimate (booked × assumed job value) is admin-only. Returns '' for any role not in POLICY.revenueVisibleTo.
function revenueTile(t){if(!POLICY.revenueVisibleTo.includes(S.role))return '';const s=stats(t);
  return stat('revenue','$'+(s.bookedSoFar*t.jobValue).toLocaleString(),'Est. revenue saved, pilot to date (admin only — rough estimate: booked × assumed job value)');}

Object.assign(VIEWS,{
 weekly(t){const s=stats(t);
  return head(t,'Weekly summary',`what the bot caught for you this week (pilot week ${t.pilot.week})`)+
  `<div class="grid">${stat('w-caught',s.caught,'Missed calls caught & texted back')}${stat('w-replied',s.replied,'Callers who replied')}${stat('w-booked',s.booked,'Estimates booked from missed calls')}${revenueTile(t)}</div>
  <div class="row" style="margin-top:10px;align-items:center"><span class="small">Was this summary useful?</span>${fb('Weekly summary','week')}</div>
  <h2>Text version (preview)</h2>${card(`<div class="sms"><div class="msg out">${esc(weeklyText(t))}</div></div>`)}
  <h2>Email version (preview)</h2>${card(`<div class="small muted">Subject: Your week — ${s.booked} estimates booked from missed calls${EX}</div><hr style="border:0;border-top:1px solid var(--line)"><p>Hi ${esc(t.owner)},</p><p>This week the bot caught <b>${s.caught}</b> missed calls on your business line, got replies from <b>${s.replied}</b>, and booked <b>${s.booked}</b> estimate windows on your calendar.${EX}</p><p>Nothing to do unless something sounded wrong — just reply and Andy will fix it.</p><p class="small muted">— Andy · preview only, not sent</p>`)}`;
 },
 leads(t){const s=stats(t),older=t.leads.filter(l=>l.wk!==t.pilot.week);
  const lc=l=>card(`<div class="row"><div>${l.lost?'<span class="tag warn">Would likely have been lost</span>':''}${l.bookedAt?'<span class="tag">Booked</span>':'<span class="tag gray">No booking yet</span>'}${tel(l.who)}${EX}</div><span class="tag blue">Replied in ${l.speed}</span></div>
   <div class="tl small"><span>📞 Missed call ${l.call}</span><span>💬 Text sent ${l.reply}</span><span>${l.bookedAt?'📅 Booked '+l.bookedAt+' → '+l.win:l.replied?'💬 Caller replied — no booking yet':'⏳ No reply yet'}</span></div>
   <p class="muted small" style="margin:6px 0 0">${esc(l.story)}</p><div class="row" style="justify-content:flex-end">${fb('Lead',l.who)}</div>`,(l.lost?'hl ':'')+'lead');
  return head(t,'Saved leads','each missed call, followed through')+`<h2>This week</h2>`+
  (s.week.length?s.week.map(lc).join(''):card('<div class="empty">No leads yet this week.</div>'))+
  (older.length?`<h2>Earlier in the pilot</h2>`+older.map(lc).join(''):'');
 },
 // 3b: the client never types baseline numbers. Andy enters them (admin "Starting numbers"); the client confirms or flags.
 baseline(t){const b=t.baseline,s=stats(t);
  if(!b)return head(t,'Before / after','how things worked before the bot, compared each week')+card(`<span class="tag gray">Andy’s step</span> <b>Andy records your starting numbers</b>
   <p class="muted small" style="margin:6px 0 0">After a quick chat about how calls are handled today, Andy enters two numbers — the share of business calls that go unanswered and the typical callback time. They’ll show up here for you to confirm.</p>`);
  const noFollow=pct(s.caught-s.texted,s.caught);
  const ask=S.role!=='client'?'':b.confirmed?card('<span class="tag">Confirmed</span> You confirmed these starting numbers.'):b.flagged?card('<span class="tag warn">Flagged</span> You said these look wrong — Andy will follow up.'):
   card(`<b>Andy entered these starting numbers. Do they look right?</b><div class="btns"><button class="b p" data-act="baseOk">Looks right</button><button class="b" data-act="baseWrong">These look wrong</button></div>`);
  return head(t,'Before / after','this week vs. your starting point')+ask+
  card(`<div class="tw"><table class="ba"><tr><th></th><th>Before (starting point)</th><th>This week</th></tr>
   <tr><td>Missed calls left with no follow-up</td><td>${b.rate}%${EX}</td><td data-k="ba-nofollow"><b class="v">${noFollow}%</b>${EX}<div class="small muted">${s.caught?'every missed call got a text-back':'no missed calls yet'}</div></td></tr>
   <tr><td>Callers who didn’t reply to the text</td><td>— (not tracked)</td><td data-k="ba-noreply"><b><span class="v">${s.noReply}</span> of ${s.caught}</b>${EX}</td></tr>
   <tr><td>Time to first callback / reply</td><td>~${b.cb} min${EX}</td><td><b>~${t.settings.delay} min</b>${EX}</td></tr>
   <tr><td>Estimates booked from missed calls</td><td>— (not tracked)</td><td data-k="ba-booked"><b class="v">${s.booked}</b>${EX}</td></tr></table></div>`);
 },
 pilot(t){const p=t.pilot,s=stats(t),d=s.bookedSoFar,pc=Math.min(100,pct(d,p.goal));
  const st=d>=p.goal?['Goal hit','']:p.weeks&&p.week/p.weeks>=pc/100+.34?['Behind','bad']:['On track','blue'];
  return head(t,'Pilot scorecard',`shared by ${esc(t.owner)} and Andy`)+
  `<div class="grid">${card(`<div class="stat"><div class="n">Week ${p.week} of ${p.weeks}${EX}</div><div class="l">Pilot length</div></div>`)}${stat('p-goal',p.goal,'Goal: booked estimates')}${stat('p-week',s.booked,'Booked this week')}${stat('p-sofar',d,p.week>1?`Booked so far (weeks 1–${p.week})`:"Booked so far")}${card(`<div class="stat"><div class="n"><span class="tag ${st[1]}" style="font-size:16px">${st[0]}</span></div><div class="l">Status</div></div>`)}${revenueTile(t)}</div>
  ${card(`<div class="small muted">Progress to goal</div><div class="bar"><div style="width:${pc}%"></div></div><div class="small">${pc}%${EX}</div>`)}
  ${card(`<b>Exit point</b><p style="margin:4px 0">${esc(p.exit)}</p><div class="small muted">No pricing shown — any paid plan is a separate conversation.</div>`)}
  ${S.role==='admin'?card(`<b>Edit pilot (admin)</b><div class="btns"><label class="small">Weeks <input id="pw" type="number" value="${p.weeks}" style="width:70px"></label><label class="small">Current week <input id="pc" type="number" value="${p.week}" style="width:70px"></label><label class="small">Goal <input id="pg" type="number" value="${p.goal}" style="width:70px"></label><button class="b p" data-act="savePilot">Save</button></div>`):''}`;
 },
 // 3c: Andy-owned steps are read-only status for the client.
 onboarding(t){const done=STEPS.filter(s=>stepDone(t,s.k)).length;
  return head(t,'Getting set up','steps to go live — Andy does most of them')+card(`<div class="bar"><div style="width:${pct(done,STEPS.length)}%"></div></div><div class="small">${done} of ${STEPS.length} done</div>`)+
  STEPS.map(s=>{const ok=stepDone(t,s.k),mine=s.owner==='client';let right;
   if(ok)right='<span class="tag">Done</span>';
   else if(s.k==='baseline')right=t.baseline&&!t.baseline.flagged?'<button class="b p" data-v="baseline">Review numbers</button>':`<span class="tag gray">${t.baseline?'With Andy':'Andy’s step'}</span>`;
   else if(mine)right=`<button class="b p" data-act="step" data-id="${s.k}">Approve</button>`;
   else right=POLICY.clientMarksAndySteps?`<button class="b" data-act="step" data-id="${s.k}">Mark done</button>`:'<span class="tag gray">Andy’s step · in progress</span>';
   return card(`<div class="row" style="align-items:center"><div>${ok?'✅':'⬜'} <b>${s.l}</b><div class="small muted">${s.owner==='andy'?'Andy does this':'Needs your OK'}</div>${s.k==='templates'?`<div class="small muted">“${esc(t.settings.greeting)}”</div>`:''}</div>${right}</div>`,'step step-'+s.owner);}).join('');
 },
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
 later(t){const n=t.finishedJobs,q=t.openQuotes,inv=t.doneInvoices;
  const prev=[[LATER[0],`You have ${q}${EX} quotes with no reply. Follow-ups could have nudged all ${q} two days later.`,`Hi! Just checking in on the estimate ${t.owner} sent — any questions?`],
   [LATER[1],`You had ${n}${EX} finished jobs; review asks could have gone to all ${n}.`,`Thanks for choosing ${t.name}! A quick Google review helps a ton.`],
   [LATER[2],`${inv}${EX} finished jobs could have had an invoice drafted the same day.`,`Invoice draft for your job on Fri — ready for you to check.`]];
  return head(t,'Coming later','only added if they’re actually useful')+
  card(`<span class="tag">Now (pilot)</span> <b>Missed call → text → calendar</b><div class="muted small">Business line only.</div>`)+
  prev.map(([l,what,msg])=>card(`<div class="row"><div><span class="tag gray">Coming later</span> <b>${l.name}</b></div><span class="tag gray">Preview — not running</span></div><div class="muted small">${l.desc}</div><p style="margin:8px 0 4px">${what}</p><div class="sms"><div class="msg out">${esc(msg)}<small>sample message — would not be sent</small></div></div>${S.role==='client'?`<div class="btns"><button class="b" data-act="interest" data-id="${l.name}">I’d want this — tell Andy</button></div>`:''}`,'later')).join('')+
  card(`<div class="muted small">Not part of this: payments, bookkeeping, personal texts, lead buying.</div>`);
 }
});
Object.assign(ACT,{
 fb(v){const[kind,ref,dir]=v.split('|');modal(`<h1>${dir==='up'?'👍 Thanks!':'👎 What was off?'}</h1><p class="muted small">Optional note for Andy</p><textarea id="fbn"></textarea><div class="btns"><button class="b p" data-act="doFb" data-id="${v}">Send</button><button class="b" data-act="cancel">Cancel</button></div>`);},
 doFb(v){const[kind,ref,dir]=v.split('|');T().feedback.unshift({kind,ref,v:dir,note:$('#fbn').value,t:'Just now'});close();toast('Feedback sent to Andy');},
 // admin
 saveBase(){const t=T(),r=$('#bRate').value,c=$('#bCb').value;if(r===''||c===''){toast('Enter both numbers');return;}
  t.baseline={rate:+r,cb:+c,confirmed:false,flagged:false};log(t,'Setup','Andy recorded starting numbers — waiting on your OK',[],'andy');toast('Saved — client will be asked to confirm');render();},
 // client
 baseOk(){const t=T();t.baseline.confirmed=true;log(t,'Confirmed','Starting numbers: confirmed');toast('Confirmed');render();},
 baseWrong(){modal(`<h1>What looks wrong?</h1><p class="muted small">Andy will check and update the numbers.</p><textarea id="bw"></textarea><div class="btns"><button class="b p" data-act="doBaseWrong">Send to Andy</button><button class="b" data-act="cancel">Cancel</button></div>`);},
 doBaseWrong(){const t=T(),n=$('#bw').value;t.baseline.flagged=true;addRequest(t,{kind:'Baseline looks wrong',ref:`${t.baseline.rate}% unanswered · ~${t.baseline.cb} min callback`,note:n});
  log(t,'Change requested','Starting numbers flagged as wrong — sent to Andy');close();toast('Sent to Andy');render();},
 savePilot(){const p=T().pilot;p.weeks=+$('#pw').value;p.week=+$('#pc').value;p.goal=+$('#pg').value;toast('Pilot updated');render();},
 step(k){const t=T(),s=STEPS.find(x=>x.k===k);if(s.owner!=='client'&&!POLICY.clientMarksAndySteps)return;t.steps[k]=true;log(t,'Setup',`Setup: you approved “${s.l}”`);toast('Approved');render();},
 adminStep(v){const[tid,k]=v.split('|'),t=TENANTS.find(x=>x.id===tid),s=STEPS.find(x=>x.k===k);t.steps[k]=!t.steps[k];log(t,'Setup',`Andy marked “${s.l}” ${t.steps[k]?'done':'not done'}`,[],'andy');render();},
 interest(n){T().feedback.unshift({kind:'Add-on interest',ref:n,v:'up',note:'Client wants this',t:'Just now'});toast('Andy will hear about it');},
 demo(){S.demo=true;S.tenant='avery';S.role='client';S.view='weekly';render();},
 exitDemo(){S.demo=false;S.tenant='colby';S.role='admin';S.view='overview';render();}
});
$('#demoBtn').onclick=()=>ACT.demo();$('#exitDemo').onclick=()=>ACT.exitDemo();
function weeklyText(t){const s=stats(t);return `${t.name} — your week: ${s.caught} missed calls caught, ${s.replied} replied to the text, ${s.booked} estimates booked on your calendar. (Example data.) Reply here if anything sounded off. — Andy`;}
render();

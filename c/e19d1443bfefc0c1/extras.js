CLIENT_NAV.splice(1,0,['weekly','Weekly summary'],['leads','Saved leads'],['pilot','Pilot scorecard'],['baseline','Before / after']);
CLIENT_NAV.push(['onboarding','Getting set up']);

const stepDone=(t,k)=>k==='baseline'?!!(t.baseline&&t.baseline.confirmed):!!t.steps[k];

Object.assign(VIEWS,{
 weekly(t){const s=stats(t);
  return head(t,'Weekly summary',`what the bot caught for you this week${t.pilot.week>0?` (pilot week ${t.pilot.week})`:''}`)+
  `<div class="grid">${stat('w-caught',s.caught,'Missed calls caught & texted back')}${stat('w-replied',s.replied,'Callers who replied')}${stat('w-booked',s.booked,'Estimates booked from missed calls')}${HOOKS.extraTiles(t)}</div>
  <div class="row" style="margin-top:10px;align-items:center"><span class="small">Was this summary useful?</span>${fb('Weekly summary','week')}</div>
  <h2>Text version (preview)</h2>${card(`<div class="sms"><div class="msg out">${esc(weeklyText(t))}</div></div>`)}
  <h2>Email version (preview)</h2>${card(`<div class="small muted">Subject: Your week — ${s.booked} ${plural(s.booked,'estimate','estimates')} booked from missed calls${EX}</div><hr style="border:0;border-top:1px solid var(--line)"><p>Hi ${esc(t.owner)},</p><p>This week the bot caught <b>${s.caught}</b> missed ${plural(s.caught,'call','calls')} on your business line, got replies from <b>${s.replied}</b>, and booked <b>${s.booked}</b> estimate ${plural(s.booked,'window','windows')} on your calendar.${EX}</p><p>Nothing to do unless something sounded wrong — just reply and Andy will fix it.</p><p class="small muted">— Andy · preview only, not sent</p>`)}`;
 },
 leads(t){const s=stats(t),older=t.leads.filter(l=>l.wk!==t.pilot.week);
  const lc=l=>card(`<div class="row"><div>${l.lost?'<span class="tag warn">Would likely have been lost</span>':''}${l.bookedAt?'<span class="tag">Booked</span>':'<span class="tag gray">No booking yet</span>'}${tel(l.who)}${EX}</div></div>
   <div class="speed"><span class="tag blue">Texted back in ${l.speed}</span></div>
   <div class="tl small"><span>📞 Missed call ${l.call}</span><span>💬 Text sent ${l.reply}</span><span>${l.bookedAt?'📅 Booked '+l.bookedAt+' → '+l.win:l.replied?'💬 Caller replied — no booking yet':'⏳ No reply yet'}</span></div>
   <p class="muted small" style="margin:6px 0 0">${esc(l.story)}</p><div class="row" style="justify-content:flex-end">${fb('Lead',l.who)}</div>`,(l.lost?'hl ':'')+'lead');
  return head(t,'Saved leads','each missed call, followed through')+`<h2>This week</h2>`+
  (s.week.length?s.week.map(lc).join(''):card('<div class="empty">No leads yet this week.</div>'))+
  (older.length?`<h2>Earlier in the pilot</h2>`+older.map(lc).join(''):'');
 },
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
  const st=t.paused?['Paused','gray']:p.week<1?['Not started','gray']:d>=p.goal?['Goal hit','']:p.weeks&&p.week/p.weeks>=pc/100+.34?['Behind','bad']:['On track','blue'];
  return head(t,'Pilot scorecard',`shared by ${esc(t.owner)} and Andy`)+
  `<div class="grid">${card(`<div class="stat" data-k="p-length">${p.week<1?`<div class="n">${p.weeks} ${plural(p.weeks,'week','weeks')}${EX}</div><div class="l">Pilot length · not started yet</div>`:`<div class="n">Week ${p.week} of ${p.weeks}${EX}</div><div class="l">Pilot length</div>`}</div>`)}${stat('p-goal',p.goal,'Goal: booked estimates')}${stat('p-week',s.booked,'Booked this week')}${stat('p-sofar',d,p.week>1?`Booked so far (weeks 1–${p.week})`:"Booked so far")}${card(`<div class="stat"><div class="n"><span class="tag ${st[1]}" style="font-size:16px">${st[0]}</span></div><div class="l">Status</div></div>`,'pstatus')}${HOOKS.extraTiles(t)}</div>
  ${card(`<div class="small muted">Progress to goal</div><div class="bar"><div style="width:${pc}%"></div></div><div class="small">${pc}%${EX}</div>`)}
  ${card(`<b>Exit point</b><p style="margin:4px 0">${esc(p.exit)}</p><div class="small muted">No pricing shown — any paid plan is a separate conversation.</div>`)}
  ${HOOKS.pilotExtra(t)}`;
 },
 onboarding(t){const done=STEPS.filter(s=>stepDone(t,s.k)).length;
  return head(t,'Getting set up','steps to go live — Andy does most of them')+card(`<div class="bar"><div style="width:${pct(done,STEPS.length)}%"></div></div><div class="small">${done} of ${STEPS.length} done</div>`)+
  STEPS.map(s=>{const ok=stepDone(t,s.k),mine=s.owner==='client';let right;
   if(ok)right='<span class="tag">Done</span>';
   else if(s.k==='baseline')right=t.baseline&&!t.baseline.flagged?'<button class="b p" data-v="baseline">Review numbers</button>':`<span class="tag gray">${t.baseline?'With Andy':'Andy’s step'}</span>`;
   else if(mine)right=`<button class="b p" data-act="step" data-id="${s.k}">Approve</button>`;
   else right=POLICY.clientMarksAndySteps?`<button class="b" data-act="step" data-id="${s.k}">Mark done</button>`:'<span class="tag gray">Andy’s step · in progress</span>';
   return card(`<div class="steprow"><span class="si ${ok?'done':''}" role="img" aria-label="${ok?'Done':'Not done yet'}">${ok?'✓':''}</span><div><b>${s.l}</b><div class="small muted">${s.owner==='andy'?'Andy does this':'Needs your OK'}</div>${s.k==='templates'?`<div class="small muted">“${esc(t.settings.greeting)}”</div>`:''}</div><div class="act">${right}</div></div>`,'step step-'+s.owner);}).join('');
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
 baseOk(){const t=T();t.baseline.confirmed=true;log(t,'Confirmed','Starting numbers: confirmed');toast('Confirmed');render();},
 baseWrong(){modal(`<h1>What looks wrong?</h1><p class="muted small">Andy will check and update the numbers.</p><textarea id="bw"></textarea><div class="btns"><button class="b p" data-act="doBaseWrong">Send to Andy</button><button class="b" data-act="cancel">Cancel</button></div>`);},
 doBaseWrong(){const t=T(),n=$('#bw').value;t.baseline.flagged=true;addRequest(t,{kind:'Baseline looks wrong',ref:`${t.baseline.rate}% unanswered · ~${t.baseline.cb} min callback`,note:n});
  log(t,'Change requested','Starting numbers flagged as wrong — sent to Andy');close();toast('Sent to Andy');render();},
 step(k){const t=T(),s=STEPS.find(x=>x.k===k);if(s.owner!=='client'&&!POLICY.clientMarksAndySteps)return;t.steps[k]=true;log(t,'Setup',`Setup: you approved “${s.l}”`);toast('Approved');render();},
 interest(n){T().feedback.unshift({kind:'Add-on interest',ref:n,v:'up',note:'Client wants this',t:'Just now'});toast('Andy will hear about it');}
});
function weeklyText(t){const s=stats(t);return `${t.name} — your week: ${s.caught} missed ${plural(s.caught,'call','calls')} caught, ${s.replied} replied to the text, ${s.booked} ${plural(s.booked,'estimate','estimates')} booked on your calendar. (Example data.) Reply here if anything sounded off. — Andy`;}

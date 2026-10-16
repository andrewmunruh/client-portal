// Added features (all EXAMPLE DATA). Loaded after app.js.
const STEPS=[['forward','Forward the business line'],['calendar','Connect the calendar'],['area','Set service area & bookable windows'],['templates','Review text templates'],['tone','Approve the tone'],['baseline','Record today’s missed-call baseline']];
function ext(t,o){Object.assign(t,{feedback:[],finishedJobs:0,openQuotes:0,doneInvoices:0},o);}
TENANTS.push(mk({id:'avery',name:'Avery’s Lawn Co (DEMO — fake)',loc:'Demo town',fake:true,demo:true,status:'Demo tenant',
 workflow:'Missed-call text-back → booked window on calendar',
 settings:{line:'Demo line',calendar:'Demo calendar',delay:2,vmPrompt:true,hours:'Example: Mon–Sat 7am–7pm',windows:['Example: Mornings 8–11','Example: Afternoons 1–4'],jobTypes:['Example: Mowing','Example: Cleanup'],greeting:'Hi, this is Avery’s Lawn Co — sorry we missed your call, we’re out on a job. What can we help with?'},
 rules:{routineText:'report',routineBooking:'report',pricing:'approve',complaint:'approve',reschedule:'approve',review:'approve',unknown:'flag'},
 approvals:[{id:'v1',kind:'Pricing question',from:'(555) 020-0011',when:'Today 10:05a',ask:'“What do you charge for spring cleanup?”',draft:'Happy to help! Avery likes to see the yard first — want a quick visit Fri 8–11am or Sat 1–4pm?'}],
 bookings:[{who:'(555) 020-0012',type:'Example: Mowing',win:'Fri 8–11am',st:'Booked'},{who:'(555) 020-0013',type:'Example: Cleanup',win:'Sat 1–4pm',st:'Booked'}],
 log:[{t:'Today 12:20p',type:'Booked',text:'Estimate window booked: Fri 8–11am (Mowing)',thread:[['in','(missed call)','12:14p'],['out','Hi, this is Avery’s Lawn Co — sorry we missed your call…','12:15p'],['in','Need mowing weekly','12:18p'],['out','Fri 8–11am or Sat 1–4pm?','12:18p'],['in','Fri','12:20p'],['out','Booked: Fri 8–11am. Thanks!','12:20p']]}]}));
const X={
 colby:{weekly:{missed:9,answered:7,booked:4,revenue:1200},baseline:null,pilot:{weeks:3,week:1,goal:6,exit:'Colby says it’s worth keeping and the goal is hit — then talk about an ongoing plan (no price set).'},steps:{forward:false,calendar:false,area:true,templates:false,tone:false,baseline:false},finishedJobs:6,openQuotes:4,doneInvoices:6,
  leads:[{who:'(515) 555-0121',call:'10:58a',reply:'11:00a',booked:'11:02a',win:'Fri 8–11am',speed:'2 min',lost:true,story:'Called while Colby was mowing; said they were also calling two other companies. Booked before calling anyone else.'},
   {who:'(515) 555-0175',call:'4:31p',reply:'4:33p',booked:'4:40p',win:'Sat 1–4pm',speed:'2 min',lost:true,story:'No voicemail left — would have been a silent missed call. Text-back turned it into a patio estimate.'},
   {who:'(515) 555-0133',call:'Mon 6:12p',reply:'6:14p',booked:'6:30p',win:'Mon 5–7pm',speed:'2 min',lost:false,story:'Existing customer; would likely have called back anyway.'},
   {who:'(515) 555-0199',call:'Tue 9:02a',reply:'9:04a',booked:null,win:null,speed:'2 min',lost:false,story:'Replied “just comparing prices” — no booking yet.'}]},
 prairie:{weekly:{missed:5,answered:4,booked:2,revenue:600},baseline:{rate:40,cb:180},pilot:{weeks:4,week:3,goal:5,exit:'Example exit point.'},steps:{forward:true,calendar:true,area:true,templates:true,tone:false,baseline:true},finishedJobs:3,openQuotes:2,doneInvoices:3,leads:[{who:'(555) 010-0002',call:'7:50a',reply:'7:52a',booked:'8:30a',win:'Tue 9–12',speed:'2 min',lost:true,story:'Example story.'}]},
 gutter:{weekly:{missed:0,answered:0,booked:0,revenue:0},baseline:null,pilot:{weeks:3,week:0,goal:4,exit:'Example exit point.'},steps:{forward:false,calendar:false,area:false,templates:false,tone:false,baseline:false},leads:[]},
 avery:{weekly:{missed:12,answered:10,booked:6,revenue:1800},baseline:{rate:45,cb:240},pilot:{weeks:3,week:2,goal:8,exit:'Avery keeps it on after the pilot → ongoing plan (no price shown).'},steps:{forward:true,calendar:true,area:true,templates:true,tone:true,baseline:true},finishedJobs:9,openQuotes:5,doneInvoices:9,
  leads:[{who:'(555) 020-0012',call:'12:14p',reply:'12:15p',booked:'12:20p',win:'Fri 8–11am',speed:'1 min',lost:true,story:'Caller was on a list of 3 companies from Google. First to reply, first booked.'},{who:'(555) 020-0013',call:'Wed 3:40p',reply:'3:42p',booked:'3:51p',win:'Sat 1–4pm',speed:'2 min',lost:true,story:'Hung up without voicemail — booked by text in 11 minutes.'}]}
};
TENANTS.forEach(t=>ext(t,X[t.id]));
const bookedSoFar=t=>t.leads.filter(l=>l.booked).length+(t.id==='colby'?0:t.pilot.week); // example
const fb=(kind,ref)=>S.role==='client'?`<span class="fb"><button class="b sm" data-act="fb" data-id="${kind}|${ref}|up" title="Good">👍</button><button class="b sm" data-act="fb" data-id="${kind}|${ref}|down" title="Not right">👎</button></span>`:'';
const pct=(a,b)=>b?Math.round(100*a/b):0;

CLIENT_NAV.splice(1,0,['weekly','Weekly summary'],['leads','Saved leads'],['pilot','Pilot scorecard'],['baseline','Before / after']);
CLIENT_NAV.push(['onboarding','Getting set up']);
ADMIN_NAV.splice(1,0,['pilot','Pilot scorecard'],['onboardAdmin','Onboarding progress'],['feedback','Client feedback']);

Object.assign(VIEWS,{
 weekly(t){const w=t.weekly;
  return head(t,'Weekly summary','what the bot caught for you this week')+
  `<div class="grid">${[['Missed calls caught',w.missed],['Texts answered',w.answered],['Estimates booked',w.booked],['Est. revenue saved','$'+w.revenue.toLocaleString()]].map(([l,n])=>card(`<div class="stat"><div class="n">${n}</div><div class="l">${l} ${EX}</div></div>`)).join('')}</div>
  <div class="small muted">“Revenue saved” is a rough example estimate (booked estimates × an assumed job value), not a measured number.</div>
  <div class="row" style="margin-top:10px"><span class="small">Was this summary useful?</span>${fb('Weekly summary','week')}</div>
  <h2>Text version (preview)</h2>${card(`<div class="sms"><div class="msg out">${esc(weeklyText(t))}</div></div>`)}
  <h2>Email version (preview)</h2>${card(`<div class="small muted">Subject: Your week — ${w.booked} estimates booked from missed calls ${EX}</div><hr style="border:0;border-top:1px solid var(--line)"><p>Hi ${esc(t.name.split('’')[0].split(' ')[0])},</p><p>This week the bot caught <b>${w.missed}</b> missed calls on your business line, got replies from <b>${w.answered}</b>, and booked <b>${w.booked}</b> estimate windows on your calendar. ${EX}</p><p>Nothing to do unless something sounded wrong — just reply and Andy will fix it.</p><p class="small muted">— Andy · preview only, not sent</p>`)}`;
 },
 leads(t){
  return head(t,'Saved leads','each missed call, followed through')+
  (t.leads.length?t.leads.map((l,i)=>card(`<div class="row"><div>${l.lost?'<span class="tag warn">Would likely have been lost</span>':''}${l.booked?'<span class="tag">Booked</span>':'<span class="tag gray">No booking yet</span>'}<b>${l.who}</b> ${EX}</div><span class="tag blue">Replied in ${l.speed}</span></div>
   <div class="tl small"><span>📞 Missed call ${l.call}</span><span>💬 Text sent ${l.reply}</span><span>${l.booked?'📅 Booked '+l.booked+' → '+l.win:'⏳ Waiting'}</span></div>
   <p class="muted small" style="margin:6px 0 0">${esc(l.story)}</p><div class="row" style="justify-content:flex-end">${fb('Lead',l.who)}</div>`,l.lost?'hl':'')).join(''):card('<div class="empty">No leads yet.</div>'));
 },
 baseline(t){const b=t.baseline,w=t.weekly;
  if(!b)return head(t,'Before / after','record how things work today, then compare each week')+card(`<b>Onboarding step: record today’s baseline</b><p class="muted small">Your best guess is fine.</p>
   <label class="small muted">Share of business calls that go unanswered today (%)</label><br><input id="bRate" type="number" value="40"><br><br>
   <label class="small muted">Typical callback time today (minutes)</label><br><input id="bCb" type="number" value="180"><br>
   <div class="btns"><button class="b p" data-act="saveBase">Save baseline</button></div><div class="small muted">Prefilled values are example data.</div>`);
  const missRate=100-pct(w.answered,w.missed);
  return head(t,'Before / after','this week vs. your starting point')+
  card(`<div class="tw"><table><tr><th></th><th>Before (baseline)</th><th>This week</th></tr>
   <tr><td>Missed calls left with no follow-up</td><td>${b.rate}% ${EX}</td><td><b>${w.missed?missRate:0}%</b> ${EX}<div class="small muted">every missed call got a text; ${w.missed-w.answered} didn’t reply</div></td></tr>
   <tr><td>Time to first callback / reply</td><td>~${b.cb} min ${EX}</td><td><b>~${t.settings.delay} min</b> ${EX}</td></tr>
   <tr><td>Estimates booked from missed calls</td><td>— (not tracked)</td><td><b>${w.booked}</b> ${EX}</td></tr></table></div>
   <div class="btns"><button class="b" data-act="resetBase">Re-record baseline</button></div>`);
 },
 pilot(t){const p=t.pilot,d=bookedSoFar(t),pc=Math.min(100,pct(d,p.goal));const st=d>=p.goal?['Goal hit','']:p.week/p.weeks>=pc/100+.34?['Behind','bad']:['On track','blue'];
  return head(t,'Pilot scorecard','shared by '+(t.fake?'the client':'Colby')+' and Andy')+
  `<div class="grid">${card(`<div class="stat"><div class="n">Week ${p.week} of ${p.weeks}</div><div class="l">Pilot length ${EX}</div></div>`)}${card(`<div class="stat"><div class="n">${p.goal}</div><div class="l">Goal: booked estimates ${EX}</div></div>`)}${card(`<div class="stat"><div class="n">${d}</div><div class="l">Booked so far ${EX}</div></div>`)}${card(`<div class="stat"><div class="n"><span class="tag ${st[1]}" style="font-size:16px">${st[0]}</span></div><div class="l">Status ${EX}</div></div>`)}</div>
  ${card(`<div class="small muted">Progress to goal</div><div class="bar"><div style="width:${pc}%"></div></div><div class="small">${pc}% ${EX}</div>`)}
  ${card(`<b>Exit point</b><p style="margin:4px 0">${esc(p.exit)}</p><div class="small muted">No pricing shown — any paid plan is a separate conversation.</div>`)}
  ${S.role==='admin'?card(`<b>Edit pilot (admin)</b><div class="btns"><label class="small">Weeks <input id="pw" type="number" value="${p.weeks}" style="width:60px"></label><label class="small">Current week <input id="pc" type="number" value="${p.week}" style="width:60px"></label><label class="small">Goal <input id="pg" type="number" value="${p.goal}" style="width:60px"></label><button class="b p" data-act="savePilot">Save</button></div>`):''}`;
 },
 onboarding(t){const done=STEPS.filter(s=>t.steps[s[0]]).length;
  return head(t,'Getting set up','your steps to go live')+card(`<div class="bar"><div style="width:${pct(done,STEPS.length)}%"></div></div><div class="small">${done} of ${STEPS.length} done</div>`)+
  STEPS.map(([k,l])=>card(`<div class="row"><div>${t.steps[k]?'✅':'⬜'} <b>${l}</b>${k==='templates'?`<div class="small muted">“${esc(t.settings.greeting)}”</div>`:''}</div>${t.steps[k]?'<span class="tag">Done</span>':(k==='baseline'?`<button class="b" data-v="baseline">Record</button>`:`<button class="b p" data-act="step" data-id="${k}">${k==='tone'||k==='templates'?'Approve':'Mark done'}</button>`)}</div>`)).join('');
 },
 onboardAdmin(){
  return `<div class="banner admin small">Admin view — visible to Andy only.</div><h1>Onboarding progress</h1><p class="sub">Per tenant</p>`+card(`<div class="tw"><table><tr><th>Tenant</th>${STEPS.map(s=>`<th>${s[1]}</th>`).join('')}<th>Done</th></tr>${TENANTS.map(t=>`<tr><td><b>${esc(t.name)}</b></td>${STEPS.map(s=>`<td>${t.steps[s[0]]?'✅':'⬜'}</td>`).join('')}<td>${STEPS.filter(s=>t.steps[s[0]]).length}/${STEPS.length}</td></tr>`).join('')}</table></div>`);
 },
 feedback(){const all=TENANTS.flatMap(t=>t.feedback.map(f=>({...f,tn:t.name})));
  const seed=[{tn:TENANTS[0].name,kind:'Lead',ref:'(515) 555-0199',v:'down',note:'Text sounded a little stiff',t:'Yesterday'},{tn:TENANTS[0].name,kind:'Weekly summary',ref:'week',v:'up',note:'',t:'Mon'}];
  const rows=[...all,...seed];
  return `<div class="banner admin small">Admin view — visible to Andy only.</div><h1>Client feedback</h1><p class="sub">Thumbs up/down from all tenants, newest first</p>`+card(`<div class="tw"><table><tr><th></th><th>Tenant</th><th>On</th><th>Note</th><th>When</th></tr>${rows.map(f=>`<tr><td>${f.v==='up'?'👍':'👎'}</td><td>${esc(f.tn)}</td><td>${esc(f.kind)} · ${esc(f.ref)} ${EX}</td><td>${esc(f.note||'—')}</td><td>${f.t}</td></tr>`).join('')}</table></div>`);
 },
 later(t){const n=t.finishedJobs,q=t.openQuotes,inv=t.doneInvoices;
  const prev=[[LATER[0],`You have ${q} quotes with no reply ${EX}. Follow-ups could have nudged all ${q} two days later.`,`Hi! Just checking in on the estimate Colby sent — any questions?`],
   [LATER[1],`You had ${n} finished jobs ${EX}; review asks could have gone to all ${n}.`,`Thanks for choosing us! A quick Google review helps a ton.`],
   [LATER[2],`${inv} finished jobs ${EX} could have had an invoice drafted the same day.`,`Invoice draft for your job on Fri — ready for you to check.`]];
  return head(t,'Coming later','only added if they’re actually useful')+
  card(`<span class="tag">Now (pilot)</span> <b>Missed call → text → calendar</b><div class="muted small">Business line only.</div>`)+
  prev.map(([l,what,msg])=>card(`<div class="row"><div><span class="tag gray">Coming later</span> <b>${l.name}</b></div><span class="tag warn">Preview — not running</span></div><div class="muted small">${l.desc}</div><p style="margin:8px 0 4px">${what}</p><div class="sms"><div class="msg out">${esc(msg)}<small>sample message — would not be sent</small></div></div>${S.role==='client'?`<div class="btns"><button class="b" data-act="interest" data-id="${l.name}">I’d want this — tell Andy</button></div>`:''}`,'later')).join('')+
  card(`<div class="muted small">Not part of this: payments, bookkeeping, personal texts, lead buying.</div>`);
 }
});
const _act=VIEWS.activity,_appr=VIEWS.approvals;
Object.assign(ACT,{
 fb(v){const[kind,ref,dir]=v.split('|');modal(`<h1>${dir==='up'?'👍 Thanks!':'👎 What was off?'}</h1><p class="muted small">Optional note for Andy</p><textarea id="fbn"></textarea><div class="btns"><button class="b p" data-act="doFb" data-id="${v}">Send</button><button class="b" data-act="cancel">Cancel</button></div>`);},
 doFb(v){const[kind,ref,dir]=v.split('|');T().feedback.unshift({kind,ref,v:dir,note:$('#fbn').value,t:'Just now'});close();toast('Feedback sent to Andy');},
 saveBase(){T().baseline={rate:+$('#bRate').value,cb:+$('#bCb').value};T().steps.baseline=true;toast('Baseline saved');render();},
 resetBase(){T().baseline=null;T().steps.baseline=false;render();},
 savePilot(){const p=T().pilot;p.weeks=+$('#pw').value;p.week=+$('#pc').value;p.goal=+$('#pg').value;toast('Pilot updated');render();},
 step(k){T().steps[k]=true;log(T(),'Confirmed','Setup step done: '+STEPS.find(s=>s[0]===k)[1]);toast('Step done');render();},
 interest(n){T().feedback.unshift({kind:'Add-on interest',ref:n,v:'up',note:'Client wants this',t:'Just now'});toast('Andy will hear about it');},
 demo(){S.demo=true;S.tenant='avery';S.role='client';S.view='weekly';document.body.classList.add('demo');render();},
 exitDemo(){S.demo=false;document.body.classList.remove('demo');S.tenant='colby';S.role='admin';S.view='overview';render();}
});
// approvals: add feedback buttons
VIEWS.approvals=t=>_appr(t).replace(/<button class="b r" data-act="reject" data-id="([^"]+)">Reject<\/button>/g,(m,id)=>m+fb('Approval',id));
// demo controls
const _render=render;
render=function(){_render();
  $('#demoBtn')||document.querySelector('.ctrls').insertAdjacentHTML('beforeend','<button class="b" id="demoBtn"></button><button class="b p" id="exitDemo">Exit demo</button>');
  $('#demoBtn').textContent='Demo mode';$('#demoBtn').onclick=()=>ACT.demo();$('#exitDemo').onclick=()=>ACT.exitDemo();
  $('#demoBtn').classList.toggle('hidden',S.role!=='admin'||!!S.demo);$('#exitDemo').classList.toggle('hidden',!S.demo);
  if(S.demo&&!$('#demoTag'))document.querySelector('.brand div').insertAdjacentHTML('beforeend','<span id="demoTag" class="tag warn">Demo · fake tenant</span>');
  if(!S.demo&&$('#demoTag'))$('#demoTag').remove();
};
if(P.get('demo')){S.demo=true;S.tenant='avery';S.role='client';document.body.classList.add('demo');}
render();
function weeklyText(t){const w=t.weekly;return `${t.name.split(' (')[0]} — your week: ${w.missed} missed calls caught, ${w.answered} texted back and replied, ${w.booked} estimates booked on your calendar. (Example data.) Reply here if anything sounded off. — Andy`;}

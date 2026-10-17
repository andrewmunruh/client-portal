// ALL records below are EXAMPLE DATA for the prototype. Nothing here is real customer data or real volume.
//
// One source of truth per tenant: `leads` (every missed call the bot caught, tagged with its pilot week `wk`).
// Dashboard tiles, Weekly summary, Pilot scorecard, Saved leads, the bot's Activity-log entries and the
// booked-windows table are all DERIVED from `leads` (see stats() / botLog() in app.js). Do not add separate counts.
const LATER = [
  {name:'Estimate follow-ups',desc:'Nudge homeowners on quotes that are sitting unanswered.'},
  {name:'Review requests',desc:'Ask for a Google review after a job is done.'},
  {name:'Invoicing',desc:'Help with invoices / other admin.'}
];
// Setup steps. owner 'andy' = Andy does it (read-only status for the client); 'client' = the client approves/confirms.
const STEPS=[
  {k:'forward',l:'Forward the business line',owner:'andy'},
  {k:'calendar',l:'Connect the calendar',owner:'andy'},
  {k:'area',l:'Set service area & bookable windows',owner:'andy'},
  {k:'templates',l:'Approve the text templates',owner:'client'},
  {k:'tone',l:'Approve the tone',owner:'client'},
  {k:'baseline',l:'Starting numbers (Andy records, you confirm)',owner:'client'}
];
const DEFAULT_RULES={routineText:'report',routineBooking:'report',pricing:'approve',complaint:'approve',reschedule:'approve',review:'approve',unknown:'flag'};
function mk(o){return Object.assign({paused:false,fake:false,demo:false,approvals:[],questions:[],confirms:[],flags:[],log:[],leads:[],requests:[],feedback:[],
  baseline:null,steps:{},finishedJobs:0,openQuotes:0,doneInvoices:0,jobValue:0,rules:Object.assign({},DEFAULT_RULES)},o);}
const TENANTS = [
 mk({id:'colby',name:"Colby’s Lawn & Landscape",owner:'Colby',their:'his',loc:'Johnston, IA',status:'Pilot',
  workflow:'Missed-call text-back → booked window on calendar',
  settings:{line:'Business line (number TBD)',calendar:'Colby’s calendar (TBD)',delay:2,vmPrompt:true,
    hours:'Mon–Sat 7am–7pm',windows:['Mornings 8–11','Afternoons 1–4','Evenings 5–7'],
    jobTypes:['Mowing','Landscaping / install','Cleanup','Other / not sure'],
    greeting:"Hi, this is Colby’s Lawn & Landscape — sorry we missed your call, we’re out on a job. What can we help with? Reply with the job type and we’ll get you on the calendar."},
  approvals:[
   {id:'a1',kind:'Pricing question',from:'(515) 555-0142',when:'Today 10:12a',src:'customer',ask:'“Ballpark what do you charge for weekly mowing on a corner lot?”',draft:'Thanks for asking! Colby will want to see the yard before giving a number. Can we get you on the calendar for a quick look? Mornings or afternoons?'},
   {id:'a2',kind:'Complaint',from:'(515) 555-0188',when:'Today 9:40a',src:'customer',ask:'“Crew left clippings all over my driveway last week.”',draft:'Sorry about that — thanks for telling us. Colby will reach out personally today to make it right.'},
   {id:'a3',kind:'Reschedule',from:'(515) 555-0107',when:'Yesterday 6:05p',src:'customer',ask:'“Can we move Thursday’s estimate to Saturday morning?”',draft:'No problem — we can do Saturday 8–11am. Want us to lock that in?'},
   // src:'system' = not a customer message; logged as an event, never as an inbound text.
   {id:'a4',kind:'Review ask',from:'(515) 555-0163',when:'Yesterday 3:20p',src:'system',ask:'Job marked done. Send a review request?',draft:'Thanks for choosing Colby’s Lawn & Landscape! If you have a sec, a quick Google review helps a ton.'}
  ],
  questions:[
   {id:'q1',q:'A caller asked if you do snow removal. What should the bot say?',opts:['Yes — book like any job','No — politely say we don’t','Flag it for me']},
   {id:'q2',q:'Are Sundays ever OK for estimate visits?',opts:['Yes','No','Ask me each time']}
  ],
  confirms:[
   {id:'c1',label:'Business line number to watch',val:'(TBD — business line only, not personal)'},
   {id:'c2',label:'Calendar bookings land on',val:'(TBD — Colby’s calendar)'},
   {id:'c3',label:'Text-back sent within',val:'A couple minutes of the missed call'}
  ],
  // type picks the triage options (FLAG_OPTS in app.js)
  flags:[
   {id:'f1',type:'vendor',sev:'warn',title:'Possible vendor / sales call',body:'Caller replied “Hi, I’m with a SEO agency…”. Bot stopped replying.'},
   {id:'f2',type:'personal',sev:'bad',title:'Caller asked for “Colby’s personal cell”',body:'Bot did not share any number. Needs your call on how to handle.'}
  ],
  pilot:{weeks:3,week:1,goal:6,exit:'Colby says it’s worth keeping and the goal is hit — then talk about an ongoing plan (no price set).'},
  steps:{forward:false,calendar:false,area:true,templates:false,tone:false},
  finishedJobs:6,openQuotes:4,doneInvoices:6,jobValue:300,
  leads:[
   {wk:1,when:'Today 11:02a',who:'(515) 555-0121',type:'Mowing',call:'10:58a',reply:'11:00a',replied:true,bookedAt:'11:02a',win:'Fri 8–11am',speed:'2 min',lost:true,
    story:'Called while Colby was mowing; said they were also calling two other companies. Booked before calling anyone else.',thread:[
     ['in','(missed call)','10:58a'],['out','Hi, this is Colby’s Lawn & Landscape — sorry we missed your call, we’re out on a job. What can we help with?','11:00a'],
     ['in','Need weekly mowing starting next week','11:01a'],['out','Got it! Pick a window for Colby to stop by: Fri 8–11am, Fri 1–4pm, or Sat 8–11am?','11:01a'],
     ['in','Fri morning works','11:02a'],['out','You’re on the calendar for Fri 8–11am. See you then!','11:02a']]},
   {wk:1,when:'Today 9:15a',who:'(515) 555-0158',type:'',call:'9:13a',reply:'9:15a',replied:false,bookedAt:null,win:null,speed:'2 min',lost:false,
    story:'No reply to the text-back yet.',thread:[
     ['in','(missed call)','9:13a'],['out','Hi, this is Colby’s Lawn & Landscape — sorry we missed your call, we’re out on a job. What can we help with?','9:15a']]},
   {wk:1,when:'Yesterday 4:40p',who:'(515) 555-0175',type:'Landscaping / install',call:'4:31p',reply:'4:33p',replied:true,bookedAt:'4:40p',win:'Sat 1–4pm',speed:'2 min',lost:true,
    story:'No voicemail left — would have been a silent missed call. Text-back turned it into a patio estimate.',thread:[
     ['in','(missed call)','4:31p'],['out','Hi, this is Colby’s Lawn & Landscape — sorry we missed your call…','4:33p'],
     ['in','Looking at a new patio + beds','4:36p'],['out','Nice! Windows for Colby to come look: Sat 1–4pm or Mon 5–7pm?','4:37p'],['in','Sat','4:40p'],['out','Booked: Sat 1–4pm. Thanks!','4:40p']]},
   {wk:1,when:'Tue 9:04a',who:'(515) 555-0199',type:'',call:'Tue 9:02a',reply:'9:04a',replied:true,bookedAt:null,win:null,speed:'2 min',lost:false,
    story:'Replied “just comparing prices” — no booking yet.',thread:[['in','(missed call)','9:02a'],['out','Hi, this is Colby’s Lawn & Landscape — sorry we missed your call…','9:04a'],['in','just comparing prices','9:20a']]},
   {wk:1,when:'Mon 6:30p',who:'(515) 555-0133',type:'Cleanup',call:'Mon 6:12p',reply:'6:14p',replied:true,bookedAt:'6:30p',win:'Mon 5–7pm',speed:'2 min',lost:false,
    story:'Existing customer; would likely have called back anyway.',thread:[]}
  ]}),
 mk({id:'prairie',name:'Prairie Pool Care',owner:'Jordan',their:'their',loc:'Example City',fake:true,status:'Example tenant',
  workflow:'Missed-call text-back (example)',
  settings:{line:'Example line',calendar:'Example calendar',delay:2,vmPrompt:false,hours:'Mon–Fri 9–5',windows:['9–12','1–5'],jobTypes:['Opening','Closing'],greeting:'Example greeting text.'},
  rules:{routineText:'report',routineBooking:'approve',pricing:'approve',complaint:'approve',reschedule:'report',review:'approve',unknown:'flag'},
  approvals:[{id:'pa1',kind:'Pricing question',from:'(555) 010-0001',when:'Today 8:00a',src:'customer',ask:'“How much to open a pool?”',draft:'Example draft reply.'}],
  baseline:{rate:40,cb:180,confirmed:false},
  pilot:{weeks:4,week:3,goal:5,exit:'Example exit point.'},
  steps:{forward:true,calendar:true,area:true,templates:true,tone:false},finishedJobs:3,openQuotes:2,doneInvoices:3,jobValue:250,
  leads:[
   {wk:3,when:'Today 8:30a',who:'(555) 010-0002',type:'Opening',call:'7:50a',reply:'7:52a',replied:true,bookedAt:'8:30a',win:'Tue 9–12',speed:'2 min',lost:true,story:'Example story.',thread:[]},
   {wk:3,when:'Yesterday 2:10p',who:'(555) 010-0003',type:'',call:'2:05p',reply:'2:07p',replied:true,bookedAt:null,win:null,speed:'2 min',lost:false,story:'Example: asked a question, no booking yet.',thread:[]},
   {wk:2,when:'Last week',who:'(555) 010-0004',type:'Closing',call:'Last week',reply:'—',replied:true,bookedAt:'Last week',win:'Thu 1–5',speed:'2 min',lost:false,story:'Example story.',thread:[]},
   {wk:1,when:'2 weeks ago',who:'(555) 010-0005',type:'Opening',call:'2 weeks ago',reply:'—',replied:true,bookedAt:'2 weeks ago',win:'Mon 9–12',speed:'2 min',lost:false,story:'Example story.',thread:[]}
  ]}),
 mk({id:'gutter',name:'Northside Gutters',owner:'Sam',their:'their',loc:'Example City',fake:true,status:'Example tenant · paused',paused:true,
  workflow:'Missed-call text-back (example)',
  settings:{line:'Example line',calendar:'Example calendar',delay:5,vmPrompt:true,hours:'Any',windows:['Any'],jobTypes:['Cleaning'],greeting:'Example greeting text.'},
  flags:[{id:'gf1',type:'unknown',sev:'warn',title:'Example flag',body:'Example flagged item.'}],
  pilot:{weeks:3,week:0,goal:4,exit:'Example exit point.'},
  steps:{forward:false,calendar:false,area:false,templates:false,tone:false}}),
 mk({id:'avery',name:'Avery’s Lawn Co',owner:'Avery',their:'their',loc:'Demo town',fake:true,demo:true,status:'Demo tenant',
  workflow:'Missed-call text-back → booked window on calendar',
  settings:{line:'Demo line',calendar:'Demo calendar',delay:2,vmPrompt:true,hours:'Mon–Sat 7am–7pm',windows:['Mornings 8–11','Afternoons 1–4'],jobTypes:['Mowing','Cleanup'],greeting:'Hi, this is Avery’s Lawn Co — sorry we missed your call, we’re out on a job. What can we help with?'},
  approvals:[{id:'v1',kind:'Pricing question',from:'(555) 020-0011',when:'Today 10:05a',src:'customer',ask:'“What do you charge for spring cleanup?”',draft:'Happy to help! Avery likes to see the yard first — want a quick visit Fri 8–11am or Sat 1–4pm?'}],
  baseline:{rate:45,cb:240,confirmed:true},
  pilot:{weeks:3,week:2,goal:8,exit:'Avery keeps it on after the pilot → ongoing plan (no price shown).'},
  steps:{forward:true,calendar:true,area:true,templates:true,tone:true},finishedJobs:9,openQuotes:5,doneInvoices:9,jobValue:300,
  leads:[
   {wk:2,when:'Today 12:20p',who:'(555) 020-0012',type:'Mowing',call:'12:14p',reply:'12:15p',replied:true,bookedAt:'12:20p',win:'Fri 8–11am',speed:'1 min',lost:true,
    story:'Caller was on a list of 3 companies from Google. First to reply, first booked.',thread:[['in','(missed call)','12:14p'],['out','Hi, this is Avery’s Lawn Co — sorry we missed your call…','12:15p'],['in','Need mowing weekly','12:18p'],['out','Fri 8–11am or Sat 1–4pm?','12:18p'],['in','Fri','12:20p'],['out','Booked: Fri 8–11am. Thanks!','12:20p']]},
   {wk:2,when:'Today 10:41a',who:'(555) 020-0014',type:'',call:'10:38a',reply:'10:40a',replied:true,bookedAt:null,win:null,speed:'2 min',lost:false,story:'Asked about aeration — Avery will follow up.',thread:[]},
   {wk:2,when:'Today 8:03a',who:'(555) 020-0015',type:'',call:'8:01a',reply:'8:03a',replied:false,bookedAt:null,win:null,speed:'2 min',lost:false,story:'No reply to the text-back yet.',thread:[]},
   {wk:2,when:'Yesterday 3:51p',who:'(555) 020-0013',type:'Cleanup',call:'3:40p',reply:'3:42p',replied:true,bookedAt:'3:51p',win:'Sat 1–4pm',speed:'2 min',lost:true,story:'Hung up without voicemail — booked by text in 11 minutes.',thread:[]},
   {wk:2,when:'Tue 5:10p',who:'(555) 020-0016',type:'Mowing',call:'Tue 4:58p',reply:'5:00p',replied:true,bookedAt:'5:10p',win:'Mon 8–11am',speed:'2 min',lost:false,story:'Wanted someone before the weekend; booked by text.',thread:[]},
   {wk:2,when:'Mon 2:22p',who:'(555) 020-0017',type:'',call:'Mon 2:18p',reply:'2:20p',replied:true,bookedAt:null,win:null,speed:'2 min',lost:false,story:'Renter — the landlord handles the yard.',thread:[]},
   {wk:1,when:'Last week',who:'(555) 020-0018',type:'Mowing',call:'Last week',reply:'—',replied:true,bookedAt:'Last week',win:'Wed 8–11am',speed:'1 min',lost:true,story:'Booked by text.',thread:[]},
   {wk:1,when:'Last week',who:'(555) 020-0019',type:'Cleanup',call:'Last week',reply:'—',replied:true,bookedAt:'Last week',win:'Thu 1–4pm',speed:'2 min',lost:false,story:'Booked by text.',thread:[]},
   {wk:1,when:'Last week',who:'(555) 020-0020',type:'',call:'Last week',reply:'—',replied:true,bookedAt:null,win:null,speed:'2 min',lost:false,story:'Replied, no booking.',thread:[]},
   {wk:1,when:'Last week',who:'(555) 020-0021',type:'',call:'Last week',reply:'—',replied:false,bookedAt:null,win:null,speed:'2 min',lost:false,story:'No reply.',thread:[]}
  ]})
];

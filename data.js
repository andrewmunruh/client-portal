// ALL records below are EXAMPLE DATA for the prototype. Nothing here is real customer data or real volume.
const LATER = [
  {name:'Estimate follow-ups',desc:'Nudge homeowners on quotes that are sitting unanswered.'},
  {name:'Review requests',desc:'Ask for a Google review after a job is done.'},
  {name:'Invoicing',desc:'Help with invoices / other admin.'}
];
function mk(o){return Object.assign({paused:false,approvals:[],questions:[],confirms:[],flags:[],log:[],bookings:[]},o);}
const TENANTS = [
 mk({id:'colby',name:"Colby’s Lawn & Landscape",loc:'Johnston, IA',fake:false,status:'Pilot',
  workflow:'Missed-call text-back → booked window on calendar',
  settings:{line:'Business line (number TBD)',calendar:'Colby’s calendar (TBD)',delay:2,vmPrompt:true,
    hours:'Example: Mon–Sat 7am–7pm',windows:['Example: Mornings 8–11','Example: Afternoons 1–4','Example: Evenings 5–7'],
    jobTypes:['Example: Mowing','Example: Landscaping / install','Example: Cleanup','Example: Other / not sure'],
    greeting:"Hi, this is Colby’s Lawn & Landscape — sorry we missed your call, we’re out on a job. What can we help with? Reply with the job type and we’ll get you on the calendar."},
  rules:{routineText:'report',routineBooking:'report',pricing:'approve',complaint:'approve',reschedule:'approve',review:'approve',unknown:'flag'},
  approvals:[
   {id:'a1',kind:'Pricing question',from:'(515) 555-0142',when:'Today 10:12a',ask:'“Ballpark what do you charge for weekly mowing on a corner lot?”',draft:'Thanks for asking! Colby will want to see the yard before giving a number. Can we get you on the calendar for a quick look? Mornings or afternoons?'},
   {id:'a2',kind:'Complaint',from:'(515) 555-0188',when:'Today 9:40a',ask:'“Crew left clippings all over my driveway last week.”',draft:'Sorry about that — thanks for telling us. Colby will reach out personally today to make it right.'},
   {id:'a3',kind:'Reschedule',from:'(515) 555-0107',when:'Yesterday 6:05p',ask:'“Can we move Thursday’s estimate to Saturday morning?”',draft:'No problem — we can do Saturday 8–11am. Want us to lock that in?'},
   {id:'a4',kind:'Review ask',from:'(515) 555-0163',when:'Yesterday 3:20p',ask:'Job marked done. Send a review request?',draft:'Thanks for choosing Colby’s Lawn & Landscape! If you have a sec, a quick Google review helps a ton.'}
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
  flags:[
   {id:'f1',sev:'warn',title:'Possible vendor / sales call',body:'Caller replied “Hi, I’m with a SEO agency…”. Bot stopped replying.'},
   {id:'f2',sev:'bad',title:'Caller asked for “Colby’s personal cell”',body:'Bot did not share any number. Needs your call on how to handle.'}
  ],
  bookings:[
   {who:'(515) 555-0121',type:'Example: Mowing',win:'Fri 8–11am',st:'Booked'},
   {who:'(515) 555-0175',type:'Example: Landscaping / install',win:'Sat 1–4pm',st:'Booked'},
   {who:'(515) 555-0133',type:'Example: Cleanup',win:'Mon 5–7pm',st:'Booked'}
  ],
  log:[
   {t:'Today 11:02a',type:'Booked',text:'Estimate window booked: Fri 8–11am (Mowing)',thread:[
     ['in','(missed call)','10:58a'],['out','Hi, this is Colby’s Lawn & Landscape — sorry we missed your call, we’re out on a job. What can we help with?','11:00a'],
     ['in','Need weekly mowing starting next week','11:01a'],['out','Got it! Pick a window for Colby to stop by: Fri 8–11am, Fri 1–4pm, or Sat 8–11am?','11:01a'],
     ['in','Fri morning works','11:02a'],['out','You’re on the calendar for Fri 8–11am. See you then!','11:02a']]},
   {t:'Today 9:15a',type:'Text-back',text:'Missed call → text sent from business number',thread:[
     ['in','(missed call)','9:13a'],['out','Hi, this is Colby’s Lawn & Landscape — sorry we missed your call, we’re out on a job. What can we help with?','9:15a']]},
   {t:'Yesterday 4:40p',type:'Booked',text:'Estimate window booked: Sat 1–4pm (Landscaping / install)',thread:[
     ['in','(missed call)','4:31p'],['out','Hi, this is Colby’s Lawn & Landscape — sorry we missed your call…','4:33p'],
     ['in','Looking at a new patio + beds','4:36p'],['out','Nice! Windows for Colby to come look: Sat 1–4pm or Mon 5–7pm?','4:37p'],['in','Sat','4:40p'],['out','Booked: Sat 1–4pm. Thanks!','4:40p']]}
  ]}),
 mk({id:'prairie',name:'Example Co. — Prairie Pool Care (FAKE)',loc:'Example City',fake:true,status:'Example tenant',
  workflow:'Missed-call text-back (example)',
  settings:{line:'Example line',calendar:'Example calendar',delay:2,vmPrompt:false,hours:'Example hours',windows:['Example: 9–12','Example: 1–5'],jobTypes:['Example: Opening','Example: Closing'],greeting:'Example greeting text.'},
  rules:{routineText:'report',routineBooking:'approve',pricing:'approve',complaint:'approve',reschedule:'report',review:'approve',unknown:'flag'},
  approvals:[{id:'pa1',kind:'Pricing question',from:'(555) 010-0001',when:'Today 8:00a',ask:'“How much to open a pool?”',draft:'Example draft reply.'}],
  questions:[],confirms:[],flags:[],bookings:[{who:'(555) 010-0002',type:'Example: Opening',win:'Tue 9–12',st:'Booked'}],
  log:[{t:'Today 8:30a',type:'Booked',text:'Example booking',thread:[]}]}),
 mk({id:'gutter',name:'Sample Tenant — Northside Gutters (FAKE)',loc:'Example City',fake:true,status:'Example tenant · paused',paused:true,
  workflow:'Missed-call text-back (example)',
  settings:{line:'Example line',calendar:'Example calendar',delay:5,vmPrompt:true,hours:'Example hours',windows:['Example: Any'],jobTypes:['Example: Cleaning'],greeting:'Example greeting text.'},
  rules:{routineText:'report',routineBooking:'report',pricing:'approve',complaint:'approve',reschedule:'approve',review:'approve',unknown:'flag'},
  flags:[{id:'gf1',sev:'warn',title:'Example flag',body:'Example flagged item.'}],log:[]})
];

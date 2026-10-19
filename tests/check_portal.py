"""Lightweight automated checks for the portal prototype.
Run: /workspace/.pwvenv/bin/python tests/check_portal.py   (exit code 0 = all pass)
"""
import json,pathlib,re,subprocess,sys,tempfile
from playwright.sync_api import sync_playwright
B=(pathlib.Path(__file__).resolve().parent.parent/'index.html').as_uri()
TENANTS=['colby','prairie','gutter','avery']
CLIENT_VIEWS=['dashboard','weekly','leads','pilot','baseline','approvals','questions','confirm','flags','activity','later','onboarding']
fails=[];passes=0
def check(ok,msg):
  global passes
  if ok: passes+=1
  else: fails.append(msg); print('FAIL',msg)
def k(pg,key): return int(pg.locator(f'[data-k="{key}"] .v').first.inner_text().replace(',',''))
def go(pg,q): pg.goto(f'{B}?{q}')

with sync_playwright() as p:
  b=p.chromium.launch();errs=[]
  pg=b.new_page(viewport={'width':1280,'height':800});pg.on('pageerror',lambda e:errs.append(str(e)))
  # --- Item 1: one source of truth; counts match across Dashboard, Weekly, Pilot per tenant
  for t in TENANTS:
    go(pg,f'role=client&tenant={t}&view=dashboard');texted,booked,upcoming=k(pg,'texted'),k(pg,'booked'),k(pg,'upcoming')
    rows=pg.locator('table.bookings tr.bk').count()
    go(pg,f'role=client&tenant={t}&view=weekly');wc,wb=k(pg,'w-caught'),k(pg,'w-booked')
    go(pg,f'role=client&tenant={t}&view=pilot');pw,ps=k(pg,'p-week'),k(pg,'p-sofar')
    go(pg,f'role=client&tenant={t}&view=leads');leads=pg.locator('h2:text("This week") ~ .lead').count() if pg.locator('.lead').count() else 0
    leads=pg.evaluate("()=>{let n=0,on=false;for(const e of document.querySelectorAll('#main > *')){if(e.tagName=='H2')on=e.textContent=='This week';else if(on&&e.classList.contains('lead'))n++}return n}")
    print(f'{t}: dashboard texted={texted} booked={booked} upcoming={upcoming} rows={rows} | weekly caught={wc} booked={wb} | pilot week={pw} so-far={ps} | leads this week={leads}')
    check(texted==wc==leads,f'{t}: texted-back count differs (dashboard {texted}, weekly {wc}, leads {leads})')
    check(booked==wb==pw==upcoming==rows,f'{t}: booked count differs (dash {booked}, weekly {wb}, pilot {pw}, upcoming {upcoming}, table {rows})')
    check(ps>=pw,f'{t}: pilot so-far {ps} < this week {pw}')
  # --- Item 2: before/after shows 0% no-follow-up and a separate didn't-reply row
  go(pg,'role=client&tenant=avery&view=baseline')
  check(pg.locator('[data-k="ba-nofollow"] .v').inner_text()=='0%','avery: no-follow-up should be 0%')
  check(re.search(r'\d+ of \d+',pg.locator('[data-k="ba-noreply"]').inner_text()) is not None,'avery: missing "didn\'t reply" row')
  # --- Item 5 + demo: no Colby anywhere in the Avery demo (including hidden DOM such as the tenant picker)
  for v in CLIENT_VIEWS:
    go(pg,f'demo=1&view={v}');html=pg.content()
    check('colby' not in html.lower(),f'demo {v}: "Colby" found')
    go(pg,f'role=client&tenant=avery&view={v}');txt=pg.locator('#main').inner_text()
    check('colby' not in txt.lower(),f'avery client {v}: "Colby" found in main')
  # --- Item 4 + pricing: no $ amount on any client or demo screen; revenue tile only in admin
  for t in TENANTS:
    for v in CLIENT_VIEWS:
      go(pg,f'role=client&tenant={t}&view={v}')
      check(not re.search(r'\$\s?\d',pg.locator('body').inner_text()),f'{t} client {v}: $ amount visible')
      check(pg.locator('[data-k="revenue"]').count()==0,f'{t} client {v}: revenue tile present')
  for v in CLIENT_VIEWS:
    go(pg,f'demo=1&view={v}');check(not re.search(r'\$\s?\d',pg.locator('body').inner_text()),f'demo {v}: $ amount visible')
  go(pg,'role=admin&view=pilot');check(pg.locator('[data-k="revenue"]').count()==1,'admin pilot: revenue tile missing')
  # --- Item 3a: Suggest a change goes to Andy, nothing sent
  go(pg,'role=client&view=approvals')
  check(pg.get_by_text('Save & send').count()==0 and pg.locator('[data-act=edit]').count()==0,'3a: client can still Edit / Save & send')
  n0=pg.locator('[data-act=approve]').count()
  pg.click('[data-act=suggest][data-id=a1]');pg.fill('#sg','Say Colby can come Saturday');pg.click('[data-act=doSuggest]')
  check(pg.locator('[data-act=approve]').count()==n0-1,'3a: item should leave the client queue')
  pg.click('nav >> text=Activity log');act=pg.locator('#main').inner_text()
  check('Change requested' in act and 'reply sent' not in act,'3a: activity should show Change requested and no reply sent')
  pg.click('#roleSeg >> text=Andy admin');pg.click('nav >> text=Client requests')
  check('Say Colby can come Saturday' in pg.locator('#main').inner_text(),'3a: request missing in admin Client requests')
  # --- Item 3b: client cannot type baseline numbers; Andy enters; client confirms/flags
  for t in TENANTS:
    go(pg,f'role=client&tenant={t}&view=baseline');check(pg.locator('#main input').count()==0,f'3b: {t} client baseline has inputs')
  go(pg,'role=admin&tenant=colby&view=baselineAdmin');pg.fill('#bRate','35');pg.fill('#bCb','120');pg.click('[data-act=saveBase]')
  pg.click('#roleSeg >> text=Client view');pg.click('nav >> text=Before / after')
  check(pg.locator('[data-act=baseOk]').count()==1 and pg.locator('[data-act=baseWrong]').count()==1,'3b: client should get Looks right / These look wrong')
  check('35%' in pg.locator('#main').inner_text(),'3b: admin-entered baseline not shown to client')
  pg.click('[data-act=baseWrong]');pg.fill('#bw','We miss more like half');pg.click('[data-act=doBaseWrong]')
  pg.click('#roleSeg >> text=Andy admin');pg.click('nav >> text=Client requests')
  check('Baseline looks wrong' in pg.locator('#main').inner_text(),'3b: baseline flag missing in admin requests')
  # --- Item 3c: Andy-owned setup steps are read-only for clients
  for t in TENANTS:
    go(pg,f'role=client&tenant={t}&view=onboarding')
    check(pg.locator('.step-andy button').count()==0 and pg.get_by_text('Mark done').count()==0,f'3c: {t} client can act on Andy steps')
  # --- Item 6: approving a review ask logs no fake inbound customer text
  go(pg,'role=client&view=approvals');pg.click('[data-act=approve][data-id=a4]');pg.click('nav >> text=Activity log')
  first=pg.locator('#main .card').first
  check(first.locator('.msg.in').count()==0 and first.locator('.msg.sys').count()==1,'6: review ask logged an inbound customer text')
  # --- Item 7: no double parentheses; correct tags
  check('((' not in pg.locator('#main').inner_text(),'7: double parentheses in activity')
  go(pg,'role=client&view=onboarding');pg.click('[data-act=step][data-id=tone]');pg.click('nav >> text=Dashboard')
  check('Setup' not in pg.locator('h2:text("Done by the bot") + .card').inner_text(),'7: client/setup action in bot Done section')
  # --- Item 8: per-type flag buttons + Undo
  go(pg,'role=client&view=flags')
  b1=pg.locator('#main .card').nth(0).locator('.btns').inner_text();b2=pg.locator('#main .card').nth(1).locator('.btns').inner_text()
  check(b1!=b2 and 'Not a customer' not in b2,'8: flag buttons not type-specific')
  pg.locator('#main .card').nth(0).locator('.btns button').first.click();check(pg.locator('#main .btns').count()==1,'8: flag not removed')
  pg.click('#undoBtn');check(pg.locator('#main .card .btns').count()==2,'8: Undo did not restore flag')
  # --- Item 12b: Esc closes modals; edit/suggest textarea not clipped
  go(pg,'role=client&view=approvals');pg.click('[data-act=reject] >> nth=0');pg.keyboard.press('Escape')
  check(pg.locator('#modal').is_hidden(),'12: Esc did not close modal')
  # --- Items 9/10/12 on iPhone: 44px targets, 16px fields, active tab in view, compact header
  ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True);m=ctx.new_page();m.on('pageerror',lambda e:errs.append(str(e)))
  for q in ['role=client&view=approvals','role=client&view=weekly','role=client&view=leads','role=admin&view=overview','role=admin&view=settings','role=client&view=onboarding']:
    go(m,q)
    small=m.evaluate("""()=>[...document.querySelectorAll('button,select,nav a,input:not([type=checkbox]),label.sw,summary')].filter(e=>e.offsetParent&&getComputedStyle(e).visibility!='hidden').map(e=>[e,e.getBoundingClientRect()]).filter(([e,r])=>r.height<44||(e.matches('label.sw,button.sm')&&r.width<44)).map(([e,r])=>(e.textContent||e.tagName).trim().slice(0,20)+' '+Math.round(r.width)+'x'+Math.round(r.height))""")
    check(not small,f'9: small touch targets on {q}: {small[:5]}')
    fs=m.evaluate("()=>[...document.querySelectorAll('input,select,textarea')].filter(e=>e.offsetParent).map(e=>parseFloat(getComputedStyle(e).fontSize)).filter(f=>f<16)")
    check(not fs,f'9: form fields under 16px on {q}: {fs}')
  go(m,'role=client&view=onboarding')
  r=m.evaluate("()=>{const n=document.querySelector('#nav'),a=n.querySelector('a.on').getBoundingClientRect(),nr=n.getBoundingClientRect();return [a.left>=nr.left-1&&a.right<=nr.right+1, Math.round(n.getBoundingClientRect().bottom)]}")
  check(r[0],'10: deep-linked active tab not scrolled into view')
  check(r[1]<=160,f'10: header + nav takes {r[1]}px on iPhone (want <=160)')
  go(m,'role=client&view=dashboard');check('fr' in m.locator('#nav').get_attribute('class'),'10: no scroll hint on nav')
  go(m,'role=client&view=dashboard')
  wraps=m.evaluate("()=>[...document.querySelectorAll('.tel')].filter(e=>e.getClientRects().length>1).length");check(wraps==0,'12c: phone number wraps')
  check(m.evaluate("()=>getComputedStyle(document.querySelector('.later')||document.body).opacity")=='1','12a: .later uses opacity')
  # --- Item 11: one example-data banner per screen
  for v in CLIENT_VIEWS:
    go(pg,f'role=client&view={v}');check(pg.locator('.exbanner').count()==1,f'11: {v} has {pg.locator(".exbanner").count()} banners')
  for v in ['overview','requests','pilot','baselineAdmin','onboardAdmin','feedback','settings']:
    go(pg,f'role=admin&view={v}');check(pg.locator('.exbanner').count()==1,f'11: admin {v} banner count')
  # ===== 2026-10-19 review, items 2-6 =====
  # (2) lead pill says "Texted back in", never "Replied in", and sits in the same spot on every card
  for t in TENANTS:
    go(m,f'role=client&tenant={t}&view=leads');txt=m.locator('#main').inner_text()
    check('Replied in' not in txt,f'2: {t} leads still say "Replied in"')
    n=m.locator('.lead').count();check(m.locator('.lead .speed .tag:text-matches("^Texted back in ")').count()==n,f'2: {t} not every lead card has "Texted back in"')
    xs=m.evaluate("()=>[...document.querySelectorAll('.lead .speed .tag')].map(e=>{const c=e.closest('.lead');return Math.round(e.getBoundingClientRect().left-c.getBoundingClientRect().left-c.clientLeft)})")  # relative to card content (highlighted cards have a 4px left border)
    check(len(set(xs))<=1,f'2: {t} speed pill moves between cards: {set(xs)}')
  # (3) iPhone bookings table fits (no clipped Status column)
  for t in TENANTS:
    for v in ['dashboard','activity']:
      go(m,f'role=client&tenant={t}&view={v}')
      over=m.evaluate("()=>[...document.querySelectorAll('table.bookings')].filter(tb=>tb.scrollWidth>tb.parentElement.clientWidth+1||[...tb.querySelectorAll('th,td')].some(c=>c.offsetParent&&c.getBoundingClientRect().right>tb.parentElement.getBoundingClientRect().right+1)).length")
      check(over==0,f'3: {t} {v} bookings table clipped on iPhone')
  # (4) plurals in weekly summary, text and email
  for t in TENANTS:
    go(pg,f'role=client&tenant={t}&view=weekly');txt=pg.locator('#main').inner_text()
    bad=re.findall(r'\b1 (?:missed calls|estimates|estimate windows)\b',txt)+re.findall(r'\b(?:[02-9]|\d\d+) (?:missed call|estimate|estimate window)\b(?! window)(?!s)',txt)
    check(not bad,f'4: {t} weekly plural errors: {bad}')
  # (5) paused / not-started pilot: no "Week 0" and no "On track"
  go(pg,'role=client&tenant=gutter&view=pilot');txt=pg.locator('#main').inner_text()
  check('Week 0' not in txt and 'On track' not in txt,'5: gutter pilot shows Week 0 / On track')
  check(pg.locator('.pstatus .tag').inner_text()=='Paused','5: paused tenant status should read Paused')
  # (6) setup steps: no checkbox emoji for the client; Approve buttons share one column
  for page,label in [(pg,'desktop'),(m,'iPhone')]:
    go(page,'role=client&tenant=colby&view=onboarding');txt=page.locator('#main').inner_text()
    check('⬜' not in txt and '✅' not in txt,f'6: {label} onboarding uses checkbox emoji')
    xs=page.evaluate("()=>[...document.querySelectorAll('.step button')].map(b=>{const r=b.getBoundingClientRect();return Math.round(r.left)+'/'+Math.round(r.right)})")
    check(len(xs)>=2 and len(set(xs))==1,f'6: {label} setup buttons not aligned: {xs}')
  # ===== Client-only copy (scripts/build_client.js), Colby =====
  ROOT=pathlib.Path(__file__).resolve().parent.parent
  slug=json.loads((ROOT/'scripts/clients.json').read_text())['colby']['slug'];CDIR=ROOT/'c'/slug
  check((CDIR/'index.html').exists(),f'client copy missing at c/{slug}/')
  with tempfile.TemporaryDirectory() as tmp:  # committed copy must match a fresh build
    subprocess.run(['node',str(ROOT/'scripts/build_client.js'),'colby','--out',tmp],check=True,capture_output=True)
    stale=[f.name for f in CDIR.iterdir() if f.read_bytes()!=(pathlib.Path(tmp)/f.name).read_bytes()]
    check(not stale and sorted(f.name for f in CDIR.iterdir())==sorted(f.name for f in pathlib.Path(tmp).iterdir()),f'client copy is stale vs build: {stale}')
  files={f.name:f.read_text() for f in CDIR.iterdir()};allsrc='\n'.join(files.values())
  check(not (CDIR/'admin.js').exists(),'client copy ships admin.js')
  go(pg,'role=admin&view=overview');others=pg.evaluate("()=>TENANTS.filter(t=>t.id!=='colby').flatMap(t=>[t.name,t.id,t.owner])")
  for w in others: check(not re.search(r'\b'+re.escape(w)+r'\b',allsrc,re.I),f'client copy contains other tenant "{w}"')
  for w in ['ADMIN_NAV','adminHead','Andy admin','role=admin','tenantSel','roleSeg','demoBtn','jobValue','revenue','baselineAdmin','onboardAdmin','overview(','requests(','"rules"']:
    check(w not in allsrc,f'client copy contains admin token {w!r}')
  check(not re.search(r'\$\s?\d',allsrc),'client copy contains a $ amount')
  CB=(CDIR/'index.html').as_uri()
  for q in ['','role=admin','role=admin&view=overview','tenant=avery','tenant=prairie&role=admin&view=pilot','demo=1','view=baselineAdmin','view=requests','view=onboardAdmin','view=feedback']:
    pg.goto(f'{CB}?{q}');txt=pg.locator('body').inner_text()
    check('Colby’s Lawn & Landscape' in txt and 'Admin view' not in txt and 'Admin (Andy only)' not in txt,f'client copy ?{q}: wrong tenant or admin view shown')
    check(pg.evaluate("()=>typeof ADMIN_NAV==='undefined'&&TENANTS.length===1&&!document.querySelector('#tenantSel,#roleSeg,#demoBtn,#menuBtn,[data-k=revenue]')"),f'client copy ?{q}: admin code/controls present')
    navs=pg.evaluate("()=>[...document.querySelectorAll('#nav a')].map(a=>a.dataset.v)")
    check(set(navs)<=set(CLIENT_VIEWS),f'client copy ?{q}: non-client nav {navs}')
  check(set(pg.evaluate("()=>Object.keys(VIEWS)"))<=set(CLIENT_VIEWS),'client copy defines admin views')
  for v in CLIENT_VIEWS:
    pg.goto(f'{CB}?view={v}&role=admin');t2=pg.locator('body').inner_text()
    check(not re.search(r'\$\s?\d',t2),f'client copy {v}: $ amount visible')
  pg.goto(f'{CB}?view=dashboard');cd=(k(pg,'texted'),k(pg,'booked'))
  go(pg,'role=client&tenant=colby&view=dashboard');check(cd==(k(pg,'texted'),k(pg,'booked')),'client copy counts differ from prototype')
  pg.goto(f'{CB}?view=approvals');pg.click('[data-act=suggest] >> nth=0');pg.fill('#sg','x');pg.click('[data-act=doSuggest]')
  check('Sent to Andy' in pg.locator('#toast').inner_text(),'client copy: Suggest a change flow broken')
  check(not errs,f'page errors: {errs}')
  b.close()
print(f'\n{passes} passed, {len(fails)} failed')
sys.exit(1 if fails else 0)

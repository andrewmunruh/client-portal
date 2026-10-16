from playwright.sync_api import sync_playwright
base='file:///workspace/client-portal-prototype/index.html'
shots=[('01-client-dashboard','role=client&view=dashboard'),('02-client-approvals','role=client&view=approvals'),('03-client-bot-questions','role=client&view=questions'),
('04-client-confirm-details','role=client&view=confirm'),('05-client-flagged','role=client&view=flags'),('06-client-activity-log','role=client&view=activity&thread=0'),
('07-client-coming-later','role=client&view=later'),('08-admin-all-tenants','role=admin&view=overview'),('09-admin-bot-settings','role=admin&view=settings'),
('10-admin-schedule','role=admin&view=schedule'),('11-admin-approval-rules','role=admin&view=rules'),('12-admin-integrations','role=admin&view=integrations'),
('13-fake-tenant-paused-admin','role=admin&view=settings&tenant=gutter'),
('17-client-weekly-summary','role=client&view=weekly'),('18-client-saved-leads','role=client&view=leads'),('19-client-baseline-onboarding-step','role=client&view=baseline'),
('20-client-before-after','role=client&view=baseline&tenant=avery'),('21-client-pilot-scorecard','role=client&view=pilot'),('22-admin-pilot-scorecard','role=admin&view=pilot'),
('23-client-getting-set-up','role=client&view=onboarding'),('24-admin-onboarding-progress','role=admin&view=onboardAdmin'),('25-client-coming-later-previews','role=client&view=later')]
with sync_playwright() as p:
  b=p.chromium.launch(); errs=[]
  pg=b.new_page(viewport={'width':1280,'height':800},device_scale_factor=2); pg.on('pageerror',lambda e:errs.append(str(e)))
  for n,q in shots: pg.goto(base+'?'+q); pg.screenshot(path=f'screens/{n}.png',full_page=True)
  # interaction: approve first item, then log
  pg.goto(base+'?role=client&view=approvals'); pg.click('text=Approve & send'); pg.click('nav >> text=Activity log'); pg.screenshot(path='screens/14-after-approve-log.png',full_page=True)
  m=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2); m.on('pageerror',lambda e:errs.append(str(e)))
  m.goto(base+'?role=client&view=dashboard'); m.screenshot(path='screens/15-mobile-dashboard.png',full_page=True)
  m.goto(base+'?role=client&view=approvals'); m.screenshot(path='screens/16-mobile-approvals.png',full_page=True)
  pg.goto(base+'?role=client&view=weekly'); pg.click('.fb button >> nth=1'); pg.fill('#fbn','Revenue number feels high'); pg.click('text=Send')
  pg.click('#roleSeg >> text=Andy admin'); pg.click('nav >> text=Client feedback'); pg.screenshot(path='screens/26-admin-feedback.png',full_page=True)
  pg.click('#demoBtn'); pg.screenshot(path='screens/27-demo-mode-desktop.png',full_page=True)
  for v in ['weekly','leads','pilot','dashboard']:
    m.goto(base+'?demo=1&view='+v); m.screenshot(path=f'screens/28-demo-mobile-{v}.png',full_page=True)
  print('errors',errs); b.close()

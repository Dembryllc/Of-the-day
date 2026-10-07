import json,subprocess,re,html,sys,os,shutil
HERE=os.path.dirname(os.path.abspath(__file__));REPO=os.path.abspath(os.path.join(HERE,'..','..'))
os.chdir(HERE)
for f in ['outfit-0.woff2','outfit-1.woff2']: shutil.copy(REPO+'/public/fonts/'+f,f)
shutil.copy(REPO+'/public/assets/sunrise-mark.png','sunrise-mark.png')
from playwright.sync_api import sync_playwright
P=json.loads(subprocess.check_output(['node','-e',"const s=require('fs').readFileSync(process.argv[1],'utf8');const m=s.match(/const POOL = (\\[[\\s\\S]*?\\n\\]);/);console.log(JSON.stringify(eval(m[1])))",REPO+'/scripts/activities-data.js']))
byid={a['id']:a for a in P}
IDS=[int(x) for x in sys.argv[1:]]
CAT={'Greeting':'Morning Meeting Greeting','SEL Prompt':'SEL Check-In','Brain Teaser':'Morning Brain Teaser','Movement Break':'Movement Break','Mindfulness':'Mindful Minute','Sharing':'Morning Meeting Share','Group Activity':'Group Activity','Morning Message':'Morning Message'}
css=open('template.html').read().split('<style>')[1].split('</style>')[0]
css+=".q{font-size:44px;font-weight:700;line-height:1.3;color:#1B2D5B}.lbl{font-size:26px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#F5A623;margin-bottom:18px}.main{flex:1;display:flex;flex-direction:column;justify-content:center;padding-bottom:40px}.how{font-size:40px;line-height:1.4;opacity:.85;margin-top:44px}"
out=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':1000,'height':1500})
  for i in IDS:
    a=byid[i];t=a['title'];mins=a['meta'].split('·')[0].strip()
    fs=128 if len(t)<=16 else 108 if len(t)<=22 else 96
    qfs=56 if len(a['prompt'])<110 else 48
    body=f'''<div class="main"><div class="kicker"><span></span>{CAT[a['cat']]} · {mins}</div>
<h1 style="font-size:{fs}px">{html.escape(t)}</h1>
<div class="card"><div class="lbl">Ask your class</div><div class="q" style="font-size:{qfs}px">{html.escape(a['prompt'])}</div></div>
<div class="how"><b style="color:#1B2D5B">How to run it:</b> {html.escape(a['directions'])}</div></div>
<div class="foot"><div class="brand"><img src="sunrise-mark.png">OfTheDay</div><div class="cta">Try today's meeting free →</div></div>'''
    open('tmp.html','w').write(f'<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>{body}</body></html>')
    pg.goto('file:///home/claude/pins/tmp.html');pg.wait_for_timeout(250)
    slug=re.sub(r'[^a-z0-9]+','-',t.lower()).strip('-')
    pg.screenshot(path=f'{REPO}/public/pins/{slug}.png')
    h=pg.evaluate("document.body.scrollHeight")
    out.append({'id':i,'slug':slug,'title':t,'cat':a['cat'],'mins':mins,'prompt':a['prompt'],'overflow':h>1500})
  b.close()
json.dump(out,open('last-batch.json','w'),indent=1)
print([o['slug'] for o in out if o['overflow']])

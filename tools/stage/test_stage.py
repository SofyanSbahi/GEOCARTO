"""Usage : (depuis tools/stage) python3 -m http.server 8765 --directory ../.. &  puis  python3 test_stage.py
   GC_URL=... pour une autre adresse. Nécessite : pip install playwright pillow (Chromium)."""
import json
from playwright.sync_api import sync_playwright
import os
os.makedirs("shots",exist_ok=True)
H=os.environ.get("GC_URL","http://localhost:8765/index.html")
res={}
def ok(name,cond,extra=""):
    res[name]=bool(cond); print(("PASS " if cond else "FAIL ")+name, extra)
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={"width":1920,"height":1080}); pg=ctx.new_page()
    errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("console",lambda m: m.type=="error" and errs.append(m.text))
    pg.goto(H+"#/stage/courbes"); pg.wait_for_timeout(1000)
    sc=lambda: pg.evaluate("window.__stage.S.scene")
    ok("starts scene 0", sc()==0)
    pg.keyboard.press("PageDown"); pg.wait_for_timeout(200); ok("PageDown -> next", sc()==1)
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(200); ok("ArrowRight -> next", sc()==2)
    pg.keyboard.press("PageUp"); pg.wait_for_timeout(200); ok("PageUp -> prev", sc()==1)
    pg.keyboard.press("5"); pg.wait_for_timeout(200); ok("key 5 -> scene 5", sc()==4)
    pg.keyboard.press("2"); pg.wait_for_timeout(300)
    # param
    pi=lambda: pg.evaluate("window.__stage.S.pi")
    n0=pg.evaluate("window.__stage.A.meta.levels")
    pg.keyboard.press("ArrowUp"); pg.wait_for_timeout(300); n1=pg.evaluate("window.__stage.A.meta.levels")
    ok("ArrowDown ArrowUp changes equidistance (more contours)", n1>n0, f"{n0}->{n1}")
    # spotlight
    pg.keyboard.press("s"); pg.mouse.move(900,500); pg.wait_for_timeout(200)
    ok("spotlight visible", pg.evaluate("getComputedStyle(document.querySelector('#stSpot')).display")!="none")
    pg.screenshot(path="shots/spot.png"); pg.keyboard.press("s")
    # zoom
    k0=pg.evaluate("window.__stage.A.k"); pg.mouse.move(700,500); pg.keyboard.press("z"); pg.wait_for_timeout(300); k1=pg.evaluate("window.__stage.A.k")
    ok("zoom x2 doubles scale", abs(k1/k0-2)<.05, f"{k0:.2f}->{k1:.2f}")
    fs_labels=pg.evaluate("[...document.querySelectorAll('#svg text.lb:not(.plain)')].map(t=>parseFloat(getComputedStyle(t).fontSize))")
    ok("labels keep same px size when zoomed", len(set(round(x,1) for x in fs_labels))==1 and fs_labels, f"{set(fs_labels)}")
    pg.screenshot(path="shots/zoom.png"); pg.keyboard.press("z"); pg.keyboard.press("z"); pg.wait_for_timeout(200)
    ok("zoom cycles back to 1", pg.evaluate("window.__stage.S.zoom")==1)
    # pen
    pg.keyboard.press("p"); pg.mouse.move(600,400); pg.mouse.down(); pg.mouse.move(900,500,steps=8); pg.mouse.up(); pg.wait_for_timeout(200)
    ink=pg.evaluate("(()=>{const c=document.querySelector('#stInk');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i])n++;return n})()")
    ok("pen draws ink", ink>500, f"{ink} px"); pg.screenshot(path="shots/pen.png"); pg.keyboard.press("c"); pg.keyboard.press("p")
    # ask / blank / help / calib
    pg.keyboard.press("q"); pg.wait_for_timeout(200); ok("ask banner shown", pg.evaluate("getComputedStyle(document.querySelector('#stAsk')).display")!="none"); pg.screenshot(path="shots/ask.png"); pg.keyboard.press("q")
    pg.keyboard.press("b"); pg.wait_for_timeout(150); ok("blank black", pg.evaluate("getComputedStyle(document.querySelector('#stBlank')).display")!="none"); pg.keyboard.press("b"); pg.wait_for_timeout(100)
    ok("blank off again", pg.evaluate("getComputedStyle(document.querySelector('#stBlank')).display")=="none")
    pg.keyboard.press("h"); pg.wait_for_timeout(200); ok("help modal", pg.evaluate("document.querySelector('#stModal .st-keys')!==null")); pg.screenshot(path="shots/help.png"); pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    ok("Esc closes modal, stays in stage", "stage" in pg.url)
    pg.keyboard.press("k"); pg.wait_for_timeout(200); pg.screenshot(path="shots/calib.png")
    ok("calibration modal", pg.evaluate("document.querySelector('#crs')!==null"))
    u0=pg.evaluate("parseFloat(getComputedStyle(document.querySelector('.stg')).getPropertyValue('--u'))")
    pg.click("[data-m=scale][data-v='2']"); pg.wait_for_timeout(300); u1=pg.evaluate("parseFloat(getComputedStyle(document.querySelector('.stg')).getPropertyValue('--u'))")
    ok("preset x2 doubles unit", abs(u1/u0-2)<.02, f"{u0}->{u1}")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    pg.screenshot(path="shots/rs2.png")
    pg.evaluate("window.__stage.act('setScale',1)"); pg.wait_for_timeout(200)
    # probe click
    pg.keyboard.press("3"); pg.wait_for_timeout(300); pg.mouse.click(800,600); pg.wait_for_timeout(300)
    ok("probe placed on click", pg.evaluate("window.__stage.S.probe!==null")); pg.keyboard.press("r"); pg.wait_for_timeout(200)
    ok("reveal works", pg.evaluate("window.__stage.S.reveal")==True)
    pg.keyboard.press("n"); pg.wait_for_timeout(500); ok("N regenerates terrain", pg.evaluate("window.__stage.S.seed")>0)
    # exit
    pg.keyboard.press("Escape"); pg.wait_for_timeout(500); ok("Esc exits to lab", "labo/courbes" in pg.url, pg.url)
    ok("chrome restored after exit", pg.evaluate("!document.body.classList.contains('stage-on')"))
    # presenter sync (same context, http)
    st=ctx.new_page(); st.goto(H+"#/stage/courbes"); st.wait_for_timeout(800)
    pv=ctx.new_page(); pv.set_viewport_size({"width":1280,"height":820}); pv.goto(H+"#/stage/courbes/presenter"); pv.wait_for_timeout(1200)
    ok("presenter connected", "Connecté" in pv.inner_text("#pvStat"), pv.inner_text("#pvStat"))
    pv.click("[data-a=next]"); pv.wait_for_timeout(500)
    ok("presenter next drives stage", st.evaluate("window.__stage.S.scene")==1)
    pv.click("[data-a=goto][data-v='4']"); pv.wait_for_timeout(500)
    ok("presenter goto scene 5", st.evaluate("window.__stage.S.scene")==4)
    pv.click("[data-a=ask]"); pv.wait_for_timeout(400)
    ok("presenter opens question on stage", st.evaluate("window.__stage.S.ask")==True)
    pv.screenshot(path="shots/presenter.png")
    print("errors:",errs[:5]); ok("no JS errors", not errs)
    b.close()
json.dump(res,open("shots/test_results.json","w"),indent=1)
print(sum(res.values()),"/",len(res))

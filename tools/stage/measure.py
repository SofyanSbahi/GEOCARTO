"""Usage : (depuis tools/stage) python3 -m http.server 8765 --directory ../.. &  puis  python3 measure.py
   GC_URL=... pour une autre adresse. Nécessite : pip install playwright pillow (Chromium)."""
import json, math
from playwright.sync_api import sync_playwright
import os
os.makedirs("shots",exist_ok=True)
H=os.environ.get("GC_URL","http://localhost:8765/index.html")
TEXT_JS="""(sel)=>{const root=document.querySelector(sel);const out=[];const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
while(n=w.nextNode()){const t=n.textContent.trim();if(!t)continue;const e=n.parentElement;if(e.closest('.st-sr'))continue;const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')continue;
let el=e,vis=true;while(el&&el!==root){if(getComputedStyle(el).display==='none'){vis=false;break}el=el.parentElement}if(!vis)continue;
const r=e.getBoundingClientRect();if(!r.width&&!(e instanceof SVGElement))continue;out.push([parseFloat(cs.fontSize),t.length,t.slice(0,24)])}return out}"""
def stats(arr,vh):
    tot=sum(c for _,c,_ in arr); mn=min(f for f,_,_ in arr)
    return dict(min_px=round(mn,1), min_pct_vh=round(mn/vh*100,2), chars=tot,
        pct_chars_below_2pct_vh=round(100*sum(c for f,c,_ in arr if f/vh*100<2.0)/tot,1),
        pct_chars_below_16px=round(100*sum(c for f,c,_ in arr if f<16)/tot,1))
def dmax(font_px,vh,screen_w_m=3.0):
    cap=.72*font_px; H_m=screen_w_m*9/16; return cap/vh*H_m/math.tan(math.radians(10/60))
R={}
with sync_playwright() as p:
    b=p.chromium.launch()
    for (w,h) in [(1920,1080),(1280,720),(1024,768)]:
        pg=b.new_page(viewport={"width":w,"height":h})
        # ---------- BEFORE ----------
        pg.goto(H+"#/labo/courbes"); pg.wait_for_timeout(1200)
        mapr=pg.evaluate("(()=>{const c=document.querySelector('#m').getBoundingClientRect();return [c.width,c.height]})()")
        txt=pg.evaluate(TEXT_JS,"main")
        k=mapr[0]/159; label_px=max(10,min(15,round(k*3.2)))
        bf=stats(txt,h)
        bf.update(map_w=round(mapr[0]),map_h=round(mapr[1]),map_area_pct=round(mapr[0]*mapr[1]/(w*h)*100,1),canvas_label_px=label_px,
                  canvas_label_pct_vh=round(label_px/h*100,2),contour_px=0.85,index_px=1.9)
        bf["min_text_px_incl_canvas"]=min(bf["min_px"],label_px)
        bf["label_legible_to_m_(3m_screen)"]=round(dmax(label_px,h),1)
        if (w,h)==(1920,1080): pg.screenshot(path="shots/before_1920.png")
        if (w,h)==(1280,720): pg.screenshot(path="shots/before_1280.png")
        if (w,h)==(1024,768): pg.screenshot(path="shots/before_1024.png")
        # ---------- AFTER (scene 5 = colline éq. 20 : même relief que le labo) ----------
        for rs in (1.0,1.5):
            pg.goto(H+"#/stage/courbes/5"); pg.wait_for_timeout(900)
            pg.evaluate(f"window.__stage.act('setScale',{rs})"); pg.keyboard.press("r"); pg.wait_for_timeout(500)
            m=pg.evaluate("(()=>{const c=document.querySelector('#mapBox').getBoundingClientRect();return [c.width,c.height]})()")
            txt=pg.evaluate(TEXT_JS,".stg")
            u=h/100*rs
            lab=pg.evaluate("[...document.querySelectorAll('#svg text.lb:not(.plain)')].map(t=>parseFloat(getComputedStyle(t).fontSize))")
            sw=pg.evaluate("[...document.querySelectorAll('#svg path[stroke-width]')].map(e=>parseFloat(e.getAttribute('stroke-width'))).filter(x=>x>0)")
            af=stats(txt,h)
            af.update(map_w=round(m[0]),map_h=round(m[1]),map_area_pct=round(m[0]*m[1]/(w*h)*100,1),canvas_label_px=round(min(lab),1) if lab else None,
                      canvas_label_pct_vh=round(min(lab)/h*100,2) if lab else None,contour_px=round(min(sw),2),index_px=round(max(sw),2))
            af["label_legible_to_m_(3m_screen)"]=round(dmax(min(lab),h),1) if lab else None
            R[f"{w}x{h}_after_rs{rs}"]=af
            if rs==1.0:
                pg.screenshot(path=f"shots/after_{w}.png")
            if rs==1.5 and (w,h)==(1920,1080): pg.screenshot(path="shots/after_1920_rs1.5.png")
        R[f"{w}x{h}_before"]=bf
        pg.close()
    b.close()
json.dump(R,open("shots/metrics.json","w"),indent=1,ensure_ascii=False)
for k,v in R.items(): print(k,json.dumps(v,ensure_ascii=False))

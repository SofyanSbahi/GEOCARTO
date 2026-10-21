"""Test différentiel de bout en bout : l'application d'origine (OLD) et l'application refactorée (NEW) reçoivent les MÊMES gestes
(Math.random figé par une graine) ; on compare pixels (canvas / pages) et textes.
Usage :  OLD=http://localhost:8766/index.html NEW=http://localhost:8765/index.html python3 compare_legacy.py
Exigences : playwright + pillow."""
import os, io, json, hashlib, sys
from playwright.sync_api import sync_playwright
from PIL import Image, ImageChops
OLD=os.environ.get("OLD","http://localhost:8766/index.html"); NEW=os.environ.get("NEW","http://localhost:8765/index.html")
INIT="""(()=>{let s=(+window.name||1)>>>0;const R=()=>{s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296};Math.random=R;})()"""
H=lambda b:hashlib.sha256(b if isinstance(b,bytes) else b.encode()).hexdigest()[:12]
ROUTES=["","m1","m2","m3","m4","m1/def","m1/courbes","m1/pente","m2/methode","profil","labos","labo/courbes","labo/relief","labo/pente","labo/atlas","terrain","inverse","exos","moi","geo","cas","projet","portfolio","erreurs","defi","prof","stage","stage/courbes"]
CHAPS=['def','echelle','orient','coord','courbes','pente','formes','theorie','methode','echelles','auto','geo1','geo2','geo3','coupe1','coupe2']
KNOWN={"defi":"ordre des choix d'un exercice : le mélange est désormais reproductible (dérivé de la graine) au lieu de Math.random"}
CANV="""()=>{const c=document.querySelector('#ex canvas');return c?c.toDataURL():''}"""
def newpage(b,seed=1):
    ctx=b.new_context(viewport={"width":1280,"height":900},reduced_motion="reduce"); ctx.add_init_script(INIT)
    pg=ctx.new_page(); errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.on("console",lambda m: m.type=="error" and "Failed to load resource" not in m.text and errs.append(m.text))
    pg.goto("about:blank"); pg.evaluate(f"window.name='{seed}'"); return pg,errs

clk=lambda pg,sel: pg.locator(sel).first.dispatch_event('click')
def profile_flow(b,base,code,mode,smooth,drop):
    pg,errs=newpage(b,3); pg.goto(base+"#/profil"); pg.wait_for_timeout(700)
    clk(pg,f".seg button:has-text('{mode}')"); pg.fill("input[placeholder^='ex']",code); clk(pg,"button:has-text('Charger un code')"); pg.wait_for_timeout(500)
    out={}
    out["map"]=H(pg.evaluate("document.querySelector('canvas').toDataURL()"))
    clk(pg,"button:has-text('Trait suggéré')"); pg.wait_for_timeout(300); out["info2"]=pg.inner_text(".fb")
    clk(pg,"button:has-text('Valider le trait')"); pg.wait_for_timeout(400)
    S=lambda e:pg.evaluate(e)
    S(f"""(()=>{{const S=__profile.S;S.marks=S.cross.filter((_,i)=>i%{drop}!==1).map((q,i)=>({{i:S.cross.indexOf(q),t:q.t,s:q.s,z:q.z,zs:i===2?q.z+S.eq:q.z}}));S.smooth={str(smooth).lower()};S.step=4;__profile.render()}})()""")
    pg.wait_for_timeout(500); out["paper_msg"]=pg.inner_text(".fb"); out["paper_cv"]=H(pg.evaluate("document.querySelector('canvas').toDataURL()"))
    clk(pg,"button:has-text('Commencer le tracé')"); pg.wait_for_timeout(300)
    S("""(()=>{const S=__profile.S,L=Math.hypot(S.B.x-S.A.x,S.B.y-S.A.y)*S.dem.cellM,m=S.marks;S.pts=[{s:0,z:m[0].z},...m.map(q=>({s:q.s,z:q.zs})),{s:L,z:m.at(-1).z}];S.pts=S.pts.filter((p,i)=>i%2===0||i===S.pts.length-1)})()""")
    clk(pg,"button:has-text('Terminer et corriger')"); pg.wait_for_timeout(2600)
    out["result_text"]=pg.inner_text("#app, main, body")[:4000]
    out["diag"]=pg.evaluate("[...document.querySelectorAll('.box.tip li')].map(l=>l.innerHTML)")
    out["result_cv"]=H(pg.evaluate("document.querySelector('canvas').toDataURL()"))
    out["stored"]=pg.evaluate("(()=>{const p=JSON.parse(localStorage.getItem('geocarto2')).profiles.at(-1);return {score:p.score,mode:p.mode,mae:p.mae,type:p.type,eq:p.eq,code:p.code}})()")
    out["errors_logged"]=pg.evaluate("JSON.parse(localStorage.getItem('geocarto2')).errors")
    out["pageerrors"]=errs; pg.context.close(); return out

def exo_flow(b,base):
    out={}
    for ch in CHAPS:
        for seed in (1,2,3,4):
            pg,errs=newpage(b,seed); pg.goto(base+"#/exos/"+ch); pg.wait_for_timeout(450)
            title=pg.inner_text("#ex h3"); prompt=pg.inner_text("#ex p")
            nopt=pg.locator("#ex .opt").count(); ninp=pg.locator("#ex input").count()
            cv=pg.evaluate(CANV)
            rec={"title":title,"nopt":nopt,"ninp":ninp,"cv":H(cv) if cv else "","errs":errs}
            if not nopt: rec["prompt"]=prompt
            out[f"{ch}-{seed}"]=rec; pg.context.close()
    return out

def route_shots(b,base):
    out={}
    for r in ROUTES:
        pg,errs=newpage(b,1); pg.goto(base+"#/"+r); pg.wait_for_timeout(1100)
        big=pg.evaluate("[...document.querySelectorAll('body *')].filter(e=>{if(e.closest('#toasts,.drawer,.modal,.stg,[role=dialog]'))return false;const c=getComputedStyle(e),r=e.getBoundingClientRect();return c.position==='fixed'&&c.display!=='none'&&r.width*r.height>0.4*innerWidth*innerHeight}).map(e=>e.tagName+'.'+e.className)")
        if big and not r.startswith('stage'): errs=errs+["recouvrement plein écran : "+str(big[:3])]
        out[r]=(pg.screenshot(full_page=False),errs); pg.context.close()
    return out

def main():
    bad=[]
    with sync_playwright() as p:
        b=p.chromium.launch()
        for name,args in [("profil debutant lisse",("volcan-1k2z-25","Débutant",True,4)),("profil expert segments",("montagne-7-25","Expert",False,3)),("profil inter",("vallee-ab-25","Intermédiaire",True,5))]:
            o=profile_flow(b,OLD,*args); n=profile_flow(b,NEW,*args)
            diff=[k for k in o if o[k]!=n[k]]
            print(("OK   " if not diff else "DIFF ")+name,diff, "score",o["stored"]["score"])
            if diff:
                bad.append(name)
                for k in diff: print("   OLD",k,str(o[k])[:300]); print("   NEW",k,str(n[k])[:300])
        eo=exo_flow(b,OLD); en=exo_flow(b,NEW); dd=[k for k in eo if eo[k]!=en[k]]
        print(("OK   " if not dd else "DIFF ")+f"exercices ({len(eo)} cas)",dd[:8]); 
        for k in dd[:4]: print("   OLD",eo[k]); print("   NEW",en[k])
        if dd: bad.append("exos")
        so=route_shots(b,OLD); sn=route_shots(b,NEW); nd=0
        for r in ROUTES:
            a=Image.open(io.BytesIO(so[r][0])).convert("RGB"); c=Image.open(io.BytesIO(sn[r][0])).convert("RGB")
            d=ImageChops.difference(a,c).getbbox(); pct=0
            if d:
                import numpy as np
                pct=float((np.array(ImageChops.difference(a,c)).sum(axis=2)>0).mean()*100)
            msg="OK  " if not d else "DIFF"
            if d and r in KNOWN: print("OK*  route /"+r,f"{pct:.3f}% px — écart attendu :",KNOWN[r]); continue
            if d: nd+=1; bad.append("route:"+r); c.save(f"shots/diff_new_{r.replace('/','_') or 'home'}.png"); a.save(f"shots/diff_old_{r.replace('/','_') or 'home'}.png")
            if d or sn[r][1]: print(msg,"route /"+r,f"{pct:.3f}% px",sn[r][1])
        print(f"routes: {len(ROUTES)-nd}/{len(ROUTES)} pixel-identiques (écarts attendus inclus)")
        b.close()
    print("RÉSULTAT:", "tout est identique" if not bad else "différences : "+", ".join(bad)); sys.exit(1 if bad else 0)
main()

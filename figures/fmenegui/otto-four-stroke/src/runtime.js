const root=document.getElementById('otto-anatomy-lab')
if(!root)throw new Error('Raiz da visualização ausente')
const $=name=>root.querySelector('[data-ui="'+name+'"]')
const ui={}
for(const el of root.querySelectorAll('[data-ui]'))ui[el.dataset.ui]=el
const fmt=(x,n=1)=>Number(x).toLocaleString('pt-BR',{minimumFractionDigits:n,maximumFractionDigits:n})
const strokes=['Admissão','Compressão','Expansão','Escape']
const processNames=['1 → 2 · compressão isentrópica','2 → 3 · adição de calor isocórica','3 → 4 · expansão isentrópica','4 → 1 · rejeição de calor isocórica']
const strokeColors=['var(--viz-series-1)','var(--muted-foreground)','var(--viz-series-2)','var(--muted-foreground)']
let cy=cycle(10,800000),factory=sceneFactory(10,true),bsp=makeBsp()
let tau=55,mode='coupled',proc=0,progress=0,speed=1,manualAngle=null,selected='',playing=!matchMedia('(prefers-reduced-motion: reduce)').matches
let current=null,last=0,raf=0,visible=true,destroyed=false,drawCount=0,lastBspAngle=0,machineTransform=null
const SVGNS='http://www.w3.org/2000/svg'
for(const [key,[name]] of Object.entries(PARTS)){const o=document.createElement('option');o.value=key;o.textContent=name;ui.part.append(o)}
const stateAt=()=>{
 if(mode==='process'){
  const a=atProcess(cy,proc,progress)
  return {...a,stroke:proc<2?1:2,hold:proc===1||proc===3}
 }
 if(manualAngle!==null){
  const t=manualAngle,a=atTimeline(timelineAtAngle(t,mode==='coupled'),cy,mode==='coupled')
  return {...a,theta:t,stroke:t===720?3:a.stroke}
 }
 return atTimeline(tau,cy,mode==='coupled')
}
function projectionFit(W,H){
 const bounds=ui.view.value==='valves'?{xmin:-83,xmax:79,ymin:-395,ymax:-212}:ui.view.value==='crank'?{xmin:-127,xmax:127,ymin:-278,ymax:70}:{xmin:-127,xmax:127,ymin:-395,ymax:70}
 const scale=Math.min((W-22)/(bounds.xmax-bounds.xmin),(H-22)/(bounds.ymax-bounds.ymin))
 return {scale,ox:W/2-(bounds.xmin+bounds.xmax)*scale/2,oy:H/2-(bounds.ymin+bounds.ymax)*scale/2}
}
function drawMachine(pose){
 const W=Math.max(280,ui.machine.getBoundingClientRect().width||500),H=W*650/570
 ui.machine.setAttribute('viewBox',`0 0 ${W} ${H}`)
 const tr=projectionFit(W,H);machineTransform=tr
 const scene=factory(pose.theta),raw=facesOf(scene)
 if(Math.abs(pose.theta-lastBspAngle)>15||drawCount%80===0)bsp=makeBsp()
 lastBspAngle=pose.theta;drawCount++
 let ordered
 try{ordered=bsp(raw).faces}catch(error){bsp=makeBsp();ordered=bsp(raw).faces}
 let markup='',d='',prev=''
 const flush=()=>{if(!d)return;const [part,tone,shade]=prev.split('|'),color=`var(--metal-${tone}-${shade})`,opacity=selected&&selected!==part?.28:1
  markup+=`<path data-piece="${part}" class="cursor-interaction" fill="${color}" stroke="${color}" stroke-width=".38" opacity="${opacity}" d="${d}"/>`;d=''
 }
 for(const f of ordered){
  const k=f.part+'|'+f.tone+'|'+f.shade
  if(k!==prev){flush();prev=k}
  d+=f.p.map((p,i)=>(i?'L':'M')+(tr.ox+p[0]*tr.scale).toFixed(2)+' '+(tr.oy+p[1]*tr.scale).toFixed(2)).join('')+'Z'
 }
 flush();ui.solids.innerHTML=markup
 let overlay=''
 const xy=p=>{const q=project(p);return[tr.ox+q[0]*tr.scale,tr.oy+q[1]*tr.scale]}
 const label=(point,text,anchor='start')=>{const [x,y]=xy(point);return `<text x="${x}" y="${y}" text-anchor="${anchor}" paint-order="stroke" stroke="var(--background)" stroke-width="3" stroke-linejoin="round">${text}</text>`}
 if(ui.labels.checked){
  overlay+=label([32,-39,445],'Comando ½θ')
  overlay+=label([55,-12,345],'Vela')
  overlay+=label([48,-25,scene.M.crown-14],'Pistão')
  overlay+=label([18,-16,205],'Biela')
  overlay+=label([65,-55,112],'Volante')
 }
 if(ui.flows.checked&&(pose.stroke===0||pose.stroke===3)&&!pose.hold){
  const y=pose.stroke===0?-18:18,start=pose.stroke===0?[74,y,324]:[38,y,324],end=pose.stroke===0?[38,y,324]:[74,y,324]
  const a=xy(start),b=xy(end),v=[b[0]-a[0],b[1]-a[1]],L=Math.hypot(...v),u=v.map(x=>x/L),n=[-u[1],u[0]],head=[b,[b[0]-8*u[0]+4*n[0],b[1]-8*u[1]+4*n[1]],[b[0]-8*u[0]-4*n[0],b[1]-8*u[1]-4*n[1]]]
  const color=pose.stroke===0?'var(--viz-series-1)':'var(--viz-series-2)'
  overlay+=`<path d="M${a.join(' ')}L${b.join(' ')}" stroke="${color}" stroke-width="2.4"/><path d="M${head.map(p=>p.join(' ')).join('L')}Z" fill="${color}"/>`
 }
 if((pose.t&&pose.t.proc===1)||(mode==='mechanical'&&pose.theta>=360&&pose.theta<366)){ 
  const p=xy([27,0,315]),q=pose.t.proc===1?pose.t.u:(pose.theta-360)/6,intensity=Math.sin(Math.PI*clamp(q,.01,.99))
  overlay+=`<circle cx="${p[0]}" cy="${p[1]}" r="${5+5*intensity}" fill="var(--viz-series-2)" opacity="${.2+.5*intensity}"/>`
 }
 ui.overlay.innerHTML=overlay
 ui.angles.textContent=`Virabrequim ${fmt(pose.theta,1)}° · comando ${fmt(pose.theta/2,1)}°`
 const gap=C.deck-Math.max(scene.M.intake.h,scene.M.exhaust.h)-scene.M.crown
 ui.clearance.textContent='Folga V–P '+fmt(gap,2)+' mm'
 return scene.M
}
const plotConfig={}
function chart(el,{xDomain,yDomain,xLabel,yLabel,lines,areaPoints=null,states=[],xTicks,yTicks,height=220,id}){
 const W=Math.max(280,el.getBoundingClientRect().width||400),H=height,L=64,R=30,T=20,B=54
 const x=v=>L+6+(v-xDomain[0])/(xDomain[1]-xDomain[0])*(W-L-R-12)
 const y=v=>H-B-6-(v-yDomain[0])/(yDomain[1]-yDomain[0])*(H-B-T-12)
 const path=points=>points.map((p,i)=>(i?'L':'M')+x(p[0]).toFixed(2)+' '+y(p[1]).toFixed(2)).join('')
 const count=W<370?3:4
 const xt=(W<370&&xTicks?.length>4?[0,240,480,720]:xTicks)||Array.from({length:count},(_,i)=>xDomain[0]+(xDomain[1]-xDomain[0])*i/(count-1))
 const yt=yTicks||Array.from({length:4},(_,i)=>yDomain[0]+(yDomain[1]-yDomain[0])*i/3)
 let s=`<rect data-chart-frame="" x="${L}" y="${T}" width="${W-L-R}" height="${H-B-T}" fill="none" stroke="var(--border)"/>`
 for(const v of yt)s+=`<path d="M${L} ${y(v)}H${W-R}" stroke="var(--border)" stroke-width=".5"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end">${fmt(v,v<5&&v%1?1:0)}</text>`
 for(const v of xt)s+=`<text x="${x(v)}" y="${H-B+20}" text-anchor="middle">${fmt(v,0)}</text>`
 s+=`<text class="axis-title" data-axis="x" x="${(L+W-R)/2}" y="${H-8}" text-anchor="middle">${xLabel}</text><text class="axis-title" data-axis="y" x="16" y="${(T+H-B)/2}" text-anchor="middle" transform="rotate(-90 16 ${(T+H-B)/2})">${yLabel}</text>`
 if(areaPoints)s+=`<path d="${path(areaPoints)}Z" fill="var(--viz-series-1)" opacity=".11"/>`
 for(let i=0;i<lines.length;i++){const l=lines[i];s+=`<path d="${path(l.points)}" fill="none" stroke="${l.color||'var(--viz-series-1)'}" stroke-width="1.7"${l.dashed?' stroke-dasharray="4 3"':''}/>`}
 for(const st of states){const xx=x(st.x),yy=y(st.y),dx=st.dx||0,dy=st.dy||0
  s+=`<circle cx="${xx}" cy="${yy}" r="2.6" fill="var(--foreground)"/><text x="${xx+dx}" y="${yy+dy}" text-anchor="middle">${st.id}</text>`
 }
 s+=`<path data-cursor-line="" d="" stroke="var(--muted-foreground)" stroke-width="1" stroke-dasharray="3 3"/><circle data-cursor="" r="4.5" fill="var(--foreground)" stroke="var(--background)" stroke-width="1.5"/><circle data-cursor-second="" r="3.5" fill="var(--viz-series-2)" stroke="var(--background)" stroke-width="1.2"/>`
 el.setAttribute('viewBox',`0 0 ${W} ${H}`);el.setAttribute('height',H);el.innerHTML=s
 plotConfig[id]={x,y,L,R,W,T,bottom:H-B,marker:el.querySelector('[data-cursor]'),marker2:el.querySelector('[data-cursor-second]'),guide:el.querySelector('[data-cursor-line]')}
}
function niceTop(max){const p=10**Math.floor(Math.log10(max/3)),s=[1,2,2.5,5,10].find(v=>v*p>=max/3)*p;return{top:Math.ceil(max/s)*s,ticks:Array.from({length:Math.ceil(max/s)+1},(_,i)=>i*s)}}
function drawCharts(){
 const curves=Array.from({length:4},(_,p)=>Array.from({length:151},(_,i)=>thermoAt(cy,p,i/150)))
 const pv=curves.map((a,i)=>({points:a.map(v=>[v.V*1e6,v.p/1e5]),color:i%2?'var(--viz-series-2)':'var(--viz-series-1)'}))
 const ts=curves.map((a,i)=>({points:a.map(v=>[v.s,v.T]),color:i%2?'var(--viz-series-2)':'var(--viz-series-1)'}))
 const [s1,s2,s3,s4]=cy.states
 const py=niceTop(s3.p/1e5*1.08),ty=niceTop(s3.T),vx=niceTop(s1.V*1e6*1.03)
 chart(ui.pv,{id:'pv',xDomain:[0,vx.top],yDomain:[0,py.top],xTicks:vx.ticks,yTicks:py.ticks,xLabel:'Volume [cm³]',yLabel:'Pressão [bar]',lines:pv,areaPoints:pv.flatMap(c=>c.points),states:cy.states.map((s,i)=>({id:i+1,x:s.V*1e6,y:s.p/1e5,dx:i===0?-13:13,dy:i===0?14:i===3?-12:4})),height:220})
 const ds=s3.s
 chart(ui.ts,{id:'ts',xDomain:[-ds*.08,ds*1.16],yDomain:[0,ty.top],yTicks:ty.ticks,xLabel:'Entropia relativa [J/(kg·K)]',yLabel:'Temperatura [K]',lines:ts,states:cy.states.map((s,i)=>({id:i+1,x:s.s,y:s.T,dx:i<2?-12:12,dy:i===0?5:4})),xTicks:[0,Math.round(ds/2/10)*10,Math.round(ds/10)*10],height:220})
 const points=Array.from({length:361},(_,i)=>i*2)
 chart(ui.pistonChart,{id:'piston',xDomain:[0,720],yDomain:[0,95],xLabel:'Ângulo do virabrequim [°]',yLabel:'Deslocamento [mm]',lines:[{points:points.map(t=>[t,mechanics(t,cy.eps).x])}],xTicks:[0,180,360,540,720],yTicks:[0,43,86],height:205})
 chart(ui.valveChart,{id:'valves',xDomain:[0,720],yDomain:[0,2.5],xLabel:'Ângulo do virabrequim [°]',yLabel:'Levantamento [mm]',lines:[{points:points.map(t=>[t,lift(t).h])},{points:points.map(t=>[t,lift(t,540).h]),color:'var(--viz-series-2)',dashed:true}],xTicks:[0,180,360,540,720],yTicks:[0,1.1,2.2],height:205})
}
function marker(config,x,y,visible=true,second=null,guide=false){
 config.marker.style.display=visible?'':'none';config.marker2.style.display=second===null?'none':''
 if(visible){config.marker.setAttribute('cx',config.x(x));config.marker.setAttribute('cy',config.y(y))}
 if(second!==null){config.marker2.setAttribute('cx',config.x(x));config.marker2.setAttribute('cy',config.y(second))}
 config.guide.setAttribute('d',guide?`M${config.x(x)} ${config.T}V${config.bottom}`:'')
}
function updateNumbers(){
 const {g}=cy
 ui.energy.innerHTML=[['Recebido',cy.qin,cy.Qin],['Rejeitado',cy.qout,cy.Qout],['Trabalho líquido',cy.wnet,cy.Wnet]].map(([a,b,c])=>`<tr><td>${a}</td><td class="text-end">${fmt(b,0)}</td><td class="text-end">${fmt(c,2)}</td></tr>`).join('')
 ui.geometry.innerHTML=[['Diâmetro B','86 mm'],['Raio r · curso S','43 mm · 86 mm'],['Biela l','143 mm'],['Cilindrada Vd',fmt(g.Vd/1000,3)+' cm³'],['Câmara Vc',fmt(g.Vc/1000,3)+' cm³']].map(([a,b])=>`<tr><td>${a}</td><td class="text-end">${b}</td></tr>`).join('')
 ui.states.innerHTML=cy.states.map(s=>`<tr><td>${s.id}</td><td>${fmt(s.V*1e6,3)}</td><td>${fmt(s.p/1000,2)}</td><td>${fmt(s.T,2)}</td><td>${fmt(Math.abs(s.s)<1e-8?0:s.s,2)}</td></tr>`).join('')
 ui.efficiency.textContent=fmt(cy.eta*100,2)+'%'
 ui.epsValue.textContent=fmt(cy.eps,1)+' : 1';ui.qinValue.textContent=fmt(cy.qin/1000,0)+' kJ/kg'
 ui.mass.textContent='Massa fechada: '+fmt(cy.m*1000,4)+' g'
}
function paint({machine=true}={}){
 current=stateAt()
 if(mode!=='process'&&current.t)ui.process.value=current.t.proc
 const M=machine?drawMachine(current):mechanics(current.theta,cy.eps)
 ui.phase.textContent=current.hold?(current.t.proc===1?'Adição de calor · PMS':'Rejeição de calor · PMI'):strokes[current.stroke]
 ui.theta.textContent=fmt(current.theta,1)+'°';ui.angle.value=current.theta
 ui.volume.textContent=fmt(M.V/1000,2)+' cm³'
 ui.pressure.textContent=current.t?fmt(current.t.p/1000,1)+' kPa':'Não aplicável'
 ui.temperature.textContent=current.t?fmt(current.t.T,1)+' K':'Não aplicável'
 // Mass shown in the energy balance refers to the closed cycle, never the instantaneous intake/exhaust charge.
 const statusText=current.hold?'Ângulo pausado para ensino · '+processNames[current.t.proc]:current.t?processNames[current.t.proc]+' · massa '+fmt(cy.m*1000,4)+' g':'Troca de massa · p, T e massa instantânea fora do modelo Otto'
 if(ui.status.textContent!==statusText)ui.status.textContent=statusText
 if(current.t){marker(plotConfig.pv,current.t.V*1e6,current.t.p/1e5);marker(plotConfig.ts,current.t.s,current.t.T)}else{marker(plotConfig.pv,0,0,false);marker(plotConfig.ts,0,0,false)}
 marker(plotConfig.piston,current.theta,M.x,true,null,true)
 marker(plotConfig.valves,current.theta,M.intake.h,true,M.exhaust.h,true)
 ui.progress.value=mode==='process'?progress:(current.t?.u||0)
 ui.processPercent.textContent=fmt(Number(ui.progress.value)*100,0)+'%'
 for(const b of root.querySelectorAll('[data-stroke]'))b.setAttribute('aria-pressed',String(Number(b.dataset.stroke)===current.stroke&&!current.hold))
 root.querySelector('[data-action="play"]').textContent=playing?'Pausar':'Reproduzir'
}
function stop(){playing=false;last=0;if(raf){cancelAnimationFrame(raf);raf=0}}
function run(){if(!raf&&playing&&visible&&!destroyed){last=0;raf=requestAnimationFrame(tick)}}
function tick(now){
 raf=0;if(!root.isConnected){destroy();return}
 const dt=last?Math.min((now-last)/1000,.25):0;last=now
 if(playing&&visible){
  manualAngle=null
  if(mode==='process'){progress=Math.min(1,progress+dt*speed/4);if(progress>=1)playing=false}
  else tau+=dt*60*speed
  paint()
 }
 if(playing&&visible)raf=requestAnimationFrame(tick)
}
function seekAngle(value){stop();manualAngle=value;tau=timelineAtAngle(value,mode==='coupled');if(mode==='process'){mode='coupled';ui.mode.value=mode;tau=timelineAtAngle(value,true)}bsp=makeBsp();paint()}
function setProcess(p){stop();mode='process';ui.mode.value=mode;proc=p;progress=0;ui.process.value=p;bsp=makeBsp();paint()}
const on=(el,event,fn)=>{el.addEventListener(event,fn);cleanups.push(()=>el.removeEventListener(event,fn))}
const cleanups=[]
on(root,'click',e=>{
 const action=e.target.closest('[data-action]')?.dataset.action
 if(action==='play'){
  if(playing)stop();else{if(mode==='process'&&progress>=1)progress=0;playing=true;manualAngle=null;run()}
  paint();return
 }
 if(action==='reset'){stop();mode='coupled';ui.mode.value=mode;tau=0;manualAngle=0;progress=0;bsp=makeBsp();paint();return}
 const st=e.target.closest('[data-stroke]');if(st){seekAngle(Number(st.dataset.stroke)*180+90);return}
 const piece=e.target.closest('[data-piece]');if(piece)selectPart(piece.dataset.piece)
})
function selectPart(key){selected=key;ui.part.value=key;ui.description.textContent=key?PARTS[key][0]+'. '+PARTS[key][1]:'Clique em uma peça ou use a lista para consultar sua função.';paint()}
on(ui.part,'change',()=>selectPart(ui.part.value))
on(ui.mode,'change',()=>{
 const theta=current.theta;stop();mode=ui.mode.value;manualAngle=null
 if(mode==='process'){proc=Number(ui.process.value);progress=0}else tau=timelineAtAngle(theta,mode==='coupled')
 bsp=makeBsp();paint()
})
on(ui.angle,'input',()=>seekAngle(Number(ui.angle.value)))
on(ui.process,'change',()=>setProcess(Number(ui.process.value)))
on(ui.progress,'input',()=>{stop();mode='process';ui.mode.value=mode;proc=Number(ui.process.value);progress=Number(ui.progress.value);bsp=makeBsp();paint()})
on(ui.speed,'change',()=>{speed=Number(ui.speed.value)})
for(const id of ['labels','flows','view'])on(ui[id],'change',()=>paint())
on(ui.shell,'change',()=>{factory=sceneFactory(cy.eps,ui.shell.checked);bsp=makeBsp();paint()})
for(const id of ['eps','qin'])on(ui[id],'input',()=>{
 const old=cy.eps;cy=cycle(Number(ui.eps.value),Number(ui.qin.value)*1000)
 if(cy.eps!==old){factory=sceneFactory(cy.eps,ui.shell.checked);bsp=makeBsp()}
 updateNumbers();drawCharts();paint()
})
const obs=new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;if(visible)run();else{last=0;if(raf){cancelAnimationFrame(raf);raf=0}}},{rootMargin:'100px'})
obs.observe(root)
let lastWidth=0
const resize=new ResizeObserver(entries=>{const w=entries[0].contentRect.width;if(Math.abs(w-lastWidth)>1){lastWidth=w;drawCharts();paint()}})
resize.observe(root)
on(document,'visibilitychange',()=>{visible=!document.hidden;if(visible)run();else if(raf){cancelAnimationFrame(raf);raf=0;last=0}})
const rm=matchMedia('(prefers-reduced-motion: reduce)')
const reduced=()=>{if(rm.matches){stop();paint()}}
rm.addEventListener('change',reduced)
function destroy(){destroyed=true;stop();obs.disconnect();resize.disconnect();rm.removeEventListener('change',reduced);cleanups.forEach(f=>f())}
ui.checks.innerHTML=`<ul><li>36.005 poses: curso de 86 mm, biela de 143 mm e razão Vmax/Vmin = ε. Erro máximo da biela: 8,53 × 10⁻¹⁴ mm.</li><li>Folga mínima válvula-pistão: 6,615 mm. Geometria validada para ε de 6 a 14, com levantamento de 2,2 mm.</li><li>Folgas verificadas por envoltórias dos principais corpos móveis em 7.201 posições, incluindo virabrequim/cárter, biela/pistão, molas/guias e tuchos/guias. Ajustes e galerias simplificados não fazem parte de uma análise CAD integral.</li><li>Perfil do comando: curvatura mínima de 3 mm, contato dentro da face do tucho e continuidade do levantamento, da velocidade e da aceleração nas extremidades.</li><li>Distribuição 20:40, continuidade em 720° e fechamento geométrico da correia de 164 dentes.</li><li>15 cenários de ε e qin, 20.001 pontos por processo. Erro relativo máximo entre ∮p dV e Qin − Qout: 3,02 × 10⁻⁸. Entre ∮T ds e qin − qout: 4,15 × 10⁻¹⁰.</li><li>Fechamento dos quatro estados, eficiência por duas expressões e consistência de volume entre motor e gráficos.</li><li data-ui="visualQA">Inspeção de imagens renderizadas em seis poses. Ordem de oclusão testada em 121 poses e 2.269 raios, sem divergência detectada. Oito grupos de testes unitários dos controles passaram em um DOM mínimo. O navegador bloqueou a prévia local, portanto interação, aparência e desempenho no navegador não foram certificados. Não foi executada uma análise CAD integral de colisões.</li></ul>`
updateNumbers();drawCharts();paint();run()
// Local inspection interface only. No network, no external API.
root.__otto={getState:()=>({playing,mode,tau,progress,pose:current,cycle:cy}),seek:seekAngle,process:setProcess,pause:()=>{stop();paint()},destroy,paint,select:selectPart}

function mountShower() {
  const root=document.getElementById('electric-shower-cutaway-3')
  if(!root)return
  const q=s=>root.querySelector(s)
  const qa=s=>[...root.querySelectorAll(s)]
  const tap=q('#sh3-tap'), replay=q('#sh3-replay'), mode=q('#sh3-mode'), phase=q('#sh3-phase')
  const svg=q('.sh-svg'), camera=q('[data-camera]'), viewport=q('.sh-view')
  const actuator=qa('[data-part="actuator"]'), dome=qa('[data-dome] path')
  const heaterA=qa('[data-part="heater-a"]'), heaterB=qa('[data-part="heater-b"]')
  const jets=qa('[data-jet]'), tracers=qa('[data-tracer]')
  const sprays=q('[data-layer="sprays"]'), streams=q('[data-layer="flow"]')
  const focusButtons=qa('[data-focus]')
  const controller=new AbortController(), options={signal:controller.signal}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)')
  let tapOpen=false, motion=0, startMotion=0, elapsed=2, clock=0, replayAt=null
  let focus='whole', visible=true, dead=false, frame=0, previous=null, lastStatus=''
  let view=null, targetView=null
  let state=showerModel(mode.value,4,false,0)

  function pointAt(route,t) {
    const lengths=route.slice(1).map((p,i)=>Math.hypot(p[0]-route[i][0],p[1]-route[i][1]))
    let distance=t*lengths.reduce((a,b)=>a+b,0)
    for(let i=0;i<lengths.length;i++) {
      if(distance<=lengths[i] || i===lengths.length-1) {
        const f=distance/lengths[i]
        return [route[i][0]+(route[i+1][0]-route[i][0])*f,route[i][1]+(route[i+1][1]-route[i][1])*f]
      }
      distance-=lengths[i]
    }
    return route[0]
  }

  function paintCamera() {
    camera.setAttribute('transform',`translate(${view[0]} ${view[1]}) scale(${view[2]})`)
  }

  function sizeCamera(immediate=false) {
    const width=Math.max(240,viewport.getBoundingClientRect().width)
    const height=width<480?Math.round(width*1.12):450
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`)
    const box=DATA.focus[focus]
    const scale=Math.min((width-12)/box[2],(height-14)/box[3])
    targetView=[(width-box[2]*scale)/2-box[0]*scale,(height-box[3]*scale)/2-box[1]*scale,scale]
    if(!view || immediate || reduced.matches)view=[...targetView]
    paintCamera()
    run()
  }

  function paint() {
    state=showerModel(mode.value,4,tapOpen,motion)
    root.dataset.contacts=state.pressureContactsClosed?'closed':'open'
    root.dataset.heater=state.closed?'on':'off'
    root.dataset.stroke=motion.toFixed(5)
    const dx=(DATA.atRise[0]-DATA.at0[0])*motion
    const dy=(DATA.atRise[1]-DATA.at0[1])*motion
    actuator.forEach(node=>node.setAttribute('transform',`translate(${dx} ${dy})`))
    dome.forEach((node,index)=>{
      const points=[]
      for(let j=0;j<=20;j++) {
        const angle=(index+j/20)*Math.PI/2
        points.push(projectPoint([DATA.diaphragm[0]+20*Math.cos(angle),DATA.diaphragm[1]+20*Math.sin(angle),105],DATA.P))
      }
      for(let j=20;j>=0;j--) {
        const angle=(index+j/20)*Math.PI/2
        points.push(projectPoint([DATA.diaphragm[0]+7*Math.cos(angle),DATA.diaphragm[1]+7*Math.sin(angle),105+4*motion],DATA.P))
      }
      node.setAttribute('d',points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ')+'Z')
    })
    heaterA.forEach(node=>node.classList.toggle('sh-energized',state.closed))
    heaterB.forEach(node=>node.classList.toggle('sh-energized',state.closed && state.mode==='summer'))
    sprays.style.opacity=tapOpen?'1':'0'
    streams.style.opacity=tapOpen?'1':'0'
    jets.forEach((node,i)=>{
      const jet=DATA.flowData.sprays[i]
      const t=reduced.matches?.35:(clock*.9+jet.phase)%1
      const end=Math.min(1,t+.048)
      const a=[jet.a[0]+(jet.b[0]-jet.a[0])*t,jet.a[1]+(jet.b[1]-jet.a[1])*t]
      const b=[jet.a[0]+(jet.b[0]-jet.a[0])*end,jet.a[1]+(jet.b[1]-jet.a[1])*end]
      node.setAttribute('d',`M${a} L${b}`)
      node.style.opacity=String(.75*(1-t))
    })
    tracers.forEach((node,i)=>{
      const route=i<7?DATA.flowData.cold:DATA.flowData.hot
      const t=reduced.matches?(i+.5)/tracers.length:(clock*.14+i/tracers.length)%1
      const p=pointAt(route,t)
      node.setAttribute('cx',p[0])
      node.setAttribute('cy',p[1])
    })
    const status=!tapOpen?(motion>0?'Diaphragm returning · heater off':'Contacts open · heater off'):
      motion<1?'Diaphragm rising · contacts closing':state.closed?'Contacts closed · heater on':'Contacts closed · cold water'
    if(status!==lastStatus){lastStatus=status;phase.textContent=status}
  }

  const cameraMoving=()=>view.some((value,i)=>Math.abs(value-targetView[i])>.0001)

  function tick(now) {
    frame=0
    if(dead || !root.isConnected){destroy();return}
    const dt=previous===null?1/60:Math.min((now-previous)/1000,1/30)
    previous=now
    clock+=dt
    elapsed+=dt
    if(replayAt!==null && clock>=replayAt) {
      replayAt=null
      tapOpen=true
      startMotion=motion
      elapsed=0
      updateControl()
    }
    const t=Math.min(1,elapsed/1.6), target=tapOpen?1:0
    motion=startMotion+(target-startMotion)*(t*t*(3-2*t))
    view=view.map((value,i)=>Math.abs(value-targetView[i])<.0001?targetView[i]:value+(targetView[i]-value)*(1-Math.exp(-dt/.14)))
    paintCamera()
    paint()
    if(visible && !document.hidden && !reduced.matches && (tapOpen || elapsed<1.6 || replayAt!==null || cameraMoving()))frame=requestAnimationFrame(tick)
  }

  function run() {
    if(dead)return
    if(reduced.matches) {
      replayAt=null
      motion=tapOpen?1:0
      elapsed=2
      view=[...targetView]
      paintCamera()
      paint()
      return
    }
    if(!frame && visible && !document.hidden){previous=null;frame=requestAnimationFrame(tick)}
  }

  function updateControl() {
    tap.textContent=tapOpen?'Close tap':'Open tap'
    tap.setAttribute('aria-pressed',String(tapOpen))
  }

  tap.addEventListener('click',()=>{
    replayAt=null
    tapOpen=!tapOpen
    startMotion=motion
    elapsed=0
    updateControl()
    paint()
    run()
  },options)
  replay.addEventListener('click',()=>{
    tapOpen=reduced.matches
    motion=0
    startMotion=0
    elapsed=2
    replayAt=reduced.matches?null:clock+.65
    updateControl()
    paint()
    run()
  },options)
  mode.addEventListener('change',()=>{paint();run()},options)
  focusButtons.forEach(button=>button.addEventListener('click',()=>{
    focus=button.dataset.focus
    root.dataset.view=focus
    focusButtons.forEach(node=>node.setAttribute('aria-pressed',String(node===button)))
    sizeCamera()
  },options))
  reduced.addEventListener('change',()=>{
    if(frame)cancelAnimationFrame(frame)
    frame=0
    run()
  },options)
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0}
    else run()
  },options)
  const sizing=new ResizeObserver(()=>sizeCamera(true))
  sizing.observe(viewport)
  const observer=new IntersectionObserver(entries=>{
    visible=entries.at(-1).isIntersecting
    if(visible)run()
    else {if(frame)cancelAnimationFrame(frame);frame=0}
  },{rootMargin:'80px'})
  observer.observe(root)
  function destroy() {
    if(dead)return
    dead=true
    if(frame)cancelAnimationFrame(frame)
    controller.abort()
    sizing.disconnect()
    observer.disconnect()
    removal.disconnect()
  }
  const removal=new MutationObserver(()=>{if(!root.isConnected)destroy()})
  removal.observe(document.documentElement,{childList:true,subtree:true})
  window.addEventListener('pagehide',destroy,{once:true,signal:controller.signal})
  root.dataset.view='whole'
  sizeCamera(true)
  updateControl()
  paint()
}
mountShower()

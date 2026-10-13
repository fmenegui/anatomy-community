// Orthographic projection from Anatomy, Copyright (c) 2026 Ryan, MIT.
import {cross,sub,dot,norm,mean} from './scene.mjs'
import {makeBsp} from './bsp-fast.mjs'
export const CAMERA={azimuth:45,elevation:35.264389682754654}
export function project(p){
 const a=CAMERA.azimuth*Math.PI/180,e=CAMERA.elevation*Math.PI/180
 const sa=Math.sin(a),ca=Math.cos(a),se=Math.sin(e),ce=Math.cos(e)
 return [p[0]*sa-p[1]*ca,(p[0]*ca+p[1]*sa)*se-p[2]*ce,(p[0]*ca+p[1]*sa)*ce+p[2]*se]
}
export const view=norm([Math.cos(CAMERA.azimuth*Math.PI/180)*Math.cos(CAMERA.elevation*Math.PI/180),Math.sin(CAMERA.azimuth*Math.PI/180)*Math.cos(CAMERA.elevation*Math.PI/180),Math.sin(CAMERA.elevation*Math.PI/180)])
const area=ps=>ps.reduce((s,p,i)=>{const q=ps[(i+1)%ps.length];return s+p[0]*q[1]-q[0]*p[1]},0)/2
function intersection(subject,clip){
 let result=subject.map(p=>p.slice(0,2)),sign=Math.sign(area(clip))
 for(let i=0;i<clip.length&&result.length;i++){
  const a=clip[i],b=clip[(i+1)%clip.length],side=p=>sign*((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))
  const input=result;result=[]
  let p=input.at(-1),dp=side(p)
  for(const q of input){const dq=side(q),ip=dp>=-1e-8,iq=dq>=-1e-8
   if(ip!==iq){const t=dp/(dp-dq);result.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t])}
   if(iq)result.push(q)
   p=q;dp=dq
  }
 }
 return result
}
export function facesOf(scene){
 const list=[]
 for(const part of scene.parts){
  for(let i=0;i<part.faces.length;i++){
   const pts=part.faces[i],n=norm(cross(sub(pts[1],pts[0]),sub(pts[2],pts[0])))
   if(!Number.isFinite(n[0])||dot(n,view)<1e-6)continue
   const p=pts.map(project),N=cross(sub(p[1],p[0]),sub(p[2],p[0]))
   if(Math.abs(N[2])<1e-9)continue
   const ax=-N[0]/N[2],ay=-N[1]/N[2],az=p[0][2]-ax*p[0][0]-ay*p[0][1]
   const light=norm([-.35,-.3,.89]),lum=dot(n,light),shade=Math.max(0,Math.min(3,Math.floor((lum+1)*2)))
   list.push({id:part.id+'_'+i,part:part.part,tone:part.tone,shade,p,ax,ay,az,n,depth:mean(p)[2],minX:Math.min(...p.map(x=>x[0])),maxX:Math.max(...p.map(x=>x[0])),minY:Math.min(...p.map(x=>x[1])),maxY:Math.max(...p.map(x=>x[1]))})
  }
 }
 return list
}
export function orderFaces(faces,{exact=true}={}){
 const sorted=faces.map((f,i)=>({...f,idx:i,edges:[],degree:0})).sort((a,b)=>a.depth-b.depth)
 if(!exact)return {faces:sorted,intersections:[],cycles:0,comparisons:0}
 const grid=new Map(),pairs=new Set(),conflicts=[],cell=12
 let comparisons=0
 for(const f of sorted){
  for(let x=Math.floor(f.minX/cell);x<=Math.floor(f.maxX/cell);x++)for(let y=Math.floor(f.minY/cell);y<=Math.floor(f.maxY/cell);y++){
   const key=x+','+y,list=grid.get(key)||[]
   for(const g of list){
    const pair=f.idx<g.idx?f.idx+','+g.idx:g.idx+','+f.idx
    if(pairs.has(pair))continue;pairs.add(pair)
    if(f.maxX<g.minX||g.maxX<f.minX||f.maxY<g.minY||g.maxY<f.minY)continue
    const overlap=f.p.length>=g.p.length?intersection(f.p,g.p):intersection(g.p,f.p)
    if(overlap.length<3||Math.abs(area(overlap))<1e-5)continue
    comparisons++
    const diffs=overlap.map(p=>(f.ax-g.ax)*p[0]+(f.ay-g.ay)*p[1]+f.az-g.az),mn=Math.min(...diffs),mx=Math.max(...diffs)
    if(mn<-.025&&mx>.025&&f.part!==g.part)conflicts.push({a:f.id,b:g.id,min:mn,max:mx})
    const d=diffs.reduce((a,b)=>a+b,0)/diffs.length
    if(Math.abs(d)<1e-6)continue
    const back=d<0?f:g,front=d<0?g:f
    back.edges.push(front);front.degree++
   }
   list.push(f);grid.set(key,list)
  }
 }
 const queue=sorted.filter(x=>x.degree===0),out=[],seen=new Set()
 while(queue.length){const f=queue.shift();out.push(f);seen.add(f.idx);for(const g of f.edges){g.degree--;if(!g.degree)queue.push(g)}}
 const left=sorted.filter(f=>!seen.has(f.idx));out.push(...left)
 return {faces:out,intersections:conflicts,cycles:left.length,comparisons}
}
export function sceneSvg(scene,{width=570,height=700,theme='light',exact=true,selected='',labels=false,flows=false}={}){
 const all=facesOf(scene),ord=exact?makeBsp()(all):orderFaces(all,{exact:false})
 const bounds={xmin:-127,xmax:127,ymin:-395,ymax:70},scale=Math.min((width-24)/(bounds.xmax-bounds.xmin),(height-24)/(bounds.ymax-bounds.ymin))
 const ox=width/2-(bounds.xmin+bounds.xmax)*scale/2,oy=height/2-(bounds.ymin+bounds.ymax)*scale/2
 const colors=theme==='light'?{lo:['#727b80','#879195','#a2acaf','#bcc5c8'],mid:['#8b969b','#a4afb3','#c4cdd0','#e0e5e6'],hi:['#a4afb5','#bdc8ce','#dce4e8','#f0f4f5']}:{lo:['#293339','#35434b','#45545c','#607077'],mid:['#3c4a53','#53636d','#71838d','#99a9b1'],hi:['#637782','#8297a3','#afc0c9','#d4dfe4']}
 const paths=ord.faces.map(f=>`<path data-face="${f.id}" data-piece="${f.part}" fill="${colors[f.tone][f.shade]}" stroke="${colors[f.tone][f.shade]}" stroke-width="0.30" d="${f.p.map((p,i)=>(i?'L':'M')+(ox+p[0]*scale).toFixed(2)+' '+(oy+p[1]*scale).toFixed(2)).join('')}Z"/>`).join('')
 return {svg:`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${paths}</svg>`,order:ord,transform:{scale,ox,oy},paths,colors}
}

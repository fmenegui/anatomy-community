import {C,DEG,mechanics,rotateXZ,BELT,beltAt} from './model.mjs'
import {makeScene,springFaces,mean,sub,dot,cross} from './scene.mjs'
export function sceneFactory(eps=10,shell=true){
 const rest=makeScene(0,eps,{shell}),cache=rest.parts
 const turn=(p,a,z)=>{const q=rotateXZ([p[0],p[2]-z],a);return [q[0],p[1],q[1]+z]}
 return theta=>{
  const a=theta*DEG,M=mechanics(theta,eps),shift=M.pin[2]-rest.M.pin[2]
  const pieces=cache.map(part=>{
   let T=null
   const id=part.id
   if(part.part==='crank'||part.part==='flywheel'||id.startsWith('lower-pulley')||id.startsWith('lower-tooth'))T=p=>turn(p,a,90)
   else if(id.startsWith('rod-'))T=p=>{const q=rotateXZ([p[0],p[2]-133],-M.beta);return [q[0]+M.crank[0],p[1],q[1]+M.crank[2]]}
   else if(part.part==='piston'||part.part==='pin'||part.part==='rings')T=p=>[p[0],p[1],p[2]+shift]
   else if(part.part==='cam'||id.startsWith('upper-pulley')||id.startsWith('upper-tooth'))T=p=>turn(p,a/2,424)
   else if(id.startsWith('intake-')||id.startsWith('exhaust-')){
    const L=id.startsWith('intake-')?M.intake.h:M.exhaust.h
    if(/-(disc|stem|collet|retainer|bucket-top|bucket-skirt)$/.test(id))T=p=>[p[0],p[1],p[2]-L]
    if(id.endsWith('-coil'))return {...part,faces:springFaces(id.startsWith('intake-')?-18:18,L)}
   }
   if(id.startsWith('belt-tooth')){
    const j=Number(id.slice(10)),p=beltAt(j*BELT.p+BELT.r*a),w=BELT.p*.40/2
    const poly=[[-w,-.85],[w,-.85],[w,.4],[-w,.4]].map(([t,d])=>[p.x+p.tx*t-p.tz*d,p.z+p.tz*t+p.tx*d])
    const A=poly.map(q=>[q[0],65,q[1]]),B=poly.map(q=>[q[0],72,q[1]])
    const fs=[A.slice().reverse(),B,...A.map((v,i)=>[v,A[(i+1)%4],B[(i+1)%4],B[i]])],cen=mean([...A,...B])
    for(const f of fs)if(dot(cross(sub(f[1],f[0]),sub(f[2],f[0])),sub(mean(f),cen))<0)f.reverse()
    return {...part,faces:fs}
   }
   return T?{...part,faces:part.faces.map(f=>f.map(T))}:part
  })
  return {parts:pieces,M}
 }
}

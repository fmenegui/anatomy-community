// All lengths in mm unless SI is explicit. No fitted commercial-engine data.
export const DEG=Math.PI/180
export const TAU=2*Math.PI
export const C=Object.freeze({B:86,r:43,l:143,zCrank:90,deck:314,camZ:424,camBase:36,lift:2.2,cv:717.5,R:287,gamma:1.4,p1:100000,T1:300,teethCrank:20,teethCam:40,teethBelt:164})
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x))
export const mod=(x,n)=>((x%n)+n)%n
export function geometry(eps=10){
 const A=Math.PI*C.B*C.B/4, S=2*C.r,Vd=A*S,Vc=Vd/(eps-1)
 return {A,S,Vd,Vc,Vmax:Vc+Vd,hc:Vc/A,crownOffset:C.deck-Vc/A-C.zCrank-C.r-C.l}
}
export function lift(theta,start=0){
 const u=mod(theta-start,720)
 if(u<=0||u>=180) return {h:0,d:0,dd:0}
 const a=u*DEG,s=Math.sin(a),c=Math.cos(a),H=C.lift
 return {h:H*s**4,d:8*H*s**3*c,dd:16*H*(3*s*s*c*c-s**4)}
}
export function mechanics(theta,eps=10){
 const a=theta*DEG,ca=Math.cos(a),sa=Math.sin(a),g=geometry(eps)
 const x=C.r*(1-ca)+C.l-Math.sqrt(C.l*C.l-C.r*C.r*sa*sa)
 const pin=[0,0,C.zCrank+C.r+C.l-x]
 const crank=[C.r*sa,0,C.zCrank+C.r*ca]
 return {theta,x,V:g.Vc+g.A*x,pin,crank,crown:pin[2]+g.crownOffset,beta:Math.atan2(crank[0],pin[2]-crank[2]),camAngle:a/2,intake:lift(theta),exhaust:lift(theta,540),g}
}
export function camPoint(alpha,start=0){
 const q=lift(alpha/DEG*2,start),h=C.camBase+q.h,c=Math.cos(alpha),s=Math.sin(alpha)
 // Inverse rotation of the contact [h', -h] in the x-z plane.
 return [c*q.d+s*h,s*q.d-c*h]
}
export function camProfile(start=0,n=720){return Array.from({length:n},(_,i)=>camPoint(i*TAU/n,start))}
export function rotateXZ(p,a){return [p[0]*Math.cos(a)+p[1]*Math.sin(a),-p[0]*Math.sin(a)+p[1]*Math.cos(a)]}
export function cycle(eps=10,qin=800000){
 const g=geometry(eps),V1=g.Vmax*1e-9,V2=g.Vc*1e-9,m=C.p1*V1/(C.R*C.T1),k=eps**(C.gamma-1)
 const T1=C.T1,T2=T1*k,T3=T2+qin/C.cv,T4=T3/k,p1=C.p1,p2=p1*eps**C.gamma,p3=p2*T3/T2,p4=p3/eps**C.gamma
 const entropy=(T,V)=>C.cv*Math.log(T/T1)+C.R*Math.log(V/V1)
 const states=[[V1,p1,T1],[V2,p2,T2],[V2,p3,T3],[V1,p4,T4]].map(([V,p,T],i)=>({id:i+1,V,p,T,s:entropy(T,V)}))
 const qout=C.cv*(T4-T1),wnet=qin-qout,eta=1-1/k
 return {eps,qin,qout,wnet,eta,m,states,Qin:m*qin,Qout:m*qout,Wnet:m*wnet,entropy,g}
}
export function thermoAt(c,proc,u){
 u=clamp(u,0,1)
 const [a,b,d,e]=c.states
 let V,T
 if(proc===0){V=a.V+(b.V-a.V)*u;T=a.T*(a.V/V)**(C.gamma-1)}
 if(proc===1){V=b.V;T=b.T+(d.T-b.T)*u}
 if(proc===2){V=d.V+(e.V-d.V)*u;T=d.T*(d.V/V)**(C.gamma-1)}
 if(proc===3){V=e.V;T=e.T+(a.T-e.T)*u}
 return {V,T,p:c.m*C.R*T/V,s:c.entropy(T,V),proc,u}
}
export function inverseX(x){
 let lo=0,hi=180
 for(let i=0;i<48;i++){const mid=(lo+hi)/2;if(mechanics(mid).x<x)lo=mid;else hi=mid}
 return (lo+hi)/2
}
export function atProcess(c,proc,u){
 const t=thermoAt(c,proc,u),x=(t.V*1e9-c.g.Vc)/c.g.A
 const theta=proc===0?360-inverseX(x):proc===1?360:proc===2?360+inverseX(x):540
 return {theta,t,proc,u}
}
// Presentation coordinate: one 720° cycle plus two 72-unit pedagogical holds.
export function atTimeline(tau,c,holds=true){
 const H=holds?72:0,period=720+2*H,q=mod(tau,period)
 if(q<180) return {theta:q,t:null,stroke:0,hold:false}
 if(q<360){const M=mechanics(q,c.eps),u=(c.states[0].V-M.V*1e-9)/(c.states[0].V-c.states[1].V);return {theta:q,t:thermoAt(c,0,u),stroke:1,hold:false}}
 if(H&&q<360+H) return {theta:360,t:thermoAt(c,1,(q-360)/H),stroke:1,hold:true}
 if(q<540+H){const theta=q-H,M=mechanics(theta,c.eps),u=(M.V*1e-9-c.states[2].V)/(c.states[3].V-c.states[2].V);return {theta,t:thermoAt(c,2,u),stroke:2,hold:false}}
 if(H&&q<540+2*H)return {theta:540,t:thermoAt(c,3,(q-540-H)/H),stroke:2,hold:true}
 return {theta:q-2*H,t:null,stroke:3,hold:false}
}
export function timelineAtAngle(theta,holds=true){const H=holds?72:0;return theta+(theta>=360?H:0)+(theta>=540?H:0)}
export function beltGeometry(){
 const D=C.camZ-C.zCrank,N=C.teethBelt
 const length=p=>{const r=p*C.teethCrank/TAU,R=2*r,a=Math.asin((R-r)/D);return 2*Math.sqrt(D*D-(R-r)**2)+Math.PI*(R+r)+2*(R-r)*a}
 let lo=4,hi=6
 for(let i=0;i<70;i++){const p=(lo+hi)/2;if(length(p)>p*N)lo=p;else hi=p}
 const p=(lo+hi)/2,r=p*C.teethCrank/TAU,R=2*r,a=Math.asin((R-r)/D),line=Math.sqrt(D*D-(R-r)**2),small=r*(Math.PI-2*a),big=R*(Math.PI+2*a),L=2*line+small+big,beta=Math.PI/2+a
 return {p,r,R,a,line,small,big,L,beta,D}
}
export const BELT=beltGeometry()
export function beltAt(s){
 const b=BELT,t=mod(s,b.L),a=b.a,beta=b.beta
 if(t<b.line){const f=t/b.line;return {x:(b.R+(b.r-b.R)*f)*Math.cos(a),z:C.camZ-b.R*Math.sin(a)-b.line*Math.cos(a)*f,tx:-Math.sin(a),tz:-Math.cos(a)}}
 if(t<b.line+b.small){const q=beta+(t-b.line)/b.r;return{x:b.r*Math.sin(q),z:C.zCrank+b.r*Math.cos(q),tx:Math.cos(q),tz:-Math.sin(q)}}
 if(t<2*b.line+b.small){const f=(t-b.line-b.small)/b.line;return {x:-(b.r+(b.R-b.r)*f)*Math.cos(a),z:C.zCrank-b.r*Math.sin(a)+b.line*Math.cos(a)*f,tx:-Math.sin(a),tz:Math.cos(a)}}
 const q=3*Math.PI/2-a+(t-2*b.line-b.small)/b.R
 return{x:b.R*Math.sin(q),z:C.camZ+b.R*Math.cos(q),tx:Math.cos(q),tz:-Math.sin(q)}
}

import {C,DEG,TAU,mechanics,camProfile,rotateXZ,BELT,beltAt} from './model.mjs'
export const add=(a,b)=>a.map((x,i)=>x+b[i])
export const sub=(a,b)=>a.map((x,i)=>x-b[i])
export const mul=(a,s)=>a.map(x=>x*s)
export const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0)
export const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
export const norm=a=>mul(a,1/Math.hypot(...a))
export const mean=ps=>mul(ps.reduce((a,p)=>add(a,p),[0,0,0]),1/ps.length)
export const camInt=camProfile(0,360),camExh=camProfile(540,360)
export const PARTS={
 block:['Bloco e camisa','A camisa de 86 mm guia o pistão. O corte remove material apenas da representação. Folga radial pistão/camisa: 0,15 mm.'],
 head:['Cabeçote e câmara','Plano da câmara em z = 314 mm. O volume de folga é cilíndrico. Ao mudar ε, varia a altura da coroa do pistão, preservando os centros da distribuição. Galerias internas omitidas no corte.'],
 case:['Cárter','Estrutura fixa que apoia os mancais principais. Seção frontal removida para expor o conjunto.'],
 piston:['Pistão','Translação exata da biela-manivela. Coroa plana com altura ajustável entre cenários de ε. Não há balanço lateral nem dilatação.'],
 rings:['Anéis','Dois anéis de compressão e um de óleo, fixos ao pistão neste modelo. As faixas se alojam em canais, sem movimento radial simulado.'],
 pin:['Pino do pistão','Liga o pé da biela aos dois bosses do pistão. A rotação própria do pino não é modelada.'],
 rod:['Biela, pé e cabeça','Distância entre centros de 143 mm. A orientação vem dos centros dos pinos. Cabeça bipartida com bronzinas e parafusos.'],
 crank:['Virabrequim','Raio de manivela de 43 mm, curso de 86 mm. O moente excêntrico liga os dois braços. Os munhões coaxiais apoiam-se nos mancais.'],
 bearing:['Mancais','Mancais lisos e bronzinas concêntricos. Não são rolamentos. Não há esferas nem rotação independente inventada.'],
 flywheel:['Volante','Solidário ao virabrequim. Em um motor real armazena energia cinética. Aqui a rotação é imposta, sem integração de inércia ou torque.'],
 intake:['Válvula de admissão','Abre somente entre 0° e 180°. Levantamento máximo de 2,2 mm, reduzido para permitir o evento curto idealizado com tucho plano.'],
 exhaust:['Válvula de escape','Abre somente entre 540° e 720°. Não há avanço, atraso ou cruzamento. A rejeição isocórica não é o escoamento de escape.'],
 spring:['Molas e pratos','Molas helicoidais com comprimento dependente da válvula, entre sede fixa e prato móvel. Contato mantido quase estaticamente, sem dinâmica de válvulas.'],
 guide:['Guias e sedes','Guias coaxiais mantêm as hastes alinhadas. Faces inferiores das válvulas fechadas coincidem com o teto plano da câmara.'],
 bucket:['Tuchos de face plana','Acionamento direto, sem balancins. O ressalto toca a face superior, a face interna toca a haste. Copos guiados e com folga radial.'],
 cam:['Comando e ressaltos','Comando a θ/2. Perfis obtidos pela envoltória do tucho plano. Raio base 36 mm. A curvatura mínima analítica é 3 mm, evitando recorte do perfil.'],
 timing:['Correia e polias 20:40','A velocidade linear vem do raio primitivo × ângulo do virabrequim. Correia inextensível de 164 dentes. Dentes simplificados, sem modelo de flexão ou contato elástico.'],
 plug:['Vela','Ignição ideal no PMS a 360°. O sinal luminoso representa a ignição, sem química, plasma ou frente de chama calculada.'],
 ports:['Dutos','Trechos externos seccionados, galerias internas omitidas. Setas mostram apenas o sentido do escoamento. Vazão, perdas de carga, mistura e dinâmica dos fluidos não são calculadas.'],
 stand:['Base e fixadores','Suportes estáticos da bancada didática. Não há vibração ou resposta estrutural simulada.']
}
export function springFaces(y,L){
 const rad=8.2,wire=.65,N=108,turns=6,start=C.deck+36+wire,end=C.deck+64-L-wire,faces=[]
 const rings=Array.from({length:N+1},(_,i)=>{
  const t=i/N,a=t*turns*TAU,c=Math.cos(a),s=Math.sin(a),p=[rad*c,y+rad*s,start+(end-start)*t]
  const d=norm([-rad*turns*TAU*s,rad*turns*TAU*c,end-start]),u=[c,s,0],v=cross(d,u)
  return Array.from({length:6},(_,j)=>add(p,add(mul(u,wire*Math.cos(j*TAU/6)),mul(v,wire*Math.sin(j*TAU/6)))))
 })
 for(let i=0;i<N;i++)for(let j=0;j<6;j++)faces.push([rings[i][j],rings[i][(j+1)%6],rings[i+1][(j+1)%6],rings[i+1][j]])
 return faces
}
export function makeScene(theta=65,eps=10,opts={}){
 const M=mechanics(theta,eps),out=[],a=theta*DEG
 const push=(id,part,faces,tone='mid')=>{out.push({id,part,faces,tone});return out.at(-1)}
 function prism(id,part,poly,from,to,axis='z',tone='mid',transform=p=>p){
  const point=(q,s)=>axis==='z'?[q[0],q[1],s]:axis==='y'?[q[0],s,q[1]]:[s,q[0],q[1]]
  const A=poly.map(q=>transform(point(q,from))),B=poly.map(q=>transform(point(q,to))),cen=mean([...A,...B])
  const faces=[A.slice().reverse(),B,...A.map((p,i)=>[p,A[(i+1)%A.length],B[(i+1)%A.length],B[i]])]
  for(const f of faces){if(dot(cross(sub(f[1],f[0]),sub(f[2],f[0])),sub(mean(f),cen))<0)f.reverse()}
  return push(id,part,faces,tone)
 }
 function box(id,part,x,y,z,w,d,h,tone='mid',transform=p=>p){return prism(id,part,[[x,y],[x+w,y],[x+w,y+d],[x,y+d]],z,z+h,'z',tone,transform)}
 function cylinder(id,part,c,r,length,axis='z',tone='mid',n=32,transform=p=>p){
  const poly=Array.from({length:n},(_,i)=>{const t=TAU*i/n;return axis==='z'?[c[0]+r*Math.cos(t),c[1]+r*Math.sin(t)]:axis==='y'?[c[0]+r*Math.cos(t),c[2]+r*Math.sin(t)]:[c[1]+r*Math.cos(t),c[2]+r*Math.sin(t)]})
  const s=c[axis==='z'?2:axis==='y'?1:0];return prism(id,part,poly,s,s+length,axis,tone,transform)
 }
 function annulus(id,part,c,ri,ro,length,axis='z',tone='mid',start=0,end=TAU,n=48,transform=p=>p){
  const point=(r,t,s)=>transform(axis==='z'?[c[0]+r*Math.cos(t),c[1]+r*Math.sin(t),c[2]+s]:axis==='y'?[c[0]+r*Math.cos(t),c[1]+s,c[2]+r*Math.sin(t)]:[c[0]+s,c[1]+r*Math.cos(t),c[2]+r*Math.sin(t)])
  const faces=[]
  for(let i=0;i<n;i++){
   const t=start+(end-start)*i/n,u=start+(end-start)*(i+1)/n
   const cell=[point(ri,t,0),point(ro,t,0),point(ro,u,0),point(ri,u,0)],upper=[point(ri,t,length),point(ro,t,length),point(ro,u,length),point(ri,u,length)],cen=mean([...cell,...upper])
   const fs=[cell.slice().reverse(),upper,[cell[1],cell[2],upper[2],upper[1]],[cell[3],cell[0],upper[0],upper[3]]]
   if(i===0&&end-start<TAU-.001)fs.push([cell[0],cell[1],upper[1],upper[0]])
   if(i===n-1&&end-start<TAU-.001)fs.push([cell[2],cell[3],upper[3],upper[2]])
   for(const f of fs){if(dot(cross(sub(f[1],f[0]),sub(f[2],f[0])),sub(mean(f),cen))<0)f.reverse();faces.push(f)}
  }
  return push(id,part,faces,tone)
 }
 const bolt=(id,part,x,y,z,r=2,h=3)=>{cylinder(id,part,[x,y,z],r,h,'z','hi',6);cylinder(id+'-socket',part,[x,y,z+h],r*.35,.06,'z','lo',6)}
 const ry=(origin,ang)=>p=>{const q=rotateXZ([p[0]-origin[0],p[2]-origin[2]],ang);return[q[0]+origin[0],p[1],q[1]+origin[2]]}
 const crankT=ry([0,0,C.zCrank],a)
 // Bench, feet and mounts.
 box('base','stand',-78,-94,8,156,190,9,'lo')
 for(const x of [-63,63])for(const y of [-78,78]){cylinder(`foot${x}${y}`,'stand',[x,y,0],9,8,'z','lo');bolt(`basebolt${x}${y}`,'stand',x,y,17,2.2,2)}
 box('case-floor','case',-68,-52,25,136,104,7,'mid')
 for(const y of [-44,44]){box('mount'+y,'stand',-48,y-6,17,96,12,8,'lo');for(const x of [-30,30])bolt('mountbolt'+x+y,'stand',x,y,32,3,4)}
 // Open crankcase, back wall and stiffening ribs.
 if(opts.shell!==false){
 box('case-back','case',-68,-52,32,7,104,150,'lo')
 for(const y of [-51,44])box('case-edge'+y,'case',-61,y,32,24,7,150,'mid')
 for(const z of [40,75,110,145,177])box('case-rib'+z,'case',-72,-52,z,4,104,3,'mid')
 // Half barrel and jacket. Cut plane x=0.
 annulus('liner','block',[0,0,181],43,46,133,'z','hi',Math.PI/2,3*Math.PI/2,40)
 annulus('jacket','block',[0,0,185],46,53,129,'z','mid',Math.PI/2,3*Math.PI/2,36)
 for(const z of [188,210,232,254,276,298])annulus('jacket-rib'+z,'block',[0,0,z],53,56,3,'z','mid',Math.PI/2,3*Math.PI/2,32)
 box('head-back','head',-54,-48,314,9,96,28,'mid')
 for(const y of [-49,42])box('head-edge'+y,'head',-45,y,314,44,7,28,'mid')
 for(const z of [317,325,334])box('head-fin'+z,'head',-58,-49,z,4,98,3,'lo')
 }
 // Head support stays present when the cut shell is hidden.
 for(const y of [-42,42]){
  box('head-tower'+y,'head',-44,y-5,320,12,10,104,'mid')
  box('cam-foot'+y,'head',-40,y-5,408,51,10,5,'mid')
  annulus('cam-bearing'+y,'bearing',[0,y-5,C.camZ],7.05,11,10,'y','mid',0,TAU,28)
  bolt('cam-bolt'+y,'head',-37,y,424,2.5,3)
 }
 // Main bearing pedestals and proper annular journals.
 for(const y of [-45,35]){
  box('bearing-foot'+y,'case',-23,y,32,46,10,37,'mid')
  box('bearing-sideL'+y,'bearing',-23,y,69,7,10,21,'mid')
  box('bearing-sideR'+y,'bearing',16,y,69,7,10,21,'mid')
  annulus('main-bearing'+y,'bearing',[0,y,90],10.08,16,10,'y','hi',0,TAU,36)
  box('bearing-capL'+y,'bearing',-23,y,90,7,10,7,'mid')
  box('bearing-capR'+y,'bearing',16,y,90,7,10,7,'mid')
  for(const x of [-19.5,19.5])bolt('bearing-bolt'+x+y,'bearing',x,y+5,97,2.1,3)
 }
 // Journals stop at webs, leaving the crankcase centre free.
 cylinder('journal-back','crank',[0,-83,90],10,59,'y','hi',40,crankT)
 cylinder('journal-front','crank',[0,24,90],10,55,'y','hi',40,crankT)
 // Webs with counterweight extension in the opposite direction.
 for(const y of [-24,14]){
  const web=[[-13,90+48],[13,90+48],[17,90-4],[34,90-30],[27,90-48],[-27,90-48],[-34,90-30],[-17,90-4]]
  prism('web'+y,'crank',web,y,y+10,'y','mid',crankT)
 }
 cylinder('crankpin','crank',[0,-14,90+43],10,28,'y','hi',40,crankT)
 // Flywheel: hub, web, rim, six real holes formed by the spaces between spokes.
 annulus('fly-rim','flywheel',[0,-76,90],51,61,12,'y','mid',0,TAU,64,crankT)
 annulus('fly-hub','flywheel',[0,-78,90],10.1,16,16,'y','hi',0,TAU,40,crankT)
 for(let j=0;j<6;j++){
  const q=j*TAU/6,poly=[[16,-4],[50.7,-5],[50.7,5],[16,4]].map(([r,t])=>[r*Math.sin(q)+t*Math.cos(q),90+r*Math.cos(q)-t*Math.sin(q)])
  prism('fly-spoke'+j,'flywheel',poly,-73,-67,'y','mid',crankT)
 }
 // Biela placed by its real pin coordinates. Local z follows the line from crankpin to small pin.
 const cb=Math.cos(M.beta),sb=Math.sin(M.beta)
 const rodT=p=>[M.crank[0]+p[0]*cb-p[2]*sb,p[1],M.crank[2]+p[0]*sb+p[2]*cb]
 // Bearing halves allow exact bore, no pin drawn through a solid disc.
 annulus('rod-big-upper','rod',[0,-8,0],11,16,16,'y','hi',0,Math.PI,36,rodT)
 annulus('rod-cap','rod',[0,-8,0],11,16,16,'y','mid',Math.PI,TAU,36,rodT)
 annulus('rod-bronze-big','bearing',[0,-8,0],10.08,10.96,16,'y','lo',0,TAU,48,rodT)
 annulus('rod-small','rod',[0,-7,C.l],8,12,14,'y','hi',0,TAU,40,rodT)
 annulus('rod-bronze-small','bearing',[0,-7,C.l],7.04,8,14,'y','lo',0,TAU,40,rodT)
 const beam=[[-5.7,15],[-4,131],[4,131],[5.7,15]]
 prism('rod-web','rod',beam,-2.0,2.0,'y','mid',rodT)
 for(const y of [-5.5,3.5])prism('rod-flange'+y,'rod',beam,y,y+2,'y','hi',rodT)
 for(const x of [-12.7,12.7]){
  box('rod-bolt-body'+x,'rod',x-1.4,-6,-9,2.8,12,16,'mid',rodT)
  cylinder('rod-bolt-head'+x,'rod',[x,0,7],2.2,2,'z','hi',6,rodT)
 }
 // Piston sections with ring grooves and an open underside.
 const pz=M.pin[2],cz=M.crown,outer=42.85,inner=36.5
 // Remove front quadrant only, retaining visible far crown and two supporting bosses.
 const cutStart=Math.PI/2,cutEnd=TAU
 const grooves=[[cz-4,1.3],[cz-7.8,1.3],[cz-12,2.0]]
 let lower=pz-17
 for(const [g,h] of grooves.slice().reverse()){
  if(g>lower)annulus('piston-skirt'+g,'piston',[0,0,lower],inner,outer,g-lower,'z','hi',cutStart,cutEnd,56)
  annulus('piston-groove'+g,'piston',[0,0,g],inner,41.9,h,'z','mid',cutStart,cutEnd,56)
  annulus('ring'+g,'rings',[0,0,g+.12],41.95,42.94,h-.24,'z','lo',cutStart,cutEnd,56)
  lower=g+h
 }
 annulus('piston-upper','piston',[0,0,lower],inner,outer,cz-lower,'z','hi',cutStart,cutEnd,56)
 // Crown is a sector, exact outer size. Bottom lies below last ring, and cylinder walls share edges.
 const crownPoly=[[0,0],...Array.from({length:73},(_,i)=>[inner*Math.cos(cutStart+(cutEnd-cutStart)*i/72),inner*Math.sin(cutStart+(cutEnd-cutStart)*i/72)])]
 prism('piston-crown','piston',crownPoly,cz-2.5,cz,'z','hi')
 for(const y of [-34,8.5]){
  annulus('piston-boss'+y,'piston',[0,y,pz],7.15,13,25.5,'y','hi',0,TAU,36)
 }
 // Ruled saddles join the pin bosses to the curved inner piston wall.
 for(const sign of [-1,1]){
  const faces=[],N=40
  const endY=x=>{
   const candidates=[]
   for(let i=0;i<56;i++){
    const a=cutStart+(cutEnd-cutStart)*i/56,b=cutStart+(cutEnd-cutStart)*(i+1)/56
    const x1=inner*Math.cos(a),x2=inner*Math.cos(b),y1=inner*Math.sin(a),y2=inner*Math.sin(b)
    if(x>=Math.min(x1,x2)-1e-9&&x<=Math.max(x1,x2)+1e-9&&Math.abs(x2-x1)>1e-9){const yy=y1+(x-x1)*(y2-y1)/(x2-x1);if(yy*sign>0)candidates.push(yy)}
   }
   return candidates.length?(sign<0?Math.min(...candidates):Math.max(...candidates)):sign*Math.sqrt(inner*inner-x*x)
  }
  const point=(r,t,end)=>{const x=r*Math.cos(t);return[x,end?endY(x):sign*34,pz+r*Math.sin(t)]}
  for(let i=0;i<N;i++){
   const a=i*TAU/N,b=(i+1)*TAU/N,A=[point(7.15,a,false),point(13,a,false),point(13,b,false),point(7.15,b,false)],B=[point(7.15,a,true),point(13,a,true),point(13,b,true),point(7.15,b,true)],cen=mean([...A,...B])
   for(const f of [A.slice().reverse(),B,[A[1],A[2],B[2],B[1]],[A[3],A[0],B[0],B[3]]]){
    if(dot(cross(sub(f[1],f[0]),sub(f[2],f[0])),sub(mean(f),cen))<0)f.reverse()
    faces.push([f[0],f[1],f[2]],[f[0],f[2],f[3]])
   }
  }
  push('piston-saddle'+sign,'piston',faces,'hi')
 }
 cylinder('piston-pin','pin',[0,-34,pz],7,68,'y','hi',40)
 // Valve gear, paired along the single overhead camshaft.
 cylinder('camshaft','cam',[0,-48,C.camZ],7,128,'y','hi',40,ry([0,0,C.camZ],a/2))
 for(const [kind,y,L,profile] of [['intake',-18,M.intake.h,camInt],['exhaust',18,M.exhaust.h,camExh]]){
  const z=C.deck
  annulus(kind+'-seat','guide',[0,y,z+2],9,12.5,2.5,'z','mid',0,TAU,40)
  cylinder(kind+'-disc',kind,[0,y,z-L],10,2,'z','hi',48)
  cylinder(kind+'-stem',kind,[0,y,z+2-L],2.5,69,'z','hi',24)
  annulus(kind+'-guide','guide',[0,y,z+14],2.55,5.0,24,'z','mid',0,TAU,28)
  // Structure holds guide and the bottom spring seat.
  box(kind+'-guide-arm','head',-44,y-4,z+24,39,8,10,'mid')
  annulus(kind+'-spring-seat','spring',[0,y,z+35],5.05,10,1,'z','mid',0,TAU,32)
  annulus(kind+'-retainer','spring',[0,y,z+64-L],2.56,9.8,2,'z','hi',0,TAU,36)
  cylinder(kind+'-collet',kind,[0,y,z+66-L],3.4,2,'z','mid',20)
  push(kind+'-coil','spring',springFaces(y,L),'hi')
  annulus(kind+'-bucket-skirt','bucket',[0,y,z+60-L],10.5,11.5,11,'z','hi',0,TAU,36)
  cylinder(kind+'-bucket-top','bucket',[0,y,z+71-L],11.5,3,'z','hi',40)
  annulus(kind+'-bucket-guide','guide',[0,y,z+54],11.56,13.4,16,'z','mid',Math.PI/2,3*Math.PI/2,24)
  box(kind+'-bucket-arm','head',-44,y-4,z+57,30.6,8,8,'mid')
  prism(kind+'-lobe','cam',profile.map(q=>[q[0],C.camZ+q[1]]),y-5,y+5,'y','hi',ry([0,0,C.camZ],a/2))
 }
 // Spark plug safely offset from the cam sweep and the valve heads.
 cylinder('plug-shell','plug',[27,0,314],4.5,14,'z','mid',32)
 cylinder('plug-hex','plug',[27,0,328],6.5,5,'z','hi',6)
 cylinder('plug-ceramic','plug',[27,0,333],4.0,16,'z','hi',32)
 for(const z of [335,339,343])annulus('plug-rib'+z,'plug',[27,0,z],4,4.8,1.5,'z','hi',0,TAU,28)
 cylinder('plug-terminal','plug',[27,0,349],2.5,4,'z','mid',24)
 annulus('plug-pad','head',[27,0,314],4.55,8,7,'z','mid',0,TAU,32)
 box('plug-bridge','head',-45,-4,320,64,8,5,'mid')
 // Ports represented as cut annular conduits, fixed and deliberately schematic internally.
 for(const [kind,y] of [['intake',-18],['exhaust',18]]){
  annulus(kind+'-port','ports',[16,y,324],6,8,35,'x','mid',0,TAU,32)
  annulus(kind+'-flange','ports',[51,y,324],6,12,4,'x','hi',0,TAU,36)
 }
 // Belt plane outside both main bearings and head supports.
 for(const [name,z,r,n,rot,phase] of [['lower',90,BELT.r,20,a,BELT.beta-BELT.line/BELT.r+Math.PI/20],['upper',424,BELT.R,40,a/2,BELT.beta+Math.PI/40]]){
  const tr=ry([0,0,z],rot+phase)
  annulus(name+'-pulley-rim','timing',[0,65,z],r-5,r-1.1,7,'y','mid',0,TAU,48,tr)
  annulus(name+'-pulley-hub','timing',[0,64,z],name==='lower'?10.1:7.1,name==='lower'?r-1.1:11,10,'y','hi',0,TAU,40,tr)
  const count=name==='lower'?0:5
  for(let j=0;j<count;j++){
   const q=j*TAU/count,poly=[[11,-2.4],[r-5,-3],[r-5,3],[11,2.4]].map(([s,t])=>[s*Math.sin(q)+t*Math.cos(q),z+s*Math.cos(q)-t*Math.sin(q)])
   prism(name+'-pulley-spoke'+j,'timing',poly,67,70,'y','mid',tr)
  }
  for(let j=0;j<n;j++){
   const q=j*TAU/n,w=BELT.p*.42/2,poly=[[-w,r-1.1],[w,r-1.1],[w,r+.25],[-w,r+.25]].map(([t,s])=>[s*Math.sin(q)+t*Math.cos(q),z+s*Math.cos(q)-t*Math.sin(q)])
   prism(name+'-tooth'+j,'timing',poly,65,72,'y','mid',tr)
  }
  cylinder(name+'-pulley-lock','timing',[0,74,z],4,3,'y','hi',6,tr)
 }
 // Belt backing follows the exact external tangent route. Fine straight-faced teeth.
 const beltFaces=[],N=240
 for(let i=0;i<N;i++){
  const p=beltAt(BELT.L*i/N),q=beltAt(BELT.L*(i+1)/N)
  const point=(p,d,y)=>[p.x-p.tz*d,y,p.z+p.tx*d]
  const A=[point(p,.4,65),point(p,1.6,65),point(q,1.6,65),point(q,.4,65)],B=A.map(v=>[v[0],72,v[2]])
  beltFaces.push(A.slice().reverse(),B,[A[1],A[2],B[2],B[1]],[A[3],A[0],B[0],B[3]])
 }
 push('belt-backing','timing',beltFaces,'lo')
 for(let j=0;j<164;j++){
  const p=beltAt(j*BELT.p+BELT.r*a),w=BELT.p*.40/2
  const pp=[[-w,-.85],[w,-.85],[w,.4],[-w,.4]].map(([t,d])=>[p.x+p.tx*t-p.tz*d,p.z+p.tz*t+p.tx*d])
  prism('belt-tooth'+j,'timing',pp,65,72,'y','lo')
 }
 return {parts:out,M}
}

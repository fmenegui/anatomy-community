// Temporal reuse of partition planes changes cost, never the geometric ordering rule.
export function makeBsp(){
 let tree=null
 return function order(input){
  const byId=new Map(input.map(f=>[f.id,f]));let splits=0,nodes=0,maxDepth=0
  const output=[]
  function walk(list,node,depth){
   if(!list.length)return node
   if(list.length===1){output.push(list[0]);return node}
   maxDepth=Math.max(maxDepth,depth)
   if(depth>250)throw new Error('Limite de partição geométrica')
   let plane=node?(byId.get(node.id)||node.plane):null
   if(!plane){
    let chosen=0,best=Infinity
    for(let j=0;j<Math.min(7,list.length);j++){
     const idx=Math.floor((j+.5)*list.length/Math.min(7,list.length)),f=list[idx]
     let front=0,back=0
     for(let k=0;k<list.length;k+=Math.max(1,Math.floor(list.length/16))){const p=list[k].p[0],d=p[2]-f.ax*p[0]-f.ay*p[1]-f.az;if(d>1e-7)front++;else if(d< -1e-7)back++}
     const score=Math.abs(front-back)+.002*(Math.abs(f.ax)+Math.abs(f.ay))
     if(score<best){best=score;chosen=idx}
    }
    plane=list[chosen];node={id:plane.id,plane,F:null,B:null}
   }
   const F=[],B=[],same=[]
   for(const f of list){
    if(f.id===plane.id){same.push(f);continue}
    const ds=f.p.map(p=>p[2]-plane.ax*p[0]-plane.ay*p[1]-plane.az)
    let mn=Infinity,mx=-Infinity
    for(const d of ds){if(d<mn)mn=d;if(d>mx)mx=d}
    const ep=1e-7*(1+Math.abs(plane.ax)+Math.abs(plane.ay))
    if(mn>=-ep&&mx<=ep){same.push(f);continue}
    if(mn>=-ep){F.push(f);continue}
    if(mx<=ep){B.push(f);continue}
    const front=[],back=[];let p=f.p.at(-1),dp=ds.at(-1)
    for(let i=0;i<f.p.length;i++){
     const q=f.p[i],dq=ds[i]
     if((dp>ep&&dq< -ep)||(dp< -ep&&dq>ep)){
      const t=dp/(dp-dq),r=[p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1]),p[2]+t*(q[2]-p[2])];front.push(r);back.push(r)
     }
     if(dq>=-ep)front.push(q)
     if(dq<=ep)back.push(q)
     p=q;dp=dq
    }
    if(front.length>=3)F.push({...f,p:front})
    if(back.length>=3)B.push({...f,p:back})
    splits++
   }
   if(!same.length&&(!F.length||!B.length))return walk(list,null,depth)
   nodes++
   node.B=walk(B,node.B,depth+1)
   for(const f of same)output.push(f)
   node.F=walk(F,node.F,depth+1)
   return node
  }
  tree=walk(input,tree,0)
  return {faces:output,splits,nodes,maxDepth}
 }
}

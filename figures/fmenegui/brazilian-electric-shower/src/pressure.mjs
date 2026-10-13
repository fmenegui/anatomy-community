export function projectPoint(point, P) {
  const az = P.azimuth * Math.PI / 180
  const el = P.elevation * Math.PI / 180
  const scale = P.scale * Math.sqrt(1.6)
  const [x,y,z] = point
  return [P.origin[0] + (x*Math.sin(az)-y*Math.cos(az))*scale,
    P.origin[1] + ((x*Math.cos(az)+y*Math.sin(az))*Math.sin(el)-z*Math.cos(el))*scale]
}

export function focusBounds(P) {
  const circle = (x,y,r,z) => Array.from({length:72},(_,i) => {
    const a=i*Math.PI/36
    return [x+r*Math.cos(a),y+r*Math.sin(a),z]
  })
  const box = (a,b) => [a[0],b[0]].flatMap(x => [a[1],b[1]].flatMap(y => [a[2],b[2]].map(z=>[x,y,z])))
  const fit = points => {
    const pp=points.map(p=>projectPoint(p,P))
    const xs=pp.map(p=>p[0]), ys=pp.map(p=>p[1])
    const x=Math.min(...xs)-10, y=Math.min(...ys)-10
    return [x,y,Math.max(...xs)-x+10,Math.max(...ys)-y+10]
  }
  return {
    whole:fit([...circle(0,0,84,0),...circle(0,0,77,138),...circle(0,0,94,-88),
      ...box([-182,-42,42],[-178,6,90]),...box([-48,-68,138],[6,-55,150])]),
    switch:fit([...circle(-20,-22,27,104),...box([-49,-68,103],[8,-8,150])]),
    heater:fit([...box([-51,-34,25],[55,38,47]),...box([15,45,19],[34,62,64])])
  }
}

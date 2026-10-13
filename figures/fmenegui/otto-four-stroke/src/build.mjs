import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const here=path.dirname(fileURLToPath(import.meta.url))
const read=name=>fs.readFileSync(path.join(here,name),'utf8')
const modules=['model.mjs','scene.mjs','fast-scene.mjs','render.mjs','bsp-fast.mjs']
const sources=modules.map(name=>read(name).replace(/^import .*$/gm,'').replace(/^export /gm,''))
const source='/*\n'+read('LICENSE.txt')+'*/\n(()=>{\n'+sources.join('\n')+'\n'+read('runtime.js')+'\n})()'
const fragment=read('template.html').replace('/*OTTO_SOURCE*/',()=>source)
const baseCSS=read('standalone.css')
for(const [name,theme] of [['otto.html','dark'],['otto-light.html','light']]){
 const css=baseCSS.replace('color-scheme: light dark','color-scheme: '+theme)
 const html='<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Motor de quatro tempos e ciclo Otto ideal</title><style>'+css+'</style></head><body data-theme="'+theme+'"><div id="wrap">'+fragment+'</div></body></html>'
 fs.writeFileSync(path.join(here,name),html)
}

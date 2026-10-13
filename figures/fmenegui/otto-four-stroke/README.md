# Four-stroke engine and ideal Otto cycle

By Felipe Dias (@fmenegui), created with the Anatomy skill in ChatGPT/Codex.
The available runtime identifies the model family as GPT. Its exact model revision was not exposed, so no specific revision or token count is claimed.

Portuguese (Brazil) interface. This educational single-cylinder engine coordinates an exact slider-crank mechanism, an overhead camshaft with direct flat followers, two valves, a 2:1 toothed-belt drive and a quantitative air-standard Otto cycle. The p–V, T–s, displacement and valve-lift plots share the same model.

The geometry and thermodynamic parameters are educational design choices, not measurements of a commercial engine. Heat-addition and heat-rejection holds are presentation devices. Speed is imposed. There is no calculated combustion chemistry, fluid dynamics, instantaneous torque, bearing dynamics or friction.

## Gallery preparation

Run `node src/build.mjs` to create `src/otto.html` and `src/otto-light.html`.
The submission contains source only. These generated pages are intentionally excluded.
The gallery adapter preserves the mechanism and equations, writes only the two standalone pages, and replaces outbound reference hyperlinks with plain text. Reference links are retained below.

Checks completed before submission: metadata schema, source import and text checks, JavaScript parsing, file limits, generated-page safety checks and two builds with identical output bytes. Upstream Acorn AST safety analysis, browser and line-end checks remain pending in the gallery CI. Browser accessibility and performance have not been certified. The original numerical and sampled visual checks are documented below and in the four JSON reports under `src/`. No complete collision proof is claimed.

The Anatomy kit fingerprint identifies the installed unmodified drawing kit at upstream revision `689dcf966e63d92be10a5d593c6e19e10acd4422`. The ChatGPT distribution disabled browser launchers, which were not restored or run. This figure uses custom geometry and depth ordering to support its engine-specific mechanism. No claim is made that it passed the upstream geometry audit.

License: MIT. Ryan's original Anatomy attribution is preserved in `src/LICENSE.txt` and in both generated pages.

## Original project notes

# Motor Otto interativo

Abra `index.html` em um navegador moderno. A página é autônoma, sem bibliotecas externas, telemetria ou chamadas de rede. O tema acompanha a aparência do navegador. Os links de referência abrem páginas externas apenas quando acionados.

O conjunto é um motor didático, sem correspondência com um produto comercial. As dimensões são escolhas de projeto para a demonstração. Os valores exibidos são calculados a partir dessas escolhas.

## Modelo

- B = 86 mm, r = 43 mm, l = 143 mm e curso = 86 mm.
- Cilindrada = 499,557214 cm³. Taxa de compressão ajustável de 6 a 14.
- A alteração da compressão representa uma mudança de projeto na altura da coroa. Os centros do comando e do virabrequim ficam fixos.
- Distribuição sem avanço, atraso ou cruzamento. Comando no cabeçote, tuchos planos e duas válvulas paralelas.
- Levantamento de 2,2 mm com lei seno à quarta potência, limitado aos eventos solicitados. Raio base de 36 mm. O perfil resulta da envoltória da face plana do seguidor.
- Correia inextensível de 164 dentes e polias de 20 e 40 dentes. O passo calculado, 4,990714331 mm, é didático e não identifica uma correia comercial.
- Ar ideal, γ = 1,4, R = 287 J/(kg·K), cv = 717,5 J/(kg·K), p₁ = 100 kPa e T₁ = 300 K.
- qin ajustável entre 200 e 1.200 kJ/kg. Valor inicial de 800 kJ/kg.
- Compressão e expansão seguem as relações isentrópicas. As duas transformações isocóricas têm pausas de apresentação identificadas.
- Admissão e escape não recebem valores de pressão, temperatura ou massa instantânea do modelo fechado.
- A rotação é imposta. Não se calcula dinâmica do volante, torque, atrito, combustão, fluidos ou forças das molas.

## Organização

| Arquivo | Responsabilidade |
| --- | --- |
| `model.mjs` | Cinemática, comando, correia, estados térmicos e trajetória de apresentação |
| `scene.mjs` | Geometria seccionada e funções de cada componente |
| `fast-scene.mjs` | Reaproveitamento da geometria rígida, sem alterar o modelo |
| `render.mjs` | Projeção isométrica, faces visíveis e renderização estática |
| `bsp-fast.mjs` | Ordenação geométrica das superfícies, com divisão de polígonos |
| `runtime.js` | Controles, gráficos, leitura de estados e ciclo de animação |
| `template.html` | Estrutura da interface e estilos do componente |
| `standalone.css` | Estilos necessários fora do ambiente da conversa |
| `build.mjs` | Criação da versão interativa autônoma e do fragmento inline |

## Verificações do projeto original

Node.js moderno e Python 3 são suficientes para os testes incluídos. Não há etapa de instalação de dependências.

```bash
node build.mjs
node verify.mjs
node verify-clearances.mjs
node verify-render.mjs
python3 dom-tree.py
node verify-runtime.cjs
```

Os resultados registrados estão em `verification.json`, `clearance-verification.json`, `render-verification.json` e `runtime-verification.json`.

Foram executados testes de curso, comprimento da biela, compressão volumétrica, contato do comando, transmissão 2:1, continuidade, fechamento térmico, integral p–V, integral T–s, balanço energético, eficiência e marcadores. Também foram verificadas folgas dos principais corpos móveis por relações analíticas e envoltórias conservadoras.

A ordenação geométrica foi comparada com profundidades calculadas em 121 poses. O teste de referência por raios não encontrou divergências nos 2.269 raios que atingiram a geometria. Isso é uma inspeção amostrada, não uma prova sobre qualquer configuração possível.

Os oito grupos de testes de controles usam um DOM mínimo em Node. Foram inspecionadas imagens renderizadas dos gráficos, do motor em seis poses e de junções ampliadas. Os testes em navegador não puderam ser realizados porque o navegador disponível bloqueou a prévia local. Os tempos medidos em Node não são medidas de FPS em navegador.

## Limites geométricos

A imagem é uma representação facetada em corte. A malha do comando aproxima o perfil analítico, com erro de suporte amostrado menor que 0,0021 mm. A câmara é cilíndrica e tem teto plano. Volumes de fendas e cavidades dos anéis não entram na termodinâmica. Os anéis acompanham rigidamente o pistão.

Galerias internas, detalhes de dentes, fixadores, sedes e ajustes foram simplificados. Os trechos externos dos dutos aparecem seccionados. Os apoios dos pinos têm superfícies de ligação ao interior do pistão. Os circuitos de óleo e de refrigeração são esquemas identificados em texto.

Não foi executada uma análise CAD integral de colisões ou de tolerâncias de fabricação. As verificações de folga se limitam às famílias e envoltórias listadas no relatório. A geometria não deve ser usada para fabricação.

## Referências

- [NASA Glenn: análise termodinâmica do ciclo Otto](https://www.grc.nasa.gov/www/k-12/airplane/ottoa.html)
- [METU: curvatura e dimensionamento de ressaltos](https://ocw.metu.edu.tr/pluginfile.php/5791/mod_resource/content/8/ch8/8-4a.htm)
- Base visual e convenção de projeção: [Anatomy](https://github.com/wheresryan22/anatomy), Ryan, revisão `689dcf966e63d92be10a5d593c6e19e10acd4422`, licença MIT preservada em `LICENSE`.

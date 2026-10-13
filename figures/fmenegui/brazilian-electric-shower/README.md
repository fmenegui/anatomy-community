# Brazilian electric shower

One working isometric cutaway of the electric shower commonly used in Brazil. The front half of the housing is removed so the water inlet, heating chamber, diaphragm, insulated actuator, two contact pairs and spray plate remain visible together.

The full shower is the initial view. **Diaphragm & contacts** and **Heating element** move the camera into the same physical drawing. The diaphragm bends at its center while its outer rim stays fixed. Its insulated stem raises the moving contacts through the visible gap. The heating element becomes active only when the contacts meet.

## Try it

- **Open tap / Close tap** operates the mechanism inside the shower.
- **Replay opening** resets the mechanism and shows one slow opening sequence.
- **Diaphragm & contacts** magnifies the membrane, stem and contact gap in place.
- **Heating element** magnifies the resistive cartridge and outlet standpipe.
- **Cold / Summer / Winter** changes the heat setting. Cold water can flow with the pressure contacts closed while the heater remains off.

All visible text and accessible descriptions are in English. The light and dark pages contain one physical SVG and compact controls. Camera motion is eased. Animation pauses offscreen, stops with a closed tap once motion settles, and remains still under reduced motion.

## Physical model and scope

This generic teaching model uses 220 V, 20 °C inlet water, 5,500 W winter power and an illustrative 3,500 W summer setting. The demonstration keeps flow at 4 L/min. Water is approximately 1 kg/L with specific heat 4,186 J/(kg·K). The ideal steady-state model uses temperature rise `power / (mass flow × specific heat)` and current `power / voltage`.

This is not a replica of one manufacturer's internal geometry or an installation guide. Contact travel and timing are enlarged for legibility. Diaphragm mechanics are prescribed, not a fluid-structure simulation. The electrical connections and heater geometry are simplified. Color indicates the active resistive section, not visible red-hot metal. Heat losses, thermal transients and boiling are not modeled.

## Sources

- [Lorenzetti, Maxi Ducha](https://www.lorenzetti.com.br/produto/maxi-ducha)
- [Lorenzetti, shower FAQ](https://www.lorenzetti.com.br/dicas/duvidas-frequentes/duchas-e-chuveiros-eletricos)
- [BR102017014047B1](https://patents.google.com/patent/BR102017014047B1/en), background paragraphs 006–009, describing the water-operated diaphragm and electrical contacts
- [AU728445B2](https://patents.google.com/patent/AU728445B2/en), describing the diaphragm, insulating actuator and moving/fixed contacts

## Validation

The geometry is the original full-shower cutaway: 141 drawn items, 100 recorded solids and two tube routes. The kit audit covers its recorded static pose and one sampled depth state. It does not prove clearance in every animated pose.

Local DOM checks exercised the actual live code with a controlled clock: opening and closing, the four-unit actuator travel, heating only after contact closure, cold-setting isolation, replay, three camera views at 320/390/736-pixel widths, a single SVG, unique IDs, offscreen pause, cleanup and still reduced motion. Layout is mocked in those checks. Static SVG renders of open, closed and intermediate positions were inspected in both themes.

The community validator checks the schema, source analysis, source-only layout, deterministic builds, output and static geometry audit locally. Browser launchers are disabled in the ChatGPT distribution. Browser screenshots, line checks and performance remain subject to community CI.

## Build

From the repository root with the matching Anatomy kit linked at `.skill`:

```sh
node figures/fmenegui/brazilian-electric-shower/src/build.mjs --light
node figures/fmenegui/brazilian-electric-shower/src/build.mjs
node figures/fmenegui/brazilian-electric-shower/src/build.mjs --audit
```

Packaged with the installed Anatomy `publish.mjs`, using `--no-preview --no-session`. The GitHub connector updates the existing PR branch.

MIT license. Anatomy geometry kit copyright (c) 2026 Ryan. The MIT notice is retained in the figure source.

# QA – FY-06-HRA-01-M3 Změř přesně od nuly

Stav: `QA_RENDER_PENDING`

## Model a fyzika

- Produkční regresní sweep: `PASS 5000 seeds; length range 35-120 mm`.
- Nezávislý referenční sweep: 1 806 kombinací `objectStartMm` 35–55 a `lengthMm` 35–120.
- Maximální pravý okraj předmětu v referenci: 618 px v SVG viewBoxu 824 px.
- Maximální pravý okraj správně přiloženého pravítka: 714 px v SVG viewBoxu 824 px.
- Invarianty: `objectEnd-start=length`, `rulerZero=objectStart`, `rulerTop=objectBottom+1.5 mm`.

## Reálný browser QA

Izolovaný cloudový agent-browser načetl přesnou kopii souborů PR #8 se seedem 60103.

Deterministická úloha seed 60103:
- začátek předmětu 46 mm,
- konec 111 mm,
- délka 65 mm,
- počáteční nula pravítka 60 mm,
- počáteční horní hrana 41,5 mm,
- správná horní hrana 31,5 mm.

Ověřeno:
- skutečný flow přes směrová tlačítka: 14× vlevo + 10× nahoru + odpověď 65 mm => `Správně`, další úloha povolena, mastery `1/3 bez nápovědy`;
- diagnostika při nesprávné svislé poloze: nejprve `placement.edge_contact`;
- po opravě svislé polohy při špatné nule: `placement.zero_alignment` a správný pokyn doleva;
- nápověda vytvoří přesně 2 prvky `.guide` a přepne `aria-expanded=true`;
- klávesa ArrowLeft posunula nulovou značku z x=250 na x=246,8, tedy přesně o 3,2 SVG jednotky = 1 mm;
- mobil 390 px: `document.scrollWidth=390`, `innerWidth=390`; celá stránka nepřetéká;
- měřicí scéna na mobilu má vlastní scroll `760 px` uvnitř `334 px` rámu.

## Pixel audit

Screenshot desktopu byl v cloudovém QA skutečně vytvořen. Stejně byly vytvořeny desktop/mobile/board screenshoty přes agent-browser. Aktuální nástrojový řetězec však obrazová data screenshotu nedokáže předat do nezávislého otevření v tomto chatu.

Podle VISUAL_STANDARD_2.0 platí: screenshot vytvořený, ale neotevřený = `RENDER_PASS=PENDING`.

Proto:
- `SPEC_PASS=PASS`
- `REFERENCE_PASS=PASS`
- `PHYSICS_PASS=PASS`
- `TECHNICAL_QA=PASS`
- `ACCESSIBILITY_QA=PASS_BROWSER`
- `RENDER_PASS=PENDING_OPEN_PIXEL_AUDIT`
- `DIDACTIC_PASS=PENDING_RENDER`
- `TEXT_VISUAL_SYNC=PENDING_RENDER`
- `TEACHING_READY=NO`
- `HUB_COMPAT_QA=UNVERIFIED`

Nic nebylo mergováno ani publikováno.

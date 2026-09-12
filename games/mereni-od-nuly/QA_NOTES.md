# QA – FY-06-HRA-01-M3 Změř přesně od nuly

Stav: `TEACHING_READY_STANDALONE`

## Model a fyzika

- Produkční regresní sweep: `PASS 5000 seeds; length range 35-120 mm`.
- Nezávislý referenční sweep: 1 806 kombinací `objectStartMm` 35–55 a `lengthMm` 35–120.
- Maximální pravý okraj předmětu v referenci: 618 px v SVG viewBoxu 824 px.
- Maximální pravý okraj správně přiloženého pravítka: 714 px v SVG viewBoxu 824 px.
- Invarianty: `objectEnd-start=length`, `rulerZero=objectStart`, `rulerTop=objectBottom+1.5 mm`.

## Reálný browser QA

Deterministická úloha seed 60103:
- začátek předmětu 46 mm,
- konec 111 mm,
- délka 65 mm,
- počáteční nula pravítka 60 mm,
- počáteční horní hrana 41,5 mm,
- správná horní hrana 31,5 mm.

Ověřeno:
- flow přes směrová tlačítka: 14× vlevo + 10× nahoru + odpověď 65 mm => `Správně`, další úloha povolena, mastery `1/3 bez nápovědy`;
- diagnostika `placement.edge_contact` a `placement.zero_alignment`;
- nápověda vytvoří přesně 2 prvky `.guide` a přepne `aria-expanded=true`;
- klávesa ArrowLeft posunuje pravítko přesně o 1 mm;
- mobil 390 px: `document.scrollWidth=390`, `innerWidth=390`; stránka nepřetéká, scrolluje pouze měřicí scéna.

## Pixel / render audit 2026-09-12

Skutečné rendery přesných souborů PR #8 byly **vytvořeny a otevřeny**:
- desktop 1440×900 – PASS,
- mobil 390×844 – PASS,
- tabule 1920×1080 – PASS,
- desktop se zapnutou nápovědou – PASS,
- desktop ve správně srovnané poloze – PASS.

Blind audit nenašel clipping, kolizi významových prvků ani změnu fyzikálního významu responzivitou. Ve správném stavu má nulová značka stejnou x souřadnici jako levý okraj předmětu. Nápověda zobrazuje svislou vodicí čáru začátku a vodorovnou čáru správné horní hrany pravítka.

Didaktický závěr: i bez komentáře učitele je z obrazu zřejmé, že se kontroluje poloha nuly a kontakt horní hrany pravítka s předmětem. Číselné popisky stupnice jsou schválená pedagogická výjimka fyzikálního SVG.

Release evidence je uložena v `render-evidence.json` a validátor VISUAL_STANDARD_2.0 vrátil `PASS`.

Proto:
- `SPEC_PASS=PASS`
- `REFERENCE_PASS=PASS`
- `PHYSICS_PASS=PASS`
- `TECHNICAL_QA=PASS`
- `ACCESSIBILITY_QA=PASS_BROWSER`
- `RENDER_PASS=PASS`
- `DIDACTIC_PASS=PASS`
- `TEXT_VISUAL_SYNC=PASS`
- `TEACHING_READY=YES` pro standalone modul
- `HUB_COMPAT_QA=UNVERIFIED`

Nic nebylo mergováno ani publikováno.

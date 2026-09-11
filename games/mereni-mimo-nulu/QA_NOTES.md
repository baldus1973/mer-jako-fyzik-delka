# QA – FY-06-HRA-01 / Měření mimo nulu

## Stav

Implementovaný izolovaný prototyp. Není určen k merge do produkčního `main`, dokud neproběhne skutečný render/pixel audit.

## Modelový důkaz

Nezávislý sweep ověřil 2 592 kombinací v generovaném rozsahu:

- start 12–65 mm,
- délka 25–72 mm při podmínce konec ≤ 145 mm,
- správná odpověď v mm,
- ekvivalentní správná odpověď v cm,
- diagnostika chyby `reading.end_is_length`,
- diagnostika chybně umístěné značky začátku.

Výsledek: PASS.

## Fyzikální invarianty

- `length_mm = end_mm - start_mm`
- 1 SVG jednotka na vodorovné ose = 1 virtuální mm
- objekt, stupnice i značky používají stejnou souřadnou soustavu
- generátor nikdy nevytváří start na nule

## Přístupnost

Implementováno:

- drag/pointer,
- klávesové šipky,
- samostatná tlačítka ±1 mm,
- rozšířená neviditelná dotyková plocha značek,
- bez časového limitu,
- význam není sdělován pouze barvou.

Stav: vyžaduje praktický smoke test na dotykovém zařízení.

## Soukromí a práva

- bez účtu a jména,
- bez externích runtime zdrojů,
- lokální ukládání pouze jednoduchého průběhu dovednosti,
- vlastní HTML/CSS/SVG/JS.

## Zbývající blokátory

1. Skutečný pixel audit desktop.
2. Skutečný pixel audit mobil/tablet.
3. Skutečný pixel audit tabule/velká obrazovka.
4. Praktický test pointer/keyboard/button interakce v prohlížeči.
5. HUB_COMPAT_QA po určení cílového repozitáře/hostitele Fyzika HUB.

Dokud tyto body nejsou doložené, `VISUAL_QA`, `TECHNICAL_QA`, `HUB_COMPAT_QA` a celkové `GAME_QA` zůstávají `UNVERIFIED`.

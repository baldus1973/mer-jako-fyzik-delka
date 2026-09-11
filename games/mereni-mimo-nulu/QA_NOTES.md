# QA – FY-06-HRA-01 / Měření mimo nulu

## Stav

Izolovaný prototyp prošel modelovým, browserovým a pixelovým QA. Produkční `main` ani PWA se tímto PR nemění. Modul zůstává kandidátem pro Fyzika HUB; `HUB_COMPAT_QA` je stále neověřeno.

## Modelový důkaz

Nezávislý referenční sweep ověřil 2 976 generovaných stavů:

- start 12–73 mm,
- délka 25–72 mm,
- konec vždy ≤ 145 mm,
- hraniční stav 73–145 mm je dosažitelný,
- `length_mm = end_mm - start_mm`,
- správná odpověď v mm i cm,
- diagnostika `reading.end_is_length`,
- diagnostika chybné značky začátku i konce.

Výsledek: `REFERENCE_PASS = PASS`, `PHYSICS_QA = PASS`, `GEOMETRY_QA = PASS`.

Repozitář obsahuje regresní test `tests/game-offset-model.test.js`.

## Browser / interakční QA

Skutečný Chromium render byl spuštěn a zkontrolován pro:

- desktop 1440×900,
- mobil 390×844,
- tabuli/projektor 1920×1080.

Ověřeno:

- bez JavaScript page errors,
- bez horizontálního přetečení,
- správná responzivita mobilu,
- správné zobrazení celé stupnice 0–15 cm,
- diagnostika chyby „konec = délka“,
- správná odpověď a přechod na další úlohu,
- klávesové šipky,
- tlačítka po 1 mm,
- skutečný pointer drag.

### Nalezené a opravené failure modes

1. **Mobilní layout byl smrštěn na desítky pixelů**, protože modul přepsal globální breakpoint. Oprava: vlastní `@media(max-width:820px){.game-layout{grid-template-columns:1fr}}`.
2. **Průhledná SVG čára nebyla spolehlivě hit-testovatelná.** Oprava: samostatný obdélníkový hitbox 16 SVG jednotek široký s téměř nulovou neprůhledností.
3. **Hraniční stav 145 mm nebyl generátorem dosažitelný.** Oprava: rozsah startu rozšířen na 12–73 mm a přidán regresní test.
4. **Číselné popisky stupnice byly na mobilu zbytečně drobné.** Oprava: mírně zvětšená velikost popisků bez změny geometrie stupnice.

Výsledek: `VISUAL_QA = PASS`, `INTERACTION_QA = PASS`, `ACCESSIBILITY_QA = PASS`, `TECHNICAL_QA = PASS` pro izolovaný prototyp.

## Přístupnost

- pointer/drag,
- klávesové šipky,
- samostatná tlačítka ±1 mm,
- široká hit-area značek,
- bez časového limitu,
- význam není sdělován pouze barvou,
- mobilní layout má jednu čitelnou hlavní kolonu.

## Soukromí a práva

- bez účtu a jména,
- bez externích runtime zdrojů,
- lokální ukládání pouze jednoduchého průběhu dovednosti,
- vlastní HTML/CSS/SVG/JS.

## Zbývající blokátor

`HUB_COMPAT_QA = UNVERIFIED` – není ještě doloženo začlenění do cílového repozitáře/hostitele Fyzika HUB a jeho sdílené navigace, výsledků a deep-link architektury.

Dokud tento bod není doložený, celkové `GAME_QA` a `HUB_READY` zůstávají neuzavřené a PR zůstává draft.

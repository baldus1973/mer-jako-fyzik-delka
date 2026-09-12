# QA – FY-06-HRA-01-M2 Najdi dílek

Datum kontroly: 2026-09-12

## Model / fyzika

- produkční regresní test spuštěn nad skutečným `model.js`: **PASS 5000 seedů**;
- všechny povolené nejmenší dílky byly dosaženy: **1 mm, 2 mm, 5 mm**;
- správná odpověď v mm i cm byla pro všechny testované úlohy přijata;
- chybná hodnota dílku a chybný odečet byly diagnostikovány odděleně.

## Nezávislý referenční model

Samostatný referenční průchod nepoužil produkční vyhodnocovací funkce. Pro 5000 stavů ověřil:

- `10 mm / minorStepMm` je celé číslo;
- cíl leží na existující značce stupnice;
- cíl není hlavní centimetrová značka;
- lineární transformace `x = x0 + mm * scale` umístí cílovou šipku přesně na značku;
- cíl zůstává v safe frame.

Výsledek: **REFERENCE_PASS = PASS**.

Rozložení 5000 seedů: 1 mm = 1680, 2 mm = 1646, 5 mm = 1674; dosažené cíle 11–139 mm.

## Render audit

Skutečné renderované screenshoty byly vytvořeny a otevřeny pro:

- desktop 1440×900;
- mobil 390×844;
- tabule 1920×1080;
- krajní stav 139 mm;
- krajní stav 15 mm.

### Nalezené failure modes a opravy

1. **MOBILE_PAGE_OVERFLOW** – formulář roztahoval dokument při 390 px na 420 px. Oprava: `minmax(0,1fr)`, `min-width:0`, šířky vstupů a lokální containment. Po opravě žádný horizontální overflow dokumentu.
2. **TARGET_OUTSIDE_MOBILE_VIEW** – u cíle poblíž pravého konce mohl být ukazatel mimo právě viditelný úsek posuvné stupnice. Oprava: po vykreslení se `scale-wrap` automaticky posune tak, aby cíl byl vidět. Ověřeno pro 15 mm i 139 mm.
3. **BOARD_UNDERUSE** – původní 1100px limit nechával na 1920px tabuli příliš mnoho nevyužitého prostoru. Oprava: od 1500px se shell rozšíří až na 1420px a stupnice se zvětší.

Výsledek po opravách: **RENDER_PASS = PASS**, **DIDACTIC_PASS = PASS**, **TEXT_VISUAL_SYNC = PASS**.

## Přístupnost / soukromí

- žádný drag není nutný;
- formulář je ovladatelný klávesnicí;
- žádný časový limit;
- význam není pouze barevný;
- žádný účet, jméno ani online žebříček.

## Stav

Samostatný modul: **TEACHING_READY**.

`HUB_COMPAT_QA` zůstává **UNVERIFIED**; integrace do centrálního Fyzika HUBu je samostatný gate.

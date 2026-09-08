# Měř jako fyzik – Délka

Interaktivní virtuální laboratoř pro 6. ročník ZŠ zaměřená na měření délky.

## Verze 0.6.0

- odhad před měřením s referenční úsečkou 1 cm ve stejném virtuálním měřítku,
- pět typů předmětů: pastelka, guma, proužek papíru, klíč a šroubek,
- náhodné délky v celých milimetrech,
- volný pohyb předmětu i pravítka dotykem, myší a klávesnicí,
- volitelné pomocné čáry, které procházejí začátkem a koncem předmětu a pokračují přes stupnici,
- zoom a celá pracovní plocha,
- lokální anonymní evidence pokusů a typů chyb,
- bez reklam, analytiky, účtů a externích runtime zdrojů.

## Fyzikální model

Souřadnice scény jsou virtuální milimetry. Aplikace netvrdí, že 1 cm na displeji odpovídá fyzickému 1 cm. Ve fázi odhadu je proto zobrazena referenční úsečka 1 cm ve stejném virtuálním měřítku jako předmět. Měření se provádí virtuálním pravítkem s nejmenším dílkem 1 mm.

## GitHub Pages

https://baldus1973.github.io/mer-jako-fyzik-delka/

Publikace probíhá automaticky z větve `main` přes GitHub Pages.

## Soukromí a bezpečnost

Aplikace nepotřebuje účet ani osobní údaje. Pokrok zůstává pouze v `localStorage` daného zařízení. Service worker má scope omezený na `/mer-jako-fyzik-delka/` a cache je verzovaná.

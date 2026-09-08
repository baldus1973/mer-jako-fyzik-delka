# QA – verze 0.6.0

## Automatické kontroly

- JavaScript syntaxe: `app.js`, `physics.js`, `sw.js` bez syntaktické chyby.
- Fyzikální model: správné převody mm/cm a měření několika generovaných délek.
- Generátor: 500 generovaných úloh v povolených rozsazích, bez okamžitého opakování stejného typu předmětu.
- Pomocné čáry: geometrie vede od 3 mm nad horní hranou přes začátek/konec předmětu až 13 mm do oblasti stupnice pravítka.
- DOM kontrola: všechny selektory používané v `app.js` mají odpovídající prvky v `index.html`.
- PWA: `id`, `start_url` a `scope` jsou `/mer-jako-fyzik-delka/`; cache verze je `0.6.0`; service worker filtruje požadavky na vlastní scope.
- App shell: všechny uvedené soubory existují.
- Externí runtime zdroje: žádné.
- HTTP smoke test lokálního serveru: HTML, `app.js` a manifest vracejí 200.

## Vizuální kontrola

Headless Chromium se v tomto běhovém prostředí při pořizování screenshotu zablokoval na systémových službách, proto je po nasazení potřeba krátký ruční smoke test na PC a mobilu.

## Doporučený ruční smoke test

1. Ověřit, že se jako první zobrazí předmět bez pravítka a referenční úsečka 1 cm.
2. Uložit odhad a ověřit zobrazení pravítka.
3. Zapnout pomocné čáry a ověřit, že procházejí začátkem a koncem předmětu.
4. Přiložit pravítko, zadat správnou délku a přejít na další předmět.
5. Ověřit několik různých předmětů a délek na mobilu dotykem.

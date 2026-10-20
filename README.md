# el_Pomiary – protokoły pomiarów elektrycznych

Aplikacja PWA (działa offline) do tworzenia protokołów:

1. **Pomiar impedancji pętli zwarcia** – grupy (pomieszczenia/obiekty), pomiary 1F / 3F / 3FN, Ia = In·k, Za = U/Ia, ocena Zs ≤ Za, izolacja OK/NOK.
2. **Pomiar rezystancji izolacji** – generowany automatycznie z pętli zwarcia (OK → „>100”, NOK → wartości wpisane ręcznie, ocena pozytywna gdy wszystkie wartości ≥ R dp = 1 MΩ).
3. **Pomiar zabezpieczeń różnicowo-prądowych** – ocena pozytywna gdy 0,5·IΔn ≤ IΔ ≤ IΔn oraz t ≤ t max.

Dokumenty do wydruku (v1.4): **sprawozdanie z badania** oraz **protokoły**: izolacji, ochrony przez szybkie wyłączenie (pętla) i ochrony wyłącznikami różnicowoprądowymi – w **PDF** i **Word (.docx)**. Numeracja protokołów N/MM.RRRR (kolejne numery w miesiącu, po wszystkich projektach na urządzeniu), wnioski z wyników pomiarów, przyrządy i dane firmy z Ustawień.

Tabele pomiarów: **PDF** (A4) oraz **Excel .xlsx** (układ jak w szablonach, z formułami). Kopia zapasowa: **.json**.

## Uruchomienie na komputerze

Otwórz `index.html` w Chrome lub Edge (dwuklik). Wszystko działa lokalnie, bez internetu.
Dane zapisują się w przeglądarce na tym komputerze.

## Instalacja na telefonie / tablecie

Instalacja PWA wymaga, żeby aplikacja była dostępna pod adresem **https://**. Najprościej:

**Netlify Drop (bez konta technicznego, ~1 min)**
1. Wejdź na https://app.netlify.com/drop i przeciągnij cały folder `app`.
2. Otrzymasz adres typu `https://nazwa.netlify.app` – otwórz go w Chrome na telefonie.
3. Menu ⋮ → **Zainstaluj aplikację** / **Dodaj do ekranu głównego**.

**GitHub Pages**
1. Utwórz repozytorium, wgraj zawartość folderu `app`.
2. Settings → Pages → Branch: `main`, folder `/root` → Save.
3. Otwórz `https://<login>.github.io/<repo>/` na telefonie i zainstaluj jak wyżej.

Po instalacji aplikacja działa w pełni offline (także eksport PDF/Excel).

## Dane i kopie zapasowe

- Dane są przechowywane **tylko na urządzeniu** (IndexedDB). Telefon i komputer mają osobne dane.
- Ustawienia → **Zapisz kopię do pliku** tworzy kopię wszystkich projektów i ustawień (.json).
  Ten plik wczytasz na innym urządzeniu: Projekty lub Ustawienia → **Wczytaj kopię z pliku**.
- Pojedynczy projekt: ekran projektu → menu ⋮ → **Zapisz kopię projektu**.

## Aktualizacja aplikacji

Po zmianie plików zwiększ numer w `sw.js` (`const VERSION = 'el-pomiary-v1.4.1'`) i wgraj folder ponownie.
Telefon pobierze nową wersję przy kolejnym uruchomieniu (czasem potrzebne jest drugie uruchomienie).

## Struktura

```
index.html            – strona aplikacji
css/tokens.css        – tokeny systemu wizualnego (kolory jasny/ciemny, odstępy, promienie)
css/bundle.css        – komponenty systemu wizualnego (karty, przyciski, pola, arkusz, zakładki)
css/app.css           – elementy specyficzne dla el_Pomiary (wiersze pomiarów, tabele protokołu)
js/model.js           – model danych i obliczenia (pętla, izolacja, RCD)
js/db.js              – zapis lokalny
js/export.js          – eksport XLSX, PDF i Word
js/reports.js         – treść protokołów i sprawozdania, numeracja, wnioski
js/app.js             – interfejs
sw.js, manifest.webmanifest, icons/  – PWA (offline, instalacja)
lib/                  – ExcelJS 4.4.0, jsPDF 2.5.2, jsPDF-AutoTable 3.8.4, docx 9.7.1
fonts/fonts.js        – czcionka Liberation Sans (polskie znaki w PDF)
```

# el_Pomiary – protokoły pomiarów elektrycznych

Aplikacja PWA (działa offline) do tworzenia protokołów:

1. **Pomiar impedancji pętli zwarcia** – grupy (pomieszczenia/obiekty), pomiary 1F / 3F / 3FN, Ia = In·k, Za = U/Ia, ocena Zs ≤ Za, izolacja OK/NOK.
2. **Pomiar rezystancji izolacji** – generowany automatycznie z pętli zwarcia (OK → „>100”, NOK → wartości wpisane ręcznie, ocena pozytywna gdy wszystkie wartości ≥ R dp = 1 MΩ).
3. **Pomiar zabezpieczeń różnicowo-prądowych** – ocena pozytywna gdy 0,5·IΔn ≤ IΔ ≤ IΔn oraz t ≤ t max.

Eksport: **PDF** (A4) oraz **Excel .xlsx** (układ jak w szablonach, z formułami). Kopia zapasowa: **.json**.

https://gwozdziu123.github.io/el_Pomiary/

## Dane i kopie zapasowe

- Dane są przechowywane **tylko na urządzeniu** (IndexedDB). Telefon i komputer mają osobne dane.
- Ustawienia → **Zapisz kopię do pliku** tworzy kopię wszystkich projektów i ustawień (.json).
  Ten plik wczytasz na innym urządzeniu: Projekty lub Ustawienia → **Wczytaj kopię z pliku**.
- Pojedynczy projekt: ekran projektu → menu ⋮ → **Zapisz kopię projektu**.


## Struktura

```
index.html            – strona aplikacji
css/tokens.css        – tokeny systemu wizualnego (kolory jasny/ciemny, odstępy, promienie)
css/bundle.css        – komponenty systemu wizualnego (karty, przyciski, pola, arkusz, zakładki)
css/app.css           – elementy specyficzne dla el_Pomiary (wiersze pomiarów, tabele protokołu)
js/model.js           – model danych i obliczenia (pętla, izolacja, RCD)
js/db.js              – zapis lokalny
js/export.js          – eksport XLSX i PDF
js/app.js             – interfejs
sw.js, manifest.webmanifest, icons/  – PWA (offline, instalacja)
lib/                  – ExcelJS 4.4.0, jsPDF 2.5.2, jsPDF-AutoTable 3.8.4
fonts/fonts.js        – czcionka Liberation Sans (polskie znaki w PDF)
```

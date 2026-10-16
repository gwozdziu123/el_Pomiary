/* el_Pomiary – eksport XLSX (ExcelJS) i PDF (jsPDF + autoTable) */
(function () {
  'use strict';
  const E = window.EP;

  /* ================= wspólne definicje tabel ================= */
  const LOOP_HEAD = ['Lp.', 'Badany punkt', 'Faza', 'Wyłącznik', 'In', 'k', 'Ia', 'Ik', 'Za', 'Zs', 'U pom', 'Ocena'];
  const LOOP_UNITS = ['', '', '', '', '[A]', '-', '[A]', '[A]', '[Ω]', '[Ω]', '[V]', 'Poz/Neg'];
  const ISO_HEAD = ['Lp.', 'Badany punkt'].concat(E.ISO_COLS.map(c => c.replace('/', '/ ')), ['Ocena']);
  const ISO_UNITS = ['', ''].concat(E.ISO_COLS.map(() => '[MΩ]'), ['Poz/Neg']);
  const ISO_LEGEND = [
    'Legenda',
    '',
    '(TN-C, TN-S) Badanie rezystancji izolacji obwodów',
    '',
    'L1/L2 … N/PE [MΩ] : Zmierzona rezystancja izolacji między wskazanymi przewodami',
    '>100 : Rezystancja izolacji powyżej 100 MΩ',
    'R dp [MΩ] : Minimalna dopuszczalna rezystancja izolacji: R dp = 1 MΩ',
    'Ocena : Ocena pomiaru: - pozytywna gdy:  wszystkie zmierzone wartości >= R dp'
  ];
  const RCD_HEAD = ['Lp.', 'Nazwa', 'Czas wyzwolenia', 'Prąd wyzwolenia', 'Dane', 'Ocena'];
  const RCD_UNITS = ['', '', '[ms]', '[mA]', '', 'Poz/Neg'];

  const LOOP_LEGEND = [
    'Legenda',
    '',
    '(TN-C, TN-S) Badanie ochrony przed porażeniem przez samoczynne wyłączenie',
    '',
    'Wyłącznik : Nazwa elementu zabezpieczającego obwód',
    'In [A] : Prąd nominalny zabezpieczenia',
    'k - : współczynnik charakterystyki t/I zabezpieczenia',
    'Ia [A] : Prąd powodujący wyzwolenie zabezpieczenia: Ia = In · k',
    'Ik [A] : Prąd zwarciowy (zmierzony)',
    'Zs [Ω] : Zmierzona impedancja pętli zwarciowej',
    'Za [Ω] : Wartość wymagana impedancji pętli zwarciowej: Za = (U pom / Ia)',
    'Ocena : Ocena pomiaru: - pozytywna gdy:  Zs <= Za'
  ];
  const RCD_LEGEND = [
    'Legenda',
    '',
    'Dane : prąd znamionowy wyłącznika In [A] oraz znamionowy prąd różnicowy IΔn [mA]',
    'Czas wyzwolenia [ms] : zmierzony czas zadziałania wyłącznika',
    'Prąd wyzwolenia [mA] : zmierzony prąd zadziałania IΔ',
    'Ocena : pozytywna gdy:  0,5 · IΔn <= IΔ <= IΔn  oraz  czas wyzwolenia <= czas dopuszczalny'
  ];

  function executorsOf(p) { return (p.executors || []).filter(x => x && x.name); }

  /* ================= XLSX ================= */
  const THIN = { style: 'thin', color: { argb: 'FF000000' } };
  const BORDER_ALL = { top: THIN, left: THIN, bottom: THIN, right: THIN };
  const FONT = { name: 'Arial', size: 11 };
  const FILL = argb => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: argb } });

  function colLetter(n) { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }

  function mergedRow(ws, r, ncols, text, opts) {
    opts = opts || {};
    ws.mergeCells(r, 1, r, ncols);
    const c = ws.getCell(r, 1);
    c.value = text;
    c.font = Object.assign({}, FONT, opts.font || {});
    c.alignment = Object.assign({ horizontal: 'center', vertical: 'middle', wrapText: true }, opts.alignment || {});
    if (opts.fill) c.fill = FILL(opts.fill);
    if (opts.border !== false) {
      for (let i = 1; i <= ncols; i++) ws.getCell(r, i).border = opts.borderStyle || BORDER_ALL;
    }
    return c;
  }

  function xlsxHeader(ws, p, type, ncols) {
    let r = 1;
    mergedRow(ws, r, ncols, rcdLike(type) ? 'Wykonawcy pomiarów:' : 'Wykonawca pomiarów:', { borderStyle: { top: THIN, left: THIN, right: THIN } });
    r++;
    const dateCols = ncols >= 10 ? 3 : 1;
    const left = ncols - dateCols;
    const nameCols = Math.max(1, Math.ceil(left * 0.45));
    const exs = executorsOf(p);
    const lines = exs.length ? exs : [{ name: '' }];
    lines.forEach((ex, i) => {
      ws.mergeCells(r, 1, r, nameCols);
      const nc = ws.getCell(r, 1);
      nc.value = ex.name || '';
      nc.font = FONT; nc.alignment = { horizontal: 'center', vertical: 'middle' };
      if (left - nameCols > 0) {
        ws.mergeCells(r, nameCols + 1, r, left);
        const sc = ws.getCell(r, nameCols + 1);
        sc.value = E.sepText(ex);
        sc.font = Object.assign({}, FONT, { size: 9 });
        sc.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        const approxChars = (left - nameCols) * 9;
        const lines = Math.ceil((sc.value || '').length / Math.max(20, approxChars));
        if (lines > 1) ws.getRow(r).height = 13 * lines + 2;
      }
      if (dateCols > 1) ws.mergeCells(r, left + 1, r, ncols);
      const dc = ws.getCell(r, left + 1);
      dc.value = i === 0 ? 'Data: ' + E.docDate(p.date) : '';
      dc.font = FONT; dc.alignment = { horizontal: 'center', vertical: 'middle' };
      const last = i === lines.length - 1;
      for (let c = 1; c <= ncols; c++) {
        const b = {};
        if (c === 1) b.left = THIN;
        if (c === ncols) b.right = THIN;
        if (last) b.bottom = THIN;
        ws.getCell(r, c).border = b;
      }
      r++;
    });
    r++;
    mergedRow(ws, r, ncols, 'Miejsce przeprowadzenia pomiarów: ' + (p.location || ''), {}); r += 2;
    mergedRow(ws, r, ncols, 'Wyniki pomiarowe', {}); ws.getRow(r).height = 15.75; r += 2;
    mergedRow(ws, r, ncols, E.DOC_HEADINGS[type], {}); r += 2;
    mergedRow(ws, r, ncols, E.networkLine(p.network), {}); r++;
    return r;
  }
  function rcdLike(type) { return type === 'rcd'; }

  function headRows(ws, r, head, units) {
    head.forEach((h, i) => {
      const c = ws.getCell(r, i + 1);
      c.value = h; c.font = Object.assign({}, FONT, { bold: true });
      c.fill = FILL('FFC0C0C0'); c.border = BORDER_ALL;
      c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      const u = ws.getCell(r + 1, i + 1);
      u.value = units[i]; u.font = FONT; u.border = BORDER_ALL;
      u.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    return r + 2;
  }

  function setupSheet(ws, widths, titleRows) {
    widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
    ws.pageSetup = {
      paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
      margins: { left: 0.39, right: 0.39, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
      printTitlesRow: titleRows, horizontalCentered: true
    };
    ws.headerFooter = { oddFooter: '&L&8&F&R&8Strona &P z &N' };
  }

  function cellNum(v) { const n = E.num(v); return n === null ? null : n; }
  function dataCell(ws, r, c, value, opts) {
    const cell = ws.getCell(r, c);
    cell.value = value === undefined ? null : value;
    cell.font = Object.assign({}, FONT, (opts && opts.font) || {});
    cell.border = BORDER_ALL;
    cell.alignment = Object.assign({ horizontal: 'center', vertical: 'middle' }, (opts && opts.alignment) || {});
    if (opts && opts.numFmt) cell.numFmt = opts.numFmt;
    return cell;
  }

  function sheetLoop(wb, p, doc) {
    const ws = wb.addWorksheet('Pętla zwarcia');
    const N = 12;
    let r = xlsxHeader(ws, p, 'loop', N);
    const headR = r;
    r = headRows(ws, r, LOOP_HEAD, LOOP_UNITS);
    setupSheet(ws, [4.5, 24, 7, 10, 6, 5, 7, 7, 7, 7, 7.5, 11.5], headR + ':' + (headR + 1));
    E.flattenLoop(doc).forEach(x => {
      if (x.type === 'group') { mergedRow(ws, r, N, x.text, { fill: 'FFD9D9D9' }); r++; return; }
      if (x.type === 'sub') { mergedRow(ws, r, N, x.text, { fill: 'FFF2F2F2', font: { bold: true } }); r++; return; }
      const c = x.calc;
      dataCell(ws, r, 1, x.lp);
      dataCell(ws, r, 2, x.name, { alignment: { horizontal: 'left' } });
      dataCell(ws, r, 3, x.phase);
      dataCell(ws, r, 4, x.m.breaker || '');
      dataCell(ws, r, 5, c.In);
      dataCell(ws, r, 6, c.k);
      dataCell(ws, r, 7, { formula: `IF(AND(ISNUMBER(E${r}),ISNUMBER(F${r})),E${r}*F${r},"")`, result: c.Ia === null ? '' : c.Ia });
      dataCell(ws, r, 8, c.Ik);
      dataCell(ws, r, 9, { formula: `IF(AND(ISNUMBER(K${r}),ISNUMBER(G${r})),K${r}/G${r},"")`, result: c.Za === null ? '' : c.Za }, { numFmt: '0.00' });
      dataCell(ws, r, 10, c.Zs, { numFmt: '0.00' });
      dataCell(ws, r, 11, c.U);
      dataCell(ws, r, 12, { formula: `IF(AND(ISNUMBER(J${r}),ISNUMBER(I${r})),IF(J${r}<=I${r},"Pozytywna","Negatywna"),"")`, result: c.result || '' },
        c.result === 'Negatywna' ? { font: { color: { argb: 'FFC00000' }, bold: true } } : null);
      r++;
    });
    r += 1;
    LOOP_LEGEND.forEach((t, i) => {
      if (t) { const c = ws.getCell(r, 2); c.value = t; c.font = Object.assign({}, FONT, { size: i === 0 ? 12 : 10, bold: i === 0 }); }
      r++;
    });
    return ws;
  }

  function sheetIso(wb, p, loopDoc) {
    const ws = wb.addWorksheet('Rezystancja izolacji');
    const N = 13;
    let r = xlsxHeader(ws, p, 'iso', N);
    const headR = r;
    r = headRows(ws, r, ISO_HEAD, ISO_UNITS);
    setupSheet(ws, [4.5, 24].concat(E.ISO_COLS.map(() => 6.6), [11.5]), headR + ':' + (headR + 1));
    E.flattenIso(loopDoc).forEach(x => {
      if (x.type === 'group') { mergedRow(ws, r, N, x.text, { fill: 'FFD9D9D9' }); r++; return; }
      if (x.type === 'sub') { mergedRow(ws, r, N, x.text, { fill: 'FFF2F2F2', font: { bold: true } }); r++; return; }
      dataCell(ws, r, 1, x.lp);
      dataCell(ws, r, 2, x.name, { alignment: { horizontal: 'left' } });
      E.ISO_COLS.forEach((col, i) => {
        const v = x.iso[col];
        let val = null;
        if (v !== undefined && v !== '') { const n = E.num(v); val = n === null ? v : n; }
        dataCell(ws, r, 3 + i, val, v !== undefined && E.isoBelow(v) ? { font: { color: { argb: 'FFC00000' }, bold: true } } : null);
      });
      dataCell(ws, r, 13, x.result || '', x.result === 'Negatywna' ? { font: { color: { argb: 'FFC00000' }, bold: true } } : null);
      r++;
    });
    r += 1;
    ISO_LEGEND.forEach((t, i) => {
      if (t) { const c = ws.getCell(r, 2); c.value = t; c.font = Object.assign({}, FONT, { size: i === 0 ? 12 : 10, bold: i === 0 }); }
      r++;
    });
    return ws;
  }

  function sheetRcd(wb, p, doc) {
    const ws = wb.addWorksheet('Różnicowo-prądowe');
    const N = 6;
    let r = xlsxHeader(ws, p, 'rcd', N);
    const headR = r;
    r = headRows(ws, r, RCD_HEAD, RCD_UNITS);
    setupSheet(ws, [5, 36, 17, 17, 16, 13], headR + ':' + (headR + 1));
    (doc.rows || []).forEach((row, i) => {
      const c = E.calcRcd(row);
      dataCell(ws, r, 1, i + 1);
      dataCell(ws, r, 2, row.name || '', { alignment: { horizontal: 'left' } });
      dataCell(ws, r, 3, c.t);
      dataCell(ws, r, 4, c.I);
      dataCell(ws, r, 5, c.label);
      dataCell(ws, r, 6, c.result || '', c.result === 'Negatywna' ? { font: { color: { argb: 'FFC00000' }, bold: true } } : null);
      r++;
    });
    r += 1;
    RCD_LEGEND.forEach((t, i) => {
      if (t) { const c = ws.getCell(r, 2); c.value = t; c.font = Object.assign({}, FONT, { size: i === 0 ? 12 : 10, bold: i === 0 }); }
      r++;
    });
    return ws;
  }

  function buildXlsx(p, types) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'el_Pomiary';
    wb.created = new Date();
    const loop = E.getDoc(p, 'loop');
    types.forEach(t => {
      if (t === 'loop' && loop) sheetLoop(wb, p, loop);
      if (t === 'iso' && loop) sheetIso(wb, p, loop);
      if (t === 'rcd') { const d = E.getDoc(p, 'rcd'); if (d) sheetRcd(wb, p, d); }
    });
    return wb.xlsx.writeBuffer().then(buf => new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  }

  /* ================= PDF ================= */
  function newPdf() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    doc.addFileToVFS('LS-Regular.ttf', window.EP_FONTS.Regular);
    doc.addFont('LS-Regular.ttf', 'LS', 'normal');
    doc.addFileToVFS('LS-Bold.ttf', window.EP_FONTS.Bold);
    doc.addFont('LS-Bold.ttf', 'LS', 'bold');
    doc.setFont('LS', 'normal');
    return doc;
  }
  const M = 15; // margines
  function pdfHeader(doc, p, type) {
    const W = doc.internal.pageSize.getWidth();
    let y = 16;
    doc.setFont('LS', 'normal'); doc.setFontSize(11);
    doc.text(type === 'rcd' ? 'Wykonawcy pomiarów:' : 'Wykonawca pomiarów:', M, y);
    doc.text('Data: ' + E.docDate(p.date), W - M, y, { align: 'right' });
    y += 6;
    const exs = executorsOf(p);
    if (!exs.length) { y += 2; }
    exs.forEach(ex => {
      doc.setFont('LS', 'bold'); doc.setFontSize(10);
      doc.text(ex.name, M + 4, y);
      const sep = E.sepText(ex);
      if (sep) {
        const nameW = doc.getTextWidth(ex.name);
        doc.setFont('LS', 'normal'); doc.setFontSize(8.5);
        const x = M + 4 + Math.max(nameW + 4, 45);
        const lines = doc.splitTextToSize(sep, W - M - x);
        doc.text(lines, x, y);
        y += 4.6 * Math.max(1, lines.length) + 0.6;
      } else y += 5.2;
    });
    doc.setDrawColor(0); doc.setLineWidth(0.2);
    doc.line(M, y - 2, W - M, y - 2);
    y += 4;
    doc.setFont('LS', 'normal'); doc.setFontSize(10.5);
    const loc = doc.splitTextToSize('Miejsce przeprowadzenia pomiarów: ' + (p.location || ''), W - 2 * M);
    doc.text(loc, M, y); y += 5 * loc.length + 3;
    doc.setFont('LS', 'bold'); doc.setFontSize(12);
    doc.text('Wyniki pomiarowe', W / 2, y, { align: 'center' }); y += 6;
    doc.setFont('LS', 'normal'); doc.setFontSize(10);
    const h = doc.splitTextToSize(E.DOC_HEADINGS[type], W - 2 * M);
    doc.text(h, W / 2, y, { align: 'center' }); y += 4.8 * h.length + 0.5;
    doc.setFontSize(8.5);
    doc.text(E.networkLine(p.network), W / 2, y, { align: 'center' }); y += 4;
    return y;
  }
  const baseTable = {
    theme: 'grid',
    margin: { left: M, right: M, bottom: 16, top: 14 },
    styles: { font: 'LS', fontSize: 8, cellPadding: 1.1, lineColor: [0, 0, 0], lineWidth: 0.15, textColor: [0, 0, 0], halign: 'center', valign: 'middle', overflow: 'linebreak' },
    headStyles: { font: 'LS', fontStyle: 'bold', fillColor: [192, 192, 192], textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.15 },
    bodyStyles: { fillColor: false },
    alternateRowStyles: { fillColor: false },
    showHead: 'everyPage'
  };
  function headFor(head, units) {
    return [head, units.map(u => ({ content: u, styles: { fontStyle: 'normal', fillColor: [255, 255, 255] } }))];
  }
  function spanRow(text, n, fill, bold) {
    return [{ content: text, colSpan: n, styles: { fillColor: fill, fontStyle: bold ? 'bold' : 'normal', halign: 'center' } }];
  }
  function redNeg(data, col) {
    if (data.section === 'body' && data.column.index === col && data.cell.raw === 'Negatywna') {
      data.cell.styles.textColor = [192, 0, 0]; data.cell.styles.fontStyle = 'bold';
    }
  }
  function legend(doc, lines, y) {
    const H = doc.internal.pageSize.getHeight();
    lines.forEach((t, i) => {
      if (y > H - 20) { doc.addPage(); y = 18; }
      if (t) { doc.setFont('LS', i === 0 ? 'bold' : 'normal'); doc.setFontSize(i === 0 ? 10 : 8.5); doc.text(t, M, y); }
      y += i === 0 ? 5 : 4.2;
    });
    return y;
  }

  function pdfLoop(doc, p, d) {
    const y = pdfHeader(doc, p, 'loop');
    const body = [];
    E.flattenLoop(d).forEach(x => {
      if (x.type === 'group') return body.push(spanRow(x.text, 12, [217, 217, 217], false));
      if (x.type === 'sub') return body.push(spanRow(x.text, 12, [242, 242, 242], true));
      const c = x.calc;
      body.push([x.lp, { content: x.name, styles: { halign: 'left' } }, x.phase, x.m.breaker || '', E.fmt(c.In), E.fmt(c.k), E.fmt(c.Ia),
        E.fmt(c.Ik), E.fmt(c.Za, 2), E.fmt(c.Zs, 2), E.fmt(c.U), c.result || '']);
    });
    doc.autoTable(Object.assign({}, baseTable, {
      startY: y, head: headFor(LOOP_HEAD, LOOP_UNITS), body: body,
      columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 37 }, 2: { cellWidth: 12 }, 3: { cellWidth: 16 }, 4: { cellWidth: 11 }, 5: { cellWidth: 8 }, 6: { cellWidth: 12 }, 7: { cellWidth: 13 }, 8: { cellWidth: 13 }, 9: { cellWidth: 13 }, 10: { cellWidth: 14 }, 11: { cellWidth: 23 } },
      didParseCell: data => redNeg(data, 11)
    }));
    legend(doc, LOOP_LEGEND, doc.lastAutoTable.finalY + 8);
  }
  function pdfIso(doc, p, loopDoc) {
    const y = pdfHeader(doc, p, 'iso');
    const body = [];
    E.flattenIso(loopDoc).forEach(x => {
      if (x.type === 'group') return body.push(spanRow(x.text, 13, [217, 217, 217], false));
      if (x.type === 'sub') return body.push(spanRow(x.text, 13, [242, 242, 242], true));
      const row = [x.lp, { content: x.name, styles: { halign: 'left' } }];
      E.ISO_COLS.forEach(col => {
        const v = x.iso[col];
        if (v === undefined) return row.push('');
        const n = E.num(v);
        const txt = n === null ? v : E.fmt(n);
        row.push(E.isoBelow(v) ? { content: txt, styles: { textColor: [192, 0, 0], fontStyle: 'bold' } } : txt);
      });
      row.push(x.result || '');
      body.push(row);
    });
    const cs = { 0: { cellWidth: 8 }, 1: { cellWidth: 40 } };
    for (let i = 2; i < 12; i++) cs[i] = { cellWidth: 11 };
    cs[12] = { cellWidth: 22 };
    doc.autoTable(Object.assign({}, baseTable, { startY: y, head: headFor(ISO_HEAD, ISO_UNITS), body: body, columnStyles: cs, didParseCell: data => redNeg(data, 12) }));
    legend(doc, ISO_LEGEND, doc.lastAutoTable.finalY + 8);
  }
  function pdfRcd(doc, p, d) {
    const y = pdfHeader(doc, p, 'rcd');
    const body = (d.rows || []).map((row, i) => {
      const c = E.calcRcd(row);
      return [i + 1, { content: row.name || '', styles: { halign: 'left' } }, E.fmt(c.t), E.fmt(c.I), c.label, c.result || ''];
    });
    doc.autoTable(Object.assign({}, baseTable, {
      startY: y, head: headFor(RCD_HEAD, RCD_UNITS), body: body,
      styles: Object.assign({}, baseTable.styles, { fontSize: 9, cellPadding: 1.5 }),
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 62 }, 2: { cellWidth: 26 }, 3: { cellWidth: 26 }, 4: { cellWidth: 28 }, 5: { cellWidth: 28 } },
      didParseCell: data => redNeg(data, 5)
    }));
    legend(doc, RCD_LEGEND, doc.lastAutoTable.finalY + 8);
  }
  function pdfFooters(doc, p) {
    const n = doc.internal.getNumberOfPages();
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setFont('LS', 'normal'); doc.setFontSize(7.5); doc.setTextColor(90);
      const loc = (p.location || '').length > 90 ? p.location.slice(0, 88) + '…' : (p.location || '');
      doc.text(loc + (loc ? '  ·  ' : '') + 'Data: ' + E.docDate(p.date), M, H - 8);
      doc.text('Strona ' + i + ' z ' + n, W - M, H - 8, { align: 'right' });
      doc.setTextColor(0);
    }
  }
  function buildPdf(p, types) {
    const doc = newPdf();
    const loop = E.getDoc(p, 'loop');
    let first = true;
    types.forEach(t => {
      const d = t === 'iso' ? loop : E.getDoc(p, t);
      if (!d) return;
      if (!first) doc.addPage();
      first = false;
      if (t === 'loop') pdfLoop(doc, p, d);
      if (t === 'iso') pdfIso(doc, p, d);
      if (t === 'rcd') pdfRcd(doc, p, d);
    });
    pdfFooters(doc, p);
    return Promise.resolve(doc.output('blob'));
  }

  /* ================= nazwy plików ================= */
  function fileName(p, types, ext) {
    const base = types.length === 1 ? E.DOC_TYPES[types[0]].file : 'Protokol';
    const parts = [base, E.safeFile(p.location || p.name), (p.date || '').slice(0, 7)].filter(Boolean);
    return parts.join('_') + '.' + ext;
  }

  window.EXPORT = { buildXlsx, buildPdf, fileName, LOOP_HEAD, ISO_HEAD, RCD_HEAD };
})();

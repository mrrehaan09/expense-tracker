import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Format Indian Rupee currency safely for PDF text (avoids Unicode glyph missing issues)
 * Example: 125000 -> "Rs. 1,25,000.00"
 */
export const formatINRPdf = (amount = 0) => {
  const num = Number(amount) || 0;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(num));
  return `${num < 0 ? '-' : ''}Rs. ${formatted}`;
};

/**
 * Format date reliably for PDF display without timezone shifting
 */
export const formatDatePdf = (dateVal) => {
  if (!dateVal) return '-';
  // If string matches YYYY-MM-DD, parse year, month, day directly
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
    const [y, m, d] = dateVal.slice(0, 10).split('-').map(Number);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${String(d).padStart(2, '0')} ${months[m - 1]} ${y}`;
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTimePdf = (dateVal) => {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Generates and downloads a complete, professional financial statement PDF
 * 
 * @param {Object} options
 * @param {Array} options.transactions - Filtered transaction objects to export
 * @param {Object} options.user - Current logged-in user details
 * @param {string} options.scopeTitle - Description of the scope (e.g. "All-Time History", "This Month", "Custom Range")
 * @param {string} options.dateRangeLabel - Text description of the timeframe
 * @param {string} options.filterDetails - Optional active filter metadata for subtitle
 * @param {string} options.groupTitle - Title of specific group if isolated
 */
export const exportTransactionsPDF = ({
  transactions = [],
  user = null,
  scopeTitle = 'Complete Financial Statement',
  dateRangeLabel = 'All Time',
  filterDetails = null,
  groupTitle = null,
}) => {
  // Sort transactions chronologically (newest first for standard bank/expense ledger)
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = new Date(a.date || a.createdAt).getTime();
    const dateB = new Date(b.date || b.createdAt).getTime();
    return dateB - dateA;
  });

  // 1. Calculate metrics strictly from the exported rows so totals match 100%
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals = {};
  const paymentMethodTotals = {};

  sortedTransactions.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    if (tx.type === 'income') {
      totalIncome += amt;
    } else {
      totalExpense += amt;
      const cat = tx.category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    }

    const pm = tx.paymentMethod || 'Other';
    paymentMethodTotals[pm] = (paymentMethodTotals[pm] || 0) + 1;
  });

  const netBalance = totalIncome - totalExpense;

  // Sorted category breakdown
  const categoryRows = Object.keys(categoryTotals)
    .map((cat) => ({
      name: cat,
      amount: categoryTotals[cat],
      percentage: totalExpense > 0 ? ((categoryTotals[cat] / totalExpense) * 100).toFixed(1) : '0.0',
    }))
    .sort((a, b) => b.amount - a.amount);

  // 2. Initialize jsPDF instance (Portrait A4: 210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const marginX = 14; // Printable width = 210 - 28 = 182mm
  let currentY = 16;

  // ── Top Brand Header ───────────────────────────────────────────────
  doc.setFillColor(15, 23, 42); // Slate-900 accent bar
  doc.rect(marginX, currentY, pageWidth - marginX * 2, 1.2, 'F');
  currentY += 6;

  // Title & Tagline
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('FinTrack', marginX, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // Slate-500
  const headerSubtitle = groupTitle
    ? `Group Financial Statement · ${groupTitle}`
    : 'Smart Daily Expense Tracker · Financial Statement';
  doc.text(headerSubtitle, marginX + 30, currentY - 0.5);

  // Right-aligned report metadata
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const now = new Date();
  const generatedDateStr = formatDateTimePdf(now);
  doc.text(`Generated: ${generatedDateStr}`, pageWidth - marginX, currentY - 1, { align: 'right' });
  doc.text(`Currency: INR (Rs.)`, pageWidth - marginX, currentY + 3.5, { align: 'right' });

  currentY += 8;

  // ── User & Scope Details Bar ───────────────────────────────────────
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, currentY, pageWidth - marginX * 2, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const userName = user?.name ? `${user.name} (${user.email || ''})` : 'Registered FinTrack User';
  doc.text(`Account: ${userName}`, marginX + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  let scopeInfoText = `Scope: ${groupTitle ? `Group [${groupTitle}]` : scopeTitle} · Timeframe: ${dateRangeLabel} · Records: ${sortedTransactions.length}`;
  if (filterDetails) {
    scopeInfoText += ` · Filter: ${filterDetails}`;
  }
  doc.text(scopeInfoText, marginX + 4, currentY + 10.2);

  currentY += 18;

  // ── Executive Summary Metrics (4 Equal KPI Cards) ───────────────────
  // Total printable width = 182mm. 4 cards with 3 gaps of 3mm = 182 - 9 = 173 / 4 = 43.25mm each
  const boxWidth = (pageWidth - marginX * 2 - 9) / 4;
  const boxHeight = 16;

  const kpis = [
    {
      title: 'TOTAL INFLOW (INCOME)',
      value: `+${formatINRPdf(totalIncome)}`,
      textColor: [5, 150, 105], // Emerald-600
    },
    {
      title: 'TOTAL OUTFLOW (EXPENSES)',
      value: `-${formatINRPdf(totalExpense)}`,
      textColor: [225, 29, 72], // Rose-600
    },
    {
      title: 'NET CASH FLOW',
      value: formatINRPdf(netBalance),
      textColor: netBalance >= 0 ? [5, 150, 105] : [225, 29, 72],
    },
    {
      title: 'TOTAL TRANSACTIONS',
      value: `${sortedTransactions.length} record${sortedTransactions.length === 1 ? '' : 's'}`,
      textColor: [15, 23, 42], // Slate-900
    },
  ];

  kpis.forEach((kpi, idx) => {
    const x = marginX + idx * (boxWidth + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, x + 3.5, currentY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(kpi.textColor[0], kpi.textColor[1], kpi.textColor[2]);
    doc.text(kpi.value, x + 3.5, currentY + 11.5);
  });

  currentY += boxHeight + 7;

  // ── Category Breakdown Table (Rendered if expenses exist) ──────────
  if (categoryRows.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Expense Category Breakdown', marginX, currentY);
    currentY += 2.5;

    const catTableBody = categoryRows.map((cat, idx) => [
      String(idx + 1),
      cat.name,
      formatINRPdf(cat.amount),
      `${cat.percentage}%`,
    ]);

    autoTable(doc, {
      startY: currentY,
      margin: { left: marginX, right: marginX },
      head: [['#', 'Category Name', 'Total Amount', '% Share']],
      body: catTableBody,
      theme: 'plain',
      styles: {
        fontSize: 7.5,
        cellPadding: 1.8,
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [30, 41, 59],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 74, halign: 'left' },
        2: { cellWidth: 55, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 45, halign: 'right' },
      },
    });

    currentY = doc.lastAutoTable.finalY + 8;
  }

  // ── Page Break Clearance for Transaction Ledger ────────────────────
  // If less than 50mm remains on Page 1, start ledger cleanly on Page 2
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 22;
  }

  // ── Full Transaction Ledger Table ──────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Transaction Ledger', marginX, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Sorted chronologically · ${sortedTransactions.length} transaction(s)`,
    marginX + 45,
    currentY
  );
  currentY += 3;

  // Column definitions (Sum = 7 + 20 + 37 + 22 + 15 + 26 + 27 + 28 = 182mm)
  const ledgerRows = sortedTransactions.map((tx, idx) => {
    const isIncome = tx.type === 'income';
    const sign = isIncome ? '+' : '-';
    const groupName = tx.group?.title || (typeof tx.group === 'string' ? tx.group : 'Personal');

    return [
      String(idx + 1),
      formatDatePdf(tx.date || tx.createdAt),
      tx.title || 'Untitled',
      groupName,
      isIncome ? 'Income' : 'Expense',
      tx.category || 'General',
      tx.paymentMethod || 'Other',
      `${sign}${formatINRPdf(tx.amount)}`,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { top: 22, bottom: 20, left: marginX, right: marginX },
    head: [['#', 'Date', 'Description / Title', 'Group', 'Type', 'Category', 'Payment Method', 'Amount']],
    body: ledgerRows,
    showHead: 'everyPage',
    theme: 'plain',
    styles: {
      fontSize: 7.2,
      cellPadding: 2.2,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [15, 23, 42], // Slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate-50
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 20, halign: 'left' },
      2: { cellWidth: 37, halign: 'left', fontStyle: 'bold' },
      3: { cellWidth: 22, halign: 'left' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 26, halign: 'left' },
      6: { cellWidth: 27, halign: 'left' },
      7: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const rawRow = sortedTransactions[data.row.index];
        const isIncome = rawRow?.type === 'income';

        // Column 4 is 'Type'
        if (data.column.index === 4) {
          data.cell.styles.textColor = isIncome ? [5, 150, 105] : [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        }
        // Column 7 is 'Amount'
        if (data.column.index === 7) {
          data.cell.styles.textColor = isIncome ? [5, 150, 105] : [15, 23, 42];
        }
      }
    },
  });

  // ── Multi-page Running Headers & Footers with Safe Margins ─────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running top header on page 2 and onwards (never collides with table starting at Y=22)
    if (i > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(
        `FinTrack · ${groupTitle ? `Group: ${groupTitle}` : scopeTitle}`,
        marginX,
        11
      );
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - marginX,
        11,
        { align: 'right' }
      );
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginX, 14, pageWidth - marginX, 14);
    }

    // Running footer on EVERY page (divider at pageHeight - 13, text at pageHeight - 8)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // Slate-400

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 13, pageWidth - marginX, pageHeight - 13);

    doc.text(
      `Generated by FinTrack Smart Expense Tracker · Currency: INR (Rs.)`,
      marginX,
      pageHeight - 8
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  // 3. Save PDF File
  const dateStr = now.toISOString().slice(0, 10);
  const cleanScope = (groupTitle || scopeTitle)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 25);
  const fileName = `FinTrack_Statement_${cleanScope}_${dateStr}.pdf`;
  doc.save(fileName);
  return { success: true, fileName };
};

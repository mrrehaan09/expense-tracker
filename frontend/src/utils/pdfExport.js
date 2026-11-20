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
 * Format date for PDF display
 */
const formatDatePdf = (dateVal) => {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTimePdf = (dateVal) => {
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
 * @param {Array} options.transactions - List of transaction objects to export
 * @param {Object} options.user - Current logged-in user details
 * @param {string} options.scopeTitle - Description of the scope (e.g. "All-Time Complete Ledger" or "Filtered Range")
 * @param {string} options.dateRangeLabel - Text description of the timeframe
 * @param {Object} options.filterDetails - Optional active filter metadata for subtitle
 */
export const exportTransactionsPDF = ({
  transactions = [],
  user = null,
  scopeTitle = 'All-Time Complete History',
  dateRangeLabel = 'All Time',
  filterDetails = null,
}) => {
  // 1. Calculate overall metrics from the exported dataset
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals = {};
  const paymentMethodTotals = {};

  transactions.forEach((tx) => {
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

  // 2. Initialize jsPDF instance (Portrait A4)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  let currentY = 16;

  // ── Top Brand Header ───────────────────────────────────────────────
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(marginX, currentY, pageWidth - marginX * 2, 1.2, 'F');
  currentY += 6;

  // Title & Tagline
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text('FinTrack', marginX, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text('Smart Daily Expense Tracker · Financial Statement', marginX + 30, currentY - 0.5);

  // Right-aligned report metadata
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const now = new Date();
  const generatedDateStr = formatDateTimePdf(now);
  doc.text(`Generated: ${generatedDateStr}`, pageWidth - marginX, currentY - 1, { align: 'right' });
  doc.text(`Currency: INR (Rs.)`, pageWidth - marginX, currentY + 3.5, { align: 'right' });

  currentY += 8;

  // User & Scope details bar
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, currentY, pageWidth - marginX * 2, 13, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const userName = user?.name ? `${user.name} (${user.email || ''})` : 'Registered User';
  doc.text(`Account: ${userName}`, marginX + 4, currentY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  let scopeInfoText = `Scope: ${scopeTitle} · Timeframe: ${dateRangeLabel} · Records: ${transactions.length}`;
  if (filterDetails) {
    scopeInfoText += ` · Filter: ${filterDetails}`;
  }
  doc.text(scopeInfoText, marginX + 4, currentY + 9.8);

  currentY += 17;

  // ── Executive Summary Metrics (4 KPI Cards) ─────────────────────────
  const boxWidth = (pageWidth - marginX * 2 - 9) / 4;
  const boxHeight = 16;

  const kpis = [
    {
      title: 'TOTAL INFLOW (INCOME)',
      value: formatINRPdf(totalIncome),
      textColor: [5, 150, 105], // Emerald-600
    },
    {
      title: 'TOTAL OUTFLOW (EXPENSES)',
      value: formatINRPdf(totalExpense),
      textColor: [225, 29, 72], // Rose-600
    },
    {
      title: 'NET CASH FLOW',
      value: formatINRPdf(netBalance),
      textColor: netBalance >= 0 ? [5, 150, 105] : [225, 29, 72],
    },
    {
      title: 'TRANSACTION COUNT',
      value: `${transactions.length} record${transactions.length === 1 ? '' : 's'}`,
      textColor: [30, 41, 59], // Slate-800
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

  currentY += boxHeight + 6;

  // ── Category Breakdown Table (if expenses exist) ────────────────────
  if (categoryRows.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Expense Category Breakdown', marginX, currentY);
    currentY += 2;

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
        0: { cellWidth: 10, halign: 'center' },
        1: { halign: 'left' },
        2: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 25, halign: 'right' },
      },
    });

    currentY = doc.lastAutoTable.finalY + 7;
  }

  // ── Check if we need page break before transaction ledger ──────────
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 20;
  }

  // ── Full Transaction Ledger Table ──────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Complete Transaction Ledger', marginX, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Displaying all ${transactions.length} record(s) sorted chronologically`,
    marginX + 60,
    currentY
  );
  currentY += 2.5;

  const ledgerRows = transactions.map((tx, idx) => {
    const isIncome = tx.type === 'income';
    const sign = isIncome ? '+' : '-';
    return [
      String(idx + 1),
      formatDatePdf(tx.date || tx.createdAt),
      tx.title || 'Untitled',
      isIncome ? 'Income' : 'Expense',
      tx.category || 'General',
      tx.paymentMethod || 'Other',
      tx.note ? String(tx.note).slice(0, 45) : '-',
      `${sign}${formatINRPdf(tx.amount)}`,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { top: 20, bottom: 18, left: marginX, right: marginX },
    head: [['#', 'Date', 'Description / Title', 'Type', 'Category', 'Payment Method', 'Notes', 'Amount']],
    body: ledgerRows,
    showHead: 'everyPage',
    theme: 'plain',
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [30, 41, 59], // Slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Slate-50
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22, halign: 'left' },
      2: { cellWidth: 40, halign: 'left', fontStyle: 'bold' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 26, halign: 'left' },
      5: { cellWidth: 22, halign: 'left' },
      6: { cellWidth: 26, halign: 'left', textColor: [100, 116, 139] },
      7: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Highlight Income vs Expense styling
      if (data.section === 'body') {
        const rawRow = transactions[data.row.index];
        const isIncome = rawRow?.type === 'income';

        // Column 3 is 'Type'
        if (data.column.index === 3) {
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

  // ── Multi-page Running Headers & Footers with Page Numbers ─────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running top rule on page 2 and onwards
    if (i > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text(
        `FinTrack · Financial Statement (${scopeTitle})`,
        marginX,
        12
      );
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth - marginX,
        12,
        { align: 'right' }
      );
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(marginX, 14, pageWidth - marginX, 14);
    }

    // Running footer on every page
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // Slate-400

    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.text(
      `Generated by FinTrack Smart Daily Expense Tracker · All amounts in INR (Rs.)`,
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
  const cleanScope = scopeTitle.toLowerCase().includes('all') ? 'All_Time' : 'Filtered';
  const fileName = `FinTrack_Statement_${cleanScope}_${dateStr}.pdf`;
  doc.save(fileName);
  return { success: true, fileName };
};

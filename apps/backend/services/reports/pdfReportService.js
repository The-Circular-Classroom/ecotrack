const PDFDocument = require('pdfkit');

// ─── BRAND COLOURS ─────────────────────────────────────────────────────────────

const C = {
    primary:      '#69aa56',
    primaryHover: '#5a9448',
    primaryDark:  '#213c2d',
    primaryLight: '#b9ff9b',
    primaryBg:    '#f0fdf4',

    error:        '#d32f2f',
    warning:      '#ed6c02',

    textPrimary:  '#111827',
    textSecondary:'#6b7280',
    textDisabled: '#9ca3af',

    border:       '#e5e7eb',
    borderLight:  '#f3f4f6',
    white:        '#ffffff',
};

const CHART_PALETTE = ['#69aa56', '#213c2d', '#5a9448', '#b9ff9b', '#0288d1', '#ed6c02', '#d32f2f', '#6b7280', '#2e7d32', '#9ca3af', '#111827', '#e5e7eb'];

// ─── LAYOUT ────────────────────────────────────────────────────────────────────

const PAGE_MARGIN = 50;
const PAGE_WIDTH  = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

// Footer positioned 30px from the absolute bottom of the page.
// This sits below the content area (which ends at PAGE_HEIGHT - PAGE_MARGIN = ~792)
// but is safely within the physical page bounds.
const FOOTER_Y = PAGE_HEIGHT - 30;

// ─── CORE HELPERS ──────────────────────────────────────────────────────────────

function ensureSpace(doc, needed) {
    if (doc.y + needed > PAGE_HEIGHT - PAGE_MARGIN - 30) doc.addPage();
    return doc.y;
}

function sectionTitle(doc, text) {
    ensureSpace(doc, 40);
    doc.moveDown(1.2);
    const y = doc.y;
    doc.save();
    doc.rect(PAGE_MARGIN, y, 3, 18).fill(C.primary);
    doc.restore();
    doc.fontSize(14).font('Helvetica-Bold').fillColor(C.primaryDark);
    doc.text(text, PAGE_MARGIN + 12, y, { lineBreak: false });
    doc.y = y + 24;
}

function sectionDesc(doc, text) {
    doc.fontSize(8.5).font('Helvetica').fillColor(C.textSecondary);
    doc.text(text, PAGE_MARGIN, doc.y, { width: CONTENT_WIDTH, lineGap: 2 });
    doc.moveDown(0.6);
}

function statLine(doc, label, value) {
    doc.fontSize(9).font('Helvetica').fillColor(C.textSecondary);
    doc.text(`${label}: `, PAGE_MARGIN, doc.y, { continued: true });
    doc.font('Helvetica-Bold').fillColor(C.textPrimary).text(String(value));
}

function hr(doc) {
    const y = doc.y + 3;
    doc.moveTo(PAGE_MARGIN, y).lineTo(PAGE_WIDTH - PAGE_MARGIN, y).lineWidth(0.5).strokeColor(C.border).stroke();
    doc.y = y + 6;
}

function fmtNum(n)  { return (n == null) ? '—' : Number(n).toLocaleString('en-SG'); }
function fmtWeight(kg) { return (kg == null) ? '—' : `${Number(kg).toLocaleString('en-SG', { minimumFractionDigits: 1, maximumFractionDigits: 3 })} kg`; }
function fmtPct(n)  { return (n == null) ? '—' : `${n}%`; }
function fmtDev(n)  { return (n == null) ? '—' : n >= 0 ? `+${n}` : String(n); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; }

// ─── TABLE HELPERS (overflow-safe) ─────────────────────────────────────────────

function tableHeader(doc, columns) {
    ensureSpace(doc, 22);
    const y = doc.y;
    doc.save();
    doc.rect(PAGE_MARGIN, y - 2, CONTENT_WIDTH, 16).fill(C.primaryBg);
    doc.restore();
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(C.primaryDark);
    for (const col of columns) {
        doc.text(col.label, col.x, y, { width: col.width, align: col.align || 'left', lineBreak: false });
    }
    doc.y = y + 14;
    hr(doc);
    return columns;
}

function tableRow(doc, columns, values, options = {}) {
    const fontSize = options.fontSize || 7.5;
    const font = options.bold ? 'Helvetica-Bold' : 'Helvetica';

    doc.font(font).fontSize(fontSize);
    let maxH = 12;
    for (let i = 0; i < columns.length; i++) {
        const h = doc.heightOfString(String(values[i] ?? ''), { width: columns[i].width - 4 });
        if (h > maxH) maxH = h;
    }

    ensureSpace(doc, maxH + 4);
    const y = doc.y;

    if (options.stripe) {
        doc.save();
        doc.rect(PAGE_MARGIN, y - 1, CONTENT_WIDTH, maxH + 3).fill(C.borderLight);
        doc.restore();
    }

    doc.font(font).fontSize(fontSize).fillColor(C.textPrimary);
    for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        if (col.colourFn) doc.fillColor(col.colourFn(values[i]));
        doc.text(String(values[i] ?? ''), col.x, y, { width: col.width - 4, align: col.align || 'left', lineBreak: true });
        doc.fillColor(C.textPrimary);
    }

    doc.y = y + maxH + 3;
}

// ─── STAT BOX GRID ─────────────────────────────────────────────────────────────

function drawStatBoxes(doc, items) {
    const boxW = (CONTENT_WIDTH - 20) / 3;
    const boxH = 42;
    const totalH = Math.ceil(items.length / 3) * (boxH + 8);
    ensureSpace(doc, totalH + 4);
    const startY = doc.y;

    for (let i = 0; i < items.length; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = PAGE_MARGIN + col * (boxW + 10);
        const y = startY + row * (boxH + 8);

        doc.save();
        doc.roundedRect(x, y, boxW, boxH, 6).fill(C.primaryBg);
        doc.rect(x, y, 3, boxH).fill(C.primary);
        doc.restore();

        doc.fontSize(7.5).font('Helvetica').fillColor(C.textSecondary);
        doc.text(items[i].label, x + 12, y + 6, { width: boxW - 20, lineBreak: false });
        doc.fontSize(13).font('Helvetica-Bold').fillColor(C.primaryDark);
        doc.text(items[i].value, x + 12, y + 22, { width: boxW - 20, lineBreak: false });
    }

    doc.y = startY + totalH + 4;
}

// ─── CHART HELPERS ─────────────────────────────────────────────────────────────

function drawBarChart(doc, data, seriesNames, opts = {}) {
    const chartW = opts.width  || CONTENT_WIDTH;
    const chartH = opts.height || 130;
    const totalNeeded = chartH + 45;

    ensureSpace(doc, totalNeeded);

    const x0 = PAGE_MARGIN;
    const yTop = doc.y;
    const yBase = yTop + chartH;

    const maxVal = Math.max(1, ...data.flatMap(d => d.values));
    const groupW = (chartW - 20) / data.length;
    const barW   = Math.min(16, (groupW - 6) / seriesNames.length);

    // Y-axis gridlines
    for (let i = 0; i <= 4; i++) {
        const gy = yBase - (chartH * i / 4);
        doc.moveTo(x0, gy).lineTo(x0 + chartW, gy).lineWidth(0.3).strokeColor(C.border).stroke();
        doc.fontSize(6).font('Helvetica').fillColor(C.textDisabled);
        doc.text(fmtNum(Math.round(maxVal * i / 4)), x0 - 42, gy - 4, { width: 38, align: 'right', lineBreak: false });
    }

    // Bars
    for (let g = 0; g < data.length; g++) {
        const gx = x0 + 10 + g * groupW;
        for (let s = 0; s < data[g].values.length; s++) {
            const val = data[g].values[s];
            const barH = (val / maxVal) * chartH;
            doc.save();
            doc.rect(gx + s * (barW + 1), yBase - barH, barW, barH).fill(CHART_PALETTE[s % CHART_PALETTE.length]);
            doc.restore();
        }
        doc.fontSize(6).font('Helvetica').fillColor(C.textSecondary);
        doc.text(String(data[g].label), gx, yBase + 4, { width: groupW - 4, align: 'center', lineBreak: false });
    }

    // Legend
    const legendY = yBase + 16;
    let lx = x0;
    for (let s = 0; s < seriesNames.length; s++) {
        doc.save();
        doc.rect(lx, legendY, 8, 8).fill(CHART_PALETTE[s % CHART_PALETTE.length]);
        doc.restore();
        doc.fontSize(6.5).font('Helvetica').fillColor(C.textPrimary);
        const nameW = doc.widthOfString(seriesNames[s]);
        doc.text(seriesNames[s], lx + 11, legendY, { lineBreak: false });
        lx += nameW + 26;
    }

    doc.y = legendY + 18;
}

function drawHorizontalBars(doc, data, opts = {}) {
    const maxItems = opts.maxItems || 10;
    const items    = data.slice(0, maxItems);
    const barH     = 14;
    const labelW   = opts.labelWidth || 160;
    const barMaxW  = CONTENT_WIDTH - labelW - 60;
    const maxVal   = Math.max(1, ...items.map(d => d.value));
    const totalNeeded = items.length * (barH + 4) + 4;

    ensureSpace(doc, totalNeeded);

    for (let i = 0; i < items.length; i++) {
        const y = doc.y;
        const barW = (items[i].value / maxVal) * barMaxW;

        doc.fontSize(7).font('Helvetica').fillColor(C.textPrimary);
        doc.text(items[i].label, PAGE_MARGIN, y + 2, { width: labelW - 8, align: 'right', lineBreak: false });

        doc.save();
        doc.roundedRect(PAGE_MARGIN + labelW, y + 1, Math.max(barW, 2), barH - 2, 3).fill(items[i].colour || C.primary);
        doc.restore();

        doc.fontSize(7).font('Helvetica-Bold').fillColor(C.textPrimary);
        doc.text(fmtNum(items[i].value), PAGE_MARGIN + labelW + barW + 4, y + 2, { lineBreak: false });

        doc.y = y + barH + 3;
    }
}

/**
 * Compact donut chart with side legend. Designed to fit within ~160px height.
 */
function drawDonutChart(doc, slices) {
    const chartH = 155;
    ensureSpace(doc, chartH);

    const startY = doc.y;
    const cx     = PAGE_MARGIN + 65;
    const cy     = startY + 65;
    const outerR = 55;
    const innerR = 28;
    const total  = slices.reduce((s, d) => s + d.value, 0) || 1;

    let startAngle = -Math.PI / 2;

    for (const slice of slices) {
        const sweep = (slice.value / total) * 2 * Math.PI;
        if (sweep < 0.001) { startAngle += sweep; continue; }
        const end = startAngle + sweep;

        doc.save();
        const steps = Math.max(20, Math.ceil(sweep * 30));
        doc.moveTo(cx + outerR * Math.cos(startAngle), cy + outerR * Math.sin(startAngle));
        for (let i = 1; i <= steps; i++) {
            const a = startAngle + (sweep * i / steps);
            doc.lineTo(cx + outerR * Math.cos(a), cy + outerR * Math.sin(a));
        }
        for (let i = steps; i >= 0; i--) {
            const a = startAngle + (sweep * i / steps);
            doc.lineTo(cx + innerR * Math.cos(a), cy + innerR * Math.sin(a));
        }
        doc.closePath().fill(slice.colour || C.primary);
        doc.restore();

        startAngle = end;
    }

    // Centre label
    doc.fontSize(13).font('Helvetica-Bold').fillColor(C.primaryDark);
    doc.text(fmtNum(total), cx - 26, cy - 8, { width: 52, align: 'center', lineBreak: false });
    doc.fontSize(6).font('Helvetica').fillColor(C.textSecondary);
    doc.text('pieces', cx - 26, cy + 7, { width: 52, align: 'center', lineBreak: false });

    // Legend — right side
    const legendX = cx + outerR + 30;
    let ly = startY + 4;
    for (const slice of slices.slice(0, 12)) {
        doc.save();
        doc.roundedRect(legendX, ly, 8, 8, 2).fill(slice.colour || C.primary);
        doc.restore();
        const pct = ((slice.value / total) * 100).toFixed(1);
        doc.fontSize(7).font('Helvetica').fillColor(C.textPrimary);
        doc.text(`${slice.label}  (${pct}%)`, legendX + 12, ly, { lineBreak: false });
        ly += 12;
    }

    doc.y = startY + chartH;
}

function drawParticipationBar(doc, participating, total) {
    ensureSpace(doc, 28);
    const y = doc.y;
    const barW = CONTENT_WIDTH - 80;
    const barH = 18;
    const pct = total > 0 ? participating / total : 0;

    doc.save();
    doc.roundedRect(PAGE_MARGIN, y, barW, barH, 4).fill(C.borderLight);
    doc.roundedRect(PAGE_MARGIN, y, Math.max(barW * pct, 4), barH, 4).fill(C.primary);
    doc.restore();

    doc.fontSize(10).font('Helvetica-Bold').fillColor(C.primaryDark);
    doc.text(`${(pct * 100).toFixed(1)}%`, PAGE_MARGIN + barW + 8, y + 2, { lineBreak: false });

    doc.y = y + barH + 8;
}

// ─── FOOTER + HEADER ───────────────────────────────────────────────────────────

/**
 * Adds footer separator line, confidential text, and page numbers to every page.
 *
 * FIX: The previous version caused ghost/empty pages because doc.text() at a Y
 * position past the bottom margin (PAGE_HEIGHT - PAGE_MARGIN) triggers PDFKit's
 * auto-pagination — even with lineBreak:false. Each doc.text() call in the loop
 * created a new blank page, doubling the page count.
 *
 * Solution: Temporarily set the current page's bottom margin to 0 before writing
 * footer text, then restore it. This prevents the auto-pagination check from
 * firing while we draw in the footer zone.
 */
function addFooters(doc, footerText, footerLogo) {
    const range = doc.bufferedPageRange();
    const logoSize = 10;
    const logoOffset = footerLogo ? logoSize + 4 : 0; // space taken by logo + gap

    for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);

        // ── Temporarily disable bottom margin to prevent auto-pagination ──
        const savedBottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;

        // Footer separator line
        const lineY = FOOTER_Y - 8;
        doc.moveTo(PAGE_MARGIN, lineY)
           .lineTo(PAGE_WIDTH - PAGE_MARGIN, lineY)
           .lineWidth(0.4)
           .strokeColor(C.border)
           .stroke();

        // Footer logo — small symbol left of the text
        if (footerLogo) {
            try {
                doc.image(footerLogo, PAGE_MARGIN, FOOTER_Y - 2, {
                    width: logoSize, height: logoSize,
                });
            } catch (_) { /* logo not found — skip silently */ }
        }

        // Left: confidential text (shifted right if logo present)
        doc.fontSize(7).font('Helvetica').fillColor(C.textDisabled);
        doc.text(footerText, PAGE_MARGIN + logoOffset, FOOTER_Y, {
            width: CONTENT_WIDTH / 2 - logoOffset,
            align: 'left',
            lineBreak: false,
        });

        // Right: page number
        doc.text(`Page ${i + 1} of ${range.count}`, PAGE_WIDTH / 2, FOOTER_Y, {
            width: CONTENT_WIDTH / 2,
            align: 'right',
            lineBreak: false,
        });

        // ── Restore bottom margin ──
        doc.page.margins.bottom = savedBottom;
    }
}

function drawCoverHeader(doc, { title, subtitle, generatedAt, generatedBy, headerLogo }) {
    doc.rect(0, 0, PAGE_WIDTH, 95).fill(C.primaryDark);
    doc.save();
    doc.rect(0, 82, PAGE_WIDTH, 13).fill(C.primary);
    doc.restore();

    // Header logo — inline left of the title
    const logoW = 40;
    const logoGap = 10;
    let textX = PAGE_MARGIN;

    if (headerLogo) {
        try {
            doc.image(headerLogo, PAGE_MARGIN, 16, { width: logoW, height: logoW, fit: [logoW, logoW] });
            textX = PAGE_MARGIN + logoW + logoGap;
        } catch (_) { /* logo not found — skip silently */ }
    }

    doc.fontSize(22).font('Helvetica-Bold').fillColor(C.white);
    doc.text(title, textX, 20, { lineBreak: false });
    doc.fontSize(11).font('Helvetica').fillColor(C.primaryLight);
    doc.text(subtitle, textX, 46, { lineBreak: false });

    const dateStr = new Date(generatedAt).toLocaleString('en-SG', { dateStyle: 'long', timeStyle: 'short' });
    doc.fillColor(C.white).fontSize(8).font('Helvetica');
    doc.text(`As of: ${dateStr}`, textX, 64, { lineBreak: false });

    if (generatedBy) {
        doc.text(`Prepared by: ${generatedBy}`, PAGE_WIDTH - PAGE_MARGIN - 180, 64, { width: 180, align: 'right', lineBreak: false });
    }

    doc.y = 110;
    doc.fillColor(C.textPrimary);
}

// ════════════════════════════════════════════════════════════════════════════════
//  SCHOOL REPORT
// ════════════════════════════════════════════════════════════════════════════════

function generateSchoolReport(data) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, bufferPages: true,
            autoFirstPage: true,
            info: { Title: `TCC School Report — ${data.profile?.schoolName ?? 'Unknown'}`, Author: 'The Circular Classroom' } });

        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        const {
            // All-time
            profile, collectionOverview, inventoryByItem, driveList,
            // Year-filtered
            drivePerformance, periodActivity, sustainability, donationBreakdown,
            monthlyTrends,
            // Admin-only
            collaborations, productsCreated,
            // Meta
            generatedAt, reportYear,
        } = data;
        const schoolName = profile?.schoolName ?? 'Unknown School';

        drawCoverHeader(doc, { title: schoolName, subtitle: 'School Analytics Report', generatedAt, headerLogo: data.headerLogo });

        // ════════════════════════════════════════════════════════════════
        //  PART A — ALL-TIME SCHOOL SNAPSHOT
        // ════════════════════════════════════════════════════════════════

        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(C.primaryDark);
        doc.text('Part A — School Snapshot', PAGE_MARGIN);
        doc.fontSize(8).font('Helvetica').fillColor(C.textSecondary);
        doc.text('Cumulative data across all years. Not filtered by report period.', PAGE_MARGIN);
        doc.moveDown(0.3);

        // ── A1. School Profile ──────────────────────────────────────────
        if (profile) {
            sectionTitle(doc, 'School Profile');
            sectionDesc(doc, 'Overview of the school\'s information and key contact persons within the TCC programme.');

            const detailFields = [
                ['Address',     profile.address],
                ['Postal Code', profile.postalCode],
                ['Zone',        profile.zoneCode],
                ['Level',       profile.mainlevelCode],
                ['Nearest MRT', profile.mrtDesc],
                ['Cooperating', profile.isCooperating ? 'Yes' : 'No'],
                ['School Email', profile.schoolEmail],
                ['School Phone', profile.schoolNumber ? `+65 ${profile.schoolNumber}` : null],
            ].filter(([, v]) => v);

            const colW = (CONTENT_WIDTH - 10) / 2;
            const cellH = 28;
            const rows = Math.ceil(detailFields.length / 2);
            ensureSpace(doc, rows * cellH + 8);

            const startY = doc.y;

            for (let i = 0; i < detailFields.length; i++) {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const x = PAGE_MARGIN + col * (colW + 10);
                const y = startY + row * cellH;

                if (col === 0 && row % 2 === 0) {
                    doc.save();
                    doc.rect(PAGE_MARGIN, y - 2, CONTENT_WIDTH, cellH).fill(C.borderLight);
                    doc.restore();
                }

                doc.fontSize(7).font('Helvetica').fillColor(C.textDisabled);
                doc.text(detailFields[i][0], x, y, { lineBreak: false });
                doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.textPrimary);
                doc.text(String(detailFields[i][1]), x, y + 11, { width: colW - 4, lineBreak: false });
            }

            doc.y = startY + rows * cellH + 6;
            doc.moveDown(0.5);
        }

        // ── A2. Collection Overview ─────────────────────────────────────
        if (collectionOverview) {
            sectionTitle(doc, 'Collection Overview');
            sectionDesc(doc, 'Current inventory snapshot across the four core status groups — School Stock, PSG Stock, For Repurposing, and Waste.');

            const pct = collectionOverview.percentages || {};
            drawStatBoxes(doc, [
                { label: 'Total Pieces', value: fmtNum(collectionOverview.totalPieces) },
                { label: `School Stock (${fmtPct(pct.schoolStock)})`, value: fmtNum(collectionOverview.schoolStock) },
                { label: `PSG Stock (${fmtPct(pct.psg)})`, value: fmtNum(collectionOverview.psg) },
                { label: `For Repurposing (${fmtPct(pct.repurposing)})`, value: fmtNum(collectionOverview.repurposing) },
                { label: `Waste / Disposed (${fmtPct(pct.waste)})`, value: fmtNum(collectionOverview.waste) },
                { label: 'Total Weight', value: fmtWeight(collectionOverview.totalWeightKg) },
            ]);
            doc.moveDown(0.5);
        }

        // ── A3. Inventory by Item ───────────────────────────────────────
        if (inventoryByItem?.items?.length > 0) {
            sectionTitle(doc, 'Inventory by Item');
            sectionDesc(doc, 'Breakdown of current sellable and PSG stock by uniform category, with size-level detail.');

            const cols = tableHeader(doc, [
                { label: 'Category', x: PAGE_MARGIN, width: 120 },
                { label: 'Gender', x: 180, width: 50 },
                { label: 'Total', x: 240, width: 55, align: 'right' },
                { label: 'School Stock', x: 305, width: 70, align: 'right' },
                { label: 'PSG', x: 385, width: 55, align: 'right' },
                { label: 'Weight', x: 450, width: 90, align: 'right' },
            ]);

            inventoryByItem.items.forEach((item, i) => {
                tableRow(doc, cols, [item.categoryName, item.gender || '—', fmtNum(item.totalPieces), fmtNum(item.schoolStock), fmtNum(item.psg), fmtWeight(item.estimatedWeightKg)], { stripe: i % 2 === 0 });

                if (item.sizes?.length > 0 && item.totalPieces > 0) {
                    const barH = 11;
                    const gap = 2;
                    const labelW = 70;
                    const valueW = 40;
                    const barMaxW = CONTENT_WIDTH - labelW - valueW - 20;
                    const maxVal = Math.max(1, ...item.sizes.map(s => s.total));
                    const totalNeeded = item.sizes.length * (barH + gap) + 4;

                    ensureSpace(doc, totalNeeded);

                    for (let si = 0; si < item.sizes.length; si++) {
                        const size = item.sizes[si];
                        const y = doc.y;
                        const barW = Math.max((size.total / maxVal) * barMaxW, 2);

                        doc.fontSize(6.5).font('Helvetica').fillColor(C.textPrimary);
                        doc.text(size.sizeName, PAGE_MARGIN + 10, y + 1, { width: labelW - 8, align: 'right', lineBreak: false });

                        doc.save();
                        doc.roundedRect(PAGE_MARGIN + 10 + labelW, y, barW, barH, 3).fill(C.primary);
                        doc.restore();

                        doc.fontSize(6.5).font('Helvetica-Bold').fillColor(C.textPrimary);
                        doc.text(fmtNum(size.total), PAGE_MARGIN + 10 + labelW + barW + 4, y + 1, { lineBreak: false });

                        doc.y = y + barH + gap;
                    }

                    doc.fillColor(C.textPrimary);
                    doc.y += 2;
                }
            });
            doc.moveDown(0.5);
        }

        // ── A4. Donation Drives ─────────────────────────────────────────
        if (driveList) {
            sectionTitle(doc, 'Donation Drives');
            sectionDesc(doc, 'All donation drives organised for this school, with their current status.');

            const summary = driveList.summary;
            if (summary) {
                statLine(doc, 'Total Drives', fmtNum(summary.total));
                statLine(doc, 'Active', fmtNum(summary.active));
                statLine(doc, 'Completed', fmtNum(summary.completed));
                doc.moveDown(0.5);
            }

            if (driveList.drives?.length > 0) {
                const cols = tableHeader(doc, [
                    { label: 'Drive Name', x: PAGE_MARGIN, width: 170 },
                    { label: 'Start', x: 230, width: 80 },
                    { label: 'End', x: 320, width: 80 },
                    { label: 'Status', x: 410, width: 70 },
                    { label: 'Location', x: 485, width: 60 },
                ]);
                driveList.drives.forEach((d, i) => tableRow(doc, cols, [d.driveName, fmtDate(d.startDate), fmtDate(d.endDate), d.status ?? '—', d.location || '—'], { stripe: i % 2 === 0 }));
            }
            doc.moveDown(0.5);
        }

        // ════════════════════════════════════════════════════════════════
        //  PART B — REPORT YEAR ACTIVITY
        // ════════════════════════════════════════════════════════════════

        doc.addPage();
        doc.fontSize(10).font('Helvetica-Bold').fillColor(C.primaryDark);
        doc.text(`Part B — ${reportYear || 'Annual'} Activity`, PAGE_MARGIN);
        doc.fontSize(8).font('Helvetica').fillColor(C.textSecondary);
        doc.text(`Data filtered to the ${reportYear || 'selected'} reporting year.`, PAGE_MARGIN);
        doc.moveDown(0.3);

        // ── B1. Period Activity KPIs ────────────────────────────────────
        if (periodActivity) {
            sectionTitle(doc, `${reportYear || 'Annual'} Period Activity`);
            sectionDesc(doc, `Donation, sale, repurposing, and disposal volumes for ${reportYear || 'the reporting year'}.`);

            drawStatBoxes(doc, [
                { label: 'Donated', value: fmtNum(periodActivity.donated) },
                { label: 'Sold', value: fmtNum(periodActivity.sold) },
                { label: 'Repurposed', value: fmtNum(periodActivity.repurposed) },
                { label: 'Disposed', value: fmtNum(periodActivity.disposed) },
                { label: 'On Hand (current)', value: fmtNum(periodActivity.onHand) },
                { label: 'Donated Weight', value: fmtWeight(periodActivity.donatedWeightKg) },
            ]);
            doc.moveDown(0.5);

            // Circularity rates
            const rates = periodActivity.rates;
            if (rates) {
                ensureSpace(doc, 30);
                doc.fontSize(8).font('Helvetica-Bold').fillColor(C.primaryDark);
                doc.text('Circularity Rates', PAGE_MARGIN);
                doc.moveDown(0.3);

                const rateItems = [
                    { label: 'Resold rate',     value: rates.sellThroughRate, colour: '#BA7517' },
                    { label: 'Repurposed rate', value: rates.repurposeRate,   colour: '#0f766e' },
                    { label: 'Recovered rate',  value: rates.recoveryRate,    colour: '#1d4ed8' },
                    { label: 'Disposal rate',   value: rates.disposalRate,    colour: C.textDisabled },
                ];

                ensureSpace(doc, 16);
                const rateStartY = doc.y;
                const chipW = (CONTENT_WIDTH - 18) / 4;

                for (let ri = 0; ri < rateItems.length; ri++) {
                    const rx = PAGE_MARGIN + ri * (chipW + 6);
                    doc.save();
                    doc.roundedRect(rx, rateStartY, chipW, 22, 6).fill(C.borderLight);
                    doc.restore();
                    doc.fontSize(6.5).font('Helvetica').fillColor(C.textSecondary);
                    doc.text(rateItems[ri].label, rx + 6, rateStartY + 3, { lineBreak: false });
                    doc.fontSize(10).font('Helvetica-Bold').fillColor(rateItems[ri].colour);
                    doc.text(`${rateItems[ri].value ?? 0}%`, rx + 6, rateStartY + 12, { lineBreak: false });
                }

                doc.y = rateStartY + 30;
            }
            doc.moveDown(0.5);
        }

        // ── B2. Monthly Donation Trends ─────────────────────────────────
        if (monthlyTrends?.monthly?.length > 0) {
            const hasData = monthlyTrends.monthly.some(m => m.donated > 0 || m.sold > 0 || m.repurposed > 0 || m.disposed > 0);
            if (hasData) {
                sectionTitle(doc, `Monthly Trends (${reportYear || 'Annual'})`);
                sectionDesc(doc, 'Monthly donated, sold, repurposed, and disposed volumes for the reporting year.');

                const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthData = monthlyTrends.monthly.map((m, i) => ({
                    label: MONTH_SHORT[i] || `M${i + 1}`,
                    values: [m.donated || 0, m.sold || 0, m.repurposed || 0, m.disposed || 0],
                }));

                drawBarChart(doc, monthData, ['Donated', 'Sold', 'Repurposed', 'Disposed'], { height: 110 });
                doc.moveDown(0.5);
            }
        }

        // ── B3. Donation Breakdown ──────────────────────────────────────
        if (donationBreakdown) {
            const categories = donationBreakdown.categories || [];
            if (categories.length > 0) {
                sectionTitle(doc, `Donation Breakdown (${reportYear || 'Annual'})`);
                sectionDesc(doc, 'Donation inflow grouped by category for the selected reporting year.');

                drawStatBoxes(doc, [
                    { label: 'Donated Items', value: fmtNum(donationBreakdown.totalQuantity) },
                    { label: 'Estimated Weight', value: fmtWeight(donationBreakdown.totalEstimatedWeightKg) },
                ]);
                doc.moveDown(0.5);

                drawHorizontalBars(doc, categories.slice(0, 8).map(c => ({
                    label: c.categoryName,
                    value: c.totalQuantity,
                })), { maxItems: 8, labelWidth: 130 });
                doc.moveDown(0.5);
            }
        }

        // ── B4. Sustainability ──────────────────────────────────────────
        if (sustainability) {
            sectionTitle(doc, `Sustainability (${reportYear || 'Annual'})`);
            sectionDesc(doc, 'Weight diverted from waste through resale and repurposing, plus disposal totals.');

            drawStatBoxes(doc, [
                { label: 'Diverted Weight', value: fmtWeight(sustainability.divertedKg) },
                { label: 'Donated Weight', value: fmtWeight(sustainability.donatedKg) },
                { label: 'Sold Weight', value: fmtWeight(sustainability.soldKg) },
                { label: 'Repurposed Weight', value: fmtWeight(sustainability.repurposedKg) },
                { label: 'Disposed Weight', value: fmtWeight(sustainability.disposedKg) },
                { label: 'Diversion Rate', value: `${sustainability.diversionRate ?? 0}%` },
            ]);
            doc.moveDown(0.3);

            if (sustainability.categories?.length > 0) {
                doc.moveDown(0.3);
                doc.fontSize(8).font('Helvetica-Bold').fillColor(C.primaryDark);
                doc.text('Weight by Top Categories', PAGE_MARGIN);
                doc.moveDown(0.3);

                drawHorizontalBars(doc, sustainability.categories.slice(0, 8).map(c => ({
                    label: c.categoryName,
                    value: Math.round((c.soldKg || 0) + (c.repurposedKg || 0)),
                })), { maxItems: 8, labelWidth: 130 });
            }
            doc.moveDown(0.5);
        }

        // ── B5. Drive Performance ───────────────────────────────────────
        if (drivePerformance?.length > 0) {
            sectionTitle(doc, `Drive Performance (${reportYear || 'Annual'})`);
            sectionDesc(doc, 'Donation volumes and category breakdown for each drive, with daily collection averages.');

            for (const drive of drivePerformance) {
                ensureSpace(doc, 70);
                doc.fontSize(10).font('Helvetica-Bold').fillColor(C.primaryDark).text(drive.driveName, PAGE_MARGIN);
                doc.fontSize(7.5).font('Helvetica').fillColor(C.textSecondary);
                doc.text(`${fmtDate(drive.startDate)} – ${fmtDate(drive.endDate)}  ·  ${drive.remainingDays ?? 0} days remaining`);
                doc.moveDown(0.3);
                statLine(doc, 'Total Donated', `${fmtNum(drive.totalQuantity)} pcs  (${fmtWeight(drive.totalEstimatedWeightKg)})`);
                statLine(doc, 'Avg Daily', `${drive.averageDailyQuantity ?? 0} pcs/day`);
                doc.moveDown(0.5);

                if (drive.categories?.length > 0) {
                    drawHorizontalBars(doc, drive.categories.map(c => ({ label: c.categoryName, value: c.totalQuantity })), { maxItems: 8, labelWidth: 120 });
                }
                doc.moveDown(1);
            }
        }

        // ── B6. Collaborations (Admin only) ─────────────────────────────
        if (collaborations?.byYear?.length > 0) {
            sectionTitle(doc, 'Collaborations');
            sectionDesc(doc, 'Projects and activities conducted with this school. Admin only.');

            for (const group of collaborations.byYear) {
                ensureSpace(doc, 30);
                doc.fontSize(9).font('Helvetica-Bold').fillColor(C.primaryDark);
                doc.text(String(group.year), PAGE_MARGIN);
                doc.moveDown(0.2);

                for (const activity of group.activities) {
                    ensureSpace(doc, 20);
                    const y = doc.y;
                    doc.save();
                    doc.roundedRect(PAGE_MARGIN, y - 1, CONTENT_WIDTH, 16, 4).fill(C.borderLight);
                    doc.restore();
                    doc.fontSize(8).font('Helvetica').fillColor(C.textPrimary);
                    doc.text(activity.activityName, PAGE_MARGIN + 8, y + 2, { width: CONTENT_WIDTH - 16, lineBreak: false });
                    doc.y = y + 18;
                }
                doc.moveDown(0.4);
            }
            doc.moveDown(0.5);
        }

        // ── B7. Products Created (Admin only) ───────────────────────────
        if (productsCreated?.totalProducts > 0) {
            sectionTitle(doc, 'Products Created');
            sectionDesc(doc, 'Products designed using this school\'s donated uniforms. Admin only.');

            drawStatBoxes(doc, [
                { label: 'Products', value: fmtNum(productsCreated.totalProducts) },
                { label: 'Styles', value: fmtNum(productsCreated.totalStyles) },
                { label: 'Recipes', value: fmtNum(productsCreated.totalRecipes) },
            ]);
            doc.moveDown(0.5);

            if (productsCreated.products?.length > 0) {
                const cols = tableHeader(doc, [
                    { label: 'Product', x: PAGE_MARGIN, width: 150 },
                    { label: 'Type', x: 210, width: 100 },
                    { label: 'Styles', x: 320, width: 50, align: 'right' },
                    { label: 'Recipes', x: 380, width: 50, align: 'right' },
                    { label: 'Created', x: 440, width: 100 },
                ]);
                productsCreated.products.forEach((p, i) => tableRow(doc, cols, [
                    p.productName,
                    p.productType || '—',
                    fmtNum(p.totalStyles),
                    fmtNum(p.totalRecipes),
                    p.createdDate ? fmtDate(p.createdDate) : '—',
                ], { stripe: i % 2 === 0 }));
            }
            doc.moveDown(0.5);
        }

        addFooters(doc, 'The Circular Classroom', data.footerLogo);
        doc.end();
    });
}

// ════════════════════════════════════════════════════════════════════════════════
//  ADMIN REPORT
// ════════════════════════════════════════════════════════════════════════════════

const MAX_PRODUCT_PROJECTIONS = 30;

function generateAdminReport(data) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, bufferPages: true,
            autoFirstPage: true,
            info: { Title: 'TCC Admin Analytics Report', Author: 'The Circular Classroom', Subject: 'Analytics & Audit Report' } });

        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        const {
            // All-time data
            kpiTotals, inventoryBySchool, inventoryByCategory, yearlyTrend,
            repurposingByColour, productProjections,
            // Year-specific data
            schoolRankings, driveParticipation, periodActivity, sustainability,
            cooperationAnalytics, activeDrives,
            // Meta
            generatedAt, generatedBy, reportYear,
        } = data;

        drawCoverHeader(doc, { title: 'The Circular Classroom', subtitle: 'Admin Analytics & Audit Report', generatedAt, generatedBy, headerLogo: data.headerLogo });

        // ════════════════════════════════════════════════════════════════
        //  PART A — ALL-TIME NETWORK SNAPSHOT
        // ════════════════════════════════════════════════════════════════

        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(C.primaryDark);
        doc.text('Part A — All-Time Network Snapshot', PAGE_MARGIN);
        doc.fontSize(8).font('Helvetica').fillColor(C.textSecondary);
        doc.text('Cumulative data across all years. Not filtered by report period.', PAGE_MARGIN);
        doc.moveDown(0.3);

        // ── A1. Network KPI Summary ─────────────────────────────────────
        if (kpiTotals) {
            sectionTitle(doc, 'Network KPI Summary');
            sectionDesc(doc, 'A high-level snapshot of all inventory across the TCC network, broken down by the four core status groups and total estimated weight.');

            drawStatBoxes(doc, [
                { label: 'Total Pieces', value: fmtNum(kpiTotals.totalPieces) },
                { label: 'School Stock', value: fmtNum(kpiTotals.schoolStock) },
                { label: 'PSG Stock', value: fmtNum(kpiTotals.psg) },
                { label: 'For Repurposing', value: fmtNum(kpiTotals.repurposing) },
                { label: 'Waste / Disposed', value: fmtNum(kpiTotals.waste) },
                { label: 'Total Weight', value: fmtWeight(kpiTotals.totalWeightKg) },
            ]);
            doc.moveDown(0.5);
        }

        // ── A2. Weight Breakdown ────────────────────────────────────────
        if (kpiTotals && kpiTotals.totalPieces > 0) {
            sectionTitle(doc, 'Weight Breakdown');
            sectionDesc(doc, 'Total estimated weight split across the four core inventory categories.');

            const totalPcs = kpiTotals.totalPieces || 1;
            const weightItems = [
                { label: 'School Stock',      value: kpiTotals.schoolStock,  colour: C.primary },
                { label: 'PSG Stock',          value: kpiTotals.psg,          colour: '#378ADD' },
                { label: 'For Repurposing',    value: kpiTotals.repurposing,  colour: '#BA7517' },
                { label: 'Waste / Disposed',   value: kpiTotals.waste,        colour: C.textDisabled },
            ];

            ensureSpace(doc, weightItems.length * 18 + 20);

            // Total header
            doc.fontSize(16).font('Helvetica-Bold').fillColor(C.primaryDark);
            doc.text(`${fmtWeight(kpiTotals.totalWeightKg)}`, PAGE_MARGIN);
            doc.fontSize(7.5).font('Helvetica').fillColor(C.textSecondary);
            doc.text('total estimated weight', PAGE_MARGIN);
            doc.moveDown(0.5);

            for (const item of weightItems) {
                ensureSpace(doc, 18);
                const y = doc.y;
                const pct = ((item.value / totalPcs) * 100).toFixed(1);
                const barMaxW = CONTENT_WIDTH - 160;
                const barW = Math.max((item.value / totalPcs) * barMaxW, 2);

                doc.fontSize(7).font('Helvetica').fillColor(C.textPrimary);
                doc.text(item.label, PAGE_MARGIN, y + 2, { width: 95, align: 'right', lineBreak: false });

                doc.save();
                doc.roundedRect(PAGE_MARGIN + 100, y + 1, barMaxW, 10, 3).fill(C.borderLight);
                doc.roundedRect(PAGE_MARGIN + 100, y + 1, barW, 10, 3).fill(item.colour);
                doc.restore();

                doc.fontSize(7).font('Helvetica-Bold').fillColor(C.textPrimary);
                doc.text(`${fmtNum(item.value)} pcs (${pct}%)`, PAGE_MARGIN + 105 + barMaxW, y + 2, { lineBreak: false });

                doc.y = y + 16;
            }
            doc.moveDown(0.5);
        }

        // ── A3. Yearly Trend ────────────────────────────────────────────
        if (yearlyTrend?.years?.length > 0) {
            sectionTitle(doc, 'Yearly Donation & Redistribution Trend');
            sectionDesc(doc, 'Year-over-year view of donation inflow, sales, repurposing, and disposal volumes.');

            const chartData = yearlyTrend.years.map(yr => ({
                label: yr.year,
                values: [yr.donated, yr.sold, yr.repurposed, yr.disposed],
            }));
            drawBarChart(doc, chartData, ['Donated', 'Sold', 'Repurposed', 'Disposed'], { height: 120 });

            doc.moveDown(1.2);

            const cols = tableHeader(doc, [
                { label: 'Year', x: PAGE_MARGIN, width: 55 },
                { label: 'Donated', x: 115, width: 70, align: 'right' },
                { label: 'Sold', x: 195, width: 65, align: 'right' },
                { label: 'Repurposed', x: 270, width: 70, align: 'right' },
                { label: 'Disposed', x: 350, width: 65, align: 'right' },
                { label: 'Weight', x: 430, width: 110, align: 'right' },
            ]);

            yearlyTrend.years.forEach((yr, i) => tableRow(doc, cols, [yr.year, fmtNum(yr.donated), fmtNum(yr.sold), fmtNum(yr.repurposed), fmtNum(yr.disposed), fmtWeight(yr.totalWeightKg)], { stripe: i % 2 === 0 }));

            const t = yearlyTrend.years.reduce((a, yr) => ({ don: a.don + (yr.donated || 0), sol: a.sol + (yr.sold || 0), rep: a.rep + (yr.repurposed || 0), dis: a.dis + (yr.disposed || 0), wt: a.wt + (yr.totalWeightKg || 0) }), { don: 0, sol: 0, rep: 0, dis: 0, wt: 0 });
            hr(doc);
            tableRow(doc, cols, ['Total', fmtNum(t.don), fmtNum(t.sol), fmtNum(t.rep), fmtNum(t.dis), fmtWeight(t.wt)], { bold: true });
            doc.moveDown(0.5);
        }

        // ── A4. Inventory by School ─────────────────────────────────────
        if (inventoryBySchool?.length > 0) {
            doc.addPage();
            sectionTitle(doc, 'Current Inventory by School');
            sectionDesc(doc, 'Total inventory held per school, broken down by the four status groups. Sorted by total item count.');

            drawHorizontalBars(doc, inventoryBySchool.slice(0, 10).map(s => ({ label: s.schoolName, value: s.totalPieces })), { labelWidth: 180 });
            doc.moveDown(1);

            const cols = tableHeader(doc, [
                { label: 'School', x: PAGE_MARGIN, width: 145 },
                { label: 'Total', x: 205, width: 50, align: 'right' },
                { label: 'School Stock', x: 260, width: 65, align: 'right' },
                { label: 'PSG', x: 330, width: 45, align: 'right' },
                { label: 'Repurpose', x: 380, width: 60, align: 'right' },
                { label: 'Waste', x: 445, width: 45, align: 'right' },
                { label: 'Weight', x: 495, width: 50, align: 'right' },
            ]);
            inventoryBySchool.forEach((s, i) => tableRow(doc, cols, [s.schoolName, fmtNum(s.totalPieces), fmtNum(s.schoolStock), fmtNum(s.psg), fmtNum(s.repurposing), fmtNum(s.waste), fmtWeight(s.totalWeightKg)], { stripe: i % 2 === 0 }));
            doc.moveDown(0.5);
        }

        // ── A5. Inventory by Category ───────────────────────────────────
        if (inventoryByCategory?.length > 0) {
            sectionTitle(doc, 'Current Inventory by Category');
            sectionDesc(doc, 'Network-wide inventory totals grouped by uniform category. Useful for identifying which categories have the most stock or waste.');

            drawHorizontalBars(doc, inventoryByCategory.slice(0, 10).map(c => ({ label: c.categoryName, value: c.totalPieces })), { labelWidth: 130 });
            doc.moveDown(1);

            const cols = tableHeader(doc, [
                { label: 'Category', x: PAGE_MARGIN, width: 145 },
                { label: 'Total', x: 205, width: 50, align: 'right' },
                { label: 'School Stock', x: 260, width: 65, align: 'right' },
                { label: 'PSG', x: 330, width: 45, align: 'right' },
                { label: 'Repurpose', x: 380, width: 60, align: 'right' },
                { label: 'Waste', x: 445, width: 45, align: 'right' },
                { label: 'Weight', x: 495, width: 50, align: 'right' },
            ]);
            inventoryByCategory.forEach((c, i) => tableRow(doc, cols, [c.categoryName, fmtNum(c.totalPieces), fmtNum(c.schoolStock), fmtNum(c.psg), fmtNum(c.repurposing), fmtNum(c.waste), fmtWeight(c.totalWeightKg)], { stripe: i % 2 === 0 }));
            doc.moveDown(0.5);
        }

        // ── A6. Repurposing by Colour ───────────────────────────────────
        if (repurposingByColour) {
            sectionTitle(doc, 'Repurposing Materials by Colour');
            sectionDesc(doc, 'Items marked for repurposing, grouped by primary fabric colour. This informs which colours are available for product manufacturing.');

            if (repurposingByColour.colours?.length > 0) {
                const slices = repurposingByColour.colours.map((c, i) => ({
                    label: c.colourName,
                    value: c.totalPieces,
                    colour: c.hexcode || CHART_PALETTE[i % CHART_PALETTE.length],
                }));
                drawDonutChart(doc, slices);
                doc.moveDown(1);

                const cols = tableHeader(doc, [
                    { label: '', x: PAGE_MARGIN, width: 16 },
                    { label: 'Colour', x: PAGE_MARGIN + 20, width: 140 },
                    { label: 'Pieces', x: 230, width: 70, align: 'right' },
                    { label: 'Weight', x: 310, width: 100, align: 'right' },
                    { label: '% of Total', x: 420, width: 70, align: 'right' },
                ]);
                repurposingByColour.colours.forEach((colour) => {
                    ensureSpace(doc, 16);
                    if (colour.hexcode) {
                        doc.save();
                        doc.roundedRect(PAGE_MARGIN + 2, doc.y + 1, 10, 10, 2).fillAndStroke(colour.hexcode, C.border);
                        doc.restore();
                    }
                    const pct = repurposingByColour.grandTotal > 0 ? ((colour.totalPieces / repurposingByColour.grandTotal) * 100).toFixed(1) : '0.0';
                    tableRow(doc, cols, ['', colour.colourName, fmtNum(colour.totalPieces), fmtWeight(colour.totalWeightKg), `${pct}%`]);
                });
            }
            doc.moveDown(0.5);
        }

        // ── A7. Product Projections (capped) ────────────────────────────
        if (productProjections) {
            sectionTitle(doc, 'Product Projections from Repurpose Stock');

            const totalProj = productProjections.projections?.length || 0;
            const capped = (productProjections.projections || []).slice(0, MAX_PRODUCT_PROJECTIONS);

            sectionDesc(doc, `Estimated producible units from current repurpose stock. Total: ${fmtNum(productProjections.totalEstimatedProducts)} units across ${totalProj} recipes. Showing top ${capped.length}.`);

            if (capped.length > 0) {
                const cols = tableHeader(doc, [
                    { label: 'Product', x: PAGE_MARGIN, width: 100 },
                    { label: 'Recipe', x: 160, width: 170 },
                    { label: 'Type', x: 340, width: 70 },
                    { label: 'Est. Units', x: 415, width: 55, align: 'right' },
                    { label: 'Limiting Factor', x: 475, width: 70 },
                ]);
                capped.forEach((p, i) => tableRow(doc, cols, [p.productName, p.recipeName, p.productType || '—', fmtNum(p.estimatedUnits), p.limitingIngredient || '—'], { stripe: i % 2 === 0 }));
            }
            doc.moveDown(0.5);
        }

        // ════════════════════════════════════════════════════════════════
        //  PART B — REPORT YEAR ACTIVITY
        // ════════════════════════════════════════════════════════════════

        doc.addPage();
        doc.fontSize(10).font('Helvetica-Bold').fillColor(C.primaryDark);
        doc.text(`Part B — ${reportYear || 'Annual'} Activity`, PAGE_MARGIN);
        doc.fontSize(8).font('Helvetica').fillColor(C.textSecondary);
        doc.text(`Data filtered to the ${reportYear || 'selected'} reporting year.`, PAGE_MARGIN);
        doc.moveDown(0.3);

        // ── B1. Period Activity KPIs ────────────────────────────────────
        if (periodActivity) {
            sectionTitle(doc, `${reportYear || 'Annual'} Period Activity`);
            sectionDesc(doc, `Donation, sale, repurposing, and disposal volumes for ${reportYear || 'the reporting year'}.`);

            drawStatBoxes(doc, [
                { label: 'Donated', value: fmtNum(periodActivity.donated) },
                { label: 'Sold', value: fmtNum(periodActivity.sold) },
                { label: 'Repurposed', value: fmtNum(periodActivity.repurposed) },
                { label: 'Disposed', value: fmtNum(periodActivity.disposed) },
                { label: 'On Hand (current)', value: fmtNum(periodActivity.onHand) },
                { label: 'Donated Weight', value: fmtWeight(periodActivity.donatedWeightKg) },
            ]);
            doc.moveDown(0.5);

            // Circularity rates
            const rates = periodActivity.rates;
            if (rates) {
                ensureSpace(doc, 30);
                doc.fontSize(8).font('Helvetica-Bold').fillColor(C.primaryDark);
                doc.text('Circularity Rates', PAGE_MARGIN);
                doc.moveDown(0.3);

                const rateItems = [
                    { label: 'Resold rate',     value: rates.sellThroughRate, colour: '#BA7517' },
                    { label: 'Repurposed rate', value: rates.repurposeRate,   colour: '#0f766e' },
                    { label: 'Recovered rate',  value: rates.recoveryRate,    colour: '#1d4ed8' },
                    { label: 'Disposal rate',   value: rates.disposalRate,    colour: C.textDisabled },
                ];

                ensureSpace(doc, 16);
                const rateStartY = doc.y;
                const chipW = (CONTENT_WIDTH - 18) / 4;

                for (let ri = 0; ri < rateItems.length; ri++) {
                    const rx = PAGE_MARGIN + ri * (chipW + 6);
                    doc.save();
                    doc.roundedRect(rx, rateStartY, chipW, 22, 6).fill(C.borderLight);
                    doc.restore();
                    doc.fontSize(6.5).font('Helvetica').fillColor(C.textSecondary);
                    doc.text(rateItems[ri].label, rx + 6, rateStartY + 3, { lineBreak: false });
                    doc.fontSize(10).font('Helvetica-Bold').fillColor(rateItems[ri].colour);
                    doc.text(`${rateItems[ri].value ?? 0}%`, rx + 6, rateStartY + 12, { lineBreak: false });
                }

                doc.y = rateStartY + 30;
            }
            doc.moveDown(0.5);
        }

        // ── B2. School Redistribution Rankings ──────────────────────────
        if (schoolRankings) {
            sectionTitle(doc, `School Redistribution Rankings (${reportYear || 'Annual'})`);
            sectionDesc(doc, `Schools ranked by sell-through rate (items sold ÷ items donated). Network average: ${fmtPct(schoolRankings.networkAverage)}.`);

            const topSchools = (schoolRankings.schools || []).slice(0, 10);
            if (topSchools.length > 0) {
                drawHorizontalBars(doc, topSchools.map(s => ({ label: s.schoolName, value: s.redistributionRate })), { maxItems: 10, labelWidth: 180 });
                doc.moveDown(1);
            }

            const deviationColour = (val) => {
                if (typeof val === 'string' && val.startsWith('+')) return C.primary;
                if (typeof val === 'string' && val.startsWith('-')) return C.error;
                return C.textPrimary;
            };

            const cols = tableHeader(doc, [
                { label: 'Rank', x: PAGE_MARGIN, width: 30, align: 'center' },
                { label: 'School', x: 90, width: 190 },
                { label: 'Donated', x: 290, width: 55, align: 'right' },
                { label: 'Sold', x: 350, width: 50, align: 'right' },
                { label: 'Rate', x: 405, width: 50, align: 'right' },
                { label: 'Deviation', x: 460, width: 80, align: 'right', colourFn: deviationColour },
            ]);

            (schoolRankings.schools || []).forEach((s, i) => tableRow(doc, cols, [s.rank, s.schoolName, fmtNum(s.totalDonated), fmtNum(s.totalSold), fmtPct(s.redistributionRate), fmtDev(s.deviationFromAverage)], { stripe: i % 2 === 0 }));
            doc.moveDown(0.5);
        }

        // ── B3. Sustainability ──────────────────────────────────────────
        if (sustainability) {
            sectionTitle(doc, `Sustainability (${reportYear || 'Annual'})`);
            sectionDesc(doc, 'Weight diverted from waste through resale and repurposing, plus disposal totals.');

            drawStatBoxes(doc, [
                { label: 'Diverted Weight', value: fmtWeight(sustainability.divertedKg) },
                { label: 'Donated Weight', value: fmtWeight(sustainability.donatedKg) },
                { label: 'Sold Weight', value: fmtWeight(sustainability.soldKg) },
                { label: 'Repurposed Weight', value: fmtWeight(sustainability.repurposedKg) },
                { label: 'Disposed Weight', value: fmtWeight(sustainability.disposedKg) },
                { label: 'Diversion Rate', value: `${sustainability.diversionRate ?? 0}%` },
            ]);
            doc.moveDown(0.3);

            // Category breakdown bars
            if (sustainability.categories?.length > 0) {
                doc.moveDown(0.3);
                doc.fontSize(8).font('Helvetica-Bold').fillColor(C.primaryDark);
                doc.text('Weight by Top Categories', PAGE_MARGIN);
                doc.moveDown(0.3);

                drawHorizontalBars(doc, sustainability.categories.slice(0, 8).map(c => ({
                    label: c.categoryName,
                    value: Math.round((c.soldKg || 0) + (c.repurposedKg || 0)),
                })), { maxItems: 8, labelWidth: 130 });
            }
            doc.moveDown(0.5);
        }

        // ── B4. Cooperation Analytics ───────────────────────────────────
        if (cooperationAnalytics?.groups?.length > 0) {
            sectionTitle(doc, `Cooperation Analytics (${reportYear || 'Annual'})`);
            sectionDesc(doc, 'Comparison between cooperating and non-cooperating schools.');

            const groupW = (CONTENT_WIDTH - 10) / 2;

            for (const group of cooperationAnalytics.groups) {
                ensureSpace(doc, 70);
                const gy = doc.y;

                doc.save();
                doc.roundedRect(PAGE_MARGIN, gy, CONTENT_WIDTH, 58, 6).fill(C.borderLight);
                doc.restore();

                doc.fontSize(9).font('Helvetica-Bold').fillColor(C.primaryDark);
                doc.text(group.label, PAGE_MARGIN + 10, gy + 6, { lineBreak: false });
                doc.fontSize(7).font('Helvetica').fillColor(C.textSecondary);
                doc.text(`${fmtNum(group.schoolCount)} schools`, PAGE_MARGIN + 10, gy + 18, { lineBreak: false });

                const metrics = [
                    ['Donated', `${fmtNum(group.donated)} / ${fmtWeight(group.donatedKg)}`],
                    ['Recovered', `${fmtNum(group.recovered)} / ${fmtWeight(group.recoveredKg)}`],
                    ['Recovery Rate', `${group.recoveryRate ?? 0}%`],
                    ['Disposal Rate', `${group.disposalRate ?? 0}%`],
                ];

                const mx = PAGE_MARGIN + 10;
                let my = gy + 30;
                for (let mi = 0; mi < metrics.length; mi++) {
                    const mcx = mx + (mi % 4) * ((CONTENT_WIDTH - 20) / 4);
                    doc.fontSize(6.5).font('Helvetica').fillColor(C.textSecondary);
                    doc.text(metrics[mi][0], mcx, my, { lineBreak: false });
                    doc.fontSize(8).font('Helvetica-Bold').fillColor(C.textPrimary);
                    doc.text(metrics[mi][1], mcx, my + 9, { lineBreak: false });
                }

                doc.y = gy + 64;
            }
            doc.moveDown(0.5);
        }

        // ── B5. Drive Participation ─────────────────────────────────────
        if (driveParticipation) {
            sectionTitle(doc, `Donation Drive Participation (${reportYear || 'Annual'})`);
            sectionDesc(doc, `Tracks how many schools have organised at least one donation drive. Currently ${fmtNum(driveParticipation.participatingCount)} of ${fmtNum(driveParticipation.totalSchools)} schools are participating.`);

            drawParticipationBar(doc, driveParticipation.participatingCount, driveParticipation.totalSchools);

            statLine(doc, 'Total Schools', fmtNum(driveParticipation.totalSchools));
            statLine(doc, 'Participating', fmtNum(driveParticipation.participatingCount));
            statLine(doc, 'Non-Participating', fmtNum(driveParticipation.nonParticipatingCount));
            doc.moveDown(0.6);

            if (driveParticipation.schools?.length > 0) {
                const cols = tableHeader(doc, [
                    { label: 'School', x: PAGE_MARGIN, width: 175 },
                    { label: 'Drives', x: 235, width: 40, align: 'center' },
                    { label: 'Drive Names', x: 285, width: 260 },
                ]);
                driveParticipation.schools.forEach((s, i) => {
                    const names = (s.drives || []).map(d => d.driveName).join(', ');
                    tableRow(doc, cols, [s.schoolName, s.driveCount, names], { stripe: i % 2 === 0 });
                });
            }
            doc.moveDown(0.5);
        }

        // ── B6. Active Drives ───────────────────────────────────────────
        if (activeDrives?.drives?.length > 0) {
            sectionTitle(doc, 'Active Donation Drives');
            sectionDesc(doc, 'Live drives currently collecting donations, with items, weight, and daily averages.');

            drawStatBoxes(doc, [
                { label: 'Active Drives', value: fmtNum(activeDrives.drives.length) },
                { label: 'Total Items Collected', value: fmtNum(activeDrives.totalQuantity) },
                { label: 'Total Weight', value: fmtWeight(activeDrives.totalWeightKg) },
            ]);
            doc.moveDown(0.5);

            const cols = tableHeader(doc, [
                { label: 'Drive', x: PAGE_MARGIN, width: 140 },
                { label: 'School', x: 200, width: 130 },
                { label: 'Items', x: 340, width: 50, align: 'right' },
                { label: 'Weight', x: 395, width: 60, align: 'right' },
                { label: 'Daily Avg', x: 460, width: 45, align: 'right' },
                { label: 'Days Left', x: 510, width: 35, align: 'right' },
            ]);
            activeDrives.drives.forEach((d, i) => tableRow(doc, cols, [d.driveName, d.schoolName || '—', fmtNum(d.totalQuantity), fmtWeight(d.totalEstimatedWeightKg), fmtNum(d.averageDailyQuantity), fmtNum(d.remainingDays)], { stripe: i % 2 === 0 }));
            doc.moveDown(0.5);
        }

        addFooters(doc, 'The Circular Classroom — Confidential', data.footerLogo);
        doc.end();
    });
}

module.exports = { generateSchoolReport, generateAdminReport };
import Papa from 'papaparse'
import type { Event, Attendance, Expense } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportEventCSV(event: Event, attendance: Attendance[], expenses: Expense[]) {
  const attRows = attendance.map((a) => ({
    Type: 'Singer',
    Name: a.memberName,
    Songs: a.songCount,
    Amount: a.earnings,
    Status: a.status === 'cancelled' ? (a.refundIssued ? 'Cancelled (Refund)' : 'Cancelled') : 'Attending',
    Notes: '',
  }))

  const expRows = expenses.map((e) => ({
    Type: 'Expense',
    Name: e.vendor,
    Songs: '',
    Amount: -e.amount,
    Status: e.category,
    Notes: e.notes ?? '',
  }))

  const summary = [
    { Type: '', Name: '', Songs: '', Amount: '', Status: '', Notes: '' },
    { Type: 'TOTAL REVENUE', Name: '', Songs: '', Amount: event.totalRevenue, Status: '', Notes: '' },
    { Type: 'TOTAL EXPENSES', Name: '', Songs: '', Amount: event.totalExpenses, Status: '', Notes: '' },
    { Type: 'NET', Name: '', Songs: '', Amount: event.netAmount, Status: '', Notes: '' },
  ]

  const csv = Papa.unparse([...attRows, ...expRows, ...summary])
  const slug = event.title.replace(/\s+/g, '_')
  const date = formatDate(event.date, { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
  downloadBlob(new Blob([csv], { type: 'text/csv' }), `${slug}_${date}.csv`)
}

export async function exportEventPDF(event: Event, attendance: Attendance[], expenses: Expense[]) {
  const { jsPDF } = await import('jspdf')

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pw = pdf.internal.pageSize.getWidth()
  const ph = pdf.internal.pageSize.getHeight()
  const marginL = 14
  const marginR = pw - 14
  const lineH = 6

  let y = 14

  const checkPageBreak = (needed = lineH * 2) => {
    if (y + needed > ph - 14) {
      pdf.addPage()
      y = 14
    }
  }

  // ── Header ──────────────────────────────────────────────────────────────────
  pdf.setFillColor(30, 58, 95) // navy
  pdf.rect(0, 0, pw, 22, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('SHRIBOOK', marginL, 10)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Event Financial Report', marginL, 16)
  y = 30

  // ── Event meta ───────────────────────────────────────────────────────────────
  pdf.setTextColor(15, 23, 42)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  const titleLines = pdf.splitTextToSize(event.title, pw - marginL * 2) as string[]
  pdf.text(titleLines, marginL, y)
  y += titleLines.length * 7

  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100, 116, 139)
  pdf.text(
    `${formatDate(event.date)}   ·   ${event.venue}   ·   ₹${event.ratePerSong}/song`,
    marginL, y
  )
  y += 5

  if (event.description) {
    pdf.setFontSize(8)
    const descLines = pdf.splitTextToSize(event.description, pw - marginL * 2) as string[]
    pdf.text(descLines, marginL, y)
    y += descLines.length * 5
  }

  y += 3
  pdf.setDrawColor(226, 232, 240)
  pdf.line(marginL, y, marginR, y)
  y += 6

  // ── Financial summary ────────────────────────────────────────────────────────
  checkPageBreak(28)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(100, 116, 139)
  pdf.text('FINANCIAL SUMMARY', marginL, y)
  y += 5

  const colW = (pw - marginL * 2) / 3
  const summaryItems = [
    { label: 'Revenue', value: formatCurrency(event.totalRevenue), color: [22, 163, 74] as [number, number, number] },
    { label: 'Expenses', value: formatCurrency(event.totalExpenses), color: [220, 38, 38] as [number, number, number] },
    { label: 'Net', value: formatCurrency(event.netAmount), color: event.netAmount >= 0 ? [22, 163, 74] as [number, number, number] : [220, 38, 38] as [number, number, number] },
  ]

  summaryItems.forEach((item, i) => {
    const x = marginL + i * colW
    pdf.setFillColor(248, 250, 252)
    pdf.roundedRect(x, y, colW - 2, 14, 2, 2, 'F')
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 116, 139)
    pdf.text(item.label.toUpperCase(), x + (colW - 2) / 2, y + 5, { align: 'center' })
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...item.color)
    pdf.text(item.value, x + (colW - 2) / 2, y + 11, { align: 'center' })
  })
  y += 20

  pdf.setDrawColor(226, 232, 240)
  pdf.line(marginL, y, marginR, y)
  y += 6

  // ── Attendance ───────────────────────────────────────────────────────────────
  const attending = attendance.filter((a) => a.status === 'attending')
  const cancelled = attendance.filter((a) => a.status === 'cancelled')

  checkPageBreak(20)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(100, 116, 139)
  pdf.text(`SINGERS (${attending.length} attending${cancelled.length ? `, ${cancelled.length} cancelled` : ''})`, marginL, y)
  y += 5

  // Table header
  pdf.setFillColor(241, 245, 249)
  pdf.rect(marginL, y, pw - marginL * 2, 6, 'F')
  pdf.setFontSize(7.5)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(71, 85, 105)
  pdf.text('Name', marginL + 2, y + 4)
  pdf.text('Songs', marginR - 42, y + 4, { align: 'right' })
  pdf.text('Earnings', marginR, y + 4, { align: 'right' })
  y += 7

  const drawAttRow = (a: Attendance) => {
    checkPageBreak(lineH)
    pdf.setFontSize(8.5)
    pdf.setFont('helvetica', a.status === 'cancelled' ? 'italic' : 'normal')
    pdf.setTextColor(a.status === 'cancelled' ? 150 : 15, a.status === 'cancelled' ? 150 : 23, a.status === 'cancelled' ? 150 : 42)
    const nameMaxW = pw - marginL * 2 - 50
    const name = pdf.splitTextToSize(
      a.status === 'cancelled' ? `${a.memberName} (cancelled${a.refundIssued ? ', refunded' : ''})` : a.memberName,
      nameMaxW
    )[0] as string
    pdf.text(name, marginL + 2, y + 4)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(71, 85, 105)
    pdf.text(String(a.songCount), marginR - 42, y + 4, { align: 'right' })
    pdf.setTextColor(a.status === 'cancelled' ? 150 : 22, a.status === 'cancelled' ? 150 : 163, a.status === 'cancelled' ? 150 : 74)
    pdf.text(a.status === 'cancelled' ? '—' : formatCurrency(a.earnings), marginR, y + 4, { align: 'right' })
    pdf.setDrawColor(241, 245, 249)
    pdf.line(marginL, y + lineH, marginR, y + lineH)
    y += lineH
  }

  attending.forEach(drawAttRow)
  cancelled.forEach(drawAttRow)

  // Total row
  checkPageBreak(8)
  pdf.setFillColor(241, 245, 249)
  pdf.rect(marginL, y, pw - marginL * 2, 7, 'F')
  pdf.setFontSize(8.5)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(15, 23, 42)
  pdf.text('Total Revenue', marginL + 2, y + 5)
  pdf.setTextColor(22, 163, 74)
  pdf.text(formatCurrency(event.totalRevenue), marginR, y + 5, { align: 'right' })
  y += 13

  // ── Expenses ─────────────────────────────────────────────────────────────────
  if (expenses.length > 0) {
    checkPageBreak(20)
    pdf.setDrawColor(226, 232, 240)
    pdf.line(marginL, y - 4, marginR, y - 4)

    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(100, 116, 139)
    pdf.text(`EXPENSES (${expenses.length})`, marginL, y)
    y += 5

    pdf.setFillColor(241, 245, 249)
    pdf.rect(marginL, y, pw - marginL * 2, 6, 'F')
    pdf.setFontSize(7.5)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(71, 85, 105)
    pdf.text('Vendor', marginL + 2, y + 4)
    pdf.text('Category', marginL + 70, y + 4)
    pdf.text('Amount', marginR, y + 4, { align: 'right' })
    y += 7

    expenses.forEach((e) => {
      checkPageBreak(lineH)
      pdf.setFontSize(8.5)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(15, 23, 42)
      pdf.text(pdf.splitTextToSize(e.vendor, 60)[0] as string, marginL + 2, y + 4)
      pdf.setTextColor(71, 85, 105)
      pdf.text(e.category, marginL + 70, y + 4)
      pdf.setTextColor(220, 38, 38)
      pdf.text(formatCurrency(e.amount), marginR, y + 4, { align: 'right' })
      pdf.setDrawColor(241, 245, 249)
      pdf.line(marginL, y + lineH, marginR, y + lineH)
      y += lineH
    })

    checkPageBreak(8)
    pdf.setFillColor(241, 245, 249)
    pdf.rect(marginL, y, pw - marginL * 2, 7, 'F')
    pdf.setFontSize(8.5)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(15, 23, 42)
    pdf.text('Total Expenses', marginL + 2, y + 5)
    pdf.setTextColor(220, 38, 38)
    pdf.text(formatCurrency(event.totalExpenses), marginR, y + 5, { align: 'right' })
    y += 13
  }

  // ── Net summary bar ──────────────────────────────────────────────────────────
  checkPageBreak(20)
  const netColor: [number, number, number] = event.netAmount >= 0 ? [22, 163, 74] : [220, 38, 38]
  pdf.setFillColor(...netColor)
  pdf.roundedRect(marginL, y, pw - marginL * 2, 14, 2, 2, 'F')
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(255, 255, 255)
  const netSign = event.netAmount >= 0 ? '+' : ''
  pdf.text(`Net  ${netSign}${formatCurrency(event.netAmount)}`, pw / 2, y + 9, { align: 'center' })
  y += 20

  // ── Approvers ────────────────────────────────────────────────────────────────
  if (event.approverNames.length > 0) {
    checkPageBreak(12)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 116, 139)
    pdf.text(`Reviewed by: ${event.approverNames.join(', ')}`, marginL, y)
    y += 6
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  const totalPages = pdf.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(148, 163, 184)
    pdf.text(`Generated by Shribook · Page ${i} of ${totalPages}`, pw / 2, ph - 7, { align: 'center' })
  }

  const slug = event.title.replace(/\s+/g, '_')
  pdf.save(`${slug}_report.pdf`)
}

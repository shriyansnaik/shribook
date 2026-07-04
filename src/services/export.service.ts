import Papa from 'papaparse'
import type { Event, Attendance, Expense, Sponsor } from '@/types'
import { formatDate } from '@/lib/utils'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportEventCSV(event: Event, attendance: Attendance[], expenses: Expense[], sponsors: Sponsor[] = []) {
  const attRows = attendance.map((a) => ({
    Type: 'Singer',
    Name: a.memberName,
    Songs: a.songCount,
    Guests: a.guestCount ?? 0,
    Amount: a.earnings,
    Status: a.status === 'cancelled' ? (a.refundIssued ? 'Cancelled (Refund)' : 'Cancelled') : 'Attending',
    Notes: '',
  }))

  const sponsorRows = sponsors.map((s) => ({
    Type: 'Sponsor',
    Name: s.name,
    Songs: '',
    Guests: '',
    Amount: s.amount,
    Status: '',
    Notes: '',
  }))

  const expRows = expenses.map((e) => ({
    Type: 'Expense',
    Name: e.vendor,
    Songs: '',
    Guests: '',
    Amount: -e.amount,
    Status: '',
    Notes: e.notes ?? '',
  }))

  const blank = { Type: '', Name: '', Songs: '', Guests: '', Amount: '', Status: '', Notes: '' }
  const summary = [
    blank,
    { ...blank, Type: 'TOTAL REVENUE', Amount: event.totalRevenue },
    { ...blank, Type: 'TOTAL SPONSORS', Amount: event.totalSponsors ?? 0 },
    { ...blank, Type: 'TOTAL EXPENSES', Amount: event.totalExpenses },
    { ...blank, Type: 'NET', Amount: event.netAmount },
  ]

  const csv = Papa.unparse([...attRows, ...sponsorRows, ...expRows, ...summary])
  const slug = event.title.replace(/\s+/g, '_')
  const date = formatDate(event.date, { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
  downloadBlob(new Blob([csv], { type: 'text/csv' }), `${slug}_${date}.csv`)
}

// jsPDF built-in fonts don't support ₹ (U+20B9). Amounts in tables are shown as
// bare numbers under an "(in Rs.)" heading; prose uses a literal "Rs." prefix.
const num = (n: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)

export async function exportEventPDF(event: Event, attendance: Attendance[], expenses: Expense[], sponsors: Sponsor[] = []) {
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
  pdf.setFillColor(16, 51, 111) // brand navy #10336F
  pdf.rect(0, 0, pw, 22, 'F')
  // Two-tone "ShriBook" wordmark: "Shri" white, "Book" brand green.
  pdf.setFontSize(15)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(255, 255, 255)
  pdf.text('Shri', marginL, 11)
  const shriW = pdf.getTextWidth('Shri')
  pdf.setTextColor(122, 179, 96) // lightened brand green for contrast on navy
  pdf.text('Book', marginL + shriW, 11)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(255, 255, 255)
  pdf.text('Event Financial Report', marginL, 17)
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
  const rateText = event.subsequentSongRate != null && event.subsequentSongRate !== event.ratePerSong
    ? `Rs. ${event.ratePerSong} first / Rs. ${event.subsequentSongRate} per extra song`
    : `Rs. ${event.ratePerSong}/song`
  pdf.text(
    `${formatDate(event.date)}   ·   ${event.venue}   ·   ${rateText}`,
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
  pdf.text('FINANCIAL SUMMARY  (in Rs.)', marginL, y)
  y += 5

  const colW = (pw - marginL * 2) / 3
  const summaryItems = [
    { label: 'Revenue', value: num(event.totalRevenue), color: [22, 163, 74] as [number, number, number] },
    { label: 'Expenses', value: num(event.totalExpenses), color: [220, 38, 38] as [number, number, number] },
    { label: 'Net', value: num(event.netAmount), color: event.netAmount >= 0 ? [22, 163, 74] as [number, number, number] : [220, 38, 38] as [number, number, number] },
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
  pdf.text('Earnings (Rs.)', marginR, y + 4, { align: 'right' })
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
    pdf.text(a.status === 'cancelled' ? '—' : num(a.earnings), marginR, y + 4, { align: 'right' })
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
  pdf.text(num(event.totalRevenue), marginR, y + 5, { align: 'right' })
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
    pdf.text('Name', marginL + 2, y + 4)
    pdf.text('Amount (Rs.)', marginR, y + 4, { align: 'right' })
    y += 7

    expenses.forEach((e) => {
      checkPageBreak(lineH)
      pdf.setFontSize(8.5)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(15, 23, 42)
      pdf.text(pdf.splitTextToSize(e.vendor, 120)[0] as string, marginL + 2, y + 4)
      pdf.setTextColor(220, 38, 38)
      pdf.text(num(e.amount), marginR, y + 4, { align: 'right' })
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
    pdf.text(num(event.totalExpenses), marginR, y + 5, { align: 'right' })
    y += 13
  }

  // ── Sponsors ─────────────────────────────────────────────────────────────────
  if (sponsors.length > 0) {
    checkPageBreak(20)
    pdf.setDrawColor(226, 232, 240)
    pdf.line(marginL, y - 4, marginR, y - 4)

    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(100, 116, 139)
    pdf.text(`SPONSORS (${sponsors.length})  (in Rs.)`, marginL, y)
    y += 5

    sponsors.forEach((s) => {
      checkPageBreak(lineH)
      pdf.setFontSize(8.5)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(15, 23, 42)
      pdf.text(pdf.splitTextToSize(s.name, 120)[0] as string, marginL + 2, y + 4)
      pdf.setTextColor(22, 163, 74)
      pdf.text(num(s.amount), marginR, y + 4, { align: 'right' })
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
    pdf.text('Total Sponsors', marginL + 2, y + 5)
    pdf.setTextColor(22, 163, 74)
    pdf.text(num(event.totalSponsors ?? 0), marginR, y + 5, { align: 'right' })
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
  pdf.text(`Net (Rs.)  ${netSign}${num(event.netAmount)}`, pw / 2, y + 9, { align: 'center' })
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
    pdf.text(`Generated by ShriBook · Page ${i} of ${totalPages}`, pw / 2, ph - 7, { align: 'center' })
  }

  const slug = event.title.replace(/\s+/g, '_')
  pdf.save(`${slug}_report.pdf`)
}

function downloadSummaryPDF(summary) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const margin = 15, width = 180;
  let y = 20;

  function write(text, size = 11, bold = false) {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.splitTextToSize(text, width).forEach(line => {
      if (y > 280) { doc.addPage(); y = 20; }   // new page when full
      doc.text(line, margin, y);
      y += size * 0.5 + 2;
    });
  }

  write('Conversation Summary', 18, true); y += 4;
  write(`Date: ${new Date().toLocaleDateString('en-GB')}`); y += 4;

  if (summary.redFlag) { write('Please seek medical help soon. Some of what you described should be checked promptly.', 12, true); y += 4; }

  write('You described these symptoms:', 14, true);
  (summary.symptoms || []).forEach(s => write(`- ${s.topic}: ${s.detail}`));
  y += 4;

  write('You can ask your GP these questions:', 14, true);
  (summary.questionsForGP || []).forEach(q => write(`- ${q}`));
  y += 4;

  write('If you want to know more:', 14, true);
  (summary.articles || []).forEach(a => write(`- ${a.title}`));
  y += 6;

  write('This summary is not medical advice and is not a diagnosis. Please discuss it with a healthcare professional.', 9);
  doc.save('gp-summary.pdf');
}
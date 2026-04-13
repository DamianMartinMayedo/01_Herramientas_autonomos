export interface ExportPdfOptions {
  filename: string
  element: HTMLElement
}

export async function exportarPdf({ filename, element }: ExportPdfOptions): Promise<void> {
  // Importación dinámica — necesaria para que Vite (ESM) cargue html2pdf.js (CommonJS)
  // Si lo importamos estático en la cabecera, Vite puede fallar al bundlear
  const html2pdfModule = await import('html2pdf.js')
  const html2pdf = html2pdfModule.default ?? html2pdfModule

  // ── Problema: si el elemento tiene un padre con display:none (hidden xl:flex),
  //    html2canvas no puede renderizarlo. Solución: clonar el elemento y
  //    colocarlo fuera de pantalla pero visible para el navegador.
  const clone = element.cloneNode(true) as HTMLElement
  Object.assign(clone.style, {
    position: 'fixed',
    top: '0',
    left: '-9999px',
    width: '210mm',
    background: 'white',
    zIndex: '-1',
    visibility: 'visible',
    display: 'block',
  })
  document.body.appendChild(clone)

  const opciones = {
    margin: [0, 0, 0, 0],
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      windowWidth: 794, // 210mm a 96dpi
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
  }

  try {
    await html2pdf().set(opciones).from(clone).save()
  } finally {
    // Limpiar siempre el clon del DOM, aunque falle el PDF
    document.body.removeChild(clone)
  }
}

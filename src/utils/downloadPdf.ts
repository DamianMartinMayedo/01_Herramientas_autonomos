/**
 * downloadPdf.ts
 *
 * Genera y descarga el PDF directamente al equipo del usuario usando
 * html2canvas + jsPDF, sin pasar por el diálogo de impresión del navegador.
 *
 * INSTALACIÓN NECESARIA (una sola vez):
 *   npm install jspdf html2canvas
 *
 * Soluciones incorporadas:
 * - El elemento puede tener un padre con display:none (hidden xl:flex) → se
 *   clona fuera de la pantalla pero visible para html2canvas.
 * - Soporte multipágina: si el documento excede un A4, se añaden páginas extra.
 */
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export async function descargarPdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  // Clonar el elemento fuera de pantalla para evitar problemas con
  // contenedores ocultos (display:none / visibility:hidden)
  const clone = element.cloneNode(true) as HTMLElement
  Object.assign(clone.style, {
    position: 'fixed',
    top: '0',
    left: '-9999px',
    width: '794px', // 210mm a 96 dpi
    background: 'white',
    zIndex: '-1',
    visibility: 'visible',
    display: 'block',
  })
  document.body.appendChild(clone)

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      windowWidth: 794,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.97)
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

    const pdfW = pdf.internal.pageSize.getWidth()   // 210 mm
    const pdfH = pdf.internal.pageSize.getHeight()  // 297 mm
    const imgH = (canvas.height * pdfW) / canvas.width

    if (imgH <= pdfH) {
      // Cabe en una sola página
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, imgH)
    } else {
      // Multipágina: desplazamos la imagen hacia arriba en cada página
      let offset = 0
      let page = 0
      while (offset < imgH) {
        if (page > 0) pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, -offset, pdfW, imgH)
        offset += pdfH
        page++
      }
    }

    pdf.save(`${filename}.pdf`)
  } finally {
    document.body.removeChild(clone)
  }
}

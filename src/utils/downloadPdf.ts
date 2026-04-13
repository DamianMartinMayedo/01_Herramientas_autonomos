/**
 * downloadPdf.ts
 *
 * PROBLEMA RESUELTO: html2canvas no soporta oklch() (Tailwind v4 lo usa).
 *
 * SOLUCIÓN en dos pasos dentro de onclone():
 *  1. Inline de todos los colores como RGB: getComputedStyle() siempre devuelve
 *     rgb(), aunque el CSS use oklch(). Así html2canvas ve solo RGB.
 *  2. Eliminar hojas de estilo que contengan oklch para que el parser interno
 *     de html2canvas no las procese.
 *
 * El clone se inserta fuera de pantalla (no dentro de hidden xl:flex)
 * para que html2canvas lo vea como elemento visible.
 */
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const COLOR_PROPS = [
  'color',
  'background-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'text-decoration-color',
]

/** Inlinea los colores computados (RGB) de cada elemento para que
 *  el parser de html2canvas nunca encuentre oklch. */
function inlineRgbColors(el: HTMLElement, win: Window): void {
  const cs = win.getComputedStyle(el)
  COLOR_PROPS.forEach(prop => {
    const val = cs.getPropertyValue(prop)
    if (val) el.style.setProperty(prop, val)
  })
}

export async function descargarPdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  // Clonar fuera del árbol visible (evita el problema de display:none en padre)
  const clone = element.cloneNode(true) as HTMLElement
  Object.assign(clone.style, {
    position: 'fixed',
    top: '0',
    left: '-9999px',
    width: '794px',   // 210mm a 96dpi
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

      onclone: (clonedDoc, clonedEl) => {
        const win = clonedDoc.defaultView ?? window

        // PASO 1 — Inline todos los colores como RGB
        const all = [clonedEl, ...Array.from(clonedEl.querySelectorAll<HTMLElement>('*'))]
        all.forEach(el => inlineRgbColors(el, win))

        // PASO 2 — Eliminar stylesheets con oklch (variables Tailwind v4)
        Array.from(clonedDoc.styleSheets).forEach(sheet => {
          try {
            const hasOklch = Array.from(sheet.cssRules ?? []).some(r =>
              r.cssText.includes('oklch')
            )
            if (hasOklch) sheet.ownerNode?.parentNode?.removeChild(sheet.ownerNode)
          } catch {
            // Cross-origin — no se puede leer, se deja
          }
        })
      },
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.97)
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    const pdfW = pdf.internal.pageSize.getWidth()   // 210
    const pdfH = pdf.internal.pageSize.getHeight()  // 297
    const imgH = (canvas.height * pdfW) / canvas.width

    if (imgH <= pdfH) {
      // Una sola página
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, imgH)
    } else {
      // Multipágina
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

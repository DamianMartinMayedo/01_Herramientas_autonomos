/**
 * downloadPdf.ts
 *
 * Estrategia híbrida según dispositivo:
 *
 *  - Desktop (>1024px o no-touch): iframe oculto + window.print() del navegador.
 *    El PDF es vectorial (texto seleccionable, calidad máxima) y entiende
 *    oklch perfectamente. Sin dependencias externas en este path.
 *
 *  - Móvil/tablet o touch: html2pdf.js (raster, descarga directa).
 *    El diálogo de impresión móvil es muy mal UX (especialmente iOS Safari y
 *    Chrome iOS: el iframe oculto a veces no dispara el print, y cuando lo
 *    hace, el usuario tiene que hacer Compartir → Guardar en Archivos).
 *    html2pdf genera el blob y dispara descarga directa con el nombre dado.
 *
 * NOTA sobre el nombre del PDF (path desktop):
 *  Chrome y la mayoría de navegadores usan document.title de la página PADRE
 *  como nombre sugerido al guardar como PDF, ignorando el <title> del iframe.
 *  Solución: cambiar document.title temporalmente antes de llamar a print()
 *  y restaurarlo en cuanto el diálogo se cierra.
 */

function isMobileLikeViewport(): boolean {
  if (typeof window === 'undefined') return false
  const isTouch = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const isNarrow = window.innerWidth <= 1024
  return isTouch || isNarrow
}

async function descargarPdfMobile(element: HTMLElement, filename: string): Promise<void> {
  const html2pdfModule = await import('html2pdf.js')
  const html2pdf = (html2pdfModule as { default?: unknown }).default ?? html2pdfModule

  // Wrapper visible PERO fuera del viewport visible mediante translate.
  // iOS Safari/Chrome no renderizan correctamente elementos posicionados con
  // left: -9999px (html2canvas captura canvas vacío). Con translate(0, -200vh)
  // el navegador sí calcula layout y los hijos quedan renderizados.
  const wrapper = document.createElement('div')
  Object.assign(wrapper.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '210mm',
    background: '#ffffff',
    transform: 'translateY(-200vh)',
    pointerEvents: 'none',
    zIndex: '-1',
  })

  // El elemento puede venir afectado por un `zoom` del padre (ej. .preview-zoom-wrap
  // en el modal de exportar). Clonamos y reseteamos solo lo imprescindible:
  // zoom y transform. NO tocamos padding/margin/height: el DocumentPreview ya
  // está diseñado para medir A4 (210×297mm); cualquier override destruye su
  // layout interno.
  const clone = element.cloneNode(true) as HTMLElement
  Object.assign(clone.style, {
    zoom: '1',
    transform: 'none',
    transformOrigin: 'top left',
    width: '210mm',
    background: '#ffffff',
    visibility: 'visible',
    display: 'block',
  })

  wrapper.appendChild(clone)
  document.body.appendChild(wrapper)

  // Esperar a que el navegador pinte el clone antes de capturarlo.
  await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

  // Medir la altura real renderizada. Si excede el alto de A4 (297mm = 1123px
  // a 96 dpi), aplicar escala uniforme al clone para que quepa en una sola
  // página sin recortes y sin perder padding/margen del diseño.
  const A4_HEIGHT_PX = 1123
  const realHeight = Math.max(clone.scrollHeight, clone.offsetHeight)
  if (realHeight > A4_HEIGHT_PX) {
    const fitScale = A4_HEIGHT_PX / realHeight
    clone.style.transform = `scale(${fitScale})`
    clone.style.transformOrigin = 'top left'
    // Compensar el ancho que pierde al escalar para mantener proporciones
    clone.style.width = `${210 / fitScale}mm`
    // Volver a esperar un frame para que el navegador aplique la transformación
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  }

  const opciones = {
    margin: [0, 0, 0, 0] as [number, number, number, number],
    filename: `${filename}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      backgroundColor: '#ffffff',
      windowWidth: 794, // 210mm a 96 dpi
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4' as const,
      orientation: 'portrait' as const,
    },
    pagebreak: { mode: 'avoid-all' as const },
  }

  try {
    await (html2pdf as () => { set: (o: typeof opciones) => { from: (el: HTMLElement) => { save: () => Promise<void> } } })()
      .set(opciones)
      .from(clone)
      .save()
  } finally {
    document.body.removeChild(wrapper)
  }
}

/** Construye el HTML completo de la página de impresión. */
function buildPrintHtml(element: HTMLElement, titulo: string): string {
  const styleLinks = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
    .map((l) => `<link rel="stylesheet" href="${l.href}">`)
    .join('\n')

  const inlineStyles = Array.from(document.querySelectorAll('style'))
    .map((s) => `<style>${s.textContent}</style>`)
    .join('\n')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${titulo}</title>
  ${styleLinks}
  ${inlineStyles}
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    @page { size: A4; margin: 0; }
    html, body {
      margin: 0; padding: 0;
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  </style>
</head>
<body>
  ${element.outerHTML}
</body>
</html>`
}

export async function descargarPdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  // En móvil/tablet, html2pdf da mejor UX que window.print()
  if (isMobileLikeViewport()) {
    return descargarPdfMobile(element, filename)
  }

  return new Promise((resolve, reject) => {
    const html = buildPrintHtml(element, filename)
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;'
    document.body.appendChild(iframe)

    // Guardar el título original para restaurarlo después
    const originalTitle = document.title

    const cleanup = () => {
      // Restaurar el título original de la SPA
      document.title = originalTitle
      URL.revokeObjectURL(url)
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
      resolve()
    }

    iframe.onload = () => {
      try {
        const win = iframe.contentWindow
        if (!win) { cleanup(); return }

        setTimeout(() => {
          try {
            // Cambiar el título de la página padre ANTES de imprimir.
            // Chrome usa document.title (no el <title> del iframe) como
            // nombre sugerido al guardar como PDF.
            document.title = filename

            win.focus()
            win.print()
            // Restaurar después de que el diálogo se cierre (estimado)
            setTimeout(cleanup, 1000)
          } catch (e) {
            cleanup()
            reject(e)
          }
        }, 500)
      } catch (e) {
        cleanup()
        reject(e)
      }
    }

    iframe.onerror = () => {
      cleanup()
      reject(new Error('No se pudo cargar el iframe de impresión'))
    }

    iframe.src = url
  })
}

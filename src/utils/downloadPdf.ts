/**
 * downloadPdf.ts
 *
 * html2canvas no soporta oklch() y Tailwind v4 lo usa en todo.
 * Solución definitiva: iframe oculto → print nativo del navegador.
 *
 * Ventajas sobre html2canvas:
 *  - El motor de print del navegador entiende oklch perfectamente
 *  - Sin dependencias externas (html2canvas / jsPDF)
 *  - El PDF generado es vectorial (texto seleccionable, sin artefactos JPEG)
 *  - Sin popup blocker (iframe está en la misma página)
 *
 * NOTA sobre el nombre del PDF:
 *  Chrome y la mayoría de navegadores usan document.title de la página PADRE
 *  como nombre sugerido al guardar como PDF, ignorando el <title> del iframe.
 *  Solución: cambiar document.title temporalmente antes de llamar a print()
 *  y restaurarlo en cuanto el diálogo se cierra.
 */

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

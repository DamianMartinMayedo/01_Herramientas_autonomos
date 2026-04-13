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
 * Flujo:
 *  1. Serializar el HTML del elemento + estilos inline actuales
 *  2. Crear un blob HTML con @media print que oculta cualquier UI extra
 *  3. Inyectar un iframe oculto con ese blob
 *  4. Cuando carga, llamar a contentWindow.print()
 *  5. Limpiar el iframe tras un timeout
 */

/** Construye el HTML completo de la página de impresión. */
function buildPrintHtml(element: HTMLElement, titulo: string): string {
  // Recoger todas las hojas de estilo del documento actual
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

    const cleanup = () => {
      URL.revokeObjectURL(url)
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe)
      resolve()
    }

    iframe.onload = () => {
      try {
        const win = iframe.contentWindow
        if (!win) { cleanup(); return }

        // Esperar a que los estilos se apliquen antes de imprimir
        setTimeout(() => {
          try {
            win.focus()
            win.print()
            // Limpiar después de que el diálogo se cierre (estimado)
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

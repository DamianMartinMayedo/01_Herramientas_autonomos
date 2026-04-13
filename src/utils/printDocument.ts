/**
 * printDocument.ts
 *
 * Abre una nueva pestaña con el documento renderizado + botón de impresión.
 * El usuario imprime y selecciona "Guardar como PDF" en el diálogo del navegador.
 *
 * Por qué este enfoque en lugar de html2pdf:
 *  - Funciona 100% en local sin configuración
 *  - No depende de canvas rendering (que fallaba con elementos ocultos)
 *  - Usa el motor de impresión del propio navegador → PDF perfecto
 *  - Sin dependencias externas
 */
export function abrirVistaImpresion(element: HTMLElement, titulo: string): void {
  const ventana = window.open('', '_blank', 'width=960,height=800')

  if (!ventana) {
    // El navegador bloqueó el popup (hay que permitirlo en la barra de direcciones)
    throw new Error('POPUP_BLOCKED')
  }

  const contenido = element.outerHTML

  ventana.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${titulo}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    @page { size: A4; margin: 0; }

    body {
      background: #f5f5f4;
      font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .barra {
      position: sticky;
      top: 0;
      z-index: 10;
      background: white;
      border-bottom: 1px solid #e7e5e4;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .btn-pdf {
      background: #0f766e;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn-pdf:hover { background: #115e59; }

    .btn-cerrar {
      background: none;
      border: 1px solid #d6d3d1;
      color: #78716c;
      padding: 10px 18px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    }

    /* Al imprimir: ocultar barra, fondo blanco */
    @media print {
      .barra { display: none !important; }
      body { background: white; }
      .contenedor { padding: 0 !important; }
    }
  </style>
</head>
<body>

  <div class="barra">
    <div>
      <strong style="font-size:14px;color:#1c1917">${titulo}</strong>
      <p style="font-size:12px;color:#a8a29e;margin-top:2px">
        En el diálogo de impresión, selecciona <strong>Guardar como PDF</strong> como destino
      </p>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn-cerrar" onclick="window.close()">✕ Cerrar</button>
      <button class="btn-pdf" onclick="window.print()">⬇ Guardar como PDF</button>
    </div>
  </div>

  <div class="contenedor" style="padding:32px;display:flex;justify-content:center;">
    <div style="box-shadow:0 4px 32px rgba(0,0,0,0.12);">
      ${contenido}
    </div>
  </div>

</body>
</html>`)

  ventana.document.close()
}

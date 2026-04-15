/**
 * adminStore.ts
 * Estado global del panel de administración.
 *
 * Arquitectura local→cloud:
 *   - Ahora:     Zustand + localStorage (persist)
 *   - En cloud:  Reemplazar las acciones de blog/herramientas con llamadas a
 *               Supabase (o cualquier API REST). La interfaz de tipos no cambia.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'

/* ── Tipos ──────────────────────────────────────────────────────────────── */

export type BlogStatus = 'draft' | 'published'

export interface BlogPost {
  id: string
  titulo: string
  slug: string
  extracto: string
  contenido: string   // Markdown / HTML raw
  tags: string[]
  status: BlogStatus
  createdAt: string   // ISO date
  updatedAt: string
  publishedAt: string | null
}

export interface Herramienta {
  id: string
  nombre: string
  ruta: string
  activa: boolean
  proximamente: boolean
  descripcion: string
  categoria: 'documentos' | 'calculadoras'
  usosRegistrados: number
}

export interface LocalEvent {
  id: string
  tipo: 'pageview' | 'tool_use' | 'pdf_export' | 'presupuesto_to_factura'
  herramienta?: string
  timestamp: string
}

interface AdminState {
  // ── Auth ──
  isAuthenticated: boolean
  login: (pin: string) => boolean
  logout: () => void

  // ── Blog ──
  posts: BlogPost[]
  createPost: (data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) => BlogPost
  updatePost: (id: string, data: Partial<BlogPost>) => void
  deletePost: (id: string) => void
  publishPost: (id: string) => void
  unpublishPost: (id: string) => void

  // ── Herramientas ──
  herramientas: Herramienta[]
  toggleHerramienta: (id: string) => void
  updateHerramienta: (id: string, data: Partial<Herramienta>) => void

  // ── Eventos locales (actividad propia) ──
  events: LocalEvent[]
  pushEvent: (tipo: LocalEvent['tipo'], herramienta?: string) => void
  clearOldEvents: () => void
}

/* ── Herramientas por defecto ───────────────────────────────────────────── */
const HERRAMIENTAS_DEFAULT: Herramienta[] = [
  { id: 'factura', nombre: 'Generador de facturas', ruta: '/factura', activa: true, proximamente: false, descripcion: 'Crea facturas con IVA e IRPF y descárgalas en PDF al instante.', categoria: 'documentos', usosRegistrados: 0 },
  { id: 'presupuesto', nombre: 'Generador de presupuestos', ruta: '/presupuesto', activa: true, proximamente: false, descripcion: 'Envía presupuestos profesionales a tus clientes en minutos.', categoria: 'documentos', usosRegistrados: 0 },
  { id: 'cuota-autonomos', nombre: 'Cuota de autónomos', ruta: '/cuota-autonomos', activa: false, proximamente: true, descripcion: 'Calcula tu cuota mensual según tus ingresos netos reales.', categoria: 'calculadoras', usosRegistrados: 0 },
  { id: 'precio-hora', nombre: 'Precio por hora', ruta: '/precio-hora', activa: false, proximamente: true, descripcion: 'Fija tu tarifa sin venderte por debajo de coste.', categoria: 'calculadoras', usosRegistrados: 0 },
  { id: 'iva-irpf', nombre: 'IVA / IRPF', ruta: '/iva-irpf', activa: false, proximamente: true, descripcion: 'Separa base imponible, IVA e IRPF de cualquier importe.', categoria: 'calculadoras', usosRegistrados: 0 },
]

/* ── Artículo seed original ─────────────────────────────────────────────── */
const SEED_POST: BlogPost = {
  id: 'seed-iva-trimestral',
  titulo: 'Cómo presentar el IVA trimestral sin errores: guía práctica para autónomos',
  slug: 'como-presentar-iva-trimestral-autonomos',
  extracto: 'El modelo 303 es la declaración trimestral de IVA que todo autónomo debe presentar cuatro veces al año. En este artículo te explico paso a paso cómo cumplimentarlo correctamente, qué gastos puedes deducir y cómo evitar los errores más comunes.',
  contenido: `## ¿Qué es el modelo 303?

El **modelo 303** es la autoliquidación del IVA (Impuesto sobre el Valor Añadido) que los autónomos y empresas deben presentar trimestralmente ante la Agencia Tributaria (AEAT).

En él se declara la diferencia entre:

- **IVA repercutido**: el que has cobrado a tus clientes en tus facturas.
- **IVA soportado**: el que tú has pagado a tus proveedores y que puedes deducir.

Si el resultado es positivo, pagas a Hacienda. Si es negativo, puedes compensarlo en trimestres siguientes o solicitar la devolución al presentar el modelo 390 anual.

---

## Plazos de presentación

Los cuatro periodos trimestrales y sus fechas límite son:

- **1T (enero–marzo):** hasta el 20 de abril
- **2T (abril–junio):** hasta el 20 de julio
- **3T (julio–septiembre):** hasta el 20 de octubre
- **4T (octubre–diciembre):** hasta el 30 de enero del año siguiente

**Consejo:** domicilia el pago en cuenta desde el primer año. Hacienda te da 5 días extra de plazo cuando domicilias, y evitas olvidos.

---

## ¿Qué gastos puedes deducir?

El IVA de un gasto **solo es deducible si está directamente relacionado con tu actividad económica**. Algunos ejemplos habituales:

- Material de oficina y equipamiento informático
- Software y herramientas de trabajo (hosting, suscripciones SaaS)
- Publicidad y marketing digital
- Formación relacionada con tu actividad
- Teléfono y conexión a internet (proporción de uso profesional)
- Vehículo y combustible (con limitaciones — consulta a tu asesor)

**Importante:** si trabajas desde casa, la deducción del IVA de suministros (luz, agua, internet) está limitada al porcentaje de la vivienda destinado a la actividad. Este punto genera muchas inspecciones, así que documenta bien.

---

## Errores más comunes al rellenar el 303

1. **Incluir facturas sin fecha en el trimestre correcto.** Cada factura tributa en el trimestre en que se emite o recibe, no en el que se cobra o paga.
2. **Olvidar las facturas de gastos.** Muchos autónomos solo meten el IVA repercutido y olvidan el soportado. Revisa todas las facturas de proveedores del trimestre.
3. **Deducir el 100% del IVA de gastos mixtos.** Si usas el móvil o el coche tanto para trabajo como para uso personal, solo puedes deducir la parte proporcional al uso profesional.
4. **No presentar si el resultado es cero.** El modelo 303 es obligatorio aunque no tengas actividad o el resultado sea cero. La no presentación conlleva sanción.
5. **Aplicar el tipo incorrecto.** En España hay tres tipos: general (21%), reducido (10%) y superreducido (4%). Asegúrate de aplicar el correcto según el bien o servicio.

---

## Paso a paso: cómo presentarlo en la Sede Electrónica

1. Accede a la **Sede Electrónica de la AEAT** con certificado digital, Cl@ve o DNI electrónico.
2. Ve a *Trámites destacados → Modelo 303*.
3. Introduce tus datos de actividad y el ejercicio/periodo.
4. Rellena el **IVA devengado** (repercutido a clientes) en la casilla correspondiente según el tipo aplicado.
5. Rellena el **IVA deducible** (soportado de proveedores).
6. Comprueba el resultado en la casilla de liquidación.
7. Si el resultado es a pagar, domicilia o paga con NRC bancario antes del plazo.
8. Guarda el justificante de presentación en un lugar seguro.

---

## Herramienta recomendada

Si emites tus facturas con nuestra herramienta gratuita, el IVA repercutido queda registrado automáticamente, lo que facilita mucho el cálculo del trimestre. Cada factura descargada en PDF incluye la base imponible, el IVA y el total claramente diferenciados.`,
  tags: ['IVA', 'Modelo 303', 'Fiscalidad', 'Autónomos'],
  status: 'published',
  createdAt: '2025-10-01T10:00:00.000Z',
  updatedAt: '2025-10-01T10:00:00.000Z',
  publishedAt: '2025-10-01T10:00:00.000Z',
}

/* ── Artículos SEO (tendencias Google Trends España 2025-2026) ──────────── */
const SEO_POSTS: BlogPost[] = [
  {
    id: 'seed-verifactu-autonomos',
    titulo: 'Verifactu para autónomos: qué es, cuándo es obligatorio y cómo adaptarte',
    slug: 'verifactu-autonomos-que-es-obligatorio-como-adaptarte',
    extracto: 'Verifactu es el nuevo sistema de facturación verificable que Hacienda exige a autónomos y empresas. En esta guía te explicamos qué implica, desde cuándo es obligatorio en 2026 y qué necesitas hacer para cumplir sin perder tiempo ni dinero.',
    contenido: `## ¿Qué es Verifactu?

**Verifactu** (o VeriFactu) es el sistema de registro de facturación de alta seguridad impulsado por la Agencia Tributaria española, regulado por la **Ley Antifraude (Ley 11/2021)** y su desarrollo reglamentario. Su objetivo es garantizar la integridad e inalterabilidad de cada factura emitida mediante un código QR y un registro encadenado de facturas.

En la práctica significa que tu software de facturación deberá:

- Generar un **código hash** único por cada factura.
- Incluir un **código QR** que Hacienda pueda escanear para verificar la autenticidad.
- Enviar (o tener disponible para enviar) cada registro a la AEAT en tiempo real o diferido.

---

## ¿A quién afecta?

Verifactu afecta a **todos los autónomos y empresas** que utilicen software informático para emitir facturas, con independencia del volumen de facturación. Están excluidos quienes tributen exclusivamente en módulos (estimación objetiva) y no estén obligados a facturar electrónicamente.

---

## Fechas clave: ¿cuándo es obligatorio?

- **1 de julio de 2025:** obligatorio para **grandes empresas** y grupos fiscales.
- **1 de enero de 2026:** obligatorio para el **resto de empresas y autónomos** que usen software de facturación.

Si emites tus facturas a mano o con plantillas Word/Excel, Verifactu no te afecta directamente — aunque sí te afectará la obligación de **factura electrónica B2B** que llega en paralelo.

---

## ¿Qué diferencia hay entre Verifactu y la factura electrónica?

| Concepto | Verifactu | Factura electrónica (B2B) |
|---|---|---|
| **Obligatorio desde** | Enero 2026 | En desarrollo (2025-2026) |
| **Qué hace** | Registra y certifica cada factura ante la AEAT | Intercambio digital entre emisor y receptor |
| **Formato** | Cualquier formato + QR + hash | XML estructurado (Facturae o UBL) |
| **Envío a AEAT** | Opcional (sistema «VERI*FACTU») u obligatorio en el futuro | No directo a AEAT |

Ambos sistemas **pueden coexistir** en el mismo software. Muchos proveedores ya están integrando los dos.

---

## Cómo adaptarte como autónomo: paso a paso

1. **Comprueba si tu software actual es compatible.** Pregunta a tu proveedor si ya cuenta con certificación Verifactu. Los principales programas del mercado (Holded, Factura Directa, Contasol, Quipu…) ya están adaptados o en proceso.
2. **Si usas Excel o Word, es el momento de dar el salto.** Necesitarás un software homologado. Existen opciones gratuitas o de bajo coste perfectamente válidas para autónomos con pocas facturas al mes.
3. **Verifica que el QR aparece en tus facturas.** A partir de la fecha de obligación, cada PDF de factura deberá llevar el código QR con el hash de verificación.
4. **Conserva los registros.** Aunque el envío a la AEAT no sea todavía automático para todos, el sistema debe mantener un registro local auditable.
5. **Habla con tu asesor.** Si tienes gestoría, confirma que su software también está adaptado, ya que suelen emitir facturas en tu nombre.

---

## Sanciones por incumplimiento

La Ley Antifraude establece sanciones de **hasta 50.000 € por ejercicio** para quienes utilicen software que no cumpla con los requisitos de integridad de registros. No es una sanción por no enviar facturas a Hacienda, sino por usar herramientas que permitan manipular o eliminar registros contables.

---

## En resumen

Verifactu no es una complicación extra: es una modernización del sistema de facturación que, bien implementada, te protege ante inspecciones y agiliza tu contabilidad. Asegúrate de usar un software adaptado antes de enero de 2026 y tendrás el 100% cubierto.`,
    tags: ['Verifactu', 'Facturación', 'Ley Antifraude', 'Software', 'Autónomos'],
    status: 'published',
    createdAt: '2026-01-10T09:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
    publishedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'seed-tarifa-plana-autonomos-2026',
    titulo: 'Tarifa plana de autónomos 2026: requisitos, importe y cómo solicitarla',
    slug: 'tarifa-plana-autonomos-2026-requisitos-importe-como-solicitarla',
    extracto: 'La tarifa plana para nuevos autónomos sigue siendo una de las ayudas más buscadas en España. En 2026 el importe se mantiene en 80 € al mes durante el primer año. Te contamos quién puede pedirla, cuánto dura, qué condiciones debes cumplir y cómo solicitarla en la Seguridad Social.',
    contenido: `## ¿Qué es la tarifa plana de autónomos?

La **tarifa plana** es una reducción de la cuota a la Seguridad Social para quienes se dan de alta como autónomos por primera vez (o llevan más de dos años sin serlo). Permite pagar solo **80 € al mes** durante los primeros 12 meses, independientemente de los ingresos reales, en lugar de la cuota ordinaria calculada sobre la base de cotización.

Esta medida está recogida en el **Real Decreto-Ley de Reformas Urgentes del Trabajo Autónomo** y fue actualizada con la reforma del sistema de cotización por ingresos reales de 2023.

---

## Importe y duración en 2026

- **Cuota mensual:** 80 € durante los primeros **12 meses** (antes eran 6 meses a 60 €).
- **Prórroga:** puedes solicitar 12 meses adicionales si al final del primer año tus rendimientos netos están **por debajo del Salario Mínimo Interprofesional (SMI)**. En 2026 el SMI es de 1.184 € brutos/mes (14 pagas).
- **Total máximo:** hasta **24 meses** con tarifa plana si se cumple la condición de ingresos.

---

## ¿Quién puede solicitarla? Requisitos

Para acceder a la tarifa plana en 2026 debes cumplir **todos estos requisitos**:

1. **Primera vez** que te das de alta en el RETA (Régimen Especial de Trabajadores Autónomos), o haber estado de baja durante al menos **2 años** (3 años si ya disfrutaste de tarifa plana anteriormente).
2. No tener **deudas pendientes** con la Seguridad Social ni con Hacienda en el momento del alta.
3. Darte de alta en el **Censo de Empresarios** de la AEAT (modelo 036 o 037) en el mismo momento o antes del alta en la Seguridad Social.
4. No ser **autónomo societario** (administrador de sociedad): la tarifa plana es solo para autónomos persona física.
5. No haber sido **autónomo colaborador** (familiar) en los últimos 2 años.

---

## Cómo solicitarla: paso a paso

1. **Rellena el modelo TA.0521** (solicitud de alta en el RETA) en la Sede Electrónica de la Seguridad Social o en tu oficina CAISS más cercana.
2. En el formulario, marca la casilla de **tarifa plana / bonificación para nuevos autónomos**. Si no la marcas en el momento del alta, no podrás aplicarla después con carácter retroactivo.
3. Presenta simultáneamente el **modelo 036 o 037** en la AEAT para el alta en el Censo de Empresarios.
4. Recibirás la confirmación del alta y el importe de 80 € aparecerá en el primer recibo de domiciliación.
5. Si quieres solicitar la **prórroga de 12 meses adicionales**, deberás justificar ante la TGSS que tus ingresos no superan el SMI al finalizar el primer año.

---

## Compatibilidades e incompatibilidades

**Compatible con:**
- Cobrar el paro (prestación por desempleo) de forma capitalizada.
- Trabajar simultáneamente como asalariado a tiempo parcial (pluriactividad), con bonificaciones adicionales.
- Deducciones fiscales en el IRPF del primer año de actividad.

**Incompatible con:**
- Ser autónomo societario (SL, SA).
- Haber disfrutado de tarifa plana en los últimos 3 años.
- Estar en el Régimen General de la Seguridad Social como administrador con más del 25% del capital.

---

## ¿Qué pasa al acabar la tarifa plana?

Al finalizar el periodo bonificado, tu cuota pasará al sistema de **cotización por ingresos reales** vigente desde 2023. Esto significa que pagarás una cuota mensual proporcional a tus rendimientos netos del año anterior, con un mínimo de aproximadamente 230 € y un máximo variable según tu tramo de ingresos.

Planifica con antelación: el salto de 80 € a tu cuota ordinaria puede suponer más de 150 € adicionales al mes. Ajusta tu ahorro mensual desde el primer día.`,
    tags: ['Tarifa plana', 'Alta autónomos', 'Seguridad Social', 'Cuota', 'Autónomos 2026'],
    status: 'published',
    createdAt: '2026-01-20T10:00:00.000Z',
    updatedAt: '2026-01-20T10:00:00.000Z',
    publishedAt: '2026-01-20T10:00:00.000Z',
  },
  {
    id: 'seed-gastos-deducibles-autonomos',
    titulo: 'Gastos deducibles para autónomos en 2026: lista completa con ejemplos',
    slug: 'gastos-deducibles-autonomos-2026-lista-completa',
    extracto: '¿Sabes realmente qué gastos puedes deducirte como autónomo? Muchos autónomos pagan más impuestos de los necesarios por desconocer qué es deducible y qué no. Aquí tienes la lista completa actualizada para 2026 con ejemplos prácticos y los límites que marca Hacienda.',
    contenido: `## ¿Qué significa que un gasto sea deducible?

Un gasto es **fiscalmente deducible** cuando cumple tres condiciones simultáneas:

1. Está **vinculado a la actividad económica** (sirve para generar ingresos).
2. Está **justificado documentalmente** (tienes factura, ticket o recibo a tu nombre o NIF).
3. Está **contabilizado o anotado** en tu libro de gastos.

Si el gasto cumple los tres requisitos, reduce tu **base imponible del IRPF** y, en la mayoría de casos, también te permite deducir el **IVA soportado** en la declaración trimestral.

---

## Lista completa de gastos deducibles

### Suministros y lugar de trabajo

- **Alquiler de oficina o local:** 100% deducible si está exclusivamente dedicado a la actividad.
- **Suministros del local** (luz, agua, internet, teléfono): 100% si el contrato está a nombre de la actividad.
- **Trabajo desde casa:** puedes deducir el **30% de los suministros** proporcional al porcentaje del domicilio afectado a la actividad (por ejemplo, si la oficina ocupa el 20% de la vivienda, deduces el 30% × 20% = 6% del total de suministros). El alquiler de vivienda habitual **no es deducible**.

### Material y equipamiento

- Ordenadores, tablets, monitores, periféricos: deducibles si son de uso profesional.
- Mobiliario de oficina (escritorio, silla ergonómica): deducible en la proporción de uso profesional.
- Material de papelería y consumibles: 100% deducible.

### Software y suscripciones digitales

- Software de facturación, contabilidad, diseño, edición de vídeo.
- Suscripciones a herramientas SaaS (Adobe, Canva Pro, herramientas de email marketing, CRMs).
- Dominio y hosting de tu página web profesional.
- Licencias de Microsoft 365, Google Workspace.

### Formación y desarrollo profesional

- Cursos, másteres y formación **relacionada con tu actividad**.
- Libros técnicos, revistas especializadas, suscripciones a medios profesionales.
- Asistencia a congresos y ferias del sector (incluidos desplazamiento y alojamiento).

### Desplazamientos y vehículo

- **Transporte público** (tren, avión, taxi, VTC) en desplazamientos de trabajo: 100% con ticket o factura.
- **Vehículo propio:** solo deducible al **50%** (tanto IRPF como IVA) si no es de uso exclusivamente profesional. Hacienda presume uso mixto salvo que puedas demostrar lo contrario (comerciales, transportistas…).
- **Dietas y manutención** en desplazamientos: hasta **26,67 €/día** en España y **48,08 €/día** en el extranjero sin pernocta (el doble con pernocta), siempre que sea en establecimiento de hostelería y tengas factura.

### Seguros

- Seguro de responsabilidad civil profesional: 100% deducible.
- Seguro médico privado: hasta **500 € anuales** por el autónomo, cónyuge e hijos menores de 25 años que convivan (1.500 € si hay discapacidad).
- Seguro de accidentes laborales y enfermedad profesional.

### Servicios profesionales externos

- Gestoría, asesoría fiscal y contable.
- Abogados, notarios (en asuntos relacionados con la actividad).
- Servicios de diseño gráfico, fotografía, copywriting, desarrollo web.
- Cuotas de coworking.

### Publicidad y marketing

- Campañas de Google Ads, Meta Ads, LinkedIn Ads.
- Diseño de logotipo, tarjetas de visita, material corporativo.
- Creación y mantenimiento de redes sociales profesionales.

### Cuotas y tributos

- **Cuota de autónomos a la Seguridad Social:** 100% deducible en IRPF.
- IBI y tasas municipales si el local está afecto a la actividad.
- Cuotas de colegios profesionales obligatorios.

---

## Gastos que NO son deducibles (errores frecuentes)

- **Multas y sanciones** administrativas o penales.
- **Donaciones** (salvo las contempladas en la Ley de Mecenazgo).
- **Gastos de representación** desproporcionados o sin justificación de la relación con clientes.
- **Alimentación cotidiana** (la compra del supermercado no es deducible aunque trabajes desde casa).
- **Ropa** (salvo uniformes o ropa de protección con logo de la empresa).
- **Gastos personales** disfrazados de gastos profesionales.

---

## Consejo práctico: el método de las tres carpetas

Organiza tus facturas en tres carpetas digitales o físicas cada mes:

1. **100% profesional** — facturas de gastos exclusivamente de la actividad.
2. **Mixto** — gastos de uso profesional y personal (móvil, internet, vehículo).
3. **Dudoso** — facturas sobre las que no estás seguro: consúltalo con tu asesor antes de deducirlos.

Esta organización mensual te ahorra horas en la declaración trimestral y te protege ante una posible inspección.`,
    tags: ['Gastos deducibles', 'IRPF', 'Fiscalidad', 'Deducciones', 'Autónomos 2026'],
    status: 'published',
    createdAt: '2026-02-03T10:00:00.000Z',
    updatedAt: '2026-02-03T10:00:00.000Z',
    publishedAt: '2026-02-03T10:00:00.000Z',
  },
  {
    id: 'seed-factura-rectificativa',
    titulo: 'Factura rectificativa: cuándo emitirla, cómo hacerla y qué dice Hacienda',
    slug: 'factura-rectificativa-cuando-emitirla-como-hacerla',
    extracto: 'Una factura rectificativa corrige errores o modifica una factura ya emitida. Es uno de los documentos más buscados por autónomos y, también, uno de los más mal hechos. Aquí tienes todo lo que necesitas saber: cuándo es obligatoria, qué debe incluir y cómo afecta a tu IVA e IRPF.',
    contenido: `## ¿Qué es una factura rectificativa?

Una **factura rectificativa** es un documento que corrige, modifica o anula total o parcialmente una factura ordinaria ya emitida. No es una factura nueva: es la corrección oficial de una factura anterior.

En España está regulada por el **Reglamento de Facturación (RD 1619/2012)**, artículos 13 al 16, que establece cuándo es obligatoria, qué debe contener y cómo afecta a la contabilidad del IVA.

---

## ¿Cuándo debes emitir una factura rectificativa?

Debes emitirla cuando se produzca alguna de estas situaciones:

1. **Error en los datos del destinatario** (NIF incorrecto, nombre mal escrito, dirección errónea).
2. **Error en el importe, tipo de IVA o base imponible** de la factura original.
3. **Devolución total o parcial** de bienes o servicios ya facturados.
4. **Descuento posterior a la emisión** de la factura (rappel, descuento por pronto pago pactado después).
5. **Resolución del contrato** o no realización definitiva de la operación.
6. **Créditos incobrables:** cuando llevas más de 6 meses sin cobrar y quieres recuperar el IVA ingresado.

---

## ¿Qué debe incluir obligatoriamente?

La factura rectificativa debe contener **todos los datos de una factura ordinaria** más:

- La mención expresa de **«Factura Rectificativa»**.
- El **número y fecha de la factura original** que se rectifica.
- La **causa de la rectificación** (error en datos, devolución, descuento…).
- Los importes correctos: puedes optar por indicar solo la **diferencia** (positiva o negativa) o mostrar los datos originales y los nuevos juntos.

**Numeración:** debe tener su propia serie de numeración, diferente a las facturas ordinarias. Lo más habitual es usar una serie «R» (R-001, R-002…) o «RECT» (RECT-2026-001).

---

## Cómo afecta a tu declaración de IVA

La factura rectificativa **modifica el IVA del periodo** en que se emite, no del periodo de la factura original.

**Ejemplo práctico:**
- Emitiste una factura en enero con un IVA de 210 € que ya declaraste en el 1T.
- En abril te das cuenta de que el tipo era incorrecto y el IVA debería haber sido 105 €.
- Emites la rectificativa en abril.
- En la declaración del **2T** incluirás -105 € de IVA repercutido, que compensará el exceso pagado.

Si la rectificativa implica una devolución de dinero al cliente, asegúrate de cruzar el albarán de devolución o el justificante del abono bancario con la factura rectificativa.

---

## ¿Puede tener importe positivo?

Sí. Aunque lo más habitual es que rectifique a la baja (corrección de errores, devoluciones), una factura rectificativa puede tener importe **positivo** si, por ejemplo, se olvidó incluir un concepto o el precio acordado era mayor que el facturado.

---

## Diferencia entre factura rectificativa y nota de abono

En la práctica empresarial se usa el término **nota de abono** para referirse a una factura rectificativa que cancela o reduce una factura anterior. Fiscalmente son lo mismo: Hacienda solo reconoce la factura rectificativa como documento válido. Una nota de abono sin los requisitos del RD 1619/2012 **no tiene validez fiscal**.

---

## Errores más comunes

1. **Emitir una nueva factura en lugar de rectificar.** Si ya facturaste 1.000 € y quieres corregirlo, no emitas una factura de -1.000 € como si fuera nueva: emite una rectificativa que haga referencia explícita a la original.
2. **No usar serie propia.** Mezclar la numeración con las facturas ordinarias puede generar problemas en una inspección.
3. **Rectificar fuera de plazo.** Para rectificar a efectos del IVA tienes un plazo de **4 años** desde la emisión de la factura original. Pasado ese plazo, el derecho a rectificar caduca.
4. **No comunicar la rectificativa al cliente.** El destinatario debe recibir la factura rectificativa para poder ajustar también su contabilidad y sus declaraciones de IVA.`,
    tags: ['Factura rectificativa', 'Facturación', 'IVA', 'Nota de abono', 'Autónomos'],
    status: 'published',
    createdAt: '2026-02-18T10:00:00.000Z',
    updatedAt: '2026-02-18T10:00:00.000Z',
    publishedAt: '2026-02-18T10:00:00.000Z',
  },
  {
    id: 'seed-retencion-irpf-factura',
    titulo: 'Retención de IRPF en facturas: qué es, cuándo aplicarla y cómo calcularla',
    slug: 'retencion-irpf-facturas-autonomos-cuando-aplicar-como-calcular',
    extracto: '¿Cuándo debes aplicar retención de IRPF en tus facturas? ¿Es siempre obligatorio el 15%? ¿Qué ocurre si facturas a particulares? La retención de IRPF es uno de los conceptos que más confusión genera entre los autónomos. En esta guía lo aclaramos todo con ejemplos reales.',
    contenido: `## ¿Qué es la retención de IRPF en una factura?

Cuando un autónomo presta un servicio a una **empresa o profesional**, el pagador tiene la obligación de retener un porcentaje del importe y ingresarlo directamente a Hacienda en nombre del autónomo. Esto se llama **retención a cuenta del IRPF**.

En la factura aparece como un importe negativo que reduce el total a cobrar. Ese dinero no desaparece: lo ha pagado la empresa cliente a Hacienda en tu nombre, y tú lo recuperas (o lo compensas) cuando presentas la declaración de la renta.

---

## ¿Cuándo es obligatorio aplicar retención?

La retención es obligatoria cuando **se cumplen las dos condiciones siguientes:**

1. El autónomo desarrolla una **actividad profesional** (epígrafe de IAE de la sección segunda: abogados, consultores, diseñadores, traductores, formadores, etc.).
2. El cliente es una **empresa, entidad jurídica o autónomo** (no un particular).

Si tu cliente es un **particular (persona física no empresaria)**, NO aplicarás retención en la factura.

**¿Y si tengo una actividad empresarial?** Los autónomos con actividades encuadradas en la sección primera del IAE (actividades empresariales: comercio, hostelería, construcción…) generalmente **no aplican retención** en sus facturas.

---

## Porcentajes de retención en 2026

- **Tipo general:** **15%** para autónomos con más de 2 años de actividad.
- **Tipo reducido:** **7%** para autónomos en su **primer y segundo año de actividad** (y parte del tercero). Para aplicarlo, debes comunicárselo al cliente mediante una declaración responsable.
- **Arrendamiento de inmuebles afectos a la actividad:** 19%.
- **Propiedad intelectual e industrial:** 15% (con excepciones al 7%).

---

## Ejemplo práctico de factura con retención

Supongamos que eres diseñador gráfico y emites una factura de 1.000 € a una empresa:

- Base imponible: **1.000,00 €**
- IVA (21%): **+ 210,00 €**
- Retención IRPF (15%): **- 150,00 €**
- **Total a cobrar: 1.060,00 €**

La empresa pagará 1.060 € y, además, ingresará los 150 € retenidos a Hacienda trimestralmente mediante el **modelo 111**.

Tú, en tu declaración de la renta anual, declararás los 1.000 € como ingreso pero tendrás ya pagados 150 € a cuenta. Si tu deuda tributaria final es de 120 €, Hacienda te devolverá 30 €.

---

## ¿Cómo acreditar el tipo reducido del 7%?

Para aplicar el 7% en lugar del 15%, debes **comunicarlo expresamente** al cliente antes o en el momento de emitir la factura. Lo habitual es incluir un texto en la propia factura o enviar una carta de comunicación que diga:

*«El prestador del servicio comunica que, de acuerdo con el artículo 95.1 del Reglamento del IRPF, le es de aplicación el tipo de retención reducido del 7%, por haber iniciado su actividad en el año [año] / en el año [año-1].»*

Conserva la comunicación firmada: en caso de inspección, necesitarás demostrar que informaste al cliente.

---

## ¿Y si el cliente no te hace la retención?

Si el cliente (empresa) no practica la retención, **la responsabilidad es del pagador**, no tuya. Sin embargo, para no tener problemas en tu declaración de la renta, asegúrate de incluir siempre la retención en tu factura. Si el cliente se niega, recuérdales que es una obligación legal (art. 99 y ss. de la Ley del IRPF).

---

## Modelo 130 vs retenciones de clientes

Los autónomos en estimación directa que tienen más del **70% de sus ingresos con retención** están **exentos de presentar el modelo 130** (pago fraccionado del IRPF). Si no llegas a ese umbral, debes presentar el 130 trimestralmente aunque tengas retenciones.

Revisa cada trimestre qué porcentaje de tus ingresos lleva retención. Si cambias de mix de clientes (más particulares, más empresas extranjeras sin retención), puede que pases a estar obligado al 130.`,
    tags: ['IRPF', 'Retención', 'Facturación', 'Modelo 111', 'Autónomos'],
    status: 'published',
    createdAt: '2026-03-05T10:00:00.000Z',
    updatedAt: '2026-03-05T10:00:00.000Z',
    publishedAt: '2026-03-05T10:00:00.000Z',
  },
]

/* ── Contraseña por defecto ─────────────────────────────────────────────── */
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN ?? 'admin1234'

/* ── Store ──────────────────────────────────────────────────────────────── */
export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      /* ── Auth ─────────────────────────────────────────────────────────── */
      isAuthenticated: false,

      login: (pin) => {
        if (pin === ADMIN_PIN) {
          set({ isAuthenticated: true })
          return true
        }
        return false
      },

      logout: () => set({ isAuthenticated: false }),

      /* ── Blog ─────────────────────────────────────────────────────────── */
      posts: [SEED_POST, ...SEO_POSTS],

      createPost: (data) => {
        const post: BlogPost = {
          ...data,
          id: nanoid(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({ posts: [post, ...s.posts] }))
        return post
      },

      updatePost: (id, data) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        })),

      deletePost: (id) =>
        set((s) => ({ posts: s.posts.filter((p) => p.id !== id) })),

      publishPost: (id) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === id
              ? { ...p, status: 'published', publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      unpublishPost: (id) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === id ? { ...p, status: 'draft', updatedAt: new Date().toISOString() } : p
          ),
        })),

      /* ── Herramientas ─────────────────────────────────────────────────── */
      herramientas: HERRAMIENTAS_DEFAULT,

      toggleHerramienta: (id) =>
        set((s) => ({
          herramientas: s.herramientas.map((h) =>
            h.id === id ? { ...h, activa: !h.activa } : h
          ),
        })),

      updateHerramienta: (id, data) =>
        set((s) => ({
          herramientas: s.herramientas.map((h) =>
            h.id === id ? { ...h, ...data } : h
          ),
        })),

      /* ── Eventos locales ──────────────────────────────────────────────── */
      events: [],

      pushEvent: (tipo, herramienta) => {
        const event: LocalEvent = {
          id: nanoid(8),
          tipo,
          herramienta,
          timestamp: new Date().toISOString(),
        }
        set((s) => ({
          events: [event, ...s.events].slice(0, 500),
          herramientas: herramienta
            ? s.herramientas.map((h) =>
                h.id === herramienta
                  ? { ...h, usosRegistrados: h.usosRegistrados + 1 }
                  : h
              )
            : s.herramientas,
        }))
      },

      clearOldEvents: () => {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 30)
        set((s) => ({
          events: s.events.filter((e) => new Date(e.timestamp) > cutoff),
        }))
      },
    }),
    {
      name: 'ha-admin',
      merge: (persistedState: unknown, currentState: AdminState): AdminState => {
        const persisted = persistedState as Partial<AdminState>
        const mergedPosts = persisted.posts ?? currentState.posts
        // Asegura que todos los seeds existen (sin duplicar)
        const allSeeds = [SEED_POST, ...SEO_POSTS]
        const seedIds = allSeeds.map((p) => p.id)
        const userPosts = mergedPosts.filter((p) => !seedIds.includes(p.id))
        return {
          ...currentState,
          ...persisted,
          posts: [...allSeeds, ...userPosts],
        }
      },
    }
  )
)

/* ── Helpers de Analytics ───────────────────────────────────────────────── */

/** Dispara un evento GA4 si el SDK está cargado */
export function trackGA(eventName: string, params?: Record<string, unknown>) {
  type GtagFn = (command: 'event', eventName: string, params?: Record<string, unknown>) => void
  const win = window as unknown as { gtag?: GtagFn }
  if (typeof window !== 'undefined' && typeof win.gtag === 'function') {
    win.gtag('event', eventName, params)
  }
}

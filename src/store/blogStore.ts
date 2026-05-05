import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'

export type BlogStatus = 'draft' | 'published'

export interface BlogPost {
  id: string
  titulo: string
  slug: string
  extracto: string
  contenido: string
  tags: string[]
  status: BlogStatus
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

interface BlogState {
  posts: BlogPost[]
  createPost: (data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) => BlogPost
  updatePost: (id: string, data: Partial<BlogPost>) => void
  deletePost: (id: string) => void
  publishPost: (id: string) => void
  unpublishPost: (id: string) => void
}

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

Si emites tus facturas con nuestra [herramienta de facturación](/factura), el IVA repercutido queda registrado automáticamente, lo que facilita mucho el cálculo del trimestre. Cada factura descargada en PDF incluye la base imponible, el IVA y el total claramente diferenciados.

---

## Artículos relacionados

- [Gastos deducibles para autónomos en 2026](/blog/gastos-deducibles-autonomos-2026-lista-completa) — Lista completa con ejemplos prácticos
- [Retención de IRPF en facturas](/blog/retencion-irpf-facturas-autonomos-cuando-aplicar-como-calcular) — Cuándo aplicar el 15% o el 7%
- [Verifactu para autónomos](/blog/verifactu-autonomos-que-es-obligatorio-como-adaptarte) — El nuevo sistema de facturación verificable

---

## Preguntas frecuentes

### ¿Qué pasa si no presento el modelo 303 a tiempo?

La AEAT puede imponer sanciones por presentación fuera de plazo: un recargo del 5% al 20% de la cuota a ingresar, más intereses de demora. Si no presentas y el resultado es a pagar, la sanción puede ser mayor.

### ¿Puedo presentar el modelo 303 si no tengo actividad?

Sí, y debes hacerlo. El modelo 303 es obligatorio aunque no tengas ingresos ni gastos en el trimestre. En ese caso, se presenta con todas las casillas a cero.

### ¿Qué diferencia hay entre el modelo 303 y el modelo 390?

El modelo 303 es trimestral y el 390 es el resumen anual. Si presentas los cuatro modelos 303 del año, el 390 es declarativo (solo informativo) y no se paga nada adicional.

### ¿Puedo rectificar un modelo 303 ya presentado?

Sí. Si detectas un error después de presentar, puedes presentar una declaración complementaria (marcando la casilla correspondiente) o una solicitud de rectificación si el error te perjudica.`,
  tags: ['IVA', 'Modelo 303', 'Fiscalidad', 'Autónomos'],
  status: 'published',
  createdAt: '2025-10-01T10:00:00.000Z',
  updatedAt: '2025-10-01T10:00:00.000Z',
  publishedAt: '2025-10-01T10:00:00.000Z',
}

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

Verifactu no es una complicación extra: es una modernización del sistema de facturación que, bien implementada, te protege ante inspecciones y agiliza tu contabilidad. Asegúrate de usar un software adaptado antes de enero de 2026 y tendrás el 100% cubierto.

---

## Artículos relacionados

- [Cómo hacer una factura rectificativa](/blog/factura-rectificativa-cuando-emitirla-como-hacerla) — Cuándo y cómo corregir facturas erróneas
- [Retención de IRPF en facturas](/blog/retencion-irpf-facturas-autonomos-cuando-aplicar-como-calcular) — Cuándo aplicar el 15% o el 7%
- [Cómo presentar el IVA trimestral](/blog/como-presentar-iva-trimestral-autonomos) — Guía práctica del modelo 303

---

## Preguntas frecuentes

### ¿Verifactu es obligatorio si emito pocas facturas al año?

Sí. La obligación de Verifactu no depende del volumen de facturación. Afecta a todos los autónomos y empresas que utilicen software informático para emitir facturas, independientemente de cuántas factures al año.

### ¿Puedo seguir usando Excel para facturar?

Técnicamente sí, pero necesitarás un complemento o software adicional que genere el hash y el QR exigidos por Verifactu. Excel por sí solo no cumple los requisitos de integridad de registros.

### ¿Qué pasa si mi software no es compatible con Verifactu?

Podrías enfrentarte a sanciones de hasta 50.000 € por ejercicio fiscal. Además, las facturas emitidas con software no conforme no tendrían validez fiscal plena.

### ¿Verifactu sustituye a la factura electrónica B2B?

No. Son dos obligaciones diferentes que coexisten. Verifactu garantiza la integridad de las facturas ante Hacienda, mientras que la factura electrónica B2B regula el formato de intercambio entre empresas.`,
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

Planifica con antelación: el salto de 80 € a tu cuota ordinaria puede suponer más de 150 € adicionales al mes. Ajusta tu ahorro mensual desde el primer día.

Puedes usar nuestra [calculadora de cuota de autónomos](/cuota-autonomos) para estimar cuánto pagarás después de la tarifa plana según tus ingresos previstos.

---

## Artículos relacionados

- [Cuánto paga un autónomo de impuestos](/blog/cuanto-paga-autonomo-impuestos-mes) — Guía completa 2026
- [Gastos deducibles para autónomos](/blog/gastos-deducibles-autonomos-2026-lista-completa) — Lista completa con ejemplos
- [Cotización autónomos 2026](/blog/cotizacion-autonomos-2026-tabla-bases-cuotas) — Tabla de bases y cuotas por ingresos

---

## Preguntas frecuentes

### ¿Puedo solicitar la tarifa plana si ya fui autónomo hace 3 años?

Sí. Si has estado de baja en el RETA durante al menos 3 años (2 años si no disfrutaste de tarifa plana anteriormente), puedes solicitarla de nuevo como nuevo autónomo.

### ¿La tarifa plana incluye la prestación por cese de actividad?

No. La tarifa plana de 80 €/mes cubre solo la cuota básica de autónomos. La cobertura por cese de actividad tiene un coste adicional que se suma a los 80 €.

### ¿Puedo darme de alta como autónomo y solicitar la tarifa plana online?

Sí. Puedes hacerlo todo a través de la Sede Electrónica de la Seguridad Social y la AEAT, sin necesidad de desplazarte a una oficina.

### ¿Qué ocurre si no marco la casilla de tarifa plana en el alta?

No podrás solicitarla con carácter retroactivo. Tendrás que esperar a cumplir los requisitos de tiempo para volver a solicitarla. Es fundamental marcarla en el momento del alta.`,
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

Esta organización mensual te ahorra horas en la declaración trimestral y te protege ante una posible inspección.

Si necesitas calcular el IVA de tus gastos deducibles, puedes usar nuestra [calculadora de IVA/IRPF](/iva-irpf).

---

## Artículos relacionados

- [Cómo presentar el IVA trimestral](/blog/como-presentar-iva-trimestral-autonomos) — Guía práctica del modelo 303
- [Retención de IRPF en facturas](/blog/retencion-irpf-facturas-autonomos-cuando-aplicar-como-calcular) — Cuándo aplicar el 15% o el 7%
- [Tarifa plana de autónomos 2026](/blog/tarifa-plana-autonomos-2026-requisitos-importe-como-solicitarla) — Requisitos e importe

---

## Preguntas frecuentes

### ¿Puedo deducir el IVA de un ordenador que uso para trabajar y para uso personal?

Sí, pero solo en la proporción de uso profesional. Si lo usas un 60% para trabajo y un 40% para uso personal, puedes deducir el 60% del IVA. Documenta esta proporción por si Hacienda te lo pide.

### ¿Es deducible el seguro médico privado como autónomo?

Sí, hasta 500 € anuales por persona (autónomo, cónyuge e hijos menores de 25 años que convivan). Si hay discapacidad, el límite sube a 1.500 €. Debe cubrirte a ti o a tus familiares directos.

### ¿Puedo deducirme el alquiler de la vivienda si trabajo desde casa?

No. El alquiler de vivienda habitual no es deducible en IRPF para autónomos. Lo que sí puedes deducir es el 30% de los suministros (luz, agua, internet) proporcional al porcentaje de la vivienda afecto a la actividad.

### ¿Las multas de tráfico son deducibles si voy a ver a un cliente?

No. Las multas y sanciones administrativas o penales nunca son deducibles, independientemente de si el desplazamiento era laboral.`,
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
4. **No comunicar la rectificativa al cliente.** El destinatario debe recibir la factura rectificativa para poder ajustar también su contabilidad y sus declaraciones de IVA.

Si necesitas generar una factura rectificativa, puedes usar nuestra [herramienta de facturación](/factura) con una serie específica para rectificativas.

---

## Artículos relacionados

- [Cómo presentar el IVA trimestral](/blog/como-presentar-iva-trimestral-autonomos) — Cómo declarar la rectificativa en el modelo 303
- [Retención de IRPF en facturas](/blog/retencion-irpf-facturas-autonomos-cuando-aplicar-como-calcular) — Cuándo aplicar el 15% o el 7%
- [Verifactu para autónomos](/blog/verifactu-autonomos-que-es-obligatorio-como-adaptarte) — El nuevo sistema de facturación verificable

---

## Preguntas frecuentes

### ¿Puedo rectificar una factura si el cliente no me ha pagado?

Sí. Si han transcurrido más de 6 meses desde el vencimiento y el crédito es incobrable, puedes emitir una factura rectificativa para recuperar el IVA ingresado. Debes acreditar que has reclamado el pago.

### ¿Tengo que enviar la factura rectificativa a Hacienda?

Depende. Si tu software es compatible con Verifactu, el registro de la rectificativa quedará almacenado con su hash correspondiente. El envío directo a la AEAT será obligatorio cuando se implemente plenamente el sistema.

### ¿Puedo rectificar una factura que ya fue declarada en un trimestre anterior?

Sí. La rectificativa se declara en el trimestre en que se emite, no en el de la factura original. El IVA rectificado compensará en la declaración del trimestre actual.

### ¿Una factura rectificativa tiene que tener el mismo formato que la original?

No necesariamente, pero debe incluir todos los datos obligatorios de una factura ordinaria más la mención expresa de «Factura Rectificativa», el número de la factura original y la causa de la rectificación.`,
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

Revisa cada trimestre qué porcentaje de tus ingresos lleva retención. Si cambias de mix de clientes (más particulares, más empresas extranjeras sin retención), puede que pases a estar obligado al 130.

Puedes calcular rápidamente el importe de retención de tus facturas con nuestra [calculadora de IVA/IRPF](/iva-irpf).

---

## Artículos relacionados

- [Cómo presentar el IVA trimestral](/blog/como-presentar-iva-trimestral-autonomos) — Guía práctica del modelo 303
- [Gastos deducibles para autónomos](/blog/gastos-deducibles-autonomos-2026-lista-completa) — Lista completa con ejemplos
- [Factura rectificativa](/blog/factura-rectificativa-cuando-emitirla-como-hacerla) — Cuándo y cómo corregir facturas

---

## Preguntas frecuentes

### ¿Tengo que aplicar retención si facturo a un particular?

No. La retención de IRPF solo es obligatoria cuando tu cliente es una empresa o profesional. Si facturas a un particular (persona física no empresaria), no aplicas retención en la factura.

### ¿Puedo cambiar del 7% al 15% a mitad de año?

Sí. Cuando cumplas los dos años de actividad, debes aplicar el tipo general del 15%. El cambio se aplica desde la primera factura que emitas después de cumplir el plazo. No necesitas comunicar el cambio al cliente, pero sí actualizar el porcentaje en tus facturas.

### ¿Qué pasa si no presento el modelo 130 cuando estoy obligado?

La AEAT puede imponerte sanciones por presentación fuera de plazo. Además, si no presentas el modelo 130, no estarás ingresando pagos fraccionados del IRPF, lo que podría generar una deuda mayor en la declaración de la renta anual.

### ¿Las facturas a clientes extranjeros llevan retención española?

No. Si tu cliente está en otro país de la UE y tiene NIF comunitario (operación intracomunitaria), la factura va sin IVA y sin retención española. Deberás cumplir con la normativa del país del cliente.`,
    tags: ['IRPF', 'Retención', 'Facturación', 'Modelo 111', 'Autónomos'],
    status: 'published',
    createdAt: '2026-03-05T10:00:00.000Z',
    updatedAt: '2026-03-05T10:00:00.000Z',
    publishedAt: '2026-03-05T10:00:00.000Z',
  },
  {
    id: 'seed-alta-autonomo-2026',
    titulo: 'Cómo darte de alta como autónomo en 2026: guía paso a paso completa',
    slug: 'alta-autonomo-2026-paso-a-paso',
    extracto: 'Si estás pensando en empezar tu actividad como trabajador por cuenta propia, este artículo te acompaña en todo el proceso: desde la elección del epígrafe del IAE hasta el alta en la Seguridad Social, pasando por la tarifa plana y las obligaciones fiscales.',
    contenido: `## Antes de empezar: ¿qué necesitas?

Antes de darte de alta como autónomo, asegúrate de tener:

- **DNI o NIE en vigor.**
- **Certificado digital o Cl@ve PIN** para trámites online.
- Una **cuenta bancaria** a tu nombre donde domiciliar los pagos.
- Definir qué **actividad económica** vas a desarrollar (necesitarás un epígrafe del IAE).

---

## Paso 1: Elige el epígrafe del IAE

El **Impuesto de Actividades Económicas (IAE)** clasifica todas las actividades empresariales y profesionales. Aunque los autónomos con facturación inferior a 1 millón de euros están exentos de pagar el IAE, **sí debes darte de alta en el epígrafe que corresponda** a tu actividad.

Los epígrafes se dividen en tres secciones:

- **Sección 1:** Actividades empresariales (comercio, hostelería, construcción…).
- **Sección 2:** Actividades profesionales (abogados, consultores, diseñadores, formadores…).
- **Sección 3:** Actividades artísticas.

Puedes consultar el listado completo en la web de la [AEAT](https://www.agenciatributaria.es). Si tienes dudas, tu gestoría te ayudará a elegir el más adecuado.

---

## Paso 2: Alta en el Censo de Empresarios (modelo 036 o 037)

El **modelo 036** (declaración censal completa) o **037** (versión simplificada) es el trámite con Hacienda donde comunicas:

- Tu alta como empresario o profesional.
- El epígrafe del IAE elegido.
- El domicilio fiscal de tu actividad.
- El régimen de IVA y IRPF que aplicarás.
- Si vas a presentar declaraciones trimestrales.

**¿Dónde se presenta?**

- Online: Sede Electrónica de la AEAT con certificado digital o Cl@ve.
- Presencial: Oficina de la AEAT (con cita previa).

**Importante:** Debes presentar este modelo **antes o simultáneamente** al alta en la Seguridad Social.

---

## Paso 3: Alta en el RETA (Seguridad Social)

El **Régimen Especial de Trabajadores Autónomos (RETA)** es donde te das de alta como trabajador por cuenta propia.

**Documentación necesaria:**

- Modelo **TA.0521** (solicitud de alta).
- DNI/NIE.
- Justificante del alta censal (modelo 036/037).
- Si solicitas la **tarifa plana**, marca la casilla correspondiente en el formulario.

**¿Dónde?**

- Online: [Sede Electrónica de la Seguridad Social](https://sede.seg-social.gob.es).
- Presencial: Oficina CAISS (Centro de Atención e Información de la Seguridad Social).

La cuota mínima en 2026 es de aproximadamente **230 €/mes** (sistema de cotización por ingresos reales), o **80 €/mes** si te acoges a la tarifa plana.

---

## Paso 4: Licencias y permisos (si aplican)

Dependiendo de tu actividad, puede que necesites:

- **Licencia de apertura** si tienes un local.
- **Comunicación responsable** para ciertas actividades.
- **Autorizaciones específicas** (sanitarias, medioambientales, etc.).

Consulta en tu ayuntamiento qué permisos necesitas antes de empezar a operar.

---

## Obligaciones fiscales desde el primer día

Una vez dado de alta, estas son tus obligaciones:

### IVA (Impuesto sobre el Valor Añadido)

- **Modelo 303:** declaración trimestral de IVA.
- **Modelo 390:** resumen anual (informativo si presentaste los 4 trimestrales).

### IRPF (Impuesto sobre la Renta de las Personas Físicas)

- **Modelo 130:** pago fraccionado trimestral (si menos del 70% de tus ingresos tienen retención).
- **Declaración de la renta:** anual, en junio-julio del año siguiente.

### Facturación

- Emitir facturas conforme a la normativa vigente.
- Desde **enero de 2026**, cumplir con **Verifactu** si usas software de facturación.

---

## Artículos relacionados

- [Tarifa plana de autónomos 2026](/blog/tarifa-plana-autonomos-2026-requisitos-importe-como-solicitarla) — Requisitos e importe
- [Gastos deducibles para autónomos](/blog/gastos-deducibles-autonomos-2026-lista-completa) — Lista completa con ejemplos
- [Verifactu para autónomos](/blog/verifactu-autonomos-que-es-obligatorio-como-adaptarte) — El nuevo sistema de facturación verificable

---

## Preguntas frecuentes

### ¿Puedo darme de alta como autónomo online?

Sí. Todo el proceso se puede hacer online con certificado digital o Cl@ve: alta censal en la AEAT y alta en la Seguridad Social. No necesitas desplazarte a ninguna oficina.

### ¿Cuánto tiempo tarda en activarse el alta?

El alta en Hacienda es inmediata al presentar el modelo 036/037 online. El alta en la Seguridad Social suele resolverse en 1-3 días laborables.

### ¿Puedo ser autónomo y trabajador asalariado a la vez?

Sí. Se llama **pluriactividad** y tienes derecho a bonificaciones adicionales en la cuota de autónomos. Al final del año, si cotizas en ambos regímenes, puedes solicitar la devolución del exceso cotizado.

### ¿Necesito un gestor para darme de alta?

No es obligatorio, pero es muy recomendable si es tu primera vez. Un gestor te ayuda a elegir el epígrafe correcto, configurar el IVA y IRPF, y evitar errores que pueden costarte sanciones.`,
    tags: ['Alta autónomos', 'RETA', 'IAE', 'Seguridad Social', 'Autónomos 2026'],
    status: 'published',
    createdAt: '2026-03-15T10:00:00.000Z',
    updatedAt: '2026-03-15T10:00:00.000Z',
    publishedAt: '2026-03-15T10:00:00.000Z',
  },
  {
    id: 'seed-cuanto-paga-autonomo-impuestos',
    titulo: 'Cuánto paga un autónomo de impuestos al mes: guía completa 2026',
    slug: 'cuanto-paga-autonomo-impuestos-mes',
    extracto: 'Una de las preguntas más frecuentes de quienes se hacen autónomos es: ¿cuánto voy a pagar de impuestos? En este artículo desglosamos todos los tributos que afectan a un autónomo en España: cuota de la Seguridad Social, IVA, IRPF y más.',
    contenido: `## Los impuestos de un autónomo: un resumen rápido

Un autónomo en España se enfrenta a tres grandes bloques de obligaciones fiscales:

1. **Cuota de autónomos** (Seguridad Social) — fija mensual según tramo de ingresos.
2. **IVA** (Impuesto sobre el Valor Añadido) — trimestral, diferencia entre IVA cobrado y pagado.
3. **IRPF** (Impuesto sobre la Renta) — pago fraccionado trimestral + declaración anual.

A estos se suman impuestos específicos según la actividad (IAE, IBI si tienes local, etc.).

---

## 1. Cuota de autónomos (Seguridad Social)

Desde 2023, España aplica el **sistema de cotización por ingresos reales**. Tu cuota mensual depende de tus rendimientos netos del año anterior:

| Rendimiento neto anual | Cuota mensual (2026) |
|---|---|
| Hasta 6.700 € | 225 € |
| 6.700 € – 9.000 € | 250 € |
| 9.000 € – 11.660 € | 267 € |
| 11.660 € – 13.000 € | 291 € |
| 13.000 € – 15.000 € | 294 € |
| 15.000 € – 17.000 € | 294 € |
| 17.000 € – 18.500 € | 310 € |
| 18.500 € – 20.300 € | 315 € |
| 20.300 € – 23.300 € | 320 € |
| 23.300 € – 27.600 € | 330 € |
| 27.600 € – 31.900 € | 350 € |
| 31.900 € – 36.200 € | 370 € |
| 36.200 € – 40.500 € | 390 € |
| 40.500 € – 60.000 € | 415 € |
| Más de 60.000 € | 500 € |

**Tarifa plana:** si es tu primera vez como autónomo, pagas **80 €/mes** durante los primeros 12 meses.

Puedes calcular tu cuota estimada con nuestra [calculadora de cuota de autónomos](/cuota-autonomos).

---

## 2. IVA (Impuesto sobre el Valor Añadido)

El IVA **no es un impuesto que pagues tú**, sino que actúas como recaudador: cobras el IVA a tus clientes y lo ingresas a Hacienda, descontando el IVA que tú has pagado a proveedores.

**Tipos de IVA:**

- **General:** 21% (la mayoría de servicios y productos).
- **Reducido:** 10% (hostelería, transporte, reformas…).
- **Superreducido:** 4% (productos de primera necesidad).

**Cálculo trimestral (modelo 303):**

\`\`\`
IVA a ingresar = IVA repercutido (cobrado) - IVA soportado (pagado)
\`\`\`

Si el resultado es negativo, compensas en el siguiente trimestre o solicitas devolución anual.

---

## 3. IRPF (Impuesto sobre la Renta)

El IRPF grava tus **rendimientos netos** (ingresos menos gastos deducibles).

### Pago fraccionado trimestral (modelo 130)

Si **menos del 70%** de tus ingresos tienen retención de IRPF, debes presentar el modelo 130:

- Se aplica un **20%** sobre el rendimiento neto (ingresos - gastos).
- Ejemplo: si en un trimestre ganas 5.000 € y tienes 2.000 € de gastos, el rendimiento neto es 3.000 €. El pago sería 3.000 × 20% = **600 €**.

**Si más del 70% de tus ingresos tienen retención**, estás exento de presentar el modelo 130.

### Declaración anual de la renta

Entre junio y julio del año siguiente presentas la declaración de la renta, donde se calcula el IRPF definitivo según tus ingresos anuales, situación personal y deducciones aplicables.

---

## Ejemplo práctico: ¿cuánto paga un autónomo que factura 2.000 €/mes?

Supongamos un autónomo que factura **2.000 €/mes** (24.000 €/año) sin gastos significativos:

| Concepto | Importe |
|---|---|
| Cuota autónomos (tramo 20.300-23.300 €) | ~320 €/mes |
| IVA (21% sobre 2.000 €) | 420 €/mes (lo cobra al cliente, no lo paga) |
| IRPF (modelo 130: 20% de 2.000 €) | 400 €/mes |

**Total de desembolso mensual:** 320 € (cuota) + 400 € (IRPF) = **720 €/mes**.

El IVA de 420 €/mes lo cobra al cliente y lo ingresa a Hacienda menos el IVA soportado de sus gastos.

---

## Artículos relacionados

- [Gastos deducibles para autónomos](/blog/gastos-deducibles-autonomos-2026-lista-completa) — Reduce tu base imponible
- [Retención de IRPF en facturas](/blog/retencion-irpf-facturas-autonomos-cuando-aplicar-como-calcular) — Cuándo aplica el 15%
- [Tarifa plana de autónomos 2026](/blog/tarifa-plana-autonomos-2026-requisitos-importe-como-solicitarla) — 80 €/mes el primer año

---

## Preguntas frecuentes

### ¿El IVA es un gasto para el autónomo?

No. El IVA que cobras a tus clientes no es un ingreso tuyo, y el IVA que pagas a proveedores no es un gasto deducible en IRPF. El IVA es un impuesto indirecto que tú recaudas para Hacienda.

### ¿Puedo cambiar de tramo de cotización durante el año?

Sí. Puedes solicitar un cambio de tramo antes del 1 de noviembre para que surta efecto el 1 de enero del año siguiente. También puedes cambiar al inicio de cada trimestre si tus ingresos varían significativamente.

### ¿Qué pasa si no presento el modelo 130?

Si estás obligado y no lo presentas, la AEAT puede imponerte sanciones por presentación fuera de plazo (recargo del 5% al 20%) más intereses de demora.

### ¿Los autónomos en módulos pagan lo mismo?

No. El régimen de estimación objetiva (módulos) tiene su propio sistema de cálculo del IRPF y del IVA, basado en indicadores como metros del local o número de empleados. Es un régimen diferente al de estimación directa.`,
    tags: ['Impuestos', 'IRPF', 'IVA', 'Cuota autónomos', 'Fiscalidad'],
    status: 'published',
    createdAt: '2026-03-20T10:00:00.000Z',
    updatedAt: '2026-03-20T10:00:00.000Z',
    publishedAt: '2026-03-20T10:00:00.000Z',
  },
  {
    id: 'seed-modelo-130-autonomos',
    titulo: 'Modelo 130 autónomos: qué es, cómo rellenarlo y cuándo presentar',
    slug: 'modelo-130-autonomos-como-rellenarlo',
    extracto: 'El modelo 130 es el pago fraccionado trimestral del IRPF para autónomos en estimación directa. Te explicamos quién está obligado, cómo calcularlo, cómo rellenarlo paso a paso y qué errores evitar.',
    contenido: `## ¿Qué es el modelo 130?

El **modelo 130** es la declaración trimestral del pago fraccionado del IRPF para autónomos que tributan en **estimación directa**. Es un anticipo de lo que pagarás en la declaración anual de la renta.

Se calcula aplicando un **20%** sobre el rendimiento neto del trimestre (ingresos menos gastos deducibles).

---

## ¿Quién está obligado a presentar el modelo 130?

Estás obligado si cumples **ambas** condiciones:

1. Tributas en **estimación directa** (normal o simplificada).
2. **Menos del 70%** de tus ingresos del trimestre tienen retención de IRPF.

**No estás obligado** si más del 70% de tus ingresos llevan retención. En ese caso, Hacienda ya está recibiendo pagos a cuenta a través de las retenciones que tus clientes ingresan con el modelo 111.

**Ejemplo:**

- Si facturas 5.000 € y todos tus clientes te aplican el 15% de retención → 100% con retención → **NO presentas** el 130.
- Si facturas 5.000 € pero la mitad es a particulares (sin retención) → 50% con retención → **SÍ presentas** el 130.

---

## ¿Cómo se calcula?

La fórmula es sencilla:

\`\`\`
Rendimiento neto = Ingresos del trimestre - Gastos deducibles
Pago = Rendimiento neto × 20%
\`\`\`

**Ejemplo práctico:**

- Ingresos del trimestre: 12.000 €
- Gastos deducibles: 4.000 €
- Rendimiento neto: 8.000 €
- Pago del modelo 130: 8.000 × 20% = **1.600 €**

Si el resultado es negativo (has tenido más gastos que ingresos), el pago es **cero**. No se paga negativo, pero sí se presenta.

---

## Cómo rellenar el modelo 130 paso a paso

1. Accede a la [Sede Electrónica de la AEAT](https://www.agenciatributaria.es) con certificado digital o Cl@ve.
2. Busca **Modelo 130** en el buscador de trámites.
3. Selecciona el **ejercicio** (año) y el **periodo** (1T, 2T, 3T o 4T).
4. Rellena:
   - **Casilla 01:** Ingresos del trimestre.
   - **Casilla 02:** Gastos deducibles.
   - **Casilla 03:** Rendimiento neto (se calcula automáticamente).
   - **Casilla 04:** Resultado a ingresar (20% del rendimiento neto).
5. Si el resultado es a pagar, domicilia el pago o genera el NRC bancario.
6. Guarda el justificante de presentación.

---

## Plazos de presentación

| Trimestre | Periodo | Plazo |
|---|---|---|
| 1T | Enero – Marzo | 1 – 20 abril |
| 2T | Abril – Junio | 1 – 20 julio |
| 3T | Julio – Septiembre | 1 – 20 octubre |
| 4T | Octubre – Diciembre | 1 – 20 enero |

---

## Artículos relacionados

- [Retención de IRPF en facturas](/blog/retencion-irpf-facturas-autonomos-cuando-aplicar-como-calcular) — Cuándo aplica el 70%
- [Cuánto paga un autónomo de impuestos](/blog/cuanto-paga-autonomo-impuestos-mes) — Guía completa 2026
- [Cómo presentar el IVA trimestral](/blog/como-presentar-iva-trimestral-autonomos) — Modelo 303 paso a paso

---

## Preguntas frecuentes

### ¿Qué pasa si presento el modelo 130 con resultado negativo?

Si tus gastos superan tus ingresos en un trimestre, el resultado del modelo 130 es cero. No pagas nada, pero debes presentar la declaración. Las pérdidas se compensan con beneficios de trimestres siguientes.

### ¿Puedo domiciliar el pago del modelo 130?

Sí. Si domicilias el pago antes del día 15 del plazo, Hacienda te da 5 días adicionales de plazo. Es la forma más cómoda de evitar olvidos.

### ¿El modelo 130 y el modelo 303 son lo mismo?

No. El modelo 130 es el pago fraccionado del IRPF (impuesto sobre la renta). El modelo 303 es la declaración trimestral del IVA. Son impuestos diferentes y ambos son obligatorios si cumples los requisitos.

### ¿Si estoy en módulos presento el modelo 130?

No. Los autónomos en estimación objetiva (módulos) no presentan el modelo 130. Su IRPF se calcula de forma diferente a través de los módulos.`,
    tags: ['Modelo 130', 'IRPF', 'Fiscalidad', 'Autónomos', 'Declaración trimestral'],
    status: 'published',
    createdAt: '2026-03-25T10:00:00.000Z',
    updatedAt: '2026-03-25T10:00:00.000Z',
    publishedAt: '2026-03-25T10:00:00.000Z',
  },
  {
    id: 'seed-factura-electronica-b2b',
    titulo: 'Factura electrónica B2B obligatoria: todo lo que necesitas saber para 2026',
    slug: 'factura-electronica-b2b-obligatoria-2026',
    extracto: 'La factura electrónica entre empresas y profesionales (B2B) será obligatoria en España. Te explicamos qué cambia, cuándo entra en vigor, qué formato debes usar y cómo prepararte para cumplir sin problemas.',
    contenido: `## ¿Qué es la factura electrónica B2B?

La **factura electrónica B2B** (Business to Business) es la obligación de emitir y recibir facturas en formato electrónico estructurado entre empresas y profesionales. No se trata simplemente de enviar un PDF por email: la factura debe estar en un formato estandarizado (XML) que pueda ser procesado automáticamente por los sistemas del receptor.

Esta medida se enmarca en la **Ley Crea y Crece (Ley 18/2022)** y su reglamento de desarrollo.

---

## ¿A quién afecta?

Afecta a **todos los empresarios y profesionales** (autónomos incluidos) que emitan facturas a otros empresarios o profesionales. En la práctica:

- Si facturas a otras empresas → **obligatorio**.
- Si facturas a particulares → **no obligatorio** (aunque recomendable).
- Si recibes facturas de proveedores → debes estar preparado para recibirlas electrónicamente.

---

## ¿Cuándo es obligatorio?

La entrada en vigor se ha escalonado:

- **Julio 2025:** obligatoria para grandes empresas y administraciones públicas.
- **2026 (fecha por confirmar):** obligatoria para **PYMEs y autónomos** en sus relaciones B2B.

El Gobierno aún está desarrollando el reglamento técnico y las plataformas de interconexión necesarias. Es posible que la fecha se retrase, pero conviene prepararse con antelación.

---

## ¿Qué formato debe tener?

Los formatos aceptados son:

- **Facturae** (estándar español, formato XML).
- **UBL** (Universal Business Language, estándar europeo).

No vale con enviar un PDF por email. La factura electrónica debe cumplir con:

- Formato XML estructurado.
- Firma electrónica del emisor.
- Registro de envío y recepción.
- Conservación durante los plazos legales.

---

## Diferencias entre factura electrónica B2B y Verifactu

| Concepto | Factura electrónica B2B | Verifactu |
|---|---|---|
| **Qué es** | Formato de intercambio entre empresas | Sistema de certificación ante Hacienda |
| **Formato** | XML (Facturae o UBL) | Cualquier formato + QR + hash |
| **Destinatario** | El cliente (otra empresa) | La AEAT |
| **Obligatorio desde** | 2026 (B2B) | Enero 2026 |

Ambas obligaciones **coexisten**. Puedes cumplir las dos con el mismo software si está adaptado.

---

## Cómo prepararte

1. **Infórmate sobre el calendario definitivo.** Las fechas pueden variar según el desarrollo reglamentario.
2. **Elige un software compatible.** Tu programa de facturación debe poder generar facturas en formato Facturae o UBL.
3. **Conéctate a una plataforma de intercambio.** Existen plataformas (PDP) que facilitan el envío y recepción de facturas electrónicas.
4. **Forma a tu equipo.** Si tienes empleados que gestionan facturas, asegúrate de que saben cómo recibirlas y procesarlas electrónicamente.
5. **Actualiza tus procesos internos.** La factura electrónica requiere un flujo de trabajo diferente al del papel o PDF.

---

## Artículos relacionados

- [Verifactu para autónomos](/blog/verifactu-autonomos-que-es-obligatorio-como-adaptarte) — El otro requisito de facturación 2026
- [Cómo hacer una factura profesional](/blog/como-hacer-factura-profesional-ejemplo) — Campos obligatorios y estructura
- [Factura rectificativa](/blog/factura-rectificativa-cuando-emitirla-como-hacerla) — Cómo corregir facturas electrónicas

---

## Preguntas frecuentes

### ¿Tengo que dejar de enviar facturas en PDF?

Sí, en relaciones B2B. El PDF por email ya no cumplirá con la obligación legal. Necesitarás generar la factura en formato XML y enviarla a través de una plataforma autorizada.

### ¿Qué pasa si mi cliente no acepta facturas electrónicas?

La ley obliga a ambas partes. Tu cliente está obligado a recibirlas electrónicamente y tú a emitirlas. Si no cumple, puede enfrentarse a sanciones.

### ¿Necesito un certificado digital para firmar las facturas?

Sí. La factura electrónica debe llevar una firma electrónica que garantice su autenticidad e integridad. Tu software de facturación debería gestionar esto automáticamente.

### ¿Las facturas a particulares también deben ser electrónicas?

No. La obligación solo afecta a las relaciones B2B (entre empresas y profesionales). Las facturas a consumidores finales pueden seguir siendo en papel o PDF.`,
    tags: ['Factura electrónica', 'B2B', 'Ley Crea y Crece', 'Facturae', 'Autónomos'],
    status: 'published',
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
    publishedAt: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'seed-cotizacion-autonomos-2026',
    titulo: 'Cotización de autónomos 2026: tabla de bases y cuotas por ingresos reales',
    slug: 'cotizacion-autonomos-2026-tabla-bases-cuotas',
    extracto: 'El sistema de cotización por ingresos reales determina cuánto paga cada autónomo a la Seguridad Social. Aquí tienes la tabla completa de tramos para 2026, cómo calcular tu cuota y cómo elegir el tramo que más te conviene.',
    contenido: `## ¿Qué es el sistema de cotización por ingresos reales?

Desde 2023, los autónomos en España cotizan a la Seguridad Social en función de sus **ingresos reales** (rendimiento neto), no de una base que eligen libremente. Esto significa que cuanto más ganas, más cotizas, y viceversa.

El sistema se aplica en **tramos de rendimiento neto** y la cuota se revisa anualmente en los Presupuestos Generales del Estado.

---

## Tabla de tramos y cuotas 2026

| Rendimiento neto anual | Base de cotización | Cuota mensual |
|---|---|---|
| Hasta 6.700 € | 661,00 € | 225 € |
| 6.700 € – 9.000 € | 735,60 € | 250 € |
| 9.000 € – 11.660 € | 788,90 € | 267 € |
| 11.660 € – 13.000 € | 859,30 € | 291 € |
| 13.000 € – 15.000 € | 868,30 € | 294 € |
| 15.000 € – 17.000 € | 868,30 € | 294 € |
| 17.000 € – 18.500 € | 914,80 € | 310 € |
| 18.500 € – 20.300 € | 929,60 € | 315 € |
| 20.300 € – 23.300 € | 944,40 € | 320 € |
| 23.300 € – 27.600 € | 974,00 € | 330 € |
| 27.600 € – 31.900 € | 1.033,00 € | 350 € |
| 31.900 € – 36.200 € | 1.092,00 € | 370 € |
| 36.200 € – 40.500 € | 1.151,00 € | 390 € |
| 40.500 € – 60.000 € | 1.224,60 € | 415 € |
| Más de 60.000 € | 1.475,00 € | 500 € |

**Rendimiento neto** = Ingresos anuales - Gastos deducibles - 7% (deducción de gastos de difícil justificación).

---

## ¿Cómo se calcula tu tramo?

1. Calcula tus **ingresos anuales** (facturación sin IVA).
2. Resta tus **gastos deducibles** (suministros, material, gestoría, etc.).
3. Aplica una **deducción del 7%** sobre el resultado (gastos de difícil justificación).
4. El resultado es tu **rendimiento neto**.
5. Busca el tramo correspondiente en la tabla.

**Ejemplo:**

- Ingresos anuales: 30.000 €
- Gastos deducibles: 5.000 €
- Rendimiento previo: 25.000 €
- Deducción 7%: 25.000 × 7% = 1.750 €
- **Rendimiento neto:** 25.000 - 1.750 = **23.250 €**
- **Tramo:** 20.300 – 23.300 € → **Cuota: 320 €/mes**

Puedes hacer este cálculo rápidamente con nuestra [calculadora de cuota de autónomos](/cuota-autonomos).

---

## ¿Puedo elegir mi tramo?

Sí, pero con límites. Puedes elegir cualquier tramo dentro de un rango:

- **Tramo mínimo:** el que corresponde a tu rendimiento neto real.
- **Tramo máximo:** el inmediatamente superior al que te corresponde.

Elegir un tramo superior te permite **cotizar más** (y tener mejores prestaciones), pero pagas más cuota.

---

## Cambio de tramo

Puedes cambiar de tramo:

- **Al inicio de cada trimestre** (enero, abril, julio, octubre).
- **Antes del 1 de noviembre** para el año siguiente (cambio anual).

Si eliges un tramo inferior al que te corresponde y al final del año tu rendimiento neto real es mayor, la Seguridad Social te regularizará y podrías tener que pagar la diferencia.

---

## Artículos relacionados

- [Tarifa plana de autónomos 2026](/blog/tarifa-plana-autonomos-2026-requisitos-importe-como-solicitarla) — 80 €/mes el primer año
- [Cuánto paga un autónomo de impuestos](/blog/cuanto-paga-autonomo-impuestos-mes) — Guía fiscal completa
- [Gastos deducibles para autónomos](/blog/gastos-deducibles-autonomos-2026-lista-completa) — Reduce tu rendimiento neto

---

## Preguntas frecuentes

### ¿Qué pasa si no elijo tramo?

Si no comunicas tu elección, se te asigna automáticamente el tramo mínimo según tu rendimiento neto del año anterior (o el mínimo general si es tu primer año).

### ¿La cotización afecta a mi pensión de jubilación?

Sí. Cuanto más cotices, mayor será tu base reguladora y, por tanto, tu pensión. Si estás cerca de la jubilación, puede interesarte cotizar en un tramo superior.

### ¿Los autónomos en módulos cotizan por ingresos reales?

No. Los autónomos en estimación objetiva (módulos) cotizan por un sistema diferente basado en los rendimientos de su actividad según los módulos establecidos.

### ¿Puedo cotizar por debajo del mínimo?

No. El mínimo de cotización es el primer tramo de la tabla (hasta 6.700 € de rendimiento neto → 225 €/mes). No hay forma legal de cotizar menos.`,
    tags: ['Cotización', 'Seguridad Social', 'Tramos', 'Cuota autónomos', '2026'],
    status: 'published',
    createdAt: '2026-04-05T10:00:00.000Z',
    updatedAt: '2026-04-05T10:00:00.000Z',
    publishedAt: '2026-04-05T10:00:00.000Z',
  },
  {
    id: 'seed-como-hacer-factura-profesional',
    titulo: 'Cómo hacer una factura profesional: estructura, campos obligatorios y ejemplo',
    slug: 'como-hacer-factura-profesional-ejemplo',
    extracto: 'Emitir facturas correctamente es una de las obligaciones más importantes de cualquier autónomo. En este artículo te mostramos qué datos debe incluir una factura válida, cómo estructurarla y un ejemplo práctico listo para usar.',
    contenido: `## ¿Qué es una factura y por qué es importante?

Una factura es el **documento que acredita una operación comercial** entre un vendedor (tú) y un comprador (tu cliente). Es obligatoria por ley y sirve como justificante tanto para ti como para Hacienda.

Una factura bien emitida te protege ante inspecciones, facilita el cobro y da una imagen profesional a tu negocio.

---

## Campos obligatorios de una factura

Según el **Reglamento de Facturación (RD 1619/2012)**, toda factura debe incluir:

### Datos del emisor (tú)

- **Nombre y apellidos** o razón social.
- **NIF/CIF.**
- **Domicilio fiscal** completo.

### Datos del destinatario (tu cliente)

- **Nombre y apellidos** o razón social.
- **NIF/CIF.**
- **Domicilio** (al menos la localidad).

### Datos de la factura

- **Número de factura** (correlativo, sin saltos).
- **Fecha de emisión.**
- **Descripción de los servicios o productos** prestados.
- **Base imponible** (importe sin impuestos).
- **Tipo de IVA aplicado** (21%, 10% o 4%).
- **Cuota de IVA** (importe en euros).
- **Tipo de retención IRPF** (si aplica, generalmente 15% o 7%).
- **Importe total** a pagar.

### Datos adicionales (si aplican)

- **Fecha de devengo** (si es diferente a la fecha de emisión).
- **Fecha y número del pedido** (si existe).
- **Forma de pago y vencimiento.**

---

## Ejemplo de factura

\`\`\`
FACTURA Nº: FAC-2026-001
Fecha de emisión: 15/03/2026
Fecha de vencimiento: 15/04/2026

EMISOR:
María García López
NIF: 12345678A
C/ Ejemplo, 1, 28001 Madrid

DESTINATARIO:
Empresa XYZ S.L.
CIF: B12345678
Av. Principal, 10, 28002 Madrid

CONCEPTO:
Servicios de consultoría - Marzo 2026

Base imponible:        1.000,00 €
IVA (21%):               210,00 €
IRPF (15%):             -150,00 €
TOTAL A PAGAR:         1.060,00 €

Forma de pago: Transferencia bancaria
IBAN: ES12 3456 7890 1234 5678 9012
\`\`\`

---

## Numeración de facturas

Las facturas deben numerarse de forma **correlativa y sin saltos**. Puedes usar diferentes series para diferentes tipos de documento:

- **Facturas ordinarias:** FAC-2026-001, FAC-2026-002…
- **Facturas rectificativas:** R-2026-001, R-2026-002…
- **Facturas simplificadas (tickets):** FS-2026-001…

**Importante:** no puedes eliminar facturas emitidas. Si te equivocas, debes emitir una factura rectificativa.

---

## Errores más comunes al emitir facturas

1. **No incluir el NIF del cliente.** Sin NIF, la factura no es válida fiscalmente.
2. **Aplicar el tipo de IVA incorrecto.** Revisa si tu servicio lleva 21%, 10% o 4%.
3. **Olvidar la retención de IRPF.** Si facturas a empresas y eres profesional, aplica el 15% (o 7% si eres nuevo autónomo).
4. **Saltos en la numeración.** Cada factura debe tener un número correlativo.
5. **No indicar la fecha de devengo.** Si el servicio se prestó en una fecha diferente a la emisión, indícalo.

---

## Artículos relacionados

- [Factura rectificativa](/blog/factura-rectificativa-cuando-emitirla-como-hacerla) — Cómo corregir errores
- [Retención de IRPF en facturas](/blog/retencion-irpf-facturas-autonomos-cuando-aplicar-como-calcular) — Cuándo aplicar el 15%
- [Verifactu para autónomos](/blog/verifactu-autonomos-que-es-obligatorio-como-adaptarte) — El nuevo sistema de facturación

---

## Preguntas frecuentes

### ¿Puedo emitir facturas en formato digital?

Sí. Las facturas electrónicas son válidas siempre que el destinatario acepte recibirlas en este formato. Desde 2026, será obligatorio en relaciones B2B.

### ¿Cuánto tiempo debo conservar las facturas?

Las facturas deben conservarse durante **4 años** a efectos del IVA y **5 años** a efectos mercantiles. Recomendamos guardarlas al menos 5 años.

### ¿Puedo facturar en una moneda diferente al euro?

Sí, pero debes indicar el tipo de cambio utilizado y el equivalente en euros a efectos fiscales.

### ¿Necesito un software para emitir facturas?

No es obligatorio, pero es altamente recomendable. Un software te garantiza la numeración correlativa, calcula los impuestos automáticamente y desde 2026 te ayudará a cumplir con Verifactu. Puedes probar nuestra [herramienta de facturación](/factura).`,
    tags: ['Facturación', 'Factura profesional', 'Campos obligatorios', 'Autónomos'],
    status: 'published',
    createdAt: '2026-04-10T10:00:00.000Z',
    updatedAt: '2026-04-10T10:00:00.000Z',
    publishedAt: '2026-04-10T10:00:00.000Z',
  },
  {
    id: 'seed-presupuesto-vs-factura',
    titulo: 'Presupuesto vs factura: diferencias clave y cuándo usar cada uno',
    slug: 'presupuesto-vs-factura-diferencias',
    extracto: 'Muchos autónomos confunden presupuestos con facturas o no saben cuándo emitir cada documento. Aquí te aclaramos las diferencias, qué valor legal tiene cada uno y cómo gestionar correctamente ambos documentos en tu actividad.',
    contenido: `## ¿Qué es un presupuesto?

Un **presupuesto** (o propuesta económica) es un documento en el que detallas el coste estimado de un servicio o producto que ofreces a un cliente. Es **previo a la prestación del servicio** y no tiene validez fiscal como documento de cobro.

### Características del presupuesto:

- Se emite **antes** de realizar el trabajo.
- Es una **propuesta**, no una obligación.
- El cliente puede aceptarlo, rechazarlo o negociar.
- **No tributa** (no se declara a Hacienda).
- No tiene validez como justificante de gasto.

---

## ¿Qué es una factura?

Una **factura** es el documento fiscal que acredita una operación comercial ya realizada. Es **obligatoria por ley** y tiene plena validez fiscal y mercantil.

### Características de la factura:

- Se emite **después** (o en el momento) de prestar el servicio.
- Es un **documento legal** con validez fiscal.
- **Tributa** (se declara en el IVA y el IRPF).
- Sirve como justificante de gasto para el cliente.
- Debe cumplir con los requisitos del RD 1619/2012.

---

## Diferencias clave

| Aspecto | Presupuesto | Factura |
|---|---|---|
| **Cuándo se emite** | Antes del trabajo | Después o durante |
| **Validez fiscal** | No tributa | Sí tributa |
| **Obligatoriedad** | Opcional | Obligatoria |
| **Numeración** | Libre (no correlativa) | Correlativa y sin saltos |
| **Justificante de gasto** | No | Sí |
| **Requisitos legales** | Mínimos | Estrictos (RD 1619/2012) |

---

## ¿Cuándo usar cada uno?

### Emite un presupuesto cuando:

- Un cliente te pide un **precio estimado** antes de contratar.
- Necesitas **detallar el alcance** del trabajo y las condiciones.
- Quieres **formalizar una oferta** que el cliente pueda aceptar por escrito.

### Emite una factura cuando:

- Has **completado el servicio** o entregado el producto.
- El cliente te lo exige como **justificante de pago**.
- Necesitas **declarar el ingreso** a Hacienda.
- El cliente necesita un **justificante de gasto** para su contabilidad.

---

## Buenas prácticas

1. **Siempre emite presupuesto antes de trabajar.** Evita malentendidos sobre el precio y el alcance.
2. **Vincula la factura al presupuesto aceptado.** Incluye una referencia al presupuesto en la factura para mantener el rastro.
3. **Conserva ambos documentos.** Tanto el presupuesto como la factura forman parte del historial comercial con el cliente.
4. **Usa herramientas que gestionen ambos.** Un buen software te permite crear presupuestos y convertirlos en facturas con un clic.

---

## Artículos relacionados

- [Cómo hacer una factura profesional](/blog/como-hacer-factura-profesional-ejemplo) — Campos obligatorios y ejemplo
- [Factura rectificativa](/blog/factura-rectificativa-cuando-emitirla-como-hacerla) — Cómo corregir facturas
- [Qué es un albarán](/blog/que-es-albaran-como-hacerlo) — Documento de entrega

---

## Preguntas frecuentes

### ¿Puedo cobrar solo con un presupuesto?

No. El presupuesto no es un documento fiscal válido para justificar un cobro. Siempre debes emitir una factura, independientemente de que hayas enviado un presupuesto previo.

### ¿El presupuesto aceptado tiene validez legal?

Sí. Si el cliente acepta el presupuesto por escrito (email, firma, etc.), se convierte en un contrato vinculante. Ambas partes están obligadas a cumplir lo pactado.

### ¿Puedo convertir un presupuesto en factura?

Sí. Muchos programas de facturación permiten aceptar un presupuesto y convertirlo automáticamente en factura, manteniendo los datos y añadiendo la numeración fiscal.

### ¿Debo aplicar IVA en el presupuesto?

Es recomendable. Indicar el IVA en el presupuesto ayuda al cliente a conocer el coste total real. Sin embargo, el presupuesto no tributa hasta que se convierte en factura.`,
    tags: ['Presupuesto', 'Factura', 'Facturación', 'Gestión', 'Autónomos'],
    status: 'published',
    createdAt: '2026-04-15T10:00:00.000Z',
    updatedAt: '2026-04-15T10:00:00.000Z',
    publishedAt: '2026-04-15T10:00:00.000Z',
  },
  {
    id: 'seed-que-es-albaran',
    titulo: 'Qué es un albarán y cómo hacerlo correctamente: guía para autónomos',
    slug: 'que-es-albaran-como-hacerlo',
    extracto: 'El albarán es un documento esencial en la entrega de mercancías pero muchos autónomos no saben exactamente qué es, para qué sirve ni cómo emitirlo. Aquí te lo explicamos con ejemplos prácticos.',
    contenido: `## ¿Qué es un albarán?

Un **albarán** (o nota de entrega) es un documento comercial que acredita la **entrega física de mercancías** del vendedor al comprador. No es una factura: no implica cobro ni tiene validez fiscal directa, pero es fundamental para controlar el stock y justificar la entrega.

---

## ¿Para qué sirve un albarán?

1. **Justificar la entrega:** prueba que el vendedor ha entregado los bienes y el cliente los ha recibido.
2. **Control de stock:** tanto el vendedor como el comprador pueden registrar las entradas y salidas de mercancía.
3. **Base para la facturación:** muchas empresas facturan basándose en los albaranes firmados por el cliente.
4. **Reclamaciones:** si hay discrepancias en la cantidad o el estado de la mercancía, el albarán firmado es la prueba.

---

## Diferencias entre albarán y factura

| Aspecto | Albarán | Factura |
|---|---|---|
| **Qué acredita** | Entrega de mercancía | Operación comercial |
| **Validez fiscal** | No tributa | Sí tributa |
| **Obligatorio** | No | Sí |
| **Numeración** | Libre | Correlativa |
| **Firma del cliente** | Recomendada | No necesaria |

---

## Qué debe incluir un albarán

Aunque no es obligatorio por ley, un albarán profesional debe contener:

### Datos del emisor

- Nombre o razón social.
- NIF/CIF.
- Dirección.

### Datos del destinatario

- Nombre o razón social.
- NIF/CIF.
- Dirección de entrega.

### Datos del albarán

- **Número de albarán** (correlativo, para tu control interno).
- **Fecha de entrega.**
- **Descripción de los bienes** entregados (cantidad, descripción, referencia).
- **Firma del receptor** (quien recibe la mercancía).
- **Referencia al pedido** o factura asociada (si existe).

---

## Ejemplo de albarán

\`\`\`
ALBARÁN Nº: ALB-2026-001
Fecha de entrega: 15/03/2026

EMISOR:
María García López
NIF: 12345678A
C/ Ejemplo, 1, 28001 Madrid

DESTINATARIO:
Empresa XYZ S.L.
CIF: B12345678
Almacén: Polígono Industrial Norte, Nave 5

DETALLE DE ENTREGA:
| Cantidad | Descripción | Referencia |
|----------|------------|------------|
| 10 | Camisetas modelo A | CAM-A-001 |
| 5 | Pantalones modelo B | PAN-B-002 |

Pedido nº: PED-2026-045
Factura nº: FAC-2026-012

Recibido por: _________________ Fecha: ___/___/______
\`\`\`

---

## ¿Cuándo es necesario emitir un albarán?

- Cuando **envías mercancía física** a un cliente.
- Cuando necesitas **controlar el stock** de tu almacén.
- Cuando el cliente exige un **justificante de recepción** antes de pagar la factura.
- Cuando hay **transportista** involucrado en la entrega.

---

## Artículos relacionados

- [Cómo hacer una factura profesional](/blog/como-hacer-factura-profesional-ejemplo) — Campos obligatorios
- [Presupuesto vs factura](/blog/presupuesto-vs-factura-diferencias) — Cuándo usar cada uno
- [Factura rectificativa](/blog/factura-rectificativa-cuando-emitirla-como-hacerla) — Corrección de documentos

---

## Preguntas frecuentes

### ¿Es obligatorio firmar el albarán?

No es obligatorio por ley, pero es muy recomendable. La firma del receptor acredita que ha recibido la mercancía en las condiciones indicadas.

### ¿Puedo facturar sin albarán?

Sí. La factura es independiente del albarán. Sin embargo, en operaciones con entrega física de mercancía, es buena práctica emitir ambos documentos.

### ¿El albarán sustituye a la factura?

No. El albarán solo acredita la entrega. La factura es el documento fiscal que justifica la operación y el cobro.

### ¿Debo guardar los albaranes?

Sí. Aunque no tienen validez fiscal directa, son documentos comerciales importantes que pueden servir como prueba en caso de reclamaciones o inspecciones.`,
    tags: ['Albarán', 'Entrega', 'Mercancía', 'Gestión', 'Autónomos'],
    status: 'published',
    createdAt: '2026-04-20T10:00:00.000Z',
    updatedAt: '2026-04-20T10:00:00.000Z',
    publishedAt: '2026-04-20T10:00:00.000Z',
  },
  {
    id: 'seed-contrato-prestacion-servicios',
    titulo: 'Contrato de prestación de servicios para autónomos: qué incluir y modelo práctico',
    slug: 'contrato-prestacion-servicios-autonomos-modelo',
    extracto: 'Un contrato de prestación de servicios bien redactado protege tanto al autónomo como al cliente. Te explicamos las cláusulas esenciales, qué no puede faltar y cómo generar uno adaptado a tu actividad.',
    contenido: `## ¿Qué es un contrato de prestación de servicios?

Un **contrato de prestación de servicios** es un acuerdo entre un profesional (tú, como autónomo) y un cliente por el cual te comprometes a realizar un servicio determinado a cambio de una contraprestación económica.

A diferencia de un contrato laboral, este contrato es **mercantil** y se rige por el Código Civil y el Código de Comercio, no por el Estatuto de los Trabajadores.

---

## Cláusulas esenciales

### 1. Identificación de las partes

- **Prestador:** tus datos completos (nombre, NIF, domicilio).
- **Cliente:** datos completos del contratante.

### 2. Objeto del contrato

Describe con precisión **qué servicio vas a prestar**. Sé específico para evitar malentendidos:

- Mal: "Servicios de consultoría."
- Bien: "Servicios de consultoría estratégica para la optimización del proceso de ventas online, incluyendo análisis de datos, propuesta de mejoras y seguimiento durante 3 meses."

### 3. Importe y forma de pago

- **Precio total** o tarifa (por hora, por proyecto, mensualidad…).
- **Forma de pago** (transferencia, domiciliación, etc.).
- **Plazos de pago** (a la firma, a 30 días, por hitos…).
- **IVA y retención IRPF** aplicables.

### 4. Duración y plazo de ejecución

- **Fecha de inicio** y, si aplica, **fecha de fin**.
- Si es por proyecto: hitos o plazos de entrega.
- Condiciones de **prórroga** o renovación.

### 5. Confidencialidad

Cláusula que obliga a ambas partes a no divulgar información sensible obtenida durante la relación contractual.

### 6. Propiedad intelectual

Define quién es titular de los derechos sobre el trabajo generado:

- Si los cedes al cliente: especifica el alcance de la cesión.
- Si los conservas: indica las condiciones de uso para el cliente.

### 7. Resolución y penalizaciones

- Condiciones bajo las cuales cualquiera de las partes puede **resolver el contrato**.
- **Preaviso** necesario (15 días, 30 días…).
- **Penalizaciones** por incumplimiento.

### 8. Jurisdicción

Indica los **juzgados y tribunales** que resolverán cualquier conflicto (generalmente los del domicilio del prestador o del cliente).

---

## Qué no puede faltar

- ✅ Identificación clara de ambas partes.
- ✅ Descripción detallada del servicio.
- ✅ Precio y condiciones de pago.
- ✅ Duración o plazo de ejecución.
- ✅ Cláusula de confidencialidad.
- ✅ Propiedad intelectual.
- ✅ Condiciones de resolución.
- ✅ Jurisdicción aplicable.

---

## Artículos relacionados

- [NDA: acuerdo de confidencialidad](/blog/nda-acuerdo-confidencialidad-que-es) — Protege tu información
- [Cómo hacer una factura profesional](/blog/como-hacer-factura-profesional-ejemplo) — Facturar correctamente
- [Factura rectificativa](/blog/factura-rectificativa-cuando-emitirla-como-hacerla) — Corregir errores

---

## Preguntas frecuentes

### ¿Es obligatorio firmar un contrato de prestación de servicios?

No es obligatorio por ley, pero es muy recomendable. Un contrato por escrito protege a ambas partes y evita malentendidos sobre el alcance, el precio y los plazos.

### ¿Puedo usar un contrato genérico?

Puedes usar un modelo base, pero siempre debes adaptarlo a cada cliente y proyecto. Un contrato genérico puede dejar lagunas legales que te perjudiquen.

### ¿Necesito abogado para redactar un contrato?

No es obligatorio, pero para proyectos de alto valor o complejidad legal, es recomendable que un abogado revise el contrato antes de firmarlo.

### ¿Puedo modificar un contrato ya firmado?

Sí, mediante un **addendum** o anexo al contrato original, firmado por ambas partes. No modifiques el contrato unilateralmente.`,
    tags: ['Contrato', 'Prestación de servicios', 'Autónomos', 'Legal', 'Modelo'],
    status: 'published',
    createdAt: '2026-04-25T10:00:00.000Z',
    updatedAt: '2026-04-25T10:00:00.000Z',
    publishedAt: '2026-04-25T10:00:00.000Z',
  },
  {
    id: 'seed-nda-acuerdo-confidencialidad',
    titulo: 'NDA o acuerdo de confidencialidad: qué es, cuándo necesitas uno y cómo usarlo',
    slug: 'nda-acuerdo-confidencialidad-que-es',
    extracto: 'El NDA (Non-Disclosure Agreement) es un documento clave para proteger información sensible en negociaciones y colaboraciones. Te explicamos qué tipos existen, cuándo es imprescindible y cómo redactarlo correctamente.',
    contenido: `## ¿Qué es un NDA?

Un **NDA** (Non-Disclosure Agreement) o **acuerdo de confidencialidad** es un contrato por el cual las partes se comprometen a no divulgar información confidencial que se comparten durante una relación comercial, laboral o de negocio.

En España, estos acuerdos están regulados por el **Código Civil** (artículos 1.254 y siguientes) y la **Ley de Secretos Empresariales (Ley 1/2019)**.

---

## Tipos de NDA

### NDA unilateral

Solo **una de las partes** comparte información confidencial y la otra se compromete a no divulgarla.

**Ejemplo:** un autónomo comparte su estrategia de marketing con un consultor externo.

### NDA bilateral (o mutuo)

**Ambas partes** comparten información confidencial y ambas se comprometen a protegerla.

**Ejemplo:** dos empresas exploran una posible colaboración y comparten datos de sus respectivos negocios.

---

## ¿Cuándo necesitas un NDA?

- Cuando **compartes información sensible** con un tercero (clientes potenciales, socios, empleados, proveedores).
- Cuando **presentas una idea de negocio** o proyecto a inversores.
- Cuando **contratas a un freelancer** que tendrá acceso a datos internos de tu empresa.
- Cuando **negocias una venta o adquisición** de negocio.
- Cuando **colaboras con otra empresa** en un proyecto conjunto.

---

## Qué debe incluir un NDA

### 1. Identificación de las partes

Nombre, NIF/CIF y domicilio de cada parte.

### 2. Definición de información confidencial

Qué se considera confidencial: datos comerciales, financieros, técnicos, listas de clientes, planes de negocio, etc.

### 3. Excepciones

Qué información **NO** está protegida:

- Información que ya era pública.
- Información que la parte ya conocía antes del acuerdo.
- Información que se obtiene legalmente de terceros.
- Información que debe divulgarse por obligación legal.

### 4. Duración de la confidencialidad

Cuánto tiempo se mantiene la obligación (habitualmente entre 1 y 5 años tras la finalización de la relación).

### 5. Obligaciones de la parte receptora

- No divulgar la información a terceros.
- Usarla solo para los fines pactados.
- Tomar medidas razonables para protegerla.

### 6. Penalizaciones por incumplimiento

Qué ocurre si una parte viola el acuerdo: indemnización, medidas cautelares, etc.

### 7. Jurisdicción

Qué tribunales resolverán los conflictos.

---

## Ejemplo práctico

Imagina que eres un desarrollador y un cliente te pide que crees una aplicación. Antes de empezar, el cliente te comparte:

- Su modelo de negocio.
- Datos de usuarios existentes.
- Estrategia de lanzamiento.

Un NDA te obliga a no compartir esta información con terceros ni usarla para otro propósito que no sea el desarrollo de la aplicación.

---

## Artículos relacionados

- [Contrato de prestación de servicios](/blog/contrato-prestacion-servicios-autonomos-modelo) — Protege tus proyectos
- [Factura rectificativa](/blog/factura-rectificativa-cuando-emitirla-como-hacerla) — Corregir documentos
- [Cómo hacer una factura profesional](/blog/como-hacer-factura-profesional-ejemplo) — Campos obligatorios

---

## Preguntas frecuentes

### ¿Un NDA tiene validez legal en España?

Sí. Los acuerdos de confidencialidad son contratos válidos según el Código Civil y están reforzados por la Ley de Secretos Empresariales.

### ¿Cuánto tiempo debe durar un NDA?

Lo habitual es entre 2 y 5 años tras la finalización de la relación. Para información especialmente sensible (patentes, secretos industriales), puede ser indefinido.

### ¿Puedo usar un NDA genérico?

Puedes usar un modelo base, pero asegúrate de adaptarlo a cada situación. Un NDA genérico puede no cubrir información específica de tu negocio.

### ¿Qué pasa si alguien incumple un NDA?

Puedes reclamar una indemnización por daños y perjuicios. Si el NDA incluye una cláusula penal, puedes exigir la cantidad pactada sin necesidad de demostrar el daño real.`,
    tags: ['NDA', 'Confidencialidad', 'Legal', 'Autónomos', 'Contrato'],
    status: 'published',
    createdAt: '2026-04-30T10:00:00.000Z',
    updatedAt: '2026-04-30T10:00:00.000Z',
    publishedAt: '2026-04-30T10:00:00.000Z',
  },
]

const DEFAULT_POSTS = [SEED_POST, ...SEO_POSTS]

function readLegacyAdminPosts(): BlogPost[] | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    const raw = window.localStorage.getItem('ha-admin')
    if (!raw) return undefined

    const parsed = JSON.parse(raw) as { state?: { posts?: BlogPost[] } }
    return parsed.state?.posts
  } catch {
    return undefined
  }
}

function mergePosts(persistedPosts: BlogPost[] | undefined): BlogPost[] {
  const seedIds = new Set(DEFAULT_POSTS.map((post) => post.id))
  const postsById = new Map(DEFAULT_POSTS.map((post) => [post.id, post]))

  for (const post of persistedPosts ?? []) {
    if (seedIds.has(post.id)) {
      postsById.set(post.id, {
        ...post,
        ...(postsById.get(post.id) ?? {}),
      } as BlogPost)
    } else {
      postsById.set(post.id, post)
    }
  }

  const mergedSeeds = DEFAULT_POSTS.map((post) => postsById.get(post.id) ?? post)
  const customPosts = (persistedPosts ?? []).filter((post) => !seedIds.has(post.id))

  return [...mergedSeeds, ...customPosts]
}

export const useBlogStore = create<BlogState>()(
  persist(
    (set) => ({
      posts: DEFAULT_POSTS,

      createPost: (data) => {
        const now = new Date().toISOString()
        const post: BlogPost = {
          ...data,
          id: nanoid(),
          createdAt: now,
          updatedAt: now,
          publishedAt: data.status === 'published' ? data.publishedAt ?? now : null,
        }
        set((state) => ({ posts: [post, ...state.posts] }))
        return post
      },

      updatePost: (id, data) =>
        set((state) => ({
          posts: state.posts.map((post) => {
            if (post.id !== id) return post

            const nextStatus = data.status ?? post.status
            const publishedAt =
              nextStatus === 'published'
                ? post.status === 'published'
                  ? post.publishedAt
                  : new Date().toISOString()
                : null

            return {
              ...post,
              ...data,
              status: nextStatus,
              publishedAt,
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      deletePost: (id) =>
        set((state) => ({ posts: state.posts.filter((post) => post.id !== id) })),

      publishPost: (id) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === id
              ? {
                  ...post,
                  status: 'published',
                  publishedAt: post.publishedAt ?? new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : post
          ),
        })),

      unpublishPost: (id) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === id
              ? { ...post, status: 'draft', publishedAt: null, updatedAt: new Date().toISOString() }
              : post
          ),
        })),
    }),
    {
      name: 'ha-blog',
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<BlogState>),
        posts: mergePosts((persistedState as Partial<BlogState>)?.posts ?? readLegacyAdminPosts()),
      }),
    }
  )
)

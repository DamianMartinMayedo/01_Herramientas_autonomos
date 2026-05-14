/**
 * modalTexts.ts
 * Generadores de textos para ConfirmModal en flujos típicos (publicar/ocultar,
 * activar/desactivar, eliminar). Mantiene tono y copy consistentes entre secciones.
 */
import type { ConfirmModalProps } from '../components/ConfirmModal'

type ConfirmTexts = Pick<ConfirmModalProps, 'title' | 'description' | 'confirmLabel' | 'confirmVariant'>

const EMPTY: ConfirmTexts = { title: '', description: '', confirmLabel: '', confirmVariant: 'danger' }

export function emptyConfirm(): ConfirmTexts {
  return EMPTY
}

export function visibilityTexts(label: string, oculta: boolean, options?: { onShowText?: string; onHideText?: string }): ConfirmTexts {
  return {
    title: oculta ? `Mostrar "${label}"` : `Ocultar "${label}"`,
    description: oculta
      ? options?.onShowText ?? 'Volverá a aparecer en el Home y será accesible por URL directa.'
      : options?.onHideText ?? 'Dejará de mostrarse en el Home y no será accesible por URL directa.',
    confirmLabel: oculta ? 'Sí, mostrar' : 'Sí, ocultar',
    confirmVariant: oculta ? 'success' : 'warning',
  }
}

export function activationTexts(label: string, activa: boolean): ConfirmTexts {
  return {
    title: activa ? `Desactivar "${label}"` : `Activar "${label}"`,
    description: activa
      ? 'La herramienta quedará inaccesible para los usuarios y se mostrará como "Mejorando".'
      : 'La herramienta pasará a estar disponible para todos los usuarios.',
    confirmLabel: activa ? 'Sí, desactivar' : 'Sí, activar',
    confirmVariant: activa ? 'danger' : 'success',
  }
}

export function deleteTexts(label: string, hint = 'Esta acción es permanente y no podrá recuperarse.'): ConfirmTexts {
  return {
    title: `Eliminar "${label}"`,
    description: hint,
    confirmLabel: 'Sí, eliminar',
    confirmVariant: 'danger',
  }
}

export function publishTexts(label: string, publicado: boolean): ConfirmTexts {
  return {
    title: publicado ? `Despublicar "${label}"` : `Publicar "${label}"`,
    description: publicado
      ? 'El artículo pasará a borrador y dejará de ser visible en el blog público.'
      : 'El artículo será visible en el blog público inmediatamente.',
    confirmLabel: publicado ? 'Sí, despublicar' : 'Sí, publicar',
    confirmVariant: publicado ? 'warning' : 'success',
  }
}

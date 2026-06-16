/**
 * Imperative confirmation dialog utility.
 *
 * Usage:
 *   const ok = await confirm({ title: 'Delete product?', danger: true })
 *   if (!ok) return
 *
 * Resolves the modal imperatively — no JSX needed at the call site.
 * The <ConfirmDialog /> component must be mounted in ClientWrapper.
 */

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Use danger styling (ember/red confirm button) */
  danger?: boolean
}

type Resolver = (value: boolean) => void

let _resolve: Resolver | null = null
let _setOptions: ((opts: ConfirmOptions | null) => void) | null = null

/** Called by <ConfirmDialog /> to register itself */
export function _registerConfirmDialog(setOptions: (opts: ConfirmOptions | null) => void) {
  _setOptions = setOptions
}

/** Called by <ConfirmDialog /> when user responds */
export function _resolveConfirm(value: boolean) {
  _setOptions?.(null)
  _resolve?.(value)
  _resolve = null
}

/**
 * Show a brand-styled confirmation dialog.
 * Returns a promise that resolves to `true` (confirm) or `false` (cancel).
 */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  if (!_setOptions) {
    // Fallback to native confirm if dialog isn't mounted (SSR safety)
    return Promise.resolve(window.confirm(options.message || options.title))
  }
  return new Promise<boolean>((resolve) => {
    _resolve = resolve
    _setOptions!(options)
  })
}

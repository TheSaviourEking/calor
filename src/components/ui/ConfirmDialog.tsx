'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { _registerConfirmDialog, _resolveConfirm, type ConfirmOptions } from '@/lib/confirm'

export default function ConfirmDialog() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)

  useEffect(() => {
    _registerConfirmDialog(setOptions)
  }, [])

  if (!options) return null

  const confirmLabel = options.confirmLabel ?? (options.danger ? 'Delete' : 'Confirm')
  const cancelLabel = options.cancelLabel ?? 'Cancel'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal/50 z-[200] transition-opacity duration-200"
        onClick={() => _resolveConfirm(false)}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={options.message ? 'confirm-message' : undefined}
        className="fixed inset-0 z-[201] flex items-center justify-center p-6 pointer-events-none"
      >
        <div
          className="bg-warm-white border border-sand w-full max-w-sm pointer-events-auto shadow-xl"
          style={{ animation: 'dialogIn 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4">
            <div className="flex items-center gap-3">
              {options.danger && (
                <div className="w-8 h-8 bg-ember/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-ember" />
                </div>
              )}
              <h2
                id="confirm-title"
                className="font-display text-charcoal text-lg"
                style={{ fontWeight: 400 }}
              >
                {options.title}
              </h2>
            </div>
            <button
              onClick={() => _resolveConfirm(false)}
              className="text-warm-gray hover:text-charcoal transition-colors ml-4 flex-shrink-0"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message */}
          {options.message && (
            <div className="px-6 pb-4">
              <p id="confirm-message" className="font-body text-warm-gray text-sm leading-relaxed">
                {options.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-sand bg-cream/40">
            <button
              onClick={() => _resolveConfirm(false)}
              className="px-4 py-2 font-body text-sm text-warm-gray hover:text-charcoal transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => _resolveConfirm(true)}
              className={`px-5 py-2 font-body text-sm uppercase tracking-wider transition-colors ${
                options.danger
                  ? 'bg-ember text-warm-white hover:bg-ember/90'
                  : 'bg-charcoal text-cream hover:bg-terracotta'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes dialogIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  )
}

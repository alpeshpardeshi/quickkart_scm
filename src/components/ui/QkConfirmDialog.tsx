import { QkButton } from './QkButton'
import { QkModal } from './QkModal'

interface QkConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  tone?: 'danger' | 'primary'
  loading?: boolean
}

export function QkConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'primary',
  loading,
}: QkConfirmDialogProps) {
  return (
    <QkModal
      open={open}
      onClose={onClose}
      title={title}
      width={420}
      footer={
        <>
          <QkButton variant="outline" onClick={onClose}>Cancel</QkButton>
          <QkButton
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </QkButton>
        </>
      }
    >
      <p style={{ margin: 0, color: 'var(--qk-text-secondary)', fontSize: 'var(--qk-font-body)' }}>{message}</p>
    </QkModal>
  )
}

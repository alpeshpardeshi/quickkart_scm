import { forwardRef, type InputHTMLAttributes } from 'react'
import { QkInput } from './QkInput'

interface QkDatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  hint?: string
}

export const QkDatePicker = forwardRef<HTMLInputElement, QkDatePickerProps>(
  ({ label, error, hint, ...props }, ref) => (
    <QkInput ref={ref} type="date" label={label} error={error} hint={hint} {...props} />
  ),
)

QkDatePicker.displayName = 'QkDatePicker'

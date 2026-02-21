import { Input } from "@tripalfa/ui-components/ui/input"

export type DatePickerProps = {
    id?: string
    value?: string
    onChange?: (value: string) => void
    disabled?: boolean
    placeholder?: string
    min?: string
    max?: string
}

export function DatePicker({ id, value, onChange, disabled, placeholder, min, max }: DatePickerProps) {
    return (
        <Input
            id={id}
            type="date"
            value={value ?? ""}
            onChange={(event) => onChange?.(event.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            min={min}
            max={max}
        />
    )
}

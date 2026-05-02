import React, {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react'

interface FormulaBarProps {
  value: string
  onChange: (value: string) => void
}

export const FormulaBar = forwardRef<HTMLInputElement, FormulaBarProps>(
  ({ value, onChange }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => innerRef.current!)

    useEffect(() => {
      if (innerRef.current) {
        innerRef.current.value = value
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onChange(e.currentTarget.value)
      }
    }

    return (
      <div className="formula-bar">
        <span className="formula-bar-label">fx</span>
        <input
          ref={innerRef}
          className="formula-bar-input"
          defaultValue={value}
          onBlur={handleChange}
          onKeyDown={handleKeyDown}
        />
      </div>
    )
  }
)

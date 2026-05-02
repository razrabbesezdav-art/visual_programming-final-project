import { CellData } from '@/types'
import { toCellId, parseCellId } from './cellUtils'

type CellGetter = (cellId: string) => CellData | undefined

function resolveValue(cell: CellData): number | null {
  if (cell.type === 'number') return Number(cell.computedValue)
  if (cell.type === 'string' && !isNaN(Number(cell.computedValue)))
    return Number(cell.computedValue)
  return null
}

// Получение значения ячейки (числа) по id
function getNumericValue(cellId: string, getCell: CellGetter): number | null {
  const cell = getCell(cellId)
  if (!cell) return null
  return resolveValue(cell)
}

// Сумма диапазона
function sumRange(start: string, end: string, getCell: CellGetter): number | null {
  const s = parseCellId(start)
  const e = parseCellId(end)
  let sum = 0
  for (let r = Math.min(s.row, e.row); r <= Math.max(s.row, e.row); r++) {
    for (let c = Math.min(s.col, e.col); c <= Math.max(s.col, e.col); c++) {
      const val = getNumericValue(toCellId(r, c), getCell)
      if (val === null) return null
      sum += val
    }
  }
  return sum
}

// Среднее диапазона
function averageRange(start: string, end: string, getCell: CellGetter): number | null {
  const s = parseCellId(start)
  const e = parseCellId(end)
  let sum = 0
  let count = 0
  for (let r = Math.min(s.row, e.row); r <= Math.max(s.row, e.row); r++) {
    for (let c = Math.min(s.col, e.col); c <= Math.max(s.col, e.col); c++) {
      const val = getNumericValue(toCellId(r, c), getCell)
      if (val === null) return null
      sum += val
      count++
    }
  }
  return count === 0 ? null : sum / count
}

// возвращает вычисленное значение или null при ошибке
export function evaluateFormula(
  formula: string,
  getCell: CellGetter
): string | number | boolean | null {
  if (!formula.startsWith('=')) return formula
  const expr = formula.substring(1).trim()

  // SUM
  const sumMatch = expr.match(/^SUM\(([A-Z]+\d+):([A-Z]+\d+)\)$/i)
  if (sumMatch) {
    return sumRange(sumMatch[1], sumMatch[2], getCell)
  }

  // AVERAGE
  const avgMatch = expr.match(/^AVERAGE\(([A-Z]+\d+):([A-Z]+\d+)\)$/i)
  if (avgMatch) {
    return averageRange(avgMatch[1], avgMatch[2], getCell)
  }

  // Простые арифметические выражения
  const arithmeticMatch = expr.match(/^([A-Z]+\d+)([+\-*/])([A-Z]+\d+|\d+(\.\d+)?)$/i)
  if (arithmeticMatch) {
    const leftId = arithmeticMatch[1]
    const operator = arithmeticMatch[2]
    const rightOperand = arithmeticMatch[3]

    const leftVal = getNumericValue(leftId, getCell)
    if (leftVal === null) return null

    let rightVal: number | null
    if (/^[A-Z]+\d+$/i.test(rightOperand)) {
      rightVal = getNumericValue(rightOperand, getCell)
    } else {
      rightVal = parseFloat(rightOperand)
    }
    if (rightVal === null) return null

    switch (operator) {
      case '+': return leftVal + rightVal
      case '-': return leftVal - rightVal
      case '*': return leftVal * rightVal
      case '/': return rightVal !== 0 ? leftVal / rightVal : null
      default: return null
    }
  }

  // Одиночная ссылка =A1
  const singleRef = expr.match(/^([A-Z]+\d+)$/i)
  if (singleRef) {
    const cell = getCell(singleRef[1])
    return cell ? cell.computedValue : null
  }

  return formula
}

// автоопределение типа значения
export function detectType(raw: string): 'string' | 'number' | 'boolean' | 'formula' {
  if (raw.startsWith('=')) return 'formula'
  if (raw === 'true' || raw === 'false') return 'boolean'
  const num = Number(raw)
  if (!isNaN(num) && raw.trim() !== '') return 'number'
  return 'string'
}
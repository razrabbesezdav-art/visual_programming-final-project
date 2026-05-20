import { CellData } from '@/types'
import { toCellId, parseCellId } from './cellUtils'

type CellGetter = (cellId: string) => CellData | undefined

// Получает числовое значение из ячейки, независимо от её типа
function getNumericValue(cellId: string, getCell: CellGetter): number | null {
  const cell = getCell(cellId)
  if (!cell) return null

  // Если ячейка уже содержит число
  if (cell.type === 'number') {
    return Number(cell.computedValue)
  }

  // Если ячейка содержит строку, которая может быть числом
  if (cell.type === 'string') {
    const num = Number(cell.computedValue)
    if (!isNaN(num)) return num
  }

  // Если ячейка содержит формулу, используем её вычисленное значение
  if (cell.type === 'formula') {
    if (
      cell.computedValue === '#ERROR' ||
      cell.computedValue === null ||
      cell.computedValue === undefined
    ) {
      return null
    }
    const num = Number(cell.computedValue)
    if (!isNaN(num)) return num
  }

  // Если ячейка содержит boolean
  if (cell.type === 'boolean') {
    return cell.computedValue === true ? 1 : 0
  }

  return null
}

// Получает значение из ячейки или константы (для IF)
function resolveValue(
  val: string,
  getCell: CellGetter
): number | string | null {
  val = val.trim()

  const cellMatch = val.match(/^([A-Z]+\d+)$/i)
  if (cellMatch) {
    const cell = getCell(cellMatch[1])
    if (!cell) return null
    const num = getNumericValue(cellMatch[1], getCell)
    if (num !== null) return num
    return cell.displayValue || cell.rawValue || null
  }

  const strMatch = val.match(/^"(.+)"$/)
  if (strMatch) return strMatch[1]

  const num = Number(val)
  if (!isNaN(num)) return num

  return val || null
}

// Вычисляет условие для функции IF
function evaluateCondition(condition: string, getCell: CellGetter): boolean {
  condition = condition.trim()

  if (condition === 'true') return true
  if (condition === 'false') return false

  const operators = ['<>', '>=', '<=', '=', '>', '<']
  for (const op of operators) {
    const idx = findOperatorIndex(condition, op)
    if (idx !== -1) {
      const leftStr = condition.substring(0, idx).trim()
      const rightStr = condition.substring(idx + op.length).trim()
      const leftVal = resolveValue(leftStr, getCell)
      const rightVal = resolveValue(rightStr, getCell)

      if (leftVal === null || rightVal === null) return false

      const leftNum =
        typeof leftVal === 'string' ? parseFloat(leftVal) : leftVal
      const rightNum =
        typeof rightVal === 'string' ? parseFloat(rightVal) : rightVal
      const isNumeric = !isNaN(leftNum) && !isNaN(rightNum)

      const left = isNumeric ? leftNum : leftVal
      const right = isNumeric ? rightNum : rightVal

      switch (op) {
        case '=':
          return left === right
        case '<>':
          return left !== right
        case '>':
          return typeof left === 'number' && typeof right === 'number'
            ? left > right
            : String(left) > String(right)
        case '<':
          return typeof left === 'number' && typeof right === 'number'
            ? left < right
            : String(left) < String(right)
        case '>=':
          return typeof left === 'number' && typeof right === 'number'
            ? left >= right
            : String(left) >= String(right)
        case '<=':
          return typeof left === 'number' && typeof right === 'number'
            ? left <= right
            : String(left) <= String(right)
      }
    }
  }

  const cellMatch = condition.match(/^([A-Z]+\d+)$/i)
  if (cellMatch) {
    const cell = getCell(cellMatch[1])
    if (!cell) return false
    if (cell.type === 'boolean') return cell.computedValue === true
    if (cell.type === 'number') return Number(cell.computedValue) !== 0
    return !!cell.rawValue
  }

  const num = Number(condition)
  if (!isNaN(num)) return num !== 0

  return false
}

function findOperatorIndex(str: string, op: string): number {
  if (op === '=' || op === '>' || op === '<') {
    const idx = str.indexOf(op)
    if (idx !== -1) {
      const nextChar = str[idx + 1]
      if (nextChar === '=' || nextChar === '>') {
        const twoCharOp = op + nextChar
        if (twoCharOp === '>=' || twoCharOp === '<=' || twoCharOp === '<>') {
          return -1
        }
      }
      return idx
    }
  }
  return str.indexOf(op)
}

function parseArgument(
  arg: string,
  getCell: CellGetter
): number | number[] | null {
  arg = arg.trim()

  // Сначала проверяем диапазоны, потом отдельные значения

  // 1. Проверяем диапазон ячеек (A1:B5)
  const cellRangeMatch = arg.match(/^([A-Z]+\d+):([A-Z]+\d+)$/i)
  if (cellRangeMatch) {
    return getRangeValues(cellRangeMatch[1], cellRangeMatch[2], getCell)
  }

  // 2. Проверяем диапазон строк (1:5) - ДОЛЖНО БЫТЬ ПЕРЕД ПРОВЕРКОЙ КОНСТАНТ
  const rowRangeMatch = arg.match(/^(\d+):(\d+)$/)
  if (rowRangeMatch) {
    const startRow = parseInt(rowRangeMatch[1]) - 1
    const endRow = parseInt(rowRangeMatch[2]) - 1
    return getRowRangeValues(startRow, endRow, getCell)
  }

  // 3. Проверяем диапазон колонок (A:C)
  const colRangeMatch = arg.match(/^([A-Z]+):([A-Z]+)$/i)
  if (colRangeMatch) {
    const startCol = columnLetterToIndex(colRangeMatch[1])
    const endCol = columnLetterToIndex(colRangeMatch[2])
    return getColRangeValues(startCol, endCol, getCell)
  }

  // 4. Проверяем ссылку на ячейку (A1, B2, etc.)
  if (/^[A-Z]+\d+$/i.test(arg)) {
    return getNumericValue(arg, getCell)
  }

  // 5. Проверяем числовую константу (только если это НЕ диапазон)
  if (/^-?\d+(\.\d+)?$/.test(arg)) {
    return parseFloat(arg)
  }

  return null
}

// Получает значения из диапазона ячеек
function getRangeValues(
  startCell: string,
  endCell: string,
  getCell: CellGetter
): number[] | null {
  const start = parseCellId(startCell)
  const end = parseCellId(endCell)

  const minRow = Math.min(start.row, end.row)
  const maxRow = Math.max(start.row, end.row)
  const minCol = Math.min(start.col, end.col)
  const maxCol = Math.max(start.col, end.col)

  const values: number[] = []
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const val = getNumericValue(toCellId(r, c), getCell)
      if (val !== null) {
        values.push(val)
      }
    }
  }

  return values.length > 0 ? values : null
}

// Получает значения из диапазона строк
function getRowRangeValues(
  startRow: number,
  endRow: number,
  getCell: CellGetter
): number[] | null {
  const minRow = Math.min(startRow, endRow)
  const maxRow = Math.max(startRow, endRow)

  const values: number[] = []
  // Проверяем все возможные колонки A-ZZ
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = 0; c < 100; c++) {
      const val = getNumericValue(toCellId(r, c), getCell)
      if (val !== null) {
        values.push(val)
      }
    }
  }

  return values.length > 0 ? values : null
}

// Получает значения из диапазона колонок
function getColRangeValues(
  startCol: number,
  endCol: number,
  getCell: CellGetter
): number[] | null {
  const minCol = Math.min(startCol, endCol)
  const maxCol = Math.max(startCol, endCol)

  const values: number[] = []
  for (let r = 0; r < 100; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const val = getNumericValue(toCellId(r, c), getCell)
      if (val !== null) {
        values.push(val)
      }
    }
  }

  return values.length > 0 ? values : null
}

// Конвертирует буквенное обозначение колонки в индекс
function columnLetterToIndex(letters: string): number {
  let col = 0
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.toUpperCase().charCodeAt(i) - 64)
  }
  return col - 1
}

// Основная функция вычисления формулы
export function evaluateFormula(
  formula: string,
  getCell: CellGetter
): string | number | boolean | null {
  // Если это не формула, возвращаем как есть
  if (!formula.startsWith('=')) {
    return formula
  }

  const expr = formula.substring(1).trim()

  // Обработка функций SUM, AVERAGE, MIN, MAX, COUNT, IF
  const funcMatch = expr.match(/^(SUM|AVERAGE|MIN|MAX|COUNT|IF)\((.+)\)$/i)
  if (funcMatch) {
    const funcName = funcMatch[1].toUpperCase()
    const argsString = funcMatch[2]

    // Функция IF имеет другую структуру: IF(условие; значение_если_да; значение_если_нет)
    if (funcName === 'IF') {
      const args = splitArguments(argsString)
      if (args.length < 2) return '#ERROR'

      const condition = args[0].trim()
      const isTrue = evaluateCondition(condition, getCell)

      const resultExpr = isTrue ? args[1].trim() : (args[2] || '').trim()

      // Если результат — ссылка на ячейку, возвращаем её computedValue
      const cellMatch = resultExpr.match(/^([A-Z]+\d+)$/i)
      if (cellMatch) {
        const cell = getCell(cellMatch[1])
        return cell ? cell.computedValue || cell.displayValue || null : null
      }

      // Если результат — число
      if (/^-?\d+(\.\d+)?$/.test(resultExpr)) {
        return parseFloat(resultExpr)
      }

      // Если результат — строка в кавычках
      const strMatch = resultExpr.match(/^"(.+)"$/)
      if (strMatch) return strMatch[1]

      return resultExpr || null
    }

    const args = splitArguments(argsString)

    const allValues: number[] = []

    for (const arg of args) {
      const result = parseArgument(arg.trim(), getCell)

      if (result === null) {
        console.warn(`Cannot parse argument: "${arg}"`)
        return '#ERROR'
      }

      if (Array.isArray(result)) {
        allValues.push(...result)
      } else {
        allValues.push(result)
      }
    }

    if (allValues.length === 0) {
      return '#ERROR'
    }

    switch (funcName) {
      case 'SUM':
        return allValues.reduce((sum, val) => sum + val, 0)

      case 'AVERAGE':
        return allValues.reduce((sum, val) => sum + val, 0) / allValues.length

      case 'MIN':
        return Math.min(...allValues)

      case 'MAX':
        return Math.max(...allValues)

      case 'COUNT':
        return allValues.length

      default:
        return '#ERROR'
    }
  }

  // Обработка арифметических выражений
  try {
    let evalExpr = expr
    const cellRefs = expr.match(/([A-Z]+\d+)/gi)
    if (cellRefs) {
      for (const ref of cellRefs) {
        const val = getNumericValue(ref, getCell)
        if (val === null) {
          return '#ERROR'
        }
        evalExpr = evalExpr.replace(ref, val.toString())
      }
    }

    // Проверяем, что выражение содержит только числа и операторы
    if (/^[\d\s+\-*/().]+$/.test(evalExpr)) {
      const result = new Function(`return (${evalExpr})`)()
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        return result
      }
    }
  } catch {
    return '#ERROR'
  }

  // Если это ссылка на одну ячейку
  const singleRef = expr.match(/^([A-Z]+\d+)$/i)
  if (singleRef) {
    const cell = getCell(singleRef[1])
    if (cell) {
      return cell.computedValue
    }
  }

  // Если это просто число
  if (/^-?\d+(\.\d+)?$/.test(expr)) {
    return parseFloat(expr)
  }

  return '#ERROR'
}

// Разбивает строку аргументов, учитывая возможные пробелы
function splitArguments(argsString: string): string[] {
  return argsString
    .split(';')
    .map((arg) => arg.trim())
    .filter((arg) => arg !== '')
}

// Определение типа значения
export function detectType(
  raw: string
): 'string' | 'number' | 'boolean' | 'formula' {
  if (raw.startsWith('=')) return 'formula'
  if (raw === 'true' || raw === 'false') return 'boolean'
  const num = Number(raw)
  if (!isNaN(num) && raw.trim() !== '') return 'number'
  return 'string'
}

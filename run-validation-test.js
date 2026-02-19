/**
 * Run validation against generated test files (Node). Reads xlsx + rate-card-types.json, runs runValidation, prints summary.
 */
import XLSX from 'xlsx'
import fs from 'fs'
import { runValidation } from './src/validationLogic.js'

const testDataDir = './test-data'
const basePath = `${testDataDir}/Base_Test_Invoice.xlsx`
const quotePath = `${testDataDir}/Quote_Test.xlsx`
const rateCardPath = `${testDataDir}/Rate_Card_Test.xlsx`
const configPath = './public/rate-card-types.json'

function sheetToJson(path) {
  const buf = fs.readFileSync(path)
  const wb = XLSX.read(buf, { type: 'buffer' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet)
}

const baseData = sheetToJson(basePath)
const quoteData = sheetToJson(quotePath)
const rateCardData = sheetToJson(rateCardPath)
const rateCardConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))

const result = runValidation(baseData, quoteData, {
  priceTolerance: 0.05,
  qtyTolerance: 0.2,
  rateCardData,
  rateCardConfig
})

console.log('Validation summary:')
console.log('  Total:', result.totalLines)
console.log('  Passed:', result.passedCount)
console.log('  Failed:', result.failedCount)
console.log('  For Rate Card Validation:', result.rateCardCount)
const failed = result.validationResults.filter(r => r.validation_result === 'Failed')
if (failed.length > 0) {
  console.log('\nFailed rows (first 5):')
  failed.slice(0, 5).forEach(r => {
    console.log('  Row', r.row, 'trx', r.trx_number, 'po', r.po_number, '-', r.remarks)
  })
}

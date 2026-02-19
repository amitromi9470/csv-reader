/**
 * Creates 3 test Excel files (50+ rows each) with positive and negative scenarios.
 * Includes quote validation and rate card validation scenarios.
 */
import XLSX from 'xlsx'
import fs from 'fs'

const outDir = './test-data'
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

const baseCols = [
  'invoice_number', 'invoice_date', 'quantity', 'unit_price', 'line_level_amount',
  'po_number', 'IBX', 'renewal term', 'first_Price_increment_applicable_after',
  'description', 'item_code', 'country', 'region', 'invoice_start_date',
  'service_start_date', 'price_increase_percentage'
]

function baseRow(overrides = {}) {
  const row = {}
  baseCols.forEach(c => { row[c] = '' })
  Object.assign(row, overrides)
  return row
}

// ---------- BASE (INVOICE) - 55 rows ----------
const baseRows = []
let rowNum = 1

const baseInvoiceStartDates = ['2025-01-01', '2025-02-15', '2025-04-01', '2025-05-10', '2025-06-01', '2025-08-01', '2025-09-15', '2025-11-01']
// 1-20: Positive (quote match) - PO001-PO005, various sites
for (let i = 1; i <= 20; i++) {
  const po = `PO00${(i % 5) + 1}`
  const sites = ['DA1', 'CH1', 'AM2', 'DA2', 'CH2']
  const qty = i % 2 === 0 ? 5 + (i % 4) : 1
  const up = i % 2 === 0 ? 10 : 100
  const startDate = baseInvoiceStartDates[i % baseInvoiceStartDates.length]
  baseRows.push(baseRow({
    invoice_number: `INV-${String(i).padStart(4, '0')}`,
    invoice_date: '2025-01-15',
    po_number: po,
    IBX: sites[i % 5],
    item_code: i % 2 === 0 ? 'SVC-001' : 'SVC-002',
    description: i % 2 === 0 ? 'Test Service Monthly' : 'Setup Fee',
    quantity: qty,
    unit_price: up,
    line_level_amount: qty * up,
    'renewal term': 12 + (i % 2) * 12,
    first_Price_increment_applicable_after: 5 + (i % 3),
    price_increase_percentage: 2 + (i % 4),
    invoice_start_date: startDate,
    service_start_date: startDate,
    country: 'United States',
    region: 'Americas'
  }))
}

// 21-32: Negative (quote) - no PO match, wrong price, excess qty
for (let i = 21; i <= 32; i++) {
  const scenario = (i - 21) % 4
  if (scenario === 0) {
    baseRows.push(baseRow({
      invoice_number: `INV-${i}`,
      invoice_date: '2025-01-15',
      po_number: 'PO999',
      IBX: 'DA1',
      item_code: 'X',
      description: 'No Quote For This PO',
      quantity: 1,
      unit_price: 50,
      line_level_amount: 50,
      invoice_start_date: '2025-01-01',
      service_start_date: '2025-01-01',
      country: 'United States',
      region: 'Americas'
    }))
  } else if (scenario === 1) {
    baseRows.push(baseRow({
      invoice_number: `INV-${i}`,
      invoice_date: '2025-01-15',
      po_number: 'PO001',
      IBX: 'DA1',
      item_code: 'SVC-001',
      description: 'Test Service Monthly',
      quantity: 5,
      unit_price: 99,
      line_level_amount: 495,
      invoice_start_date: '2025-01-01',
      service_start_date: '2025-01-01',
      country: 'United States',
      region: 'Americas'
    }))
  } else if (scenario === 2) {
    baseRows.push(baseRow({
      invoice_number: `INV-${i}`,
      invoice_date: '2025-01-15',
      po_number: 'PO002',
      IBX: 'CH1',
      item_code: 'SVC-002',
      description: 'Setup Fee',
      quantity: 100,
      unit_price: 100,
      line_level_amount: 10000,
      invoice_start_date: '2025-01-01',
      service_start_date: '2025-01-01',
      country: 'United States',
      region: 'Americas'
    }))
  } else {
    baseRows.push(baseRow({
      invoice_number: `INV-${i}`,
      invoice_date: '2025-01-15',
      po_number: 'PO001',
      IBX: 'DA1',
      item_code: 'FREE',
      description: 'Zero charge',
      quantity: 1,
      unit_price: 0,
      line_level_amount: 0,
      invoice_start_date: '2025-01-01',
      service_start_date: '2025-01-01',
      country: 'United States',
      region: 'Americas'
    }))
  }
}

// 33-55: Rate card scenarios (no quote PO / OOS) - AC Power kVA, Smart Hands, Cabinet Installation, etc.
const rateCardDescriptions = [
  'AC Power kVA',
  'Metered Power Charges kVA',
  'Power Cord kVA',
  'Smart Hands NRC',
  'Cabinet Installation',
  'Cage Installation',
  'Cross Connect Single-Mode Fiber',
  'Equinix Precision Time Standard NTP'
]
for (let i = 33; i <= 55; i++) {
  const desc = rateCardDescriptions[(i - 33) % rateCardDescriptions.length]
  const isMissingServiceStart = i >= 52
  const up = i === 54 ? 0 : (desc.indexOf('Power') !== -1 ? 12 : desc.indexOf('Smart') !== -1 ? 150 : 200)
  const svcStart = isMissingServiceStart ? '' : '2025-06-01'
  baseRows.push(baseRow({
    invoice_number: `INV-${i}`,
    invoice_date: '2025-06-15',
    po_number: 'PO-RC',
    IBX: 'DA1',
    item_code: '',
    description: desc,
    quantity: 1,
    unit_price: up,
    line_level_amount: up,
    invoice_start_date: svcStart,
    service_start_date: svcStart,
    country: 'United States',
    region: 'Americas'
  }))
}

// One row with price over rate card (fail rate card)
baseRows.push(baseRow({
  invoice_number: 'INV-56',
  invoice_date: '2025-06-15',
  po_number: 'PO-RC',
  IBX: 'DA1',
  description: 'AC Power kVA',
  quantity: 1,
  unit_price: 500,
  line_level_amount: 500,
  invoice_start_date: '2025-06-01',
  service_start_date: '2025-06-01',
  country: 'United States',
  region: 'Americas'
}))

const wsBase = XLSX.utils.json_to_sheet(baseRows)
const wbBase = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wbBase, wsBase, 'Sheet1')
XLSX.writeFile(wbBase, `${outDir}/Base_Test_Invoice.xlsx`)
console.log('Created', `${outDir}/Base_Test_Invoice.xlsx`, baseRows.length, 'rows')

// ---------- QUOTE - 55+ rows ----------
const quoteRows = []
const quotePoSites = [
  { po: 'PO001', site: 'DA1' }, { po: 'PO001', site: 'DA1' },
  { po: 'PO002', site: 'CH1' }, { po: 'PO002', site: 'CH1' },
  { po: 'PO003', site: 'AM2' }, { po: 'PO003', site: 'AM2' },
  { po: 'PO004', site: 'DA2' }, { po: 'PO004', site: 'DA2' },
  { po: 'PO005', site: 'CH2' }, { po: 'PO005', site: 'CH2' }
]
const quoteInvoiceStartDates = ['2024-01-01', '2024-03-15', '2024-06-01', '2024-09-01', '2025-01-01', '2025-04-01', '2025-07-01', '2025-10-01']
for (let i = 0; i < 55; i++) {
  const { po, site } = quotePoSites[i % 10]
  const isRecurring = i % 2 === 0
  quoteRows.push({
    'Po Number': po,
    'site_id': site,
    'Item Code': isRecurring ? 'SVC-001' : 'SVC-002',
    'Item Description': isRecurring ? 'Test Service Monthly' : 'Setup Fee',
    'Changed Item Description': isRecurring ? 'Test Service Monthly' : 'Setup Fee One Time',
    'Quantity': isRecurring ? 10 : 2,
    'MRC': isRecurring ? 10 : '',
    'OTC': isRecurring ? '' : 100,
    'Invoice start date': quoteInvoiceStartDates[i % quoteInvoiceStartDates.length],
    'first_Price_increment_applicable_after': 5 + (i % 3),
    'renewal term': 12 + (i % 2) * 12,
    'price_increase_percentage': 2 + (i % 4)
  })
}

const wsQuote = XLSX.utils.json_to_sheet(quoteRows)
const wbQuote = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wbQuote, wsQuote, 'Sheet1')
XLSX.writeFile(wbQuote, `${outDir}/Quote_Test.xlsx`)
console.log('Created', `${outDir}/Quote_Test.xlsx`, quoteRows.length, 'rows')

// ---------- RATE CARD - 55+ rows ----------
const rcRows = []
const rcTypes = [
  { sub_type: 'Space & Power', price_field: 'u_pricekva', price: 12, density: 'Standard' },
  { sub_type: 'Space & Power', price_field: 'u_pricekva', price: 15, density: 'High' },
  { sub_type: 'Power Install NRC', price_field: 'u_rate', price: 500, amps: '30', volt: '208' },
  { sub_type: 'Secure Cabinet Express', price_field: 'u_pricekva', price: 18, density: 'Standard' },
  { sub_type: 'Cabinet Install NRC', price_field: 'u_nrc', price: 200 },
  { sub_type: 'Cabinet Install NRC', price_field: 'u_nrc', price: 250 },
  { sub_type: 'Interconnection', price_field: 'u_nrc', price: 180 },
  { sub_type: 'Smart Hands', price_field: 'u_rate', price: 150 },
  { sub_type: 'Equinix Precision Time', price_field: 'u_std_ntp_non_red', price: 50, std_ptp: 60, ent_ntp: 80, ent_ptp: 90 }
]
const rateCardCols = ['u_rate_card_type', 'u_rate_card', 'u_rate_card_sub_type', 'u_country', 'u_region', 'u_effective_from', 'effective_till', 'u_icb_flag', 'u_all_ibx', 'u_ibxs', 'u_excluded_ibxs', 'u_pricekva', 'u_minimum_cabinet_density', 'u_rate', 'u_amps', 'u_volt', 'u_nrc', 'u_std_ntp_non_red', 'u_std_ptp_non_red', 'u_ent_ntp_non_red', 'u_ent_ptp_non_red', 'IBX']
function rcRow(overrides = {}) {
  const row = {}
  rateCardCols.forEach(c => { row[c] = '' })
  Object.assign(row, overrides)
  return row
}

const countries = ['United States', 'United States', 'United Kingdom']
const regions = ['Americas', 'Americas', 'EMEA']
for (let i = 0; i < 55; i++) {
  const rc = rcTypes[i % rcTypes.length]
  const row = rcRow({
    u_rate_card_type: 'Equinix',
    u_rate_card: rc.sub_type.includes('Power') ? 'Power' : rc.sub_type.includes('Cabinet') || rc.sub_type.includes('Secure') ? 'Space' : rc.sub_type === 'Interconnection' ? 'Interconnection' : 'Service',
    u_rate_card_sub_type: rc.sub_type,
    u_country: countries[i % 3],
    u_region: regions[i % 3],
    u_effective_from: '2025-04-01',
    effective_till: '2026-03-31',
    u_icb_flag: false,
    u_all_ibx: true,
    u_ibxs: '',
    u_excluded_ibxs: '',
    IBX: 'DA1'
  })
  if (rc.price_field === 'u_pricekva') {
    row.u_pricekva = rc.price
    row.u_minimum_cabinet_density = rc.density || 'Standard'
  } else if (rc.price_field === 'u_rate') {
    row.u_rate = rc.price
  } else {
    row.u_nrc = rc.price
  }
  if (rc.sub_type === 'Power Install NRC') {
    row.u_amps = rc.amps || '30'
    row.u_volt = rc.volt || '208'
  }
  if (rc.sub_type === 'Equinix Precision Time') {
    row.u_std_ntp_non_red = rc.price
    row.u_std_ptp_non_red = rc.std_ptp || 60
    row.u_ent_ntp_non_red = rc.ent_ntp || 80
    row.u_ent_ptp_non_red = rc.ent_ptp || 90
  }
  rcRows.push(row)
}

// 2 rows with ICB (should be skipped in rate card validation)
rcRows.push(rcRow({
  u_rate_card_type: 'Equinix',
  u_rate_card: 'Power',
  u_rate_card_sub_type: 'Space & Power',
  u_country: 'United States',
  u_region: 'Americas',
  u_effective_from: '2025-04-01',
  effective_till: '2026-03-31',
  u_pricekva: 10,
  u_minimum_cabinet_density: 'Standard',
  u_icb_flag: true,
  u_all_ibx: true,
  u_excluded_ibxs: '',
  IBX: 'DA1'
}))
rcRows.push(rcRow({
  u_rate_card_type: 'Equinix',
  u_rate_card: 'Service',
  u_rate_card_sub_type: 'Smart Hands',
  u_country: 'United States',
  u_region: 'Americas',
  u_effective_from: '2025-04-01',
  effective_till: '2026-03-31',
  u_rate: 120,
  u_icb_flag: true,
  u_all_ibx: true,
  u_excluded_ibxs: '',
  IBX: 'DA1'
}))

const wsRc = XLSX.utils.json_to_sheet(rcRows)
const wbRc = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wbRc, wsRc, 'Sheet1')
XLSX.writeFile(wbRc, `${outDir}/Rate_Card_Test.xlsx`)
console.log('Created', `${outDir}/Rate_Card_Test.xlsx`, rcRows.length, 'rows')

console.log('\nDone. Test files:')
console.log('  - Base_Test_Invoice.xlsx: quote positive/negative + rate card scenarios (56 rows)')
console.log('  - Quote_Test.xlsx: quote line items for PO001-PO005 (55 rows)')
console.log('  - Rate_Card_Test.xlsx: rate card data for Space & Power, Smart Hands, Cabinet, etc. (57 rows)')
console.log('Upload all 3 in Excel Validation to test Passed / Failed / For Rate Card + rate card validation.')

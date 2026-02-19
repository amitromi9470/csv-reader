/**
 * Validation logic for Invoice Line Items (ILI) vs Quote Line Items (QLI).
 * Two-file mode: Base file (Invoice) + Quote file (QLI).
 */
import { validateWithRateCard } from './rateCardValidation.js'

const ILI_PO_VARIANTS = ['po_number', 'PO_NUMBER', 'PO_Number', 'Po_Number', 'PO Number', 'purchase_order']
const ILI_IBX_VARIANTS = ['IBX', 'ibx', 'site_id', 'SITE_ID']
const ILI_ITEM_CODE_VARIANTS = ['item_code', 'ITEM_NUMBER', 'item_number', 'Item_Number', 'PRODUCT_CODE', 'product_code', 'Item Code']
const ILI_DESC_VARIANTS = ['description', 'DESCRIPTION', 'Charge Description', 'CHARGE_DESCRIPTION']
const ILI_QTY_VARIANTS = ['quantity', 'QUANTITY', 'Quantity']
const ILI_UNIT_PRICE_VARIANTS = ['unit_price', ' UNIT_SELLING_PRICE ', 'UNIT_SELLING_PRICE', 'Unit Selling Price', 'unit_selling_price']
const ILI_LLA_VARIANTS = ['line_level_amount', ' LINE_LEVEL_AMOUNT ', 'LINE_LEVEL_AMOUNT', 'Line Level Amount', 'LLA']
const ILI_BILLING_FROM_VARIANTS = ['invoice_start_date', 'BILLING_FROM', 'billing_from', 'INVOICE_START_DATE', 'SERVICE_START_DATE']
const ILI_BILLING_TILL_VARIANTS = ['BILLING_TILL', 'billing_till', 'INVOICE_END_DATE', 'SERVICE_END_DATE']

const QLI_PO_VARIANTS = ['Po Number', 'PO Number', 'po_number', 'PO_NUMBER', 'PO_Number']
const QLI_SITE_VARIANTS = ['Site ID', 'Site_Id', 'IBX', 'ibx', 'site_id', 'SITE_ID']
const QLI_PRODUCT_CODE_VARIANTS = ['Item Code', 'Item_Code', 'Product Code', 'PRODUCT_CODE', 'product_code']
const QLI_CHARGE_DESC_VARIANTS = ['Item Description', 'Item_Description', 'Charge Description', 'CHARGE_DESCRIPTION']
const QLI_CHANGE_DESC_VARIANTS = ['Changed Item Description', 'Changed_Item_Description', 'Change Description', 'CHANGE_DESCRIPTION']
const QLI_QTY_VARIANTS = ['Quantity', 'quantity', 'QUANTITY']
const QLI_UNIT_PRICE_VARIANTS = ['Unit Price', 'Unit_Price', 'OTC', 'otc', 'Total OTC', 'MRC', 'mrc', 'Total MRC']
const QLI_SERVICE_START_VARIANTS = ['service_start_date', 'Service_Start_Date', 'SERVICE_START_DATE']
const QLI_INITIAL_TERM_VARIANTS = ['initial_term', 'Initial_Term', 'INITIAL_TERM', 'renewal_term']
const QLI_TERM_VARIANTS = ['term', 'Term', 'TERM', 'renewal_term', 'RENEWAL_TERM']
const QLI_INITIAL_TERM_INC_VARIANTS = ['first_Price_increment_applicable_after', 'Initial_term_Increment', 'initial_term_increment', 'Initial_Term_Increment', 'FIRST_PRICE_INC_APP_AFTER']
const QLI_INCREMENT_VARIANTS = ['price_increase_percentage', 'Increment', 'increment', 'PRICE_INCREASE_PERCENTAGE']
const QLI_CONTRACT_MONTHS_VARIANTS = ['contract_period_in_months', 'Contract_Period_In_Months', 'CONTRACT_PERIOD_IN_MONTHS']

function getValue(row, variants) {
  if (!row) return ''
  for (const v of variants) {
    const val = row[v]
    if (val !== undefined && val !== null && val !== '') return String(val).trim()
  }
  return ''
}

function getNumeric(row, variants) {
  const s = getValue(row, variants)
  if (!s) return NaN
  const cleaned = String(s).replace(/[$,]/g, '')
  return parseFloat(cleaned)
}

function parseDate(s) {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

function normalizeText(text) {
  if (!text || text === '' || text === null || text === undefined) return ''
  return text.toString()
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/[\s,]+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * Get words from text: replace non-alphanumeric with space, then split on spaces (so "item-code" and "item code" yield same words).
 */
function getWords(text) {
  if (!text || text === '' || text === null || text === undefined) return []
  const normalized = text.toString().replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
  return normalized.split(/\s+/).filter(w => w.length > 0)
}

/**
 * Score QLI description(s) against ILI description.
 * Rule: min (n-1) words of quotation (QLI) must match ILI; whichever QLI has max match count is taken.
 * Returns { passes, matchCount }: passes if at least one QLI desc (charge or change) has matchCount >= n-1 (n = words in that desc); matchCount = best count among those that pass.
 */
function getDescMatchScore(iliDesc, qliChargeDesc, qliChangeDesc) {
  const wordsIli = getWords(iliDesc)
  let bestMatchCount = 0
  let passes = false

  function scoreOne(qliDesc) {
    if (!qliDesc) return { passes: false, matchCount: 0 }
    const wordsQli = getWords(qliDesc)
    const n = wordsQli.length
    if (n === 0) return { passes: true, matchCount: 0 }
    const matchCount = wordsQli.filter(w => wordsIli.includes(w)).length
    const passesN1 = matchCount >= n - 1
    return { passes: passesN1, matchCount }
  }

  const charge = scoreOne(qliChargeDesc)
  const change = scoreOne(qliChangeDesc)
  if (charge.passes && charge.matchCount >= bestMatchCount) {
    bestMatchCount = charge.matchCount
    passes = true
  }
  if (change.passes && change.matchCount >= bestMatchCount) {
    bestMatchCount = change.matchCount
    passes = true
  }
  return { passes, matchCount: bestMatchCount }
}

/**
 * Current Unit Price (CUP) of QLI based on date rules.
 * If today < service_start_date: use Unit Price (assumption per spec "Check what to do" -> use same as initial).
 * If today < service_start_date + initial_term: CUP = Unit Price of QLI
 * If (today > service_start_date + initial_term) AND (today < service_start_date + initial_term + term): CUP = Unit Price * (1+Initial_term_Increment)
 * If today > service_start_date + initial_term + term: CUP = Unit Price * (1+Initial_term_Increment) * (1+Increment)^num_completed_terms
 */
function getCUP(quoteItem, today) {
  const unitPrice = getNumeric(quoteItem, QLI_UNIT_PRICE_VARIANTS)
  if (isNaN(unitPrice) || unitPrice <= 0) return NaN

  const serviceStart = parseDate(getValue(quoteItem, QLI_SERVICE_START_VARIANTS))
  const initialTermMonths = getNumeric(quoteItem, QLI_INITIAL_TERM_VARIANTS)
  const initialTerm = isNaN(initialTermMonths) || initialTermMonths <= 0 ? 12 : initialTermMonths
  const termMonths = getNumeric(quoteItem, QLI_TERM_VARIANTS)
  const term = isNaN(termMonths) || termMonths <= 0 ? 12 : termMonths
  const initialTermIncrement = getNumeric(quoteItem, QLI_INITIAL_TERM_INC_VARIANTS) / 100 || 0
  const increment = getNumeric(quoteItem, QLI_INCREMENT_VARIANTS) / 100 || 0

  if (!serviceStart) return unitPrice

  const addMonths = (d, m) => {
    const x = new Date(d)
    x.setMonth(x.getMonth() + m)
    return x
  }

  const endInitial = addMonths(serviceStart, initialTerm)
  const endFirstTerm = addMonths(endInitial, term)

  if (today < serviceStart) return unitPrice
  if (today < endInitial) return unitPrice
  if (today < endFirstTerm) return unitPrice * (1 + (initialTermIncrement || 0))

  const numCompletedTerms = Math.floor((today - endInitial) / (term * 30.44 * 24 * 60 * 60 * 1000)) || 0
  return unitPrice * (1 + (initialTermIncrement || 0)) * Math.pow(1 + (increment || 0), numCompletedTerms)
}

/**
 * Prorata factor: (billing_till - billing_from) / total_days_in_month
 */
function getPF(ili, billingFrom, billingTill) {
  const from = parseDate(billingFrom) || parseDate(getValue(ili, ILI_BILLING_FROM_VARIANTS))
  const till = parseDate(billingTill) || parseDate(getValue(ili, ILI_BILLING_TILL_VARIANTS))
  if (!from || !till) return 1
  const daysInMonth = new Date(from.getFullYear(), from.getMonth() + 1, 0).getDate()
  const days = Math.max(0, (till - from) / (24 * 60 * 60 * 1000)) + 1
  return Math.min(1, days / daysInMonth)
}

/**
 * Get PO number for an ILI (from line or invoice mapping). In 2-file mode, PO is on the line.
 */
export function getILIPO(ili) {
  return getValue(ili, ILI_PO_VARIANTS)
}

export function getILIIBX(ili) {
  return getValue(ili, ILI_IBX_VARIANTS)
}

export function getILIItemCode(ili) {
  return getValue(ili, ILI_ITEM_CODE_VARIANTS)
}

export function getILIDescription(ili) {
  return getValue(ili, ILI_DESC_VARIANTS)
}

export function getILIQuantity(ili) {
  return getNumeric(ili, ILI_QTY_VARIANTS)
}

export function getILIUnitPrice(ili) {
  return getNumeric(ili, ILI_UNIT_PRICE_VARIANTS)
}

export function getILILLA(ili) {
  return getNumeric(ili, ILI_LLA_VARIANTS)
}

export function getQLIPO(qli) {
  return getValue(qli, QLI_PO_VARIANTS)
}

export function getQLISiteId(qli) {
  return getValue(qli, QLI_SITE_VARIANTS)
}

export function getQLIProductCode(qli) {
  return getValue(qli, QLI_PRODUCT_CODE_VARIANTS)
}

export function getQLIChargeDesc(qli) {
  return getValue(qli, QLI_CHARGE_DESC_VARIANTS)
}

export function getQLIChangeDesc(qli) {
  return getValue(qli, QLI_CHANGE_DESC_VARIANTS)
}

export function getQLIQuantity(qli) {
  return getNumeric(qli, QLI_QTY_VARIANTS)
}

/**
 * Index quote data by PO for fast lookup.
 */
export function indexQuotesByPO(quoteData) {
  const byPO = {}
  for (const row of quoteData || []) {
    const po = getQLIPO(row)
    if (!po) continue
    const key = po.toUpperCase()
    if (!byPO[key]) byPO[key] = []
    byPO[key].push(row)
  }
  return byPO
}

/**
 * Single ILI validation against a list of QLIs. Returns { result, remarks, matchedQLI }.
 * result: 'validated' | 'failed' | null (continue to next QLI)
 */
export function validateILIAgainstQLIs(ili, qlis, options) {
  const {
    priceTolerance = 0.05,
    qtyTolerance = 0.20,
    today = new Date()
  } = options || {}

  const po = getILIPO(ili)
  const ibx = getILIIBX(ili)
  const itemCode = getILIItemCode(ili)
  const chargeDesc = getILIDescription(ili)
  let quantity = getILIQuantity(ili)
  let unitPrice = getILIUnitPrice(ili)
  let lla = getILILLA(ili)

  if (isNaN(quantity)) quantity = 0
  if (isNaN(unitPrice)) unitPrice = NaN
  if (isNaN(lla)) lla = NaN

  // If Unit Price and LLA are zero -> validated, exit (no charge)
  if (unitPrice === 0 && lla === 0) {
    return { result: 'validated', remarks: 'Unit Price and LLA are zero; no charge.', matchedQLI: null }
  }

  // If Unit Price missing but LLA & Quantity present: Unit Price = LLA / Quantity
  if ((isNaN(unitPrice) || unitPrice === 0) && !isNaN(lla) && quantity > 0) {
    unitPrice = lla / quantity
  }

  // 1) Build candidates: QLIs that pass IBX and (product code includes OR description min n-1 match)
  // 2) Take the QLI with max description match count for further validation (unit price, quantity)
  const candidates = []

  for (const qli of qlis || []) {
    const qliSite = getQLISiteId(qli)
    if (qliSite && ibx && qliSite.toUpperCase() !== ibx.toUpperCase()) continue

    const qliProductCode = getQLIProductCode(qli)
    const qliChargeDesc = getQLIChargeDesc(qli)
    const qliChangeDesc = getQLIChangeDesc(qli)

    let productMatch = false
    if (itemCode && qliProductCode) {
      const ni = normalizeText(itemCode)
      const nq = normalizeText(qliProductCode)
      productMatch = ni.includes(nq) || nq.includes(ni)
    }

    const descScore = getDescMatchScore(chargeDesc, qliChargeDesc, qliChangeDesc)
    const descPass = descScore.passes  // min n-1 of quotation words match

    const passesProductOrDesc = productMatch || (descPass && (!itemCode || !qliProductCode))
    if (!passesProductOrDesc) continue

    // Use description match count to rank; product-only match use 0 or desc score for tie-break
    const matchCount = productMatch ? (descScore.matchCount || 0) : descScore.matchCount
    candidates.push({ qli, matchCount })
  }

  if (candidates.length === 0) return { result: null, remarks: '', matchedQLI: null }

  // Whichever QLI has max description match count is taken for further validation
  let best = candidates[0]
  for (let i = 1; i < candidates.length; i++) {
    if (candidates[i].matchCount > best.matchCount) best = candidates[i]
  }
  const qli = best.qli

  // 3) Unit Price and LLA (only on selected QLI)
  const cup = getCUP(qli, today)
  if (isNaN(cup) || cup <= 0) {
    return { result: null, remarks: '', matchedQLI: null }
  }

  const pf = getPF(ili)
  if (unitPrice > cup * (1 + priceTolerance)) {
    return { result: 'failed', remarks: `Unit price ${unitPrice.toFixed(2)} exceeds CUP*(1+tolerance)=${(cup * (1 + priceTolerance)).toFixed(2)}`, matchedQLI: qli }
  }

  const qtyILI = quantity
  const ella = cup * qtyILI * pf
  if (!isNaN(lla) && lla > ella * (1 + priceTolerance)) {
    return { result: 'failed', remarks: `LLA ${lla.toFixed(2)} exceeds ELLA*(1+tolerance)=${(ella * (1 + priceTolerance)).toFixed(2)}`, matchedQLI: qli }
  }

  // 4) Quantity: ILI quantity vs QLI quantity with tolerance (no cumulative check)
  const qliQty = getQLIQuantity(qli)
  if (isNaN(qliQty) || qliQty <= 0) {
    return { result: null, remarks: '', matchedQLI: null }
  }

  if (qtyILI > qliQty * (1 + qtyTolerance)) {
    return { result: 'failed', remarks: `Quantity ${qtyILI} exceeds quote quantity ${qliQty} * (1+${(qtyTolerance * 100).toFixed(0)}%)`, matchedQLI: qli }
  }

  return { result: 'validated', remarks: 'All validations passed.', matchedQLI: qli }
}

/**
 * Full validation: for each ILI, get PO -> find QLIs -> run validateILIAgainstQLIs.
 * If result is "For Rate Card Validation" and rateCardData + rateCardConfig provided, run rate card validation.
 * Returns array of { row, serial_number, line_number, trx_number, po_number, ibx, validation_result, remarks, ... }
 */
export function runValidation(baseData, quoteData, options = {}) {
  const results = []
  const byPO = indexQuotesByPO(quoteData)
  let passedCount = 0
  let failedCount = 0
  let rateCardCount = 0

  for (let i = 0; i < (baseData || []).length; i++) {
    const ili = baseData[i]
    const rowNumber = i + 1
    const po = getILIPO(ili)
    const key = (po || '').toUpperCase()
    const qlis = byPO[key] || []

    const serialNumber = getValue(ili, ['SERIAL_NUMBER', 'serial_number'])
    const lineNumber = getValue(ili, ['LINE_NUMBER', 'line_number'])
    const trxNumber = getValue(ili, ['invoice_number', 'TRX_NUMBER', 'trx_number', 'Invoice Number'])

    const baseResult = {
      row: rowNumber,
      serial_number: serialNumber,
      line_number: lineNumber,
      trx_number: trxNumber,
      po_number: po,
      ibx: getILIIBX(ili),
      unit_price: getILIUnitPrice(ili),
      quantity: getILIQuantity(ili),
      lla: getILILLA(ili),
      ili_description: getILIDescription(ili),
      validation_result: '',
      remarks: ''
    }

    if (qlis.length === 0) {
      baseResult.validation_result = 'For Rate Card Validation'
      baseResult.remarks = 'No matching quote line items for this PO number.'
      rateCardCount++
      results.push(baseResult)
      continue
    }

    const { result, remarks, matchedQLI } = validateILIAgainstQLIs(ili, qlis, options)
    baseResult.remarks = remarks
    if (matchedQLI) {
      baseResult.qli_po_number = getQLIPO(matchedQLI)
      baseResult.qli_site_id = getQLISiteId(matchedQLI)
      baseResult.qli_quantity = getQLIQuantity(matchedQLI)
      baseResult.qli_unit_price = getNumeric(matchedQLI, QLI_UNIT_PRICE_VARIANTS)
      baseResult.qli_description = getQLIChargeDesc(matchedQLI)
    }

    if (result === 'validated') {
      baseResult.validation_result = 'Passed'
      passedCount++
    } else if (result === 'failed') {
      baseResult.validation_result = 'Failed'
      failedCount++
    } else {
      baseResult.validation_result = 'For Rate Card Validation'
      baseResult.remarks = baseResult.remarks || 'No QLI matched (IBX/product/charge/price/quantity).'
      rateCardCount++
    }
    results.push(baseResult)
  }

  // Rate card validation: for each "For Rate Card Validation" line, if rate card data and config provided, validate
  const rateCardData = options.rateCardData
  const rateCardConfig = options.rateCardConfig
  if (rateCardData && rateCardConfig && Array.isArray(rateCardConfig) && rateCardConfig.length > 0) {
    for (let i = 0; i < results.length; i++) {
      if (results[i].validation_result !== 'For Rate Card Validation') continue
      const ili = baseData[i]
      const rcResult = validateWithRateCard(ili, rateCardData, rateCardConfig, {
        priceTolerance: options.priceTolerance != null ? options.priceTolerance : 0.05
      })
      results[i].remarks = rcResult.remarks
      if (rcResult.result === 'validated') {
        results[i].validation_result = 'Passed'
        rateCardCount--
        passedCount++
      } else if (rcResult.result === 'failed') {
        results[i].validation_result = 'Failed'
        rateCardCount--
        failedCount++
      }
      // skipped: remains "For Rate Card Validation"
    }
  }

  return {
    status: 'completed',
    totalLines: (baseData || []).length,
    passedCount,
    failedCount,
    rateCardCount,
    validationResults: results,
    timestamp: new Date().toISOString()
  }
}

/**
 * Rate card validation for "For Rate Card Validation" lines (OOS / no quote match).
 * Mirrors ServiceNow RateCardDataHandlerUtils (validateWithRateCardForOOS, findRateCard1, fetchRateCard,
 * checkExactRateCardEntry, completeQuery, checkRateCardType). Uses rate-card-types.json (key_to_identify_Rate_Card_Types).
 *
 * Rules:
 * - ILI service_start_date must fall within global effective window (April 1, 2025 – March 31, 2026).
 * - If Unit Price missing but LLA & Quantity present: Unit Price = LLA / Quantity
 * - Rate card is found by: type (charge_description) + country + region + u_effective_from <= service_start_date < effective_till + IBX (u_all_ibx/u_ibxs/u_excluded_ibxs).
 * - CUP = Unit Price of RLI (rate card line). If both 0 → Pass; if ILI unit price > CUP * (1 + tolerance) → Failed.
 */

// Global effective date range: ILI service_start_date must fall within this window for rate card validation
const EFFECTIVE_FROM_GLOBAL = '2025-04-01'  // April 1, 2025
const EFFECTIVE_TILL_GLOBAL = '2026-03-31'   // March 31, 2026

const ILI_DESC_VARIANTS = ['description', 'charge_description', 'CHARGE_DESCRIPTION', 'DESCRIPTION']
const ILI_SERVICE_START_VARIANTS = ['service_start_date', 'SERVICE_START_DATE', 'Service_Start_Date', 'invoice_start_date']
const ILI_COUNTRY_VARIANTS = ['country', 'COUNTRY', 'Country']
const ILI_REGION_VARIANTS = ['region', 'REGION', 'Region']
const ILI_IBX_VARIANTS = ['IBX', 'ibx', 'ibx_center', 'IBX_CENTER']

const RC_SUB_TYPE_VARIANTS = ['u_rate_card_sub_type', 'rate_card_sub_type', 'Rate Card Sub Type']
const RC_COUNTRY_VARIANTS = ['u_country', 'country', 'Country']
const RC_REGION_VARIANTS = ['u_region', 'region', 'Region']
const RC_EFFECTIVE_FROM_VARIANTS = ['u_effective_from', 'effective_from', 'Effective From']
const RC_EFFECTIVE_TILL_VARIANTS = ['effective_till', 'effective_to', 'Effective Till']
const RC_PRICE_KVA_VARIANTS = ['u_pricekva', 'pricekva', 'Price per kVA']
const RC_RATE_VARIANTS = ['u_rate', 'rate', 'Rate']
const RC_NRC_VARIANTS = ['u_nrc', 'nrc', 'NRC']
const RC_ICB_FLAG_VARIANTS = ['u_icb_flag', 'icb_flag', 'ICB Flag']
const RC_U_SUBKEYS_VARIANTS = ['u_subkeys', 'Subkey', 'subkeys', 'subkey', 'U_SUBKEYS']
const RC_STD_NTP_VARIANTS = ['u_std_ntp_non_red', 'std_ntp_non_red']
const RC_STD_PTP_VARIANTS = ['u_std_ptp_non_red', 'std_ptp_non_red']
const RC_ENT_NTP_VARIANTS = ['u_ent_ntp_non_red', 'ent_ntp_non_red']
const RC_ENT_PTP_VARIANTS = ['u_ent_ptp_non_red', 'ent_ptp_non_red']

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

function getIliChargeDesc(ili) {
  return getValue(ili, ILI_DESC_VARIANTS)
}

function getIliServiceStart(ili) {
  return getValue(ili, ILI_SERVICE_START_VARIANTS)
}

function getIliCountry(ili) {
  return getValue(ili, ILI_COUNTRY_VARIANTS)
}

function getIliRegion(ili) {
  return getValue(ili, ILI_REGION_VARIANTS)
}

function getIliIbx(ili) {
  return getValue(ili, ILI_IBX_VARIANTS)
}

/**
 * Check if ILI service_start_date falls within the global effective window (April 1, 2025 – March 31, 2026).
 */
function isServiceStartInEffectiveWindow(serviceStartDate) {
  if (!serviceStartDate) return false
  const d = parseDate(serviceStartDate)
  if (!d) return false
  const from = parseDate(EFFECTIVE_FROM_GLOBAL)
  const till = parseDate(EFFECTIVE_TILL_GLOBAL)
  if (!from || !till) return true
  return d.getTime() >= from.getTime() && d.getTime() <= till.getTime()
}

/**
 * IBX filter (mirrors completeQuery/determineIBXQuery): rate card row must apply to ILI's IBX.
 * - u_all_ibx = false: u_ibxs must contain ILI IBX (comma-separated list or single value).
 * - u_all_ibx = true and u_excluded_ibxs non-empty: ILI IBX must NOT be in u_excluded_ibxs.
 * - u_all_ibx = true and u_excluded_ibxs empty: applies to all IBX.
 */
function rateCardAppliesToIbx(rcRow, iliIbx) {
  if (!iliIbx) return true
  const allIbx = getRcValue(rcRow, 'u_all_ibx').toLowerCase()
  const isAllIbx = allIbx === 'true' || allIbx === '1' || allIbx === 'yes'
  if (!isAllIbx) {
    const ibxs = getRcValue(rcRow, 'u_ibxs')
    if (!ibxs) return false
    const list = ibxs.split(',').map(s => s.trim().toUpperCase())
    return list.includes(iliIbx.toUpperCase())
  }
  const excluded = getRcValue(rcRow, 'u_excluded_ibxs')
  if (!excluded) return true
  const excludedList = excluded.split(',').map(s => s.trim().toUpperCase())
  return !excludedList.includes(iliIbx.toUpperCase())
}

/**
 * Fixed order for evaluating rate card categories (first match wins).
 * Must match order in rate-card-types.json.
 */
const CATEGORY_ORDER = [
  'space_and_power',
  'power_install_nrc',
  'secure_cabinet_express',
  'cabinet_install_nrc',
  'interconnection',
  'smart_hands',
  'equinix_precision_time'
]

/**
 * Maps category key to subType / rcType / rc for rate card row filtering.
 * JSON does not contain these; they are fixed per category.
 */
const CATEGORY_META = {
  space_and_power: { subType: 'Space & Power', rcType: 'Power', rc: 'Power' },
  power_install_nrc: { subType: 'Power Install NRC', rcType: 'Power', rc: 'Power' },
  secure_cabinet_express: { subType: 'Secure Cabinet Express', rcType: 'Space', rc: 'Space' },
  cabinet_install_nrc: { subType: 'Cabinet Install NRC', rcType: 'Space', rc: 'Space' },
  interconnection: { subType: 'Interconnection', rcType: 'Interconnection', rc: 'Interconnection' },
  smart_hands: { subType: 'Smart Hands', rcType: 'Service', rc: 'Service' },
  equinix_precision_time: { subType: 'Equinix Precision Time', rcType: 'Service', rc: 'Service' }
}

/**
 * Match charge_description against one category's entries from rate-card-types.json.
 * Case-insensitive substring match. No regex, no tokenizing.
 * - Key matched AND (no subkey or subkey matched) → return full match { keyObj, key, subkey?, fields }.
 * - Key matched BUT subkey defined and NOT matched → return { ambiguous: true } (do not validate).
 * - No key matched → return null.
 * First matching entry wins.
 */
function matchChargeDescriptionToCategory(chargeDesc, entries) {
  if (!chargeDesc || !entries || !Array.isArray(entries)) return null
  const descLower = String(chargeDesc).toLowerCase()
  for (let i = 0; i < entries.length; i++) {
    const item = entries[i]
    const key = (item.key || '').trim()
    if (!key) continue
    const keyLower = key.toLowerCase()
    if (descLower.indexOf(keyLower) === -1) continue
    const subkeyArr = item.subkey && Array.isArray(item.subkey) ? item.subkey : []
    if (subkeyArr.length === 0) {
      return { keyObj: item, key: item.key, fields: item.fields || [] }
    }
    let subkeyMatched = false
    let matchedSubkey = null
    for (let j = 0; j < subkeyArr.length; j++) {
      const sk = (subkeyArr[j] || '').trim().toLowerCase()
      if (sk && descLower.indexOf(sk) !== -1) {
        subkeyMatched = true
        matchedSubkey = subkeyArr[j]
        break
      }
    }
    if (!subkeyMatched) return { ambiguous: true }
    return { keyObj: item, key: item.key, subkey: matchedSubkey, fields: item.fields || [] }
  }
  return null
}

/**
 * Get entries array for a category from configArray (array of { [categoryKey]: entries }).
 */
function getCategoryEntries(configArray, categoryKey) {
  if (!configArray || !Array.isArray(configArray)) return []
  const obj = configArray.find(o => o[categoryKey] != null)
  return obj && Array.isArray(obj[categoryKey]) ? obj[categoryKey] : []
}

function getRcValue(rcRow, fieldName) {
  const v = rcRow[fieldName]
  if (v !== undefined && v !== null && v !== '') return String(v).trim()
  const lower = fieldName.toLowerCase().trim()
  for (const k of Object.keys(rcRow || {})) {
    if (String(k).trim().toLowerCase() === lower) return String(rcRow[k]).trim()
  }
  return ''
}

/**
 * Check that all required fields from rate card row appear in charge_description.
 */
function checkExactRateCardEntry(rcRow, chargeDesc, fieldArr) {
  if (!fieldArr || fieldArr.length === 0) return true
  const descLower = (chargeDesc || '').toLowerCase()
  for (let j = 0; j < fieldArr.length; j++) {
    const value = getRcValue(rcRow, fieldArr[j]).toLowerCase()
    if (value && descLower.indexOf(value) === -1) return false
  }
  return true
}

/**
 * Find rate card by matching charge_description against rate-card-types.json (configArray).
 * Categories evaluated in CATEGORY_ORDER (first match wins). Key + subkey match required when subkey defined;
 * key-only with subkey defined → ambiguous, skip. Field-based validation: charge_description must contain
 * each rate card field value when "fields" is defined.
 */
function findRateCard(ili, rateCardData, configArray) {
  const serviceStart = getIliServiceStart(ili)
  if (!serviceStart) return null
  const serviceStartDate = parseDate(serviceStart)
  if (!serviceStartDate) return null

  const country = getIliCountry(ili)
  const region = getIliRegion(ili)
  const chargeDesc = getIliChargeDesc(ili)
  const iliIbx = getIliIbx(ili)

  for (let t = 0; t < CATEGORY_ORDER.length; t++) {
    const categoryKey = CATEGORY_ORDER[t]
    const entries = getCategoryEntries(configArray, categoryKey)
    if (entries.length === 0) continue

    const match = matchChargeDescriptionToCategory(chargeDesc, entries)
    if (!match) continue
    if (match.ambiguous) continue

    const meta = CATEGORY_META[categoryKey]
    if (!meta) continue
    const subType = meta.subType

    const matchedSubkey = match.subkey
    const candidates = (rateCardData || []).filter(rc => {
      const rcSub = getRcValue(rc, 'u_rate_card_sub_type') || getRcValue(rc, 'rate_card_sub_type')
      if (rcSub !== subType) return false
      const rcSubkeys = getValue(rc, RC_U_SUBKEYS_VARIANTS)
      if (rcSubkeys && matchedSubkey) {
        const subkeyList = rcSubkeys.split(',').map(s => s.trim().toLowerCase())
        const matchedLower = String(matchedSubkey).trim().toLowerCase()
        if (!subkeyList.includes(matchedLower)) return false
      }
      const rcCountry = getRcValue(rc, 'u_country') || getRcValue(rc, 'country')
      if (country && rcCountry && rcCountry !== country) return false
      const rcRegion = getRcValue(rc, 'u_region') || getRcValue(rc, 'region')
      if (region && rcRegion && rcRegion !== region) return false
      const effFrom = parseDate(getRcValue(rc, 'u_effective_from') || getRcValue(rc, 'effective_from'))
      const effTill = parseDate(getRcValue(rc, 'effective_till') || getRcValue(rc, 'effective_to'))
      if (effFrom && serviceStartDate < effFrom) return false
      if (effTill && serviceStartDate >= effTill) return false
      if (!rateCardAppliesToIbx(rc, iliIbx)) return false
      return true
    })

    const fieldArr = match.fields || []
    for (let c = 0; c < candidates.length; c++) {
      const rc = candidates[c]
      if (getRcValue(rc, 'u_icb_flag') === 'true' || rc.u_icb_flag === true) continue
      if (!checkExactRateCardEntry(rc, chargeDesc, fieldArr)) continue
      return { rc, subType, matchedSubkey: matchedSubkey || null, match: { keyObj: match.keyObj } }
    }
  }
  return null
}

/**
 * Get unit price from rate card row by sub type (and charge desc for Precision Time).
 */
function getRateCardUnitPrice(rcRow, subType, chargeDesc) {
  const desc = (chargeDesc || '').toLowerCase()
  switch (subType) {
    case 'Space & Power':
      return getNumeric(rcRow, RC_PRICE_KVA_VARIANTS)
    case 'Power Install NRC':
      return getNumeric(rcRow, RC_RATE_VARIANTS)
    case 'Secure Cabinet Express':
      return getNumeric(rcRow, RC_PRICE_KVA_VARIANTS)
    case 'Cabinet Install NRC':
      return getNumeric(rcRow, RC_NRC_VARIANTS)
    case 'Interconnection':
      return getNumeric(rcRow, RC_NRC_VARIANTS)
    case 'Smart Hands':
      return getNumeric(rcRow, RC_RATE_VARIANTS)
    case 'Equinix Precision Time':
      if (desc.indexOf('standard') !== -1) {
        if (desc.indexOf('ntp') !== -1) return getNumeric(rcRow, RC_STD_NTP_VARIANTS)
        if (desc.indexOf('ptp') !== -1) return getNumeric(rcRow, RC_STD_PTP_VARIANTS)
      } else if (desc.indexOf('enterprise') !== -1) {
        if (desc.indexOf('ntp') !== -1) return getNumeric(rcRow, RC_ENT_NTP_VARIANTS)
        if (desc.indexOf('ptp') !== -1) return getNumeric(rcRow, RC_ENT_PTP_VARIANTS)
      }
      return getNumeric(rcRow, RC_STD_NTP_VARIANTS) || getNumeric(rcRow, RC_RATE_VARIANTS)
    default:
      return getNumeric(rcRow, RC_RATE_VARIANTS) || getNumeric(rcRow, RC_NRC_VARIANTS) || getNumeric(rcRow, RC_PRICE_KVA_VARIANTS)
  }
}

/**
 * Validate ILI against rate card with tolerance.
 * - If service_start_date missing → skipped (remain For Rate Card)
 * - If no rate card found → skipped
 * - If ICB → skipped
 * - If both ILI unit price and RLI (CUP) are 0 → Pass
 * - If ILI unit price > CUP * (1 + tolerance) → Failed
 * - Else → Pass
 */
export function validateWithRateCard(ili, rateCardData, configArray, options = {}) {
  const priceTolerance = options.priceTolerance != null ? options.priceTolerance : 0.05

  const serviceStart = getIliServiceStart(ili)
  if (!serviceStart) {
    return {
      result: 'skipped',
      remarks: 'Out-of-Scope Item. Service Start Date is missing. This Line Item will be handled manually. Validation has been skipped.'
    }
  }
  const serviceStartDate = parseDate(serviceStart)
  if (!serviceStartDate) {
    return {
      result: 'skipped',
      remarks: 'Out-of-Scope Item. Service Start Date is invalid. This Line Item will be handled manually. Validation has been skipped.'
    }
  }
  if (!isServiceStartInEffectiveWindow(serviceStart)) {
    return {
      result: 'skipped',
      remarks: `Out-of-Scope Item. Service Start Date (${serviceStart}) does not fall within the rate card effective window (${EFFECTIVE_FROM_GLOBAL} to ${EFFECTIVE_TILL_GLOBAL}). This Line Item will be handled manually. Validation has been skipped.`
    }
  }

  let invPrice = getNumeric(ili, ['unit_price', ' UNIT_SELLING_PRICE ', 'UNIT_SELLING_PRICE', 'unit_selling_price', 'Unit Price'])
  const lla = getNumeric(ili, ['line_level_amount', ' LINE_LEVEL_AMOUNT ', 'LINE_LEVEL_AMOUNT', 'lla', 'Line Level Amount'])
  const qty = getNumeric(ili, ['quantity', 'QUANTITY', 'Quantity'])
  if ((isNaN(invPrice) || invPrice === 0) && !isNaN(lla) && qty > 0) {
    invPrice = lla / qty
  }
  if (isNaN(invPrice)) invPrice = 0

  const found = findRateCard(ili, rateCardData, configArray)
  if (!found) {
    return {
      result: 'skipped',
      remarks: 'Out-of-Scope Item. This line item is not a part of the contract; and no rate card reference is available to validate the price. Validation has been skipped due to missing rate card information. This Line item will be handled manually.'
    }
  }

  const { rc, subType } = found
  const chargeDesc = getIliChargeDesc(ili)
  const cup = getRateCardUnitPrice(rc, subType, chargeDesc)

  const rcFields = {
    rc_u_rate_card_type: getRcValue(rc, 'u_rate_card_type'),
    rc_u_rate_card: getRcValue(rc, 'u_rate_card'),
    rc_u_rate_card_sub_type: subType || getRcValue(rc, 'u_rate_card_sub_type'),
    rc_u_subkeys: getValue(rc, RC_U_SUBKEYS_VARIANTS),
    rc_u_effective_from: getRcValue(rc, 'u_effective_from'),
    rc_effective_till: getRcValue(rc, 'effective_till'),
    rc_u_country: getRcValue(rc, 'u_country'),
    rc_u_region: getRcValue(rc, 'u_region'),
    rc_unit_price_used: isNaN(cup) ? '' : cup,
    rc_u_pricekva: getRcValue(rc, 'u_pricekva') ? (getNumeric(rc, RC_PRICE_KVA_VARIANTS) || '') : '',
    rc_u_rate: getRcValue(rc, 'u_rate') ? (getNumeric(rc, RC_RATE_VARIANTS) || '') : '',
    rc_u_nrc: getRcValue(rc, 'u_nrc') ? (getNumeric(rc, RC_NRC_VARIANTS) || '') : '',
    rc_u_minimum_cabinet_density: getRcValue(rc, 'u_minimum_cabinet_density'),
    rc_u_icb_flag: getRcValue(rc, 'u_icb_flag')
  }

  if (getRcValue(rc, 'u_icb_flag') === 'true' || rc.u_icb_flag === true) {
    return {
      result: 'skipped',
      remarks: 'Out-of-Scope Item. Rate card reference is available with ICB. This Line Item will be handled manually. Validation has been skipped.',
      ...rcFields
    }
  }

  // Smart Hands: skip MRC/monthly
  if (subType === 'Smart Hands' && (chargeDesc.toLowerCase().indexOf('mrc') > -1 || chargeDesc.toLowerCase().indexOf('monthly') > -1)) {
    return { result: 'skipped', remarks: 'Smart Hands MRC/monthly - skipped.', ...rcFields }
  }

  if (isNaN(cup)) {
    return { result: 'skipped', remarks: 'Rate card unit price not found for this sub type.', ...rcFields }
  }

  // Both 0 → Pass
  if (invPrice === 0 && cup === 0) {
    return { result: 'validated', remarks: 'Both ILI and rate card unit price are zero; validation passed.', ...rcFields }
  }

  // If ILI unit price > CUP * (1 + tolerance) → Failed
  if (invPrice > cup * (1 + priceTolerance)) {
    return {
      result: 'failed',
      remarks: `Rate card validation failed. Invoice unit price ${invPrice.toFixed(2)} exceeds rate card price ${cup.toFixed(2)} * (1+${(priceTolerance * 100).toFixed(0)}%) = ${(cup * (1 + priceTolerance)).toFixed(2)}.`,
      ...rcFields
    }
  }

  return { result: 'validated', remarks: 'Rate card validation passed.', ...rcFields }
}

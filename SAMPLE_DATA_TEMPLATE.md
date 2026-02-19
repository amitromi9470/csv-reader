# Sample Data Templates for Testing

## Quick Test Files

Create these three Excel files for testing the validation:

---

## File 1: Invoice_Line_Items.xlsx

| SERIAL_NUMBER | LINE_NUMBER | TRX_NUMBER | site_id | unit_selling_price | quantity | description | item_code |
|---------------|-------------|------------|---------|-------------------|----------|-------------|-----------|
| SN-123 | 1 | INV-2024-001 | SV1 | 1500.00 | 2 | Power Distribution Unit 10kW | PWR-001 |
| SN-123 | 2 | INV-2024-001 | SV1 | 2500.00 | 1 | Network Switch 48 Port | NET-001 |
| SN-456 | 1 | INV-2024-002 | NY1 | 3000.00 | 3 | Cooling Unit 20kW | COOL-001 |
| SN-456 | 2 | INV-2024-002 | NY1 | 1800.00 | 5 | Server Cabinet 42U | CAB-001 |
| SN-789 | 1 | INV-2024-003 | LA1 | 5000.00 | 1 | Router Enterprise | RTR-001 |

**Test Cases:**
- Row 1: Should PASS (price and qty match quote)
- Row 2: Should PASS (price and qty match quote)
- Row 3: Should FAIL if price different in quote
- Row 4: Should FAIL if qty exceeds quote
- Row 5: Should SKIP if no quote data

---

## File 2: Invoice_PO_Mapping.xlsx

| TRX_NUMBER | PO_NUMBER |
|------------|-----------|
| INV-2024-001 | PO-2024-100 |
| INV-2024-002 | PO-2024-101 |

**Note:** INV-2024-003 intentionally missing to test "No PO Found" scenario

---

## File 3: Quotation_Line_Items.xlsx

| site_id | po_number | mrc | otc | quantity | item_description | item_code |
|---------|-----------|-----|-----|----------|------------------|-----------|
| SV1 | PO-2024-100 | 1500.00 | - | 5 | Power Distribution | PWR-001 |
| SV1 | PO-2024-100 | - | 2500.00 | 3 | Network Switch | NET-001 |
| NY1 | PO-2024-101 | 2800.00 | - | 3 | Cooling Unit | COOL-001 |
| NY1 | PO-2024-101 | - | 1800.00 | 2 | Server Cabinet | CAB-001 |

**Test Cases:**
- SV1/PWR-001: Invoice qty (2) < Quote qty (5) → PASS
- SV1/NET-001: Invoice qty (1) < Quote qty (3) → PASS
- NY1/COOL-001: Invoice price (3000) ≠ Quote price (2800) → FAIL
- NY1/CAB-001: Invoice qty (5) > Quote qty (2) → FAIL

---

## Expected Validation Results

### Row 1: SN-123, Line 1, INV-2024-001
- **Status:** ✅ Validation Passed
- **Reason:** Price matches ($1500), Quantity (2) within limit (5)

### Row 2: SN-123, Line 2, INV-2024-001
- **Status:** ✅ Validation Passed
- **Reason:** Price matches ($2500), Quantity (1) within limit (3)

### Row 3: SN-456, Line 1, INV-2024-002
- **Status:** ❌ Validation Failed
- **Reason:** Price mismatch - Invoice: $3000, Quote: $2800

### Row 4: SN-456, Line 2, INV-2024-002
- **Status:** ❌ Validation Failed
- **Reason:** Quantity exceeded - Invoice: 5, Quote: 2

### Row 5: SN-789, Line 1, INV-2024-003
- **Status:** ⚠️ Skipped
- **Reason:** No PO Number found for INV-2024-003

---

## Summary Statistics Expected

- **Total Lines:** 5
- **Passed:** 2
- **Failed:** 2
- **Skipped:** 1

---

## Advanced Test Scenarios

### Test Price Matching Logic

**MRC vs OTC:**
- If MRC has value → Use MRC
- If MRC is empty/'-'/'--' and OTC has value → Use OTC
- If both invalid → Skip

### Test Description Matching

**Fuzzy Matching:**
```
Invoice: "Power Distribution Unit 10kW"
Quote:   "Power Distribution"
Result:  Match ✓ (invoice description contains quote description)
```

### Test Special Characters

**Normalization:**
```
Invoice: "Network-Switch (48-Port) #001"
Quote:   "NetworkSwitch48Port001"
Result:  Match ✓ (special chars removed before comparison)
```

### Test Case Sensitivity

**Case Insensitive:**
```
Invoice: "POWER DISTRIBUTION"
Quote:   "power distribution"
Result:  Match ✓ (compared in lowercase)
```

---

## Creating Your Test Files

### Option 1: Excel
1. Open Excel
2. Create new workbook for each file
3. Copy the table structure above
4. Paste values
5. Save as .xlsx

### Option 2: Google Sheets
1. Create three Google Sheets
2. Copy table data
3. Download as Excel (.xlsx)

### Option 3: CSV
You can also use CSV format:
- Same column structure
- Save as .csv instead of .xlsx
- Upload works the same way

---

## Tips for Real Data

### Column Names
- Use consistent naming
- Avoid spaces in column names (use underscores)
- Keep names simple and descriptive

### Data Quality
- Remove currency symbols ($, €, etc.)
- Remove commas from numbers
- Ensure dates are in consistent format
- Check for typos in item codes

### File Organization
- Keep files in same folder
- Use descriptive file names
- Date your files (e.g., Invoice_2024_02_16.xlsx)

---

## Validation Checklist

Before uploading files, verify:

**Main File (Invoice):**
- [ ] Has SERIAL_NUMBER
- [ ] Has LINE_NUMBER
- [ ] Has TRX_NUMBER (Invoice Number)
- [ ] Has site_id
- [ ] Has unit_selling_price (numeric)
- [ ] Has quantity (numeric)
- [ ] Has description or item_code

**Reference File 1 (Invoice-PO Mapping):**
- [ ] Has TRX_NUMBER
- [ ] Has PO_NUMBER
- [ ] Every invoice has a PO mapping

**Reference File 2 (Quotation):**
- [ ] Has site_id
- [ ] Has po_number
- [ ] Has mrc OR otc (with valid values)
- [ ] Has quantity (numeric)
- [ ] Has item_description or item_code

---

## Common Issues & Solutions

### Issue: "No matching quote line items"
**Check:**
- site_id matches exactly in both files
- po_number matches exactly
- Quote has valid MRC or OTC value

### Issue: All items showing "Skipped"
**Check:**
- Column names are spelled correctly
- No extra spaces in column names
- Data is in first row after headers

### Issue: Prices not matching
**Check:**
- Numbers don't have $ symbols
- Numbers don't have commas
- Decimal places are consistent

---

## Ready to Test!

1. Create the three test files above
2. Navigate to http://localhost:5174/
3. Click "Excel Validation" tab
4. Upload all three files
5. Click "Run Validation"
6. Review results!

You should see:
- 2 items passed (green)
- 2 items failed (red)  
- 1 item skipped (orange)

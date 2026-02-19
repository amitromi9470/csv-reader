# Excel Validation Implementation - Complete Guide

## ✅ Implementation Status: COMPLETE

The validation logic from your ServiceNow script has been successfully implemented in the React UI!

## 🌐 Access Your Application

**URL:** http://localhost:5174/

**Navigate to:** Click the "Excel Validation" tab in the top navigation

---

## 📋 Expected Excel File Formats

### **File 1: Invoice Line Items (Main File)**

Required columns:
- `SERIAL_NUMBER` or `serial_number` - Device/Asset serial number
- `LINE_NUMBER` or `line_number` - Invoice line number
- `TRX_NUMBER` or `trx_number` or `invoice_number` - Invoice number
- `site_id` or `SITE_ID` or `ibx_center` or `IBX_CENTER` - Site/Location ID
- `unit_selling_price` or `UNIT_SELLING_PRICE` or `unit_price` - Unit price on invoice
- `quantity` or `QUANTITY` - Quantity on invoice
- `description` or `DESCRIPTION` or `charge_description` - Item description
- `item_code` or `ITEM_CODE` - Item code (optional but helps matching)

**Example:**
| SERIAL_NUMBER | LINE_NUMBER | TRX_NUMBER | site_id | unit_selling_price | quantity | description | item_code |
|---------------|-------------|------------|---------|-------------------|----------|-------------|-----------|
| SN-001 | 1 | INV-2024-001 | SV1 | 1500.00 | 2 | Power Distribution | PWR-001 |
| SN-002 | 2 | INV-2024-001 | SV1 | 2500.00 | 1 | Network Switch | NET-001 |

---

### **File 2: Invoice to PO Mapping (Reference File 1)**

Required columns:
- `TRX_NUMBER` or `trx_number` or `invoice_number` - Invoice number (to match with Main File)
- `PO_NUMBER` or `po_number` - Purchase Order number

**Example:**
| TRX_NUMBER | PO_NUMBER |
|------------|-----------|
| INV-2024-001 | PO-2024-100 |
| INV-2024-002 | PO-2024-101 |

**Purpose:** Maps invoice numbers to PO numbers for quote lookup

---

### **File 3: Quotation Line Items (Reference File 2)**

Required columns:
- `site_id` or `SITE_ID` - Site ID (to match with Main File)
- `po_number` or `PO_NUMBER` or `quotation_po_number` - PO number (to match with Ref File 1)
- `mrc` or `MRC` - Monthly Recurring Charge (quote unit price)
- `otc` or `OTC` - One-Time Charge (quote unit price)
- `quantity` or `QUANTITY` - Quoted quantity
- `item_description` or `ITEM_DESCRIPTION` - Item description
- `changed_item_description` or `CHANGED_ITEM_DESCRIPTION` - Alternate description (optional)
- `item_code` or `ITEM_CODE` - Item code (optional but helps matching)

**Example:**
| site_id | po_number | mrc | otc | quantity | item_description | item_code |
|---------|-----------|-----|-----|----------|------------------|-----------|
| SV1 | PO-2024-100 | 1500.00 | - | 5 | Power Distribution Unit | PWR-001 |
| SV1 | PO-2024-100 | - | 2500.00 | 3 | Network Switch 48-Port | NET-001 |

**Note:** Either `mrc` OR `otc` must have a valid value (not empty, not '-', not '--')

---

## 🔍 Validation Logic Flow

### Step 1: Invoice to PO Lookup
```
Invoice Line Item (TRX_NUMBER) → Reference File 1 → Get PO_NUMBER
```

### Step 2: Quote Lookup
```
PO_NUMBER + site_id → Reference File 2 → Find matching quote items
Filter: Must have valid MRC or OTC
```

### Step 3: Item Matching
Compare using normalized text (removes special chars, extra spaces):

**Match if ANY of these conditions are true:**
- Invoice Item Code **contains** Quote Item Code
- Invoice Description **contains** Quote Item Description
- Invoice Description **contains** Quote Changed Item Description

### Step 4: Price Validation
```
Invoice Unit Price === Quote Price (MRC or OTC)
```

### Step 5: Quantity Validation
```
Invoice Quantity ≤ Quote Quantity
```

---

## 📊 Validation Results

### **Validation Passed** ✅
**Conditions:**
- Item match found
- Price matches exactly
- Quantity within quote limit

**Remarks:** "Price and quantity match the agreed quote."

---

### **Validation Failed** ❌
**Scenario 1 - Price Mismatch:**
- Item match found
- Price doesn't match quote

**Remarks:** "Price mismatch. Invoice price: $X, Quote price: $Y. Out-of-scope line item."

**Scenario 2 - Quantity Exceeded:**
- Item match found
- Price matches
- Quantity exceeds quote

**Remarks:** "Quantity exceeded. Invoice quantity: X, Quote quantity: Y. Price matches but quantity exceeds agreed quote."

**Action:** Marked as "Out of Scope"

---

### **Skipped** ⚠️
**Scenario 1 - No PO Found:**

**Remarks:** "No PO Number found for this invoice number in Reference File 1"

**Scenario 2 - No Quote Found:**

**Remarks:** "No matching quote line items found for this site ID and PO number"

**Scenario 3 - No Item Match:**

**Remarks:** "No matching quote item found based on item code or description"

**Scenario 4 - Invalid Quote Price:**

**Remarks:** "Quote unit price is unavailable or zero. Cannot perform price validation."

---

## 🎯 Key Features Implemented

### 1. **Text Normalization**
- Removes special characters
- Removes extra spaces
- Converts to lowercase
- Handles null/empty values

### 2. **Flexible Price Matching**
- Uses MRC if available and valid
- Falls back to OTC if MRC is invalid
- Handles various "empty" indicators: '', '-', '--'
- Returns 0 if both are invalid

### 3. **Fuzzy Matching**
- Uses "includes" instead of exact match
- Allows for slight variations in descriptions
- Matches on item code, description, or changed description

### 4. **Smart Filtering**
```javascript
// Filter by validation status
- All Results
- Passed Only
- Failed Only  
- Skipped Only

// Search functionality
- Search by Serial Number
- Search by Line Number
- Search by Invoice Number
- Search by PO Number
- Search in Remarks
```

### 5. **Export Options**
- Export all validation results
- Export filtered results only
- Excel format (.xlsx)
- Includes all validation details

---

## 📈 Results Display

### Summary Cards
- **Total Lines**: Total invoice line items processed
- **Passed**: Items that passed all validations
- **Failed**: Items marked as out-of-scope
- **Skipped**: Items that couldn't be validated

### Detailed Table
Columns displayed:
1. Row number
2. Serial Number
3. Line Number
4. Invoice Number
5. PO Number
6. Invoice Price
7. Quote Price
8. Invoice Quantity
9. Quote Quantity
10. Match Type (Item Code / Description / Changed Description)
11. Status badge (color-coded)
12. Detailed remarks

### Color Coding
- **Green row**: Validation Passed
- **Red row**: Validation Failed
- **Orange row**: Skipped
- **Status badges**: Color-coded for quick scanning

---

## 💡 Usage Instructions

### Step 1: Upload Files
1. Click "Excel Validation" tab
2. Upload **Invoice Line Items** (Main File)
3. Upload **Invoice to PO Mapping** (Reference File 1)
4. Upload **Quotation Line Items** (Reference File 2)

### Step 2: Review File Info
- Check row counts
- Verify column names are detected
- Ensure correct sheets are loaded

### Step 3: Run Validation
- Click "Run Validation" button
- Wait for processing (instant for most files)
- View results in summary cards

### Step 4: Analyze Results
- Use status filter to focus on specific results
- Search for specific line items
- Review detailed remarks for failures

### Step 5: Export Results
- Export all results for documentation
- Export only failed items for remediation
- Export only passed items for approval

---

## 🔧 Technical Implementation Details

### Validation Algorithm

```javascript
For each invoice line item:
  1. Get PO Number from Reference File 1
     → If not found: Skip (no PO mapping)
  
  2. Find quote items with matching site_id + po_number
     → Filter: Must have valid MRC or OTC
     → If none found: Skip (no quote data)
  
  3. Normalize text fields for comparison
     → Remove special characters
     → Remove extra spaces
     → Convert to lowercase
  
  4. Try to match with quote items
     → Match by: Item Code OR Description OR Changed Description
     → If no match: Skip (item not found in quote)
  
  5. Get quote price (MRC or OTC)
     → If price is 0: Skip (invalid quote price)
  
  6. Compare prices
     → If mismatch: Fail (price validation failed)
  
  7. Compare quantities
     → If invoice qty > quote qty: Fail (quantity exceeded)
  
  8. All checks passed: Pass
```

### Performance Optimizations

1. **Invoice-to-PO Map**: Created once, reused for all lookups
2. **Text Normalization**: Cached and reused
3. **Early Returns**: Skip further processing when possible
4. **Asynchronous Processing**: UI remains responsive

### Error Handling

- Handles missing columns (tries multiple naming conventions)
- Handles null/undefined values
- Handles non-numeric values gracefully
- Provides detailed error messages in remarks

---

## 📋 Example Test Cases

### Test Case 1: Perfect Match (Should Pass)
**Invoice Line:**
- Serial: SN-001, Line: 1, Invoice: INV-001
- Site: SV1, Price: $1500, Qty: 2
- Description: "Power Distribution Unit"

**Quote Line:**
- Site: SV1, PO: PO-100, MRC: $1500, Qty: 5
- Description: "Power Distribution"

**Result:** ✅ Validation Passed

---

### Test Case 2: Price Mismatch (Should Fail)
**Invoice Line:**
- Price: $1600

**Quote Line:**
- MRC: $1500

**Result:** ❌ Validation Failed - Price mismatch

---

### Test Case 3: Quantity Exceeded (Should Fail)
**Invoice Line:**
- Qty: 10

**Quote Line:**
- Qty: 5

**Result:** ❌ Validation Failed - Quantity exceeded

---

### Test Case 4: No PO Mapping (Should Skip)
**Invoice Line:**
- Invoice: INV-999

**Reference File 1:**
- No mapping for INV-999

**Result:** ⚠️ Skipped - No PO found

---

### Test Case 5: No Quote Data (Should Skip)
**Invoice Line:**
- Site: SV1, PO: PO-999

**Reference File 2:**
- No quotes for PO-999

**Result:** ⚠️ Skipped - No quote data

---

## 🚀 Advanced Features

### 1. Real-time Search
Type to filter results across all columns instantly

### 2. Status Filtering
One-click filtering by validation status

### 3. Hover Details
Hover over remarks to see full text

### 4. Responsive Design
Works on desktop, tablet, and mobile

### 5. Export Flexibility
Export all or filtered results

---

## ⚙️ Configuration Options

### Column Name Variants
The system automatically detects these column name variants:
- `SERIAL_NUMBER`, `serial_number`
- `LINE_NUMBER`, `line_number`
- `TRX_NUMBER`, `trx_number`, `invoice_number`
- `site_id`, `SITE_ID`, `ibx_center`, `IBX_CENTER`
- `unit_selling_price`, `UNIT_SELLING_PRICE`, `unit_price`
- etc.

**Case Insensitive:** Column names are matched regardless of case

---

## 🐛 Troubleshooting

### Issue: "No PO Number found"
**Solution:** Check that Reference File 1 has the invoice number

### Issue: "No matching quote line items"
**Solution:** Verify site_id and po_number match exactly

### Issue: All items showing "Skipped"
**Solution:** Check column names match expected format

### Issue: Prices not matching when they should
**Solution:** Ensure numbers don't have currency symbols or commas

---

## 📞 Support

If you encounter issues:
1. Check column names in your Excel files
2. Verify data types (prices should be numbers)
3. Check the browser console for error messages
4. Export results to see exact values being compared

---

## ✨ Summary

Your ServiceNow validation logic has been fully implemented with:
- ✅ Complete validation flow
- ✅ Text normalization
- ✅ Flexible matching
- ✅ Price and quantity validation
- ✅ Detailed results display
- ✅ Export functionality
- ✅ Search and filtering
- ✅ Beautiful UI

**Ready to use!** Visit http://localhost:5174/ and click "Excel Validation" tab.

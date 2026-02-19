# Troubleshooting Guide - "No PO Number Found" Error

## ✅ Problem Fixed!

I've updated the validation logic to be **much more flexible** with column names and data formats. Here's what changed:

---

## 🔧 Improvements Made

### 1. **Case-Insensitive Matching**
- Invoice numbers are now compared in uppercase
- "INV-001" will match "inv-001" or "Inv-001"
- Column names are matched regardless of case

### 2. **Multiple Column Name Variations**
The system now recognizes many variations of column names:

**Invoice Number:**
- TRX_NUMBER
- trx_number
- invoice_number
- INVOICE_NUMBER
- Invoice_Number
- Trx_Number

**PO Number:**
- PO_NUMBER
- po_number
- PO_Number
- PONumber
- purchase_order
- PURCHASE_ORDER

**And many more for all fields!**

### 3. **Whitespace Handling**
- Automatically trims leading/trailing spaces
- Removes extra spaces in data values

### 4. **Better Debugging**
- Browser console shows the invoice-to-PO mapping
- Shows which invoices were found
- Logs lookup failures with details

### 5. **Column Detection Panel**
- New UI section shows exactly what columns were detected
- Shows all columns from each file
- Lists expected column names
- Helps you verify your data before validation

---

## 🔍 How to Debug "No PO Number Found"

### Step 1: Check Browser Console

1. Open your browser (Chrome/Firefox)
2. Press **F12** to open Developer Tools
3. Click the **Console** tab
4. Look for these messages:
   ```
   Invoice to PO Mapping: { ... }
   Total mappings found: X
   ```

This shows all invoice-to-PO mappings that were found.

### Step 2: Check Column Detection Panel

After uploading all files, look at the **"Column Detection"** section:

- It shows all columns detected in each file
- Click "Expected Column Names" to see what's needed
- Compare your columns with expected names

### Step 3: Verify Data Format

Common issues:

#### Invoice Numbers Don't Match
```
Main File:     TRX_NUMBER = "INV-2024-001"
Reference 1:   TRX_NUMBER = "INV-2024-001 "  ← Extra space!

Solution: Update now handles this automatically (trims spaces)
```

#### Column Name Spelling
```
Your file:     "Invoice_Num" 
Expected:      "TRX_NUMBER" or "invoice_number"

Solution: Rename column or use one of the supported variations
```

#### Case Differences
```
Main File:     TRX_NUMBER = "inv-001"
Reference 1:   TRX_NUMBER = "INV-001"

Solution: Update now handles this automatically (case-insensitive)
```

---

## 📋 Supported Column Name Variations

### Main File (Invoice Line Items)

| Field | Accepted Column Names |
|-------|----------------------|
| Serial Number | SERIAL_NUMBER, serial_number, Serial_Number, SerialNumber |
| Line Number | LINE_NUMBER, line_number, Line_Number, LineNumber |
| Invoice Number | TRX_NUMBER, trx_number, invoice_number, INVOICE_NUMBER, Invoice_Number, Trx_Number |
| Site ID | site_id, SITE_ID, ibx_center, IBX_CENTER, Site_Id, SiteId |
| Unit Price | unit_selling_price, UNIT_SELLING_PRICE, unit_price, UNIT_PRICE, Unit_Price, price |
| Quantity | quantity, QUANTITY, Quantity, qty, QTY |
| Description | description, DESCRIPTION, charge_description, CHARGE_DESCRIPTION, Description |
| Item Code | item_code, ITEM_CODE, Item_Code, ItemCode, item_id, ITEM_ID |

### Reference File 1 (Invoice-PO Mapping)

| Field | Accepted Column Names |
|-------|----------------------|
| Invoice Number | TRX_NUMBER, trx_number, invoice_number, INVOICE_NUMBER, Invoice_Number, Trx_Number |
| PO Number | PO_NUMBER, po_number, PO_Number, PONumber, purchase_order, PURCHASE_ORDER |

### Reference File 2 (Quotation Line Items)

| Field | Accepted Column Names |
|-------|----------------------|
| Site ID | site_id, SITE_ID, Site_Id, SiteId, ibx_center, IBX_CENTER |
| PO Number | po_number, PO_NUMBER, PO_Number, PONumber, quotation_po_number, QUOTATION_PO_NUMBER, purchase_order |
| MRC | mrc, MRC, Mrc, monthly_recurring_charge, MONTHLY_RECURRING_CHARGE |
| OTC | otc, OTC, Otc, one_time_charge, ONE_TIME_CHARGE |
| Quantity | quantity, QUANTITY, Quantity, qty, QTY |
| Item Description | item_description, ITEM_DESCRIPTION, Item_Description, description, DESCRIPTION |
| Changed Description | changed_item_description, CHANGED_ITEM_DESCRIPTION, alternate_description |
| Item Code | item_code, ITEM_CODE, Item_Code, ItemCode, item_id, ITEM_ID |

---

## 🧪 Testing Steps

### Quick Test:

1. **Refresh the page**: http://localhost:5174/
2. **Navigate to**: Excel Validation tab
3. **Upload your files** again
4. **Check the "Column Detection" panel** - do you see your columns?
5. **Open browser console** (F12) before clicking "Run Validation"
6. **Click "Run Validation"**
7. **Look in console** for:
   ```
   Invoice to PO Mapping: { "INV-001": "PO-100", "INV-002": "PO-101", ... }
   Total mappings found: X
   ```

### If You See "Total mappings found: 0"

**Problem:** Reference File 1 columns not detected

**Solutions:**
1. Check column names in Reference File 1
2. Make sure invoice number column is named one of:
   - TRX_NUMBER
   - trx_number
   - invoice_number
   - INVOICE_NUMBER
3. Make sure PO number column is named one of:
   - PO_NUMBER
   - po_number
   - purchase_order

### If You See Mappings But Still Get "No PO Found"

**Problem:** Invoice numbers in Main File don't match Reference File 1

**Check:**
1. Open console and look at the mapping
2. Compare invoice numbers in Main File with keys in mapping
3. Look for:
   - Extra spaces
   - Different formats (e.g., "001" vs "1")
   - Different prefixes (e.g., "INV-001" vs "INVOICE-001")

---

## 🔧 Quick Fixes

### Fix 1: Rename Columns in Excel

If your columns don't match any variations:

1. Open your Excel file
2. Rename the column header to match expected names
3. Save the file
4. Re-upload

**Example:**
```
Change:  "Invoice_Num" → "TRX_NUMBER"
Change:  "PO_Num" → "PO_NUMBER"
Change:  "Price" → "unit_selling_price"
```

### Fix 2: Ensure Data Consistency

Make sure invoice numbers are formatted the same way in both files:

**Main File (Invoice Line Items):**
```
TRX_NUMBER
INV-2024-001
INV-2024-002
INV-2024-003
```

**Reference File 1 (Invoice-PO Mapping):**
```
TRX_NUMBER        PO_NUMBER
INV-2024-001      PO-001
INV-2024-002      PO-002
INV-2024-003      PO-003
```

### Fix 3: Remove Special Characters

Avoid special characters in data values:
- Remove extra spaces
- Remove invisible characters
- Use consistent casing (now handled automatically)

---

## 📝 Example Console Output

### Good Output (Working):
```javascript
Invoice to PO Mapping: {
  "INV-2024-001": "PO-001",
  "INV-2024-002": "PO-002",
  "INV-2024-003": "PO-003"
}
Total mappings found: 3
```

### Bad Output (Not Working):
```javascript
Invoice to PO Mapping: {}
Total mappings found: 0
```

This means Reference File 1 columns weren't detected.

---

## 🎯 Common Scenarios

### Scenario 1: Mixed Case Column Names
**Your File:**
```
Invoice_Number | Po_Number
INV-001       | PO-100
```

**Status:** ✅ **NOW WORKS!** (Case-insensitive matching added)

---

### Scenario 2: Extra Spaces in Data
**Your File:**
```
TRX_NUMBER    | PO_NUMBER
"INV-001 "    | "PO-100"   ← Trailing space
```

**Status:** ✅ **NOW WORKS!** (Automatic trimming added)

---

### Scenario 3: Different Column Names
**Your File:**
```
invoice_num | purchase_order_number
INV-001     | PO-100
```

**Status:** ⚠️ **Partial** - "invoice_num" works, but "purchase_order_number" needs to be renamed to "PO_NUMBER" or "po_number" or "purchase_order"

---

### Scenario 4: Case-Insensitive Data
**Main File:**
```
TRX_NUMBER
inv-001
```

**Reference 1:**
```
TRX_NUMBER
INV-001
```

**Status:** ✅ **NOW WORKS!** (Case-insensitive comparison added)

---

## 🆘 Still Having Issues?

### Checklist:

- [ ] Column names match one of the supported variations
- [ ] No extra spaces in column names
- [ ] Invoice numbers are consistent across files
- [ ] Reference File 1 has both TRX_NUMBER and PO_NUMBER columns
- [ ] Data rows have values (not empty)
- [ ] Browser console shows the mapping (F12 → Console)
- [ ] Column Detection panel shows your columns

### Get More Help:

1. **Check Console**: Look for error messages
2. **Export Sample**: Create a small test file with 2-3 rows
3. **Compare Format**: Check against `SAMPLE_DATA_TEMPLATE.md`
4. **Verify Columns**: Use Column Detection panel

---

## 💡 Pro Tips

1. **Use Standard Names**: Stick to `TRX_NUMBER` and `PO_NUMBER` for best compatibility

2. **Test with Small Data**: Create a test file with 5 rows first

3. **Check Console**: Always open console (F12) before validation

4. **Use Column Detection**: Review the detection panel before running validation

5. **Keep Data Clean**: 
   - No currency symbols in prices
   - No commas in numbers
   - Consistent date formats
   - No extra spaces

---

## 🎊 Summary of Fixes

✅ **Case-insensitive** invoice number matching  
✅ **Automatic trimming** of spaces  
✅ **Multiple column name variations** supported  
✅ **Better error messages** with debug info  
✅ **Column detection panel** to verify uploads  
✅ **Console logging** for debugging  
✅ **Flexible matching** in both directions  

**Your validation should work now!** 

Refresh the page (http://localhost:5174/) and try again. If you still have issues, check the browser console (F12) and the Column Detection panel for clues.

# 🔍 Troubleshooting: "No matching quote line items found"

## Error Message

```
No matching quote line items found for this PO number and site ID
```

## What This Means

The validation is looking for matching records in your **Reference File 2 (Quotation)** but can't find any quote line items that match both:
1. The **PO Number** from your invoice
2. The **Site ID** (IBX) from your invoice

## Why This Happens

### Common Reasons:

1. **PO Number Mismatch**
   - The PO number in your Main File or Reference File 1 doesn't exist in Reference File 2
   - Extra spaces: `"4510987654"` vs `" 4510987654 "`
   - Different format: `"4510987654"` vs `"45-10-987654"`

2. **Site ID Mismatch**
   - The Site ID (IBX) in your Main File doesn't match the Site ID in Reference File 2 for that PO
   - Case sensitivity: `"SV1"` vs `"sv1"`
   - Extra characters: `"SV1"` vs `"SV1 "`

3. **Missing Data**
   - The PO number doesn't exist at all in your quotation file
   - The quotation file is missing records for certain sites

4. **Column Name Issues**
   - PO number column in quotation file has a different name than expected
   - Site ID column has a different name than expected

## How to Fix

### Step 1: Use the Data Diagnostics Tool

1. **Upload all your files** (Main File, Reference File 1, Reference File 2)
2. **Click "Show Data Diagnostics"** button (appears after files are uploaded)
3. **Compare the values**:
   - Check if PO numbers from Main/Ref1 exist in Ref2
   - Check if Site IDs from Main exist in Ref2
   - Look for formatting differences (spaces, case, special characters)

### Step 2: Check the Detailed Error Message

When validation completes, look at the "Remarks" column in the results table. The error message now includes:

```
No matching quote found. Searching for PO: "4510987654", Site ID: "SV1" | 
This PO number not found in Reference File 2 (Quotation).
```

OR

```
No matching quote found. Searching for PO: "4510987654", Site ID: "SV1" | 
Found 5 quote(s) with this PO, but Site ID doesn't match. 
Available Site IDs for this PO: [SV2, SV3, NY1]
```

This tells you exactly:
- What PO and Site ID the validation is looking for
- Whether the PO exists in the quotation file
- If the PO exists but the Site ID doesn't match, what Site IDs are available

### Step 3: Fix Your Data

Based on what you found:

#### If PO Numbers Don't Match:

**Option A: Fix the quotation file**
- Add the missing PO numbers to Reference File 2
- Make sure PO numbers are formatted exactly the same way

**Option B: Fix the invoice or mapping file**
- Correct any typos in PO numbers in Main File or Reference File 1
- Remove extra spaces or special characters

#### If Site IDs Don't Match:

**Option A: Fix the Site IDs**
- Make sure Site IDs are spelled/formatted the same in both files
- Check for extra spaces, wrong case (uppercase vs lowercase)

**Option B: Verify the data**
- Confirm that the invoice line item actually belongs to that Site ID
- Check if the quotation has quotes for that site

### Step 4: Re-run Validation

After fixing your files:
1. Click "Remove" on the file you modified
2. Upload the corrected file
3. Click "Run Validation" again

## Example Scenario

### The Problem:
```
Main File: PO_NUMBER = "4510987654", IBX = "SV1"
Ref File 2: Po Number = "4510987654", IBX = "SV2"
```

Error: Site IDs don't match (`SV1` vs `SV2`)

### The Error Message Will Show:
```
No matching quote found. Searching for PO: "4510987654", Site ID: "SV1" | 
Found 3 quote(s) with this PO, but Site ID doesn't match. 
Available Site IDs for this PO: [SV2, SV2, SV2]
```

### The Solution:
Either:
- Change IBX in Main File from "SV1" to "SV2" if it was a typo
- OR Add quotes for SV1 to Reference File 2 if they're missing
- OR Correct the Site ID in Reference File 2 if SV2 was wrong

## Expected Column Names

The validation looks for these column names (case-insensitive):

### PO Number in Reference File 2:
- `Po Number`
- `PO Number`
- `po_number`
- `PO_NUMBER`
- `PO_Number`
- `PONumber`

### Site ID in Reference File 2:
- `IBX`
- `ibx`
- `site_id`
- `SITE_ID`
- `Site_Id`
- `SiteId`
- `Number`
- `number`

If your columns have different names, you may need to rename them.

## Data Diagnostics Features

The **"Show Data Diagnostics"** button provides:

1. **All Unique PO Numbers** in each file
   - Click to expand and see the full list
   - Compare across files to find missing POs

2. **All Unique Site IDs** in each file
   - See what sites are present in each file
   - Identify formatting differences

3. **Match Analysis Tips**
   - Common issues to look for
   - Examples of data mismatches

## Still Having Issues?

If you're still getting errors after checking the diagnostics:

1. **Export a sample** of your validation results to see specific failing records
2. **Check the console** (F12 in browser) for additional debug logs
3. **Verify column names** in the "Column Detection Info" section
4. **Check for empty cells** - make sure PO numbers and Site IDs aren't blank

## Technical Notes

- The validation performs **case-insensitive** matching for both PO numbers and Site IDs
- Extra whitespace is automatically **trimmed** from both sides
- The validation creates an **indexed lookup** for fast matching
- If a quote doesn't have a Site ID column, it will match by PO number only

## Quick Checklist

- [ ] Uploaded all required files (Main File and Reference File 2 minimum)
- [ ] Clicked "Show Data Diagnostics" and reviewed PO numbers
- [ ] Clicked "Show Data Diagnostics" and reviewed Site IDs
- [ ] Checked that PO numbers from Main/Ref1 exist in Ref2
- [ ] Verified Site IDs match between files (case-insensitive, no extra spaces)
- [ ] Checked "Column Detection Info" to ensure columns are recognized
- [ ] Read the detailed error messages in the "Remarks" column after validation

---

**Remember:** The new enhanced error messages and diagnostics tool will show you exactly which PO numbers and Site IDs don't match, making it much easier to identify and fix the problem!

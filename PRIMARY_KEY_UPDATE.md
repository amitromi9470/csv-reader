# Primary Key Configuration Update

## Change Summary

The primary key combination used for duplicate detection has been updated.

### Previous Configuration
```javascript
Primary Key Fields (5 fields):
- TRX_NUMBER
- SERIAL_NUMBER
- BILLING_AGREEMENT
- SERVICE_START_DATE
- SERVICE_END_DATE
```

### New Configuration
```javascript
Primary Key Fields (3 fields):
- SERIAL_NUMBER
- TRX_NUMBER
- LINE_NUMBER
```

## What This Means

### Duplicate Detection
Two records are now considered duplicates if **ALL THREE** of these fields match exactly:
1. **SERIAL_NUMBER** - Must be identical
2. **TRX_NUMBER** - Must be identical
3. **LINE_NUMBER** - Must be identical

### Example

#### Records Considered Duplicates:
```
Record 1: SERIAL_NUMBER="SN-123", TRX_NUMBER="TX-001", LINE_NUMBER="LINE-01"
Record 2: SERIAL_NUMBER="SN-123", TRX_NUMBER="TX-001", LINE_NUMBER="LINE-01"
→ These are DUPLICATES (all 3 fields match)
```

#### Records Considered Unique:
```
Record 1: SERIAL_NUMBER="SN-123", TRX_NUMBER="TX-001", LINE_NUMBER="LINE-01"
Record 2: SERIAL_NUMBER="SN-123", TRX_NUMBER="TX-001", LINE_NUMBER="LINE-02"
→ These are UNIQUE (LINE_NUMBER differs)

Record 1: SERIAL_NUMBER="SN-123", TRX_NUMBER="TX-001", LINE_NUMBER="LINE-01"
Record 2: SERIAL_NUMBER="SN-123", TRX_NUMBER="TX-002", LINE_NUMBER="LINE-01"
→ These are UNIQUE (TRX_NUMBER differs)

Record 1: SERIAL_NUMBER="SN-123", TRX_NUMBER="TX-001", LINE_NUMBER="LINE-01"
Record 2: SERIAL_NUMBER="SN-456", TRX_NUMBER="TX-001", LINE_NUMBER="LINE-01"
→ These are UNIQUE (SERIAL_NUMBER differs)
```

## Impact on Your Data

### Before (5-field key)
- More restrictive duplicate detection
- Required all 5 fields to match
- Fewer duplicates detected
- Records with same SERIAL_NUMBER, TRX_NUMBER, LINE_NUMBER but different dates/billing were considered unique

### After (3-field key)
- More focused duplicate detection
- Only requires 3 fields to match
- May detect more duplicates if you have the same serial/transaction/line combination repeated
- Other fields (dates, billing, etc.) don't affect duplicate detection

## Column Requirements

### Required Columns in Your File
Your CSV/Excel file **must** contain these exact column headers:
- `SERIAL_NUMBER`
- `TRX_NUMBER`
- `LINE_NUMBER`

### Case Sensitivity
- Column names are **case-sensitive**
- Must match exactly as shown above
- Spaces and special characters matter

### Missing Columns
If any of these columns are missing:
- The application will log a warning in the browser console
- Duplicate detection may not work correctly
- You'll see results but they may be inaccurate

## What Changed in the UI

### Duplicate Analysis Section
The subtitle now shows:
```
Primary Key: SERIAL_NUMBER + TRX_NUMBER + LINE_NUMBER
```

### No Other Changes
- Occurrence Count column still works the same
- Filter buttons still work the same
- Export functionality still works the same
- All other features remain unchanged

## How to Use

### 1. Check Your Data
Ensure your file has these columns:
```
SERIAL_NUMBER | TRX_NUMBER | LINE_NUMBER | [other columns...]
```

### 2. Upload File
Upload your CSV or Excel file as usual.

### 3. Review Statistics
Check the duplicate analysis:
- **Total Records**: Original file size
- **Unique Records**: Unique combinations of SERIAL_NUMBER + TRX_NUMBER + LINE_NUMBER
- **Duplicate Records**: Records with repeated combinations
- **Duplicate Groups**: How many combinations appear more than once

### 4. Analyze Duplicates
- Click "Has Duplicates" to see records with occurrence count > 1
- Sort by "Occurrence Count" to find most duplicated combinations
- Use column filters to narrow down specific serials, transactions, or lines

### 5. Export Clean Data
- Click "No Duplicates" to see only unique combinations
- Export to get deduplicated dataset

## Use Cases

### Use Case 1: Find Duplicate Line Items
```
Scenario: Same serial number, transaction, and line number appearing multiple times
Action: Click "Has Duplicates" and review
Result: See which serial/transaction/line combinations are duplicated
```

### Use Case 2: Track Multiple Lines per Transaction
```
Scenario: Same serial and transaction, but different line numbers
Action: Filter by SERIAL_NUMBER and TRX_NUMBER
Result: See all line items for that serial/transaction (each line is unique)
```

### Use Case 3: Clean Export for Billing
```
Scenario: Need deduplicated data for billing purposes
Action: Click "No Duplicates" and export
Result: Each serial/transaction/line combination appears once
```

## Technical Details

### Composite Key Creation
The application creates a composite key by joining the three fields:
```javascript
compositeKey = `${SERIAL_NUMBER}|${TRX_NUMBER}|${LINE_NUMBER}`
```

### Example Composite Keys
```
"SN-123|TX-001|LINE-01"
"SN-123|TX-001|LINE-02"
"SN-456|TX-002|LINE-01"
```

### Grouping Logic
1. Application reads all records
2. Creates composite key for each record
3. Groups records by composite key
4. Counts occurrences of each unique key
5. Displays first occurrence with count

## Modifying the Primary Key

If you need to change the primary key fields again, edit `src/App.jsx`:

```javascript
// Located in the analyzeDuplicates function
const primaryKeys = ['SERIAL_NUMBER', 'TRX_NUMBER', 'LINE_NUMBER']

// To change, simply update the array:
const primaryKeys = ['YOUR_FIELD_1', 'YOUR_FIELD_2', 'YOUR_FIELD_3']
```

**Important:**
- Field names must match your CSV/Excel column headers exactly
- They are case-sensitive
- Add as many or as few fields as needed

## Verification Steps

After uploading your file:

### 1. Check Console
Open browser console (F12) and look for:
```
Missing primary key columns: [...]
```
If you see this, your file is missing required columns.

### 2. Review Statistics
- If "Unique Records" = "Total Records": No duplicates found
- If "Duplicate Groups" > 0: Duplicates detected

### 3. Test a Known Duplicate
If you know certain records should be duplicates:
1. Use column filters to find them
2. Check if they have occurrence count > 1
3. Verify the primary key fields match exactly

## Benefits of This Configuration

### ✅ Simpler Key
- Only 3 fields to match
- Easier to understand
- Faster duplicate detection

### ✅ Line-Level Detection
- Focuses on serial/transaction/line combinations
- Perfect for line-item data
- Ignores dates and other metadata

### ✅ Flexible Analysis
- Same serial/transaction can have multiple unique lines
- Each line tracked separately
- Clean separation of line items

### ✅ Better Performance
- Fewer fields = faster key creation
- Quicker comparisons
- More efficient grouping

## Common Scenarios

### Scenario: Multiple Lines Are Not Duplicates
```
Q: I have the same SERIAL_NUMBER and TRX_NUMBER but different LINE_NUMBERs. 
   Are these duplicates?

A: No. Each line is unique because LINE_NUMBER is part of the primary key.
   This is correct behavior for line-item data.
```

### Scenario: Same Line Appears Twice
```
Q: I have the exact same SERIAL_NUMBER, TRX_NUMBER, and LINE_NUMBER twice.
   Will the app detect this?

A: Yes. The app will show this as one row with occurrence count = 2.
```

### Scenario: Want to Group Differently
```
Q: I want to detect duplicates based only on SERIAL_NUMBER and TRX_NUMBER,
   ignoring LINE_NUMBER.

A: Edit src/App.jsx and change:
   const primaryKeys = ['SERIAL_NUMBER', 'TRX_NUMBER']
```

## Summary

The primary key has been simplified from 5 fields to 3 fields:
- **SERIAL_NUMBER**: Device/asset identifier
- **TRX_NUMBER**: Transaction identifier  
- **LINE_NUMBER**: Line item identifier

This configuration is ideal for line-item based data where each transaction can have multiple line items, and you want to detect duplicate line entries.

All other application features remain the same. The change only affects how duplicates are identified and grouped.

## Need Help?

- Check `README.md` for general usage
- Check `DEDUPLICATION_GUIDE.md` for how deduplication works
- Check `DUPLICATE_DETECTION_GUIDE.md` for duplicate detection details
- Open browser console (F12) to see any errors or warnings

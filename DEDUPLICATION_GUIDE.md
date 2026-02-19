# Deduplication Guide

## Overview

The application now shows **deduplicated data** - each unique primary key combination appears only once in the table, with an "Occurrence Count" showing how many times it appeared in the original file.

## What Changed

### Before (Previous Behavior)
- If a record appeared 5 times, you would see 5 identical rows in the table
- All 5 rows would be highlighted as duplicates
- Each row would show "5" in the duplicate count

### Now (Current Behavior)
- If a record appears 5 times, you see only **1 row** in the table
- That row shows "5" in the "Occurrence Count" column
- The row is highlighted with a red background to indicate it has duplicates
- Much cleaner view without repetitive data

## Why This Is Better

### 1. Cleaner Table View
- No repetitive rows cluttering your view
- Easier to scan and analyze data
- Better performance with large datasets

### 2. Accurate Counts
- Still see exactly how many times each record appears
- "Occurrence Count" column shows the total count
- Red badge makes high-count records stand out

### 3. Better Export
- Export unique records without duplicates
- Still know which records had duplicates
- Include occurrence count in your export

### 4. Easier Analysis
- Filter to "Has Duplicates" to see only problematic records
- Sort by "Occurrence Count" to find worst offenders
- No need to manually deduplicate data

## Understanding the Table

### Columns

**Occurrence Count** (First Column)
- Shows how many times this primary key combination exists in your original data
- **Red Badge (e.g., 5)**: This exact combination appears 5 times in original file
- **Green Number (1)**: This combination appears only once (truly unique)

**Other Columns**
- Show data from the **first occurrence** of each primary key combination
- If a key appeared 5 times, you see the values from the first instance

### Rows

**Red Background Row**
- Occurrence count > 1
- This primary key combination has duplicates
- Hover to see tooltip with occurrence count

**Normal Background Row**
- Occurrence count = 1
- This primary key combination is unique
- No duplicates found

## Filter Modes Explained

### "All Unique Keys" (Default)
- Shows all unique primary key combinations
- Each row represents one distinct primary key
- Example: If you have 11,000 records with 10,500 unique keys, shows 10,500 rows

### "Has Duplicates"
- Shows only rows where Occurrence Count > 1
- These are the problematic records that need attention
- Example: Shows 250 rows that each appear 2+ times in original data

### "No Duplicates"
- Shows only rows where Occurrence Count = 1
- These are truly unique records with no duplicates
- Example: Shows 10,250 rows that appear exactly once

## Primary Key Combination

Records are grouped by this composite key:
1. **SERIAL_NUMBER**
2. **TRX_NUMBER**
3. **LINE_NUMBER**

All 3 fields must match exactly for records to be considered duplicates.

## Real-World Example

### Original Data File
```
Row 1: SN-123, TRX-001, LINE-001, ... [other columns]
Row 2: SN-123, TRX-001, LINE-001, ... [other columns]  [DUPLICATE]
Row 3: SN-123, TRX-001, LINE-001, ... [other columns]  [DUPLICATE]
Row 4: SN-456, TRX-002, LINE-002, ... [other columns]
Row 5: SN-789, TRX-003, LINE-003, ... [other columns]
```

### What You See in Table (3 Rows)
```
Row 1: [Occurrence: 3 🔴] SN-123, TRX-001, LINE-001, ... [other columns]
Row 2: [Occurrence: 1 ✅] SN-456, TRX-002, LINE-002, ... [other columns]
Row 3: [Occurrence: 1 ✅] SN-789, TRX-003, LINE-003, ... [other columns]
```

### Statistics
- **Total Records**: 5 (from original file)
- **Unique Records**: 3 (shown in table)
- **Duplicate Records**: 2 (Row 2 and Row 3 from original)
- **Duplicate Groups**: 1 (the TRX-001 combination)

## Use Cases

### 1. Identify High-Count Duplicates
```
1. Sort by "Occurrence Count" column (descending)
2. See which records appear most frequently
3. Investigate why these duplicates exist
```

### 2. Export Clean Dataset
```
1. Click "No Duplicates" to show only unique records
2. Click "Export to CSV"
3. Get a perfectly clean dataset with no duplicates
```

### 3. Focus on Problem Records
```
1. Click "Has Duplicates"
2. See only records that need attention
3. Sort by occurrence count to prioritize
4. Export for investigation
```

### 4. Analyze Specific Duplicates
```
1. Click "Has Duplicates"
2. Filter TRX_NUMBER column: "TX-2024"
3. See which transactions have duplicates
4. Review occurrence counts
```

## Benefits of This Approach

### ✅ Advantages

1. **No Data Loss**: Original occurrence count is preserved
2. **Clean View**: No repetitive rows
3. **Better Performance**: Fewer rows = faster rendering
4. **Easier Analysis**: See patterns without clutter
5. **Accurate Statistics**: Know exactly how many duplicates exist
6. **Flexible Filtering**: Easy to show/hide duplicates
7. **Better Exports**: Clean CSV files ready for use

### 📊 Statistics Are More Meaningful

- **Total Records**: Shows original file size (important for audit)
- **Unique Records**: Shows actual distinct combinations
- **Duplicate Records**: Shows how many extra rows were removed
- **Duplicate Groups**: Shows how many primary keys have issues

## Frequently Asked Questions

### Q: Where did the duplicate rows go?
**A:** They're grouped into the first occurrence of each primary key. The occurrence count shows how many there were.

### Q: Can I see all the original rows?
**A:** No, the app shows deduplicated data only. The occurrence count tells you how many times each appeared.

### Q: How do I know which row was kept?
**A:** The first occurrence (by order in the original file) is shown. The values shown are from that first row.

### Q: What if duplicate rows have different data in other columns?
**A:** Only the first occurrence's data is shown. If rows with the same primary key have different values in other columns, you'll only see the first row's values.

### Q: Does export include all original rows?
**A:** No, export includes the deduplicated data with occurrence counts. You get one row per unique primary key.

### Q: Can I change the primary key fields?
**A:** Yes, edit the `primaryKeys` array in `src/App.jsx` to use different columns.

### Q: How do I find the highest duplicate count?
**A:** Sort by "Occurrence Count" column (click header twice for descending order). Highest counts appear first.

### Q: What if I need the original data back?
**A:** Simply reload your CSV/Excel file. The deduplication happens on display only, your file is never modified.

## Tips for Best Use

1. **Start by reviewing statistics** - See overall duplicate situation
2. **Click "Has Duplicates"** - Focus on problematic records
3. **Sort by Occurrence Count** - Find highest-count duplicates first
4. **Use column filters** - Narrow down to specific criteria
5. **Export results** - Save cleaned data or duplicate list
6. **Investigate root cause** - Why are duplicates being created?

## Visual Guide

### Occurrence Count Badges

```
🔴 [5] - Red badge: Appears 5 times (has duplicates)
🔴 [3] - Red badge: Appears 3 times (has duplicates)
🔴 [2] - Red badge: Appears 2 times (has duplicates)
✅ [1] - Green text: Appears 1 time (unique)
```

### Row Colors

- **Light Red Background**: Has duplicates (count > 1)
- **Normal White Background**: No duplicates (count = 1)
- **Light Blue on Hover**: Mouse hover effect

## Example Workflow

### Scenario: Find and Export Duplicate Billing Agreements

```
Step 1: Upload your file
  ↓
Step 2: Check statistics
  - Total Records: 11,000
  - Unique Records: 10,500
  - Duplicate Records: 500
  - Duplicate Groups: 250
  ↓
Step 3: Click "Has Duplicates" (shows 250 rows)
  ↓
Step 4: Filter BILLING_AGREEMENT column: "BA-2024"
  ↓
Step 5: Sort by "Occurrence Count" (descending)
  ↓
Step 6: Review which agreements have most duplicates
  ↓
Step 7: Export to CSV for investigation
```

## Technical Details

### Deduplication Algorithm

1. Load original data from CSV/Excel
2. Create composite key for each row (5 primary key fields joined)
3. Group rows by composite key
4. Keep first occurrence of each unique key
5. Count occurrences for each key
6. Display deduplicated data with counts

### Performance

- **Fast**: Deduplication happens once on file load
- **Efficient**: Only unique rows are rendered
- **Scalable**: Works well with 10,000+ unique records
- **Memory**: Reduced memory usage (fewer rows in table)

## Summary

The application shows **deduplicated data** for a cleaner, more efficient view. Each unique primary key combination appears once, with the "Occurrence Count" showing how many times it existed in your original file. This approach gives you:

- ✅ Clean, non-repetitive table view
- ✅ Accurate duplicate counts preserved
- ✅ Better performance with large files
- ✅ Easier data analysis and export
- ✅ Clear identification of problematic records

All your data is accounted for - nothing is lost, just organized better!

# Duplicate Detection Guide

## Overview

Your React application now includes powerful duplicate detection and **automatic deduplication** capabilities that analyze records based on a composite primary key.

**IMPORTANT:** The application shows **deduplicated data**. Each unique primary key combination appears only once in the table, with an "Occurrence Count" column showing how many times it appeared in your original file.

## Primary Key Configuration

The application identifies duplicates using the following fields as a composite primary key:

1. **SERIAL_NUMBER**
2. **TRX_NUMBER**
3. **LINE_NUMBER**

Two records are considered duplicates if ALL three of these fields match exactly.

## What You'll See

### 1. Duplicate Analysis Dashboard

When you load a file, you'll immediately see:

- **Total Records**: Total rows in your file (e.g., 11,000)
- **Unique Records**: Number of unique primary key combinations
- **Duplicate Records**: Number of records that are duplicates
- **Duplicate Groups**: Number of unique keys that have duplicates

### 2. Top Duplicate Groups

The dashboard shows the top 5 groups with the most duplicates, ranked by frequency.

### 3. Visual Indicators

- **Red Badge**: In the "Occurrence Count" column, shows how many times this primary key appears in original data
- **Red Background**: Rows with occurrence count > 1 have a light red background
- **Green "1"**: Unique records (count = 1) show a green "1" in the Occurrence Count column

### 4. Important: Deduplicated View

The table shows **deduplicated data only**:
- Each unique primary key combination appears once
- No repetitive rows cluttering your view
- Occurrence count shows total from original file
- Much cleaner and easier to analyze

## Filtering Options

### All Unique Keys (Default)
Shows all unique primary key combinations with their occurrence counts
- Example: If 11,000 records have 10,500 unique keys, shows 10,500 rows
- Each row shows occurrence count from 1 to N

### Has Duplicates
Shows ONLY primary keys with occurrence count > 1
- These are the records that need attention
- Useful for reviewing data quality issues
- Example: Shows 250 rows that each appear 2+ times

### No Duplicates
Shows ONLY primary keys with occurrence count = 1
- These are truly unique records
- Perfect clean dataset with no duplicates
- Example: Shows 10,250 rows that appear exactly once

## Export Functionality

Each filter mode has its own export:

1. **Export All**: Downloads all records with duplicate indicators
2. **Export Duplicates**: Downloads only duplicate records for review
3. **Export Unique**: Downloads deduplicated dataset

Files are named automatically:
- `YourFile_all.csv`
- `YourFile_duplicates.csv`
- `YourFile_unique.csv`

## Use Cases

### 1. Identify Data Quality Issues
1. Click "Has Duplicates" to see primary keys with occurrence count > 1
2. Sort by "Occurrence Count" to see worst offenders first
3. Understand why these duplicates exist

### 2. Export Perfectly Clean Dataset
1. Click "No Duplicates" (shows count = 1 only)
2. Apply any additional filters needed
3. Click "Export to CSV"
4. Get a perfectly clean dataset with no duplicates

### 3. Audit High-Occurrence Records
1. Review the "Top 5 Duplicate Groups" in the dashboard
2. Click "Has Duplicates"
3. Sort by "Occurrence Count" (descending)
4. Investigate which primary keys appear most frequently

### 4. Search Within Problem Records
1. Click "Has Duplicates"
2. Use column filters to narrow down (e.g., specific TRX_NUMBER)
3. Review occurrence counts
4. Export for remediation

## Example Scenario

**Your Data**: 11,000 records in original file

**Analysis Results**:
- Total Records: 11,000 (original file size)
- Unique Records: 10,200 (rows shown in table)
- Duplicate Records: 800 (extra duplicates in original)
- Duplicate Groups: 350 (unique keys with count > 1)

**What This Means**:
- **Table shows**: 10,200 rows (deduplicated)
- **350 rows** have occurrence count > 1 (red badge)
- **9,850 rows** have occurrence count = 1 (green)
- **Original file had**: 800 extra duplicate entries now grouped
- **Benefit**: Cleaner view, but you still see the counts

**What You See**:
- Not 11,000 rows (which would include duplicates)
- But 10,200 rows (deduplicated)
- With occurrence counts showing the original frequency

## Technical Details

### How Duplicates Are Detected

1. For each record, a composite key is created by joining:
   `SERIAL_NUMBER|TRX_NUMBER|LINE_NUMBER`

2. The application tracks how many times each composite key appears

3. If a key appears more than once, all instances are grouped and counted

### Performance

- Duplicate detection runs once when you load the file
- Filtering between All/Duplicates/Unique is instant
- Search works across all columns in real-time
- Pagination ensures smooth performance even with 11,000 records

## Modifying Primary Key Fields

If you need to change which fields are used as the primary key, edit this section in `src/App.jsx`:

```javascript
const primaryKeys = [
  'SERIAL_NUMBER', 
  'TRX_NUMBER', 
  'LINE_NUMBER'
]
```

Simply replace the field names with your desired columns (must match your CSV/Excel column headers exactly).

## Tips

1. **Start with "All Records"**: Get an overview of your data first
2. **Check Statistics**: Look at the duplicate analysis numbers
3. **Filter to Duplicates**: Review what's causing duplicates
4. **Export Clean Data**: Use "Unique Only" + Export for clean dataset
5. **Search is Powerful**: Combine filters with search for targeted analysis

## Need Help?

- Check that your CSV/Excel has the required column headers
- Column names are case-sensitive
- Missing columns will be noted in the browser console
- If no duplicates are found, all records will show "1" in Duplicate Count

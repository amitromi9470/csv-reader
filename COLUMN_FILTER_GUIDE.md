# Column Filter Guide

## Overview

Your React application now includes powerful column-level filtering capabilities. Each column has its own filter input, allowing you to filter data with surgical precision.

## Features Added

### 1. Individual Column Filters
- Every column header now has a filter input box below the column name
- Type in any filter box to filter only that specific column
- Filters are case-insensitive by default

### 2. Column Sorting
- Click any column header to sort by that column
- Click again to reverse the sort direction
- Visual indicators show sort state:
  - ⇅ (double arrow) = Not sorted
  - 🔼 (up arrow) = Sorted ascending (A-Z, 0-9)
  - 🔽 (down arrow) = Sorted descending (Z-A, 9-0)

### 3. Combined Filtering
You can use multiple types of filters simultaneously:
- **View Mode Filter**: All Records / Duplicates Only / Unique Only
- **Global Search**: Search across all columns at once
- **Column Filters**: Filter specific columns individually
- **All work together**: Results show records matching ALL active filters

### 4. Filter Management
- **Active Filters Counter**: Shows how many filters are currently active
- **Clear All Filters Button**: One-click removal of all filters (appears when filters are active)
- **After Filters Stats**: Shows how many records remain after applying filters

## How to Use Column Filters

### Basic Column Filtering

1. **Load Your File**: Upload your CSV or Excel file
2. **Locate the Column**: Find the column you want to filter
3. **Type in Filter Box**: Click the small input box below the column name
4. **See Results**: Table updates in real-time as you type

### Example Use Cases

#### Filter by Specific TRX_NUMBER
1. Find the TRX_NUMBER column
2. Type the transaction number (e.g., "12345")
3. See only records with that transaction number

#### Filter by Date Range (Manual)
1. Find the SERVICE_START_DATE column
2. Type a year or month (e.g., "2024" or "2024-01")
3. See records from that time period

#### Find Specific Serial Numbers
1. Find the SERIAL_NUMBER column
2. Type partial or full serial number
3. See matching records instantly

#### Combine Multiple Filters
1. Filter SERIAL_NUMBER: "SN-2024"
2. Filter TRX_NUMBER: "TX-001"
3. Filter LINE_NUMBER: "LINE-01"
4. See only records matching ALL three criteria

## Advanced Filtering Workflows

### Workflow 1: Find Duplicate Records for a Specific Serial Number
1. Click "Has Duplicates" button
2. Filter SERIAL_NUMBER column with specific serial
3. Export results to CSV for review

### Workflow 2: Analyze Records by Date and Status
1. Sort by SERVICE_START_DATE (click column header)
2. Filter by specific date range in column filter
3. Add global search for status keywords
4. Review paginated results

### Workflow 3: Clean Data Export
1. Click "Unique Only" button
2. Filter out unwanted records using column filters
3. Sort by relevant column
4. Export cleaned dataset to CSV

### Workflow 4: Focused Duplicate Investigation
1. Click "Duplicates Only"
2. Sort by "Duplicate Count" column (descending)
3. Filter SERIAL_NUMBER column for specific device
4. Review all duplicates for that device

## Filter Behavior

### Case Sensitivity
- Column filters are **case-insensitive**
- Searching "ABC" will match "abc", "Abc", "ABC"

### Partial Matching
- Filters match partial strings
- Searching "2024" in dates will match "2024-01-15", "2024-12-31", etc.
- Searching "TX" in transaction numbers matches "TX-001", "TX-999", etc.

### Multiple Column Filters
- All column filters are **AND** operations
- Record must match ALL active column filters to appear
- Example: Filter1="2024" AND Filter2="Annual" = must match both

### Filter Persistence
- Column filters stay active when you:
  - Change pages
  - Sort columns
  - Switch between view modes (All/Duplicates/Unique)
- Column filters are cleared when you:
  - Click "Clear Filters" button
  - Upload a new file

## Performance Tips

### For Large Datasets (11,000+ records)

1. **Start Broad, Then Narrow**
   - Use view mode filter first (Duplicates/Unique)
   - Add column filters to narrow down
   - Use global search last for fine-tuning

2. **Use Specific Columns**
   - Filter indexed columns (TRX_NUMBER, SERIAL_NUMBER)
   - These tend to have more specific values

3. **Pagination**
   - Increase page size (100-500 rows) when using filters
   - See more results at once without scrolling

4. **Export Filtered Data**
   - Once you've filtered to desired results
   - Export to CSV for further analysis in Excel

## Visual Indicators

### Active Filters
When filters are active, you'll see:
- **Orange highlighted stat**: Shows "After Filters" count
- **Active Filters counter**: Shows total number of active filters
- **Clear Filters button**: Red button to clear all filters

### Column States
- **Normal header**: White text, purple background
- **Sortable header**: Clickable, cursor changes on hover
- **Sorted column**: Shows arrow indicator (🔼 or 🔽)
- **Filtered column**: Has text in the filter input box

### Row Indicators
- **Normal row**: White background
- **Duplicate row**: Light red background
- **Hovered row**: Light blue background
- **Both duplicate + hovered**: Light pink background

## Keyboard Shortcuts

### In Column Filter Input
- **Tab**: Move to next column's filter
- **Shift+Tab**: Move to previous column's filter
- **Escape**: Clear current column filter
- **Enter**: Keep filter active, focus next column

### In Table
- **Click Column Header**: Sort by that column
- **Double-click Header**: Quick sort toggle

## Troubleshooting

### Filter Not Working?
- Check spelling (though it's case-insensitive)
- Check for extra spaces
- Try partial matches instead of exact
- Clear other filters that might conflict

### No Results After Filter?
- Click "Clear Filters" to start fresh
- Check if view mode is limiting results
- Try searching in the global search bar instead

### Can't See Filter Input?
- Scroll horizontally in the table
- Filter input is below each column name
- May need to zoom out on mobile devices

### Performance Slow?
- Reduce number of active filters
- Lower page size temporarily
- Export filtered data and analyze separately

## Examples from Your Dataset

### Example 1: Find All Duplicates for a Serial Number
```
1. Click "Has Duplicates"
2. In SERIAL_NUMBER column filter, type: "SN-2024-001"
3. Sort by LINE_NUMBER
4. Review duplicate line items
5. Export for investigation
```

### Example 2: Analyze New Records This Month
```
1. Click "All Records"
2. In SERVICE_START_DATE filter, type: "2024-02"
3. In TRX_NUMBER filter, type: "TX" (if that's your prefix)
4. Sort by SERIAL_NUMBER
5. Review new entries
```

### Example 3: Clean Dataset for Report
```
1. Click "Unique Only"
2. Clear any existing filters
3. Sort by most important column
4. Add any exclusion filters if needed
5. Export to CSV
6. Use in your reporting tool
```

## Pro Tips

1. **Filter Before Exporting**: Filters apply to exports, so set up your filters first, then export

2. **Sort + Filter Combo**: Sort to see patterns, then filter to isolate them

3. **Save Filter Patterns**: Document your common filter combinations for reuse

4. **Pagination + Filters**: Increase page size when filtering to see more results

5. **Mobile Use**: Rotate to landscape for better column filter access

6. **Copy Values**: Can copy values from cells to paste into filters for exact matches

## Best Practices

- ✅ Start with view mode filter (All/Duplicates/Unique)
- ✅ Add column filters for specific criteria
- ✅ Use global search for keyword matching
- ✅ Clear filters between different analyses
- ✅ Export filtered results for documentation
- ❌ Don't add too many filters at once (start simple)
- ❌ Don't forget to clear filters before new analysis
- ❌ Don't filter on columns with many unique values (performance)

## Need More?

If you need additional filtering features:
- Date range pickers
- Numeric range filters (min/max)
- Multi-select dropdown filters
- Regular expression support
- Saved filter presets

These can be added by modifying `src/App.jsx` and the column filter component.

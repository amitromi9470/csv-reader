# CSV / Excel Data Viewer

A modern React application built with Vite for viewing and analyzing large CSV and Excel files with up to 11,000+ records.

## Features

- 📁 **File Upload**: Support for both CSV and Excel (.xlsx, .xls) files
- 📊 **Large Dataset Handling**: Efficiently handles 11,000+ records with pagination
- 🔍 **Duplicate Detection**: Automatically detects duplicates based on composite primary key
  - Primary Key: TRX_NUMBER + SERIAL_NUMBER + BILLING_AGREEMENT + SERVICE_START_DATE + SERVICE_END_DATE
  - Shows duplicate count for each record
  - Highlights duplicate rows in the table
  - Displays comprehensive duplicate statistics
- 🎯 **Smart Filtering**: Filter to view all records, only duplicates, or only unique records
- 💾 **Export Functionality**: Export filtered data (all, duplicates, or unique) to CSV
- 🔍 **Multi-Level Filtering**: 
  - Global search across all columns
  - Individual column filters for precise filtering
  - Combined filtering support
- 📊 **Column Sorting**: Click any column header to sort ascending/descending
- 📄 **Pagination**: Customizable page sizes (25, 50, 100, 250, 500 rows)
- 📈 **Statistics Dashboard**: 
  - Total records count
  - Unique records count
  - Duplicate records count
  - Number of duplicate groups
  - Top 5 duplicate groups by frequency
- 🎨 **Modern UI**: Beautiful gradient design with responsive layout
- ⚡ **Fast Performance**: Built with Vite and React 18
- 📱 **Responsive**: Works on desktop, tablet, and mobile devices

## Technologies Used

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **@tanstack/react-table** - Powerful table management
- **xlsx** - Excel file parsing
- **papaparse** - CSV file parsing

## Installation

1. Navigate to the project directory:
```bash
cd csv-viewer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and go to:
```
http://localhost:5173/
```

## Usage

1. Click the "Choose File" button
2. Select your CSV or Excel file (`.csv`, `.xlsx`, or `.xls`)
3. Wait for the file to load
4. **View Duplicate Analysis**:
   - Check the statistics dashboard showing total, unique, and duplicate records
   - See the top 5 duplicate groups by frequency
   - View which records are duplicates (highlighted with red background)
5. **Filter Records**:
   - Click "All Unique Keys" to view all deduplicated records
   - Click "Has Duplicates" to view only records with occurrence count > 1
   - Click "No Duplicates" to view only records with occurrence count = 1
6. **Filter Data**:
   - **Global Search**: Use the search bar to filter across ALL columns at once
   - **Column Filters**: Type in any column header's filter box to filter that specific column
   - **Combined Filters**: Use both global and column filters together for precise results
   - **Clear Filters**: Click "Clear Filters" button to remove all active filters
7. **Sort Data**:
   - Click any column header to sort by that column
   - Click again to reverse sort direction
   - Sort indicator shows current sort state (🔼 ascending, 🔽 descending, ⇅ unsorted)
8. **Export Data**:
   - Click "Export to CSV" button to download the currently filtered data
   - File will be named based on your original file and filter mode
   - Example: `Book1_duplicates.csv` or `Book1_unique.csv`
   - Exported file respects all active filters
9. Navigate through pages using the pagination controls
10. Change the number of rows displayed using the dropdown

### Duplicate Detection & Deduplication

The application automatically analyzes and deduplicates your data based on a composite primary key:
- **SERIAL_NUMBER**
- **TRX_NUMBER**
- **LINE_NUMBER**

**IMPORTANT:** The table shows **deduplicated data** - each unique primary key combination (SERIAL_NUMBER + TRX_NUMBER + LINE_NUMBER) appears only **once** in the table.

The "Occurrence Count" column shows:
- **Red badge with number (e.g., 5)**: This primary key combination appears 5 times in your original data
- **Green "1"**: This primary key combination appears only once (truly unique)

Example:
- Original data: 11,000 records
- After deduplication: 10,200 unique primary key combinations shown in table
- 800 duplicate instances were grouped into their first occurrence

Two records are considered duplicates if ALL three fields (SERIAL_NUMBER, TRX_NUMBER, LINE_NUMBER) match exactly.

Rows with duplicates (count > 1) are highlighted with a light red background for easy identification.

## Advanced Filtering & Sorting

### Global Search
The search bar at the top searches across ALL columns simultaneously. Type any value and see results from any column that matches.

### Column Filters
Each column header has its own filter input:
- Type in any column's filter box to filter only that column
- Combine multiple column filters for precise results
- Column filters work independently and cumulatively

### Filter Combinations
You can use multiple filters at once:
1. Select a view mode (All/Duplicates/Unique)
2. Add column-specific filters
3. Add a global search term
4. All filters work together to narrow down results

### Sorting
- Click any column header to sort
- First click: ascending order (🔼)
- Second click: descending order (🔽)
- Third click: remove sort (⇅)
- Sorting works with all active filters

### Clear All Filters
The "Clear Filters" button appears when any filter is active and removes:
- Global search term
- All column filters
- Does NOT clear the view mode (All/Duplicates/Unique)

## File Support

- **CSV Files**: Any properly formatted CSV file with headers
- **Excel Files**: .xlsx and .xls formats (reads first sheet by default)

## Understanding the Statistics & Deduplication

When you load a file, the application analyzes your data and provides the following metrics:

- **Total Records**: The total number of rows in your original file (before deduplication)
- **Unique Records**: Number of distinct primary key combinations (this is what you see in the table)
- **Duplicate Records**: Total number of duplicate instances found in original data
- **Duplicate Groups**: Number of unique primary keys that have multiple occurrences

### Example:
If you have:
- 11,000 total records (in original file)
- 10,500 unique records (shown in table)
- 500 duplicate records (removed from display)
- 250 duplicate groups (primary keys with count > 1)

This means:
- **Table shows**: 10,500 rows (one per unique primary key)
- **250 rows** have occurrence count > 1 (shown with red badge)
- **10,250 rows** have occurrence count = 1 (shown with green "1")
- **Original file had**: 500 extra duplicate entries that are now grouped into their first occurrence

### How Deduplication Works:

1. **Original Data**: 11,000 records loaded from file
2. **Analysis**: Groups records by primary key combination
3. **Display**: Shows only the first occurrence of each unique primary key
4. **Occurrence Count**: Shows how many times each key appeared in original data
5. **Benefit**: Cleaner view without repetitive data, but you still see the duplicate count

## Performance

The application uses pagination to efficiently display large datasets:
- Default: 50 rows per page
- Options: 25, 50, 100, 250, or 500 rows per page
- Global search filters across all data
- Smooth navigation through thousands of records
- Fast duplicate detection algorithm
- Instant filtering between all/duplicates/unique views

## Building for Production

To create a production build:

```bash
npm run build
```

The build files will be in the `dist` directory.

To preview the production build:

```bash
npm run preview
```

## Project Structure

```
csv-viewer/
├── src/
│   ├── App.jsx          # Main application component
│   ├── App.css          # Application styles
│   ├── index.css        # Global styles
│   └── main.jsx         # Entry point
├── public/              # Static assets
├── package.json         # Dependencies
└── README.md           # This file
```

## Sample Data

A sample Excel file (`Book1 test 2.xlsx`) is included in the project directory for testing.

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT

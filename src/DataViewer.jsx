import { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table'
import './DataViewer.css'

// Column Filter Component
function ColumnFilter({ column }) {
  const columnFilterValue = column.getFilterValue()

  return (
    <input
      type="text"
      value={(columnFilterValue ?? '')}
      onChange={(e) => column.setFilterValue(e.target.value)}
      placeholder={`Filter...`}
      className="column-filter-input"
      onClick={(e) => e.stopPropagation()}
    />
  )
}

function DataViewer() {
  const [data, setData] = useState([])
  const [columns, setColumns] = useState([])
  const [fileName, setFileName] = useState('')
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState([])
  const [sorting, setSorting] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterMode, setFilterMode] = useState('all') // 'all', 'duplicates', 'unique'
  const [duplicateStats, setDuplicateStats] = useState(null)

  // Analyze duplicates based on primary key columns
  const analyzeDuplicates = (rawData) => {
    const primaryKeys = ['SERIAL_NUMBER', 'TRX_NUMBER', 'LINE_NUMBER']
    
    // Check if all primary key columns exist
    const sampleRow = rawData[0] || {}
    const missingKeys = primaryKeys.filter(key => !(key in sampleRow))
    
    if (missingKeys.length > 0) {
      console.warn('Missing primary key columns:', missingKeys)
    }

    // Create a map to track duplicates and store first occurrence
    const keyMap = new Map()
    const duplicateGroups = []
    
    rawData.forEach((row, index) => {
      // Create composite key from primary key columns
      const compositeKey = primaryKeys
        .map(key => String(row[key] || '').trim())
        .join('|')
      
      if (keyMap.has(compositeKey)) {
        // This is a duplicate - increment count
        const existing = keyMap.get(compositeKey)
        existing.count++
        existing.indices.push(index)
      } else {
        // First occurrence - store it
        keyMap.set(compositeKey, {
          row: row,
          count: 1,
          indices: [index],
          compositeKey: compositeKey
        })
      }
    })

    // Identify duplicate groups and create deduplicated data
    let totalDuplicates = 0
    let duplicateGroupCount = 0
    const deduplicatedData = []
    
    keyMap.forEach((value, key) => {
      // Add the first occurrence with count
      const enrichedRow = {
        ...value.row,
        _isDuplicate: value.count > 1,
        _duplicateCount: value.count,
        _duplicateGroup: value.count > 1 ? key : null,
        _rowIndex: value.indices[0],
        _totalOccurrences: value.count
      }
      deduplicatedData.push(enrichedRow)
      
      // Track statistics
      if (value.count > 1) {
        duplicateGroupCount++
        totalDuplicates += value.count
        duplicateGroups.push({
          key,
          count: value.count,
          indices: value.indices
        })
      }
    })

    return {
      enrichedData: deduplicatedData,
      stats: {
        totalRecords: rawData.length,
        uniqueRecords: keyMap.size,
        duplicateRecords: totalDuplicates,
        duplicateGroups: duplicateGroupCount,
        duplicateGroupDetails: duplicateGroups.sort((a, b) => b.count - a.count)
      }
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    setLoading(true)
    setFileName(file.name)
    setFilterMode('all')
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const fileExtension = file.name.split('.').pop().toLowerCase()

        if (fileExtension === 'csv') {
          // Parse CSV
          Papa.parse(e.target.result, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.data.length > 0) {
                const { enrichedData, stats } = analyzeDuplicates(results.data)
                
                const cols = Object.keys(results.data[0]).map((key) => ({
                  accessorKey: key,
                  header: key,
                  cell: (info) => info.getValue(),
                  enableColumnFilter: true,
                  enableSorting: true,
                }))
                
                // Add duplicate indicator column
                cols.unshift({
                  accessorKey: '_duplicateCount',
                  header: 'Occurrence Count',
                  enableColumnFilter: true,
                  enableSorting: true,
                  cell: (info) => {
                    const count = info.getValue()
                    return count > 1 ? (
                      <span style={{ 
                        background: '#ff4444', 
                        color: 'white', 
                        padding: '6px 12px', 
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        display: 'inline-block',
                        minWidth: '40px',
                        textAlign: 'center'
                      }}>
                        {count}
                      </span>
                    ) : (
                      <span style={{ 
                        color: '#4caf50',
                        fontWeight: '600',
                        fontSize: '0.95rem'
                      }}>
                        {count}
                      </span>
                    )
                  },
                })
                
                setColumns(cols)
                setData(enrichedData)
                setDuplicateStats(stats)
              }
              setLoading(false)
            },
            error: (error) => {
              console.error('CSV parsing error:', error)
              alert('Error parsing CSV file')
              setLoading(false)
            },
          })
        } else if (['xlsx', 'xls'].includes(fileExtension)) {
          // Parse Excel
          const workbook = XLSX.read(e.target.result, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          if (jsonData.length > 0) {
            const { enrichedData, stats } = analyzeDuplicates(jsonData)
            
            const cols = Object.keys(jsonData[0]).map((key) => ({
              accessorKey: key,
              header: key,
              cell: (info) => info.getValue(),
              enableColumnFilter: true,
              enableSorting: true,
            }))
            
            // Add duplicate indicator column
            cols.unshift({
              accessorKey: '_duplicateCount',
              header: 'Occurrence Count',
              enableColumnFilter: true,
              enableSorting: true,
              cell: (info) => {
                const count = info.getValue()
                return count > 1 ? (
                  <span style={{ 
                    background: '#ff4444', 
                    color: 'white', 
                    padding: '6px 12px', 
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    display: 'inline-block',
                    minWidth: '40px',
                    textAlign: 'center'
                  }}>
                    {count}
                  </span>
                ) : (
                  <span style={{ 
                    color: '#4caf50',
                    fontWeight: '600',
                    fontSize: '0.95rem'
                  }}>
                    {count}
                  </span>
                )
              },
            })
            
            setColumns(cols)
            setData(enrichedData)
            setDuplicateStats(stats)
          }
          setLoading(false)
        } else {
          alert('Please upload a CSV or Excel file')
          setLoading(false)
        }
      } catch (error) {
        console.error('File parsing error:', error)
        alert('Error parsing file')
        setLoading(false)
      }
    }

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file)
    } else {
      reader.readAsBinaryString(file)
    }
  }

  // Filter data based on selected mode
  const filteredData = useMemo(() => {
    if (filterMode === 'duplicates') {
      // Show only records that have duplicates (count > 1)
      return data.filter(row => row._duplicateCount > 1)
    } else if (filterMode === 'unique') {
      // Show only records that are unique (count = 1)
      return data.filter(row => row._duplicateCount === 1)
    }
    return data
  }, [data, filterMode])

  // Export data to CSV
  const exportToCSV = () => {
    if (filteredData.length === 0) return

    // Get original column names (excluding internal columns)
    const originalColumns = columns
      .map(col => col.accessorKey)
      .filter(key => !key.startsWith('_'))

    // Create CSV header
    const header = originalColumns.join(',')

    // Create CSV rows
    const rows = filteredData.map(row => {
      return originalColumns.map(col => {
        const value = row[col]
        // Handle values with commas, quotes, or newlines
        if (value === null || value === undefined) return ''
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    }).join('\n')

    const csv = `${header}\n${rows}`

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    const filterLabel = filterMode === 'duplicates' ? 'duplicates' : 
                       filterMode === 'unique' ? 'unique' : 'all'
    link.setAttribute('href', url)
    link.setAttribute('download', `${fileName.split('.')[0]}_${filterLabel}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
      columnFilters,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  })

  return (
    <div className="app-container">
      <header className="header">
        <h1>CSV / Excel Data Viewer</h1>
        <p>Upload your CSV or Excel file to view data in a table</p>
      </header>

      <div className="upload-section">
        <label htmlFor="file-upload" className="file-upload-label">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Choose File
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          className="file-input"
        />
        {fileName && <span className="file-name">{fileName}</span>}
      </div>

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      )}

      {!loading && data.length > 0 && (
        <>
          <div className="duplicate-analysis">
            <h2>Duplicate Analysis (Showing Deduplicated Data)</h2>
            <p className="analysis-subtitle">
              Primary Key: SERIAL_NUMBER + TRX_NUMBER + LINE_NUMBER
              <br />
              <strong>Note:</strong> Each unique primary key combination is shown only once with its occurrence count
            </p>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <span className="stat-label">Total Records</span>
                  <span className="stat-value">{duplicateStats?.totalRecords.toLocaleString()}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <span className="stat-label">Unique Records</span>
                  <span className="stat-value">{duplicateStats?.uniqueRecords.toLocaleString()}</span>
                </div>
              </div>
              <div className="stat-card duplicate">
                <div className="stat-icon">🔄</div>
                <div className="stat-content">
                  <span className="stat-label">Duplicate Records</span>
                  <span className="stat-value">{duplicateStats?.duplicateRecords.toLocaleString()}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-content">
                  <span className="stat-label">Duplicate Groups</span>
                  <span className="stat-value">{duplicateStats?.duplicateGroups.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {duplicateStats?.duplicateGroups > 0 && (
              <div className="duplicate-summary">
                <h3>Top 5 Duplicate Groups</h3>
                <div className="duplicate-groups">
                  {duplicateStats.duplicateGroupDetails.slice(0, 5).map((group, idx) => (
                    <div key={idx} className="duplicate-group-item">
                      <span className="group-rank">#{idx + 1}</span>
                      <span className="group-count">{group.count} occurrences</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="filter-controls">
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filterMode === 'all' ? 'active' : ''}`}
                onClick={() => setFilterMode('all')}
              >
                All Unique Keys ({data.length.toLocaleString()})
              </button>
              <button
                className={`filter-btn ${filterMode === 'duplicates' ? 'active' : ''}`}
                onClick={() => setFilterMode('duplicates')}
              >
                Has Duplicates ({duplicateStats?.duplicateGroups.toLocaleString()})
              </button>
              <button
                className={`filter-btn ${filterMode === 'unique' ? 'active' : ''}`}
                onClick={() => setFilterMode('unique')}
              >
                No Duplicates ({(duplicateStats?.uniqueRecords - duplicateStats?.duplicateGroups).toLocaleString()})
              </button>
            </div>
            <button className="export-btn" onClick={exportToCSV}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export {filterMode === 'all' ? 'All' : filterMode === 'duplicates' ? 'Duplicates' : 'Unique'} to CSV
            </button>
          </div>

          <div className="stats-bar">
            <div className="stat">
              <span className="stat-label">Showing Unique Keys:</span>
              <span className="stat-value">{filteredData.length.toLocaleString()}</span>
            </div>
            {(globalFilter || columnFilters.length > 0) && (
              <>
                <div className="stat highlight">
                  <span className="stat-label">After Filters:</span>
                  <span className="stat-value">
                    {table.getFilteredRowModel().rows.length.toLocaleString()}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Active Filters:</span>
                  <span className="stat-value">
                    {(globalFilter ? 1 : 0) + columnFilters.length}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="controls">
            <div className="search-section">
              <input
                type="text"
                placeholder="Search across all columns..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="search-input"
              />
              {(globalFilter || columnFilters.length > 0) && (
                <button
                  onClick={() => {
                    setGlobalFilter('')
                    setColumnFilters([])
                  }}
                  className="clear-filters-btn"
                  title="Clear all filters"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Clear Filters
                </button>
              )}
            </div>
            
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value))
              }}
              className="page-size-select"
            >
              {[25, 50, 100, 250, 500].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize} rows
                </option>
              ))}
            </select>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id}>
                        <div className="header-content">
                          <div
                            className={header.column.getCanSort() ? 'header-label sortable' : 'header-label'}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getCanSort() && (
                              <span className="sort-indicator">
                                {header.column.getIsSorted() === 'asc' ? ' 🔼' : 
                                 header.column.getIsSorted() === 'desc' ? ' 🔽' : 
                                 ' ⇅'}
                              </span>
                            )}
                          </div>
                          {header.column.getCanFilter() && (
                            <ColumnFilter column={header.column} />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => {
                  const count = row.original._duplicateCount
                  const hasDuplicates = count > 1
                  return (
                    <tr 
                      key={row.id} 
                      className={hasDuplicates ? 'duplicate-row' : ''}
                      title={hasDuplicates ? `This primary key combination appears ${count} times in the original data` : 'This primary key combination appears only once'}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="pagination-btn"
            >
              {'<<'}
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="pagination-btn"
            >
              {'<'}
            </button>
            <span className="pagination-info">
              Page{' '}
              <strong>
                {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
              </strong>
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="pagination-btn"
            >
              {'>'}
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="pagination-btn"
            >
              {'>>'}
            </button>
            <span className="pagination-info">
              | Go to page:
              <input
                type="number"
                min="1"
                max={table.getPageCount()}
                defaultValue={table.getState().pagination.pageIndex + 1}
                onChange={(e) => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0
                  table.setPageIndex(page)
                }}
                className="page-input"
              />
            </span>
          </div>
        </>
      )}

      {!loading && data.length === 0 && (
        <div className="empty-state">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <h2>No Data Loaded</h2>
          <p>Upload a CSV or Excel file to get started</p>
        </div>
      )}
    </div>
  )
}

export default DataViewer

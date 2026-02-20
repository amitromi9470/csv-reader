import { useState, useMemo, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { runValidation as runValidationLogic } from './validationLogic'
import './ExcelValidation.css'

// Validation Results Component - Passed / Failed / Skipped
function ValidationResults({ results }) {
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredResults = useMemo(() => {
    let filtered = results.validationResults
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.validation_result === filterStatus)
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(r =>
        (r.serial_number || '').toString().toLowerCase().includes(search) ||
        (r.line_number || '').toString().toLowerCase().includes(search) ||
        (r.trx_number || '').toString().toLowerCase().includes(search) ||
        (r.po_number || '').toString().toLowerCase().includes(search) ||
        (r.qli_po_number || '').toString().toLowerCase().includes(search) ||
        (r.ibx || '').toString().toLowerCase().includes(search) ||
        (r.qli_site_id || '').toString().toLowerCase().includes(search) ||
        (r.ili_description || '').toString().toLowerCase().includes(search) ||
        (r.qli_description || '').toString().toLowerCase().includes(search) ||
        (r.ili_item_code || '').toString().toLowerCase().includes(search) ||
        (r.qli_item_code || '').toString().toLowerCase().includes(search) ||
        (r.ili_invoice_start_date || '').toString().toLowerCase().includes(search) ||
        (r.qli_invoice_start_date || '').toString().toLowerCase().includes(search) ||
        (r.billing_from || '').toString().toLowerCase().includes(search) ||
        (r.billing_till || '').toString().toLowerCase().includes(search) ||
        (r.ili_renewal_term || '').toString().toLowerCase().includes(search) ||
        (r.qli_renewal_term || '').toString().toLowerCase().includes(search) ||
        (r.quotation_skip_reason || '').toString().toLowerCase().includes(search) ||
        (r.rc_u_subkeys || '').toString().toLowerCase().includes(search) ||
        (r.rc_u_rate_card_sub_type || '').toString().toLowerCase().includes(search) ||
        (r.rc_u_country || '').toString().toLowerCase().includes(search) ||
        (r.rc_u_region || '').toString().toLowerCase().includes(search) ||
        (r.remarks || '').toLowerCase().includes(search)
      )
    }
    return filtered
  }, [results.validationResults, filterStatus, searchTerm])

  const exportResults = () => {
    const worksheet = XLSX.utils.json_to_sheet(results.validationResults)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Validation Results')
    XLSX.writeFile(workbook, `validation_results_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="results-section">
      <h2>Validation Results</h2>
      <div className="results-summary-grid">
        <div className="summary-card total">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <span className="summary-label">Total Lines</span>
            <span className="summary-value">{results.totalLines}</span>
          </div>
        </div>
        <div className="summary-card passed">
          <div className="summary-icon">✅</div>
          <div className="summary-content">
            <span className="summary-label">Passed</span>
            <span className="summary-value">{results.passedCount}</span>
          </div>
        </div>
        <div className="summary-card failed">
          <div className="summary-icon">❌</div>
          <div className="summary-content">
            <span className="summary-label">Failed</span>
            <span className="summary-value">{results.failedCount}</span>
          </div>
        </div>
        <div className="summary-card skipped">
          <div className="summary-icon">📋</div>
          <div className="summary-content">
            <span className="summary-label">Skipped</span>
            <span className="summary-value">{results.rateCardCount}</span>
          </div>
        </div>
      </div>

      <div className="results-controls">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="status-filter">
            <option value="all">All Results ({results.totalLines})</option>
            <option value="Passed">Passed ({results.passedCount})</option>
            <option value="Failed">Failed ({results.failedCount})</option>
            <option value="For Rate Card Validation">Skipped ({results.rateCardCount})</option>
          </select>
        </div>
        <div className="search-group">
          <input
            type="text"
            placeholder="Search by PO, IBX, Site ID, Description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="results-search"
          />
        </div>
        <div className="export-group">
          <button onClick={exportResults} className="export-results-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export All
          </button>
        </div>
      </div>

      <div className="results-table-container">
        <p className="showing-results">
          Showing {filteredResults.length} of {results.totalLines} results
        </p>
        <div className="results-table-wrapper">
          <table className="results-table">
            <thead>
              <tr>
                <th>Row</th>
                <th>ILI PO Number</th>
                <th>QLI PO Number</th>
                <th>ILI IBX</th>
                <th>QLI Site ID</th>
                <th>ILI Quantity</th>
                <th>QLI Quantity</th>
                <th>ILI Unit Price</th>
                <th>QLI Unit Price</th>
                <th>ILI Description</th>
                <th>QLI Description</th>
                <th>ILI Item Code</th>
                <th>QLI Item Code</th>
                <th>ILI Invoice Start Date</th>
                <th>QLI Invoice Start Date</th>
                <th>ILI Renewal Term</th>
                <th>QLI Renewal Term</th>
                <th>ILI First Price Inc After</th>
                <th>QLI First Price Inc After</th>
                <th>ILI Price Inc %</th>
                <th>QLI Price Inc %</th>
                <th>Billing From</th>
                <th>Billing Till</th>
                <th>PF</th>
                <th>LLA</th>
                <th>ELLA</th>
                <th>RC Sub Type</th>
                <th>RC Subkey</th>
                <th>RC Effective From</th>
                <th>RC Effective Till</th>
                <th>RC Country</th>
                <th>RC Region</th>
                <th>RC Unit Price Used</th>
                <th>RC u_pricekva</th>
                <th>RC u_rate</th>
                <th>RC u_nrc</th>
                <th>RC Cabinet Density</th>
                <th>RC ICB Flag</th>
                <th>Status</th>
                <th>Skipped Quotation Reason</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((result, idx) => (
                <tr key={idx} className={`result-row ${result.validation_result.toLowerCase().replace(/\s+/g, '-')}`}>
                  <td>{result.row}</td>
                  <td>{result.po_number ?? '-'}</td>
                  <td>{result.qli_po_number ?? '-'}</td>
                  <td>{result.ibx ?? '-'}</td>
                  <td>{result.qli_site_id ?? '-'}</td>
                  <td className="qty-cell">{result.quantity !== undefined && !isNaN(result.quantity) ? result.quantity : '-'}</td>
                  <td className="qty-cell">{result.qli_quantity !== undefined && !isNaN(result.qli_quantity) ? result.qli_quantity : '-'}</td>
                  <td className="price-cell">{result.unit_price !== undefined && !isNaN(result.unit_price) ? `$${Number(result.unit_price).toFixed(2)}` : '-'}</td>
                  <td className="price-cell">{result.qli_unit_price !== undefined && result.qli_unit_price !== '' && !isNaN(Number(result.qli_unit_price)) ? `$${Number(result.qli_unit_price).toFixed(2)}` : '-'}</td>
                  <td className="desc-cell">{result.ili_description ?? '-'}</td>
                  <td className="desc-cell">{result.qli_description ?? '-'}</td>
                  <td>{result.ili_item_code ?? '-'}</td>
                  <td>{result.qli_item_code ?? '-'}</td>
                  <td>{result.ili_invoice_start_date ?? '-'}</td>
                  <td>{result.qli_invoice_start_date ?? '-'}</td>
                  <td>{result.ili_renewal_term ?? '-'}</td>
                  <td>{result.qli_renewal_term ?? '-'}</td>
                  <td>{result.ili_first_Price_increment_applicable_after ?? '-'}</td>
                  <td>{result.qli_first_Price_increment_applicable_after ?? '-'}</td>
                  <td>{result.ili_price_increase_percentage ?? '-'}</td>
                  <td>{result.qli_price_increase_percentage ?? '-'}</td>
                  <td>{result.billing_from ?? '-'}</td>
                  <td>{result.billing_till ?? '-'}</td>
                  <td className="price-cell">{result.pf !== undefined && !isNaN(Number(result.pf)) ? Number(result.pf).toFixed(4) : '-'}</td>
                  <td className="price-cell">{result.lla !== undefined && !isNaN(Number(result.lla)) ? `$${Number(result.lla).toFixed(2)}` : '-'}</td>
                  <td className="price-cell">{result.ella !== undefined && !isNaN(Number(result.ella)) ? `$${Number(result.ella).toFixed(2)}` : '-'}</td>
                  <td>{result.rc_u_rate_card_sub_type ?? '-'}</td>
                  <td>{result.rc_u_subkeys ?? '-'}</td>
                  <td>{result.rc_u_effective_from ?? '-'}</td>
                  <td>{result.rc_effective_till ?? '-'}</td>
                  <td>{result.rc_u_country ?? '-'}</td>
                  <td>{result.rc_u_region ?? '-'}</td>
                  <td className="price-cell">{result.rc_unit_price_used !== undefined && result.rc_unit_price_used !== '' && !isNaN(Number(result.rc_unit_price_used)) ? `$${Number(result.rc_unit_price_used).toFixed(2)}` : '-'}</td>
                  <td className="price-cell">{result.rc_u_pricekva !== undefined && result.rc_u_pricekva !== '' && !isNaN(Number(result.rc_u_pricekva)) ? `$${Number(result.rc_u_pricekva).toFixed(2)}` : '-'}</td>
                  <td className="price-cell">{result.rc_u_rate !== undefined && result.rc_u_rate !== '' && !isNaN(Number(result.rc_u_rate)) ? `$${Number(result.rc_u_rate).toFixed(2)}` : '-'}</td>
                  <td className="price-cell">{result.rc_u_nrc !== undefined && result.rc_u_nrc !== '' && !isNaN(Number(result.rc_u_nrc)) ? `$${Number(result.rc_u_nrc).toFixed(2)}` : '-'}</td>
                  <td>{result.rc_u_minimum_cabinet_density ?? '-'}</td>
                  <td>{result.rc_u_icb_flag ?? '-'}</td>
                  <td>
                    <span className={`status-badge ${result.validation_result.toLowerCase().replace(/\s+/g, '-')}`}>
                      {result.validation_result === 'For Rate Card Validation' ? 'Skipped' : result.validation_result}
                    </span>
                  </td>
                  <td className="desc-cell">{result.quotation_skip_reason ?? '-'}</td>
                  <td className="remarks-cell">{result.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredResults.length === 0 && (
        <div className="no-results">
          <p>No results match your filters</p>
        </div>
      )}
    </div>
  )
}

function ExcelValidation() {
  const [baseFile, setBaseFile] = useState(null)
  const [quoteFile, setQuoteFile] = useState(null)
  const [rateCardFile, setRateCardFile] = useState(null)
  const [baseData, setBaseData] = useState(null)
  const [quoteData, setQuoteData] = useState(null)
  const [rateCardData, setRateCardData] = useState(null)
  const [rateCardConfig, setRateCardConfig] = useState(null)
  const [loading, setLoading] = useState(false)
  const [validationResults, setValidationResults] = useState(null)
  const [validationRunning, setValidationRunning] = useState(false)
  const [validationProgress, setValidationProgress] = useState(0)
  const [priceTolerance, setPriceTolerance] = useState(5)
  const [qtyTolerance, setQtyTolerance] = useState(20)

  useEffect(() => {
    fetch('/rate-card-types.json')
      .then(res => res.ok ? res.json() : null)
      .then(data => setRateCardConfig(Array.isArray(data) ? data : null))
      .catch(() => setRateCardConfig(null))
  }, [])

  const handleFileUpload = (file, fileType) => {
    if (!file) return
    setLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        const fileInfo = {
          name: file.name,
          sheets: workbook.SheetNames,
          selectedSheet: sheetName,
          rowCount: jsonData.length,
          columns: jsonData.length > 0 ? Object.keys(jsonData[0]) : [],
          data: jsonData,
          workbook
        }
        if (fileType === 'base') {
          setBaseFile(fileInfo)
          setBaseData(jsonData)
        } else if (fileType === 'quote') {
          setQuoteFile(fileInfo)
          setQuoteData(jsonData)
        } else {
          setRateCardFile(fileInfo)
          setRateCardData(jsonData)
        }
        setLoading(false)
      } catch (error) {
        console.error('Error reading file:', error)
        alert('Error reading file: ' + error.message)
        setLoading(false)
      }
    }
    reader.readAsBinaryString(file)
  }

  const clearFile = (fileType) => {
    if (fileType === 'base') {
      setBaseFile(null)
      setBaseData(null)
    } else if (fileType === 'quote') {
      setQuoteFile(null)
      setQuoteData(null)
    } else {
      setRateCardFile(null)
      setRateCardData(null)
    }
    setValidationResults(null)
  }

  const clearAll = () => {
    setBaseFile(null)
    setQuoteFile(null)
    setRateCardFile(null)
    setBaseData(null)
    setQuoteData(null)
    setRateCardData(null)
    setValidationResults(null)
  }

  const allFilesUploaded = baseFile && quoteFile

  const runValidation = async () => {
    if (!baseData || !quoteData) {
      alert('Please upload both Base File (Invoice) and Quote File before running validation.')
      return
    }
    setValidationRunning(true)
    setValidationProgress(0)
    let config = rateCardConfig
    if (!config && rateCardData) {
      try {
        const res = await fetch('/rate-card-types.json')
        if (res.ok) config = await res.json()
      } catch (_) {}
    }
    setTimeout(() => {
      try {
        const priceTol = (priceTolerance || 0) / 100
        const qtyTol = (qtyTolerance || 0) / 100
        const result = runValidationLogic(baseData, quoteData, {
          priceTolerance: priceTol,
          qtyTolerance: qtyTol,
          rateCardData: rateCardData || undefined,
          rateCardConfig: Array.isArray(config) ? config : undefined
        })
        setValidationResults(result)
      } catch (error) {
        console.error('Validation error:', error)
        alert('Error during validation: ' + error.message)
      }
      setValidationRunning(false)
      setValidationProgress(100)
    }, 100)
  }

  return (
    <div className="excel-validation-container">
      <header className="validation-header">
        <h1>Invoice vs Quote Validation</h1>
        <p>Two files: Base (Invoice line items) and Quote (Quote line items). Validate by PO, IBX, product/charge, price, and quantity.</p>
      </header>

      <div className="info-banner">
        <div className="info-icon">ℹ️</div>
        <div className="info-content">
          <strong>Quick Guide:</strong>
          <ul>
            <li><strong>Base File (Invoice):</strong> Book1-style with TRX_NUMBER, LINE_NUMBER, SERIAL_NUMBER, PO_NUMBER, IBX, ITEM_NUMBER/PRODUCT_CODE, DESCRIPTION, QUANTITY, UNIT_SELLING_PRICE, LINE_LEVEL_AMOUNT. Optional: BILLING_FROM, BILLING_TILL.</li>
            <li><strong>Quote File:</strong> Po Number, Site ID/IBX, Item Code, Item Description, Changed Item Description, Quantity, Unit Price (OTC/MRC). Optional: service_start_date, initial_term, term, Initial_term_Increment, Increment, contract_period_in_months.</li>
          </ul>
          <p className="tip">Outcomes: <strong>Passed</strong> (all match), <strong>Failed</strong> (e.g. price/quantity anomaly), <strong>Skipped</strong> (no QLIs or no matching QLI; upload Rate Card to validate).</p>
          <p className="tip">Optional <strong>Rate Card File</strong>: Upload to validate &quot;Skipped&quot; lines against rate card (Space &amp; Power, Power Install NRC, Secure Cabinet Express, etc.). Uses same price tolerance. Config: <code>public/rate-card-types.json</code>.</p>
        </div>
      </div>

      <div className="upload-section-grid two-files">
        <div className="upload-card main-file">
          <div className="upload-card-header">
            <h3><span className="file-icon">📄</span> Base File (Invoice Line Items)</h3>
          </div>
          {!baseFile ? (
            <label className="upload-area">
              <input type="file" accept=".xlsx,.xls" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'base')} className="file-input-hidden" />
              <div className="upload-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                <p className="upload-text">Click to upload Base Excel file (e.g. Book1 test 2)</p>
                <p className="upload-hint">.xlsx / .xls</p>
              </div>
            </label>
          ) : (
            <div className="file-info">
              <div className="file-details">
                <p className="file-name"><strong>{baseFile.name}</strong></p>
                <div className="file-stats">
                  <span className="stat-badge">📊 {baseFile.rowCount.toLocaleString()} rows</span>
                  <span className="stat-badge">📋 {baseFile.columns.length} columns</span>
                </div>
                <div className="column-preview">
                  <strong>Columns:</strong>
                  <div className="column-tags">
                    {baseFile.columns.slice(0, 6).map((col, idx) => <span key={idx} className="column-tag">{col}</span>)}
                    {baseFile.columns.length > 6 && <span className="column-tag more">+{baseFile.columns.length - 6} more</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => clearFile('base')} className="clear-btn">Remove</button>
            </div>
          )}
        </div>

        <div className="upload-card ref-file">
          <div className="upload-card-header">
            <h3><span className="file-icon">📘</span> Quote File (Quote Line Items)</h3>
          </div>
          {!quoteFile ? (
            <label className="upload-area">
              <input type="file" accept=".xlsx,.xls" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'quote')} className="file-input-hidden" />
              <div className="upload-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                <p className="upload-text">Click to upload Quote Excel file</p>
                <p className="upload-hint">.xlsx / .xls</p>
              </div>
            </label>
          ) : (
            <div className="file-info">
              <div className="file-details">
                <p className="file-name"><strong>{quoteFile.name}</strong></p>
                <div className="file-stats">
                  <span className="stat-badge">📊 {quoteFile.rowCount.toLocaleString()} rows</span>
                  <span className="stat-badge">📋 {quoteFile.columns.length} columns</span>
                </div>
                <div className="column-preview">
                  <strong>Columns:</strong>
                  <div className="column-tags">
                    {quoteFile.columns.slice(0, 6).map((col, idx) => <span key={idx} className="column-tag">{col}</span>)}
                    {quoteFile.columns.length > 6 && <span className="column-tag more">+{quoteFile.columns.length - 6} more</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => clearFile('quote')} className="clear-btn">Remove</button>
            </div>
          )}
        </div>

        <div className="upload-card ref-file rate-card">
          <div className="upload-card-header">
            <h3><span className="file-icon">📋</span> Rate Card File (Optional)</h3>
          </div>
          {!rateCardFile ? (
            <label className="upload-area">
              <input type="file" accept=".xlsx,.xls" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'ratecard')} className="file-input-hidden" />
              <div className="upload-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                <p className="upload-text">Click to upload Rate Card Excel (optional)</p>
                <p className="upload-hint">Validates &quot;For Rate Card&quot; lines</p>
              </div>
            </label>
          ) : (
            <div className="file-info">
              <div className="file-details">
                <p className="file-name"><strong>{rateCardFile.name}</strong></p>
                <div className="file-stats">
                  <span className="stat-badge">📊 {rateCardFile.rowCount.toLocaleString()} rows</span>
                  <span className="stat-badge">📋 {rateCardFile.columns.length} columns</span>
                </div>
              </div>
              <button onClick={() => clearFile('ratecard')} className="clear-btn">Remove</button>
            </div>
          )}
        </div>
      </div>

      {allFilesUploaded && (
        <>
          <div className="tolerance-section">
            <h4>Tolerance Settings</h4>
            <div className="tolerance-inputs">
              <label>
                Price tolerance (%): <input type="number" min="0" max="100" step="0.5" value={priceTolerance} onChange={(e) => setPriceTolerance(Number(e.target.value) || 0)} />
              </label>
              <label>
                Quantity tolerance (%): <input type="number" min="0" max="100" step="1" value={qtyTolerance} onChange={(e) => setQtyTolerance(Number(e.target.value) || 0)} />
              </label>
            </div>
            <p className="tolerance-hint">E.g. 5% price tolerance: invoice unit price can be up to CUP × 1.05. 20% quantity: invoice qty can be up to quote qty × 1.20.</p>
          </div>

          {validationRunning && (
            <div className="progress-section">
              <div className="progress-info"><span>Processing validation...</span><span className="progress-percent">{validationProgress}%</span></div>
              <div className="progress-bar-container"><div className="progress-bar" style={{ width: `${validationProgress}%` }}></div></div>
            </div>
          )}

          <div className="action-section">
            <button onClick={runValidation} className="validate-btn" disabled={validationRunning}>
              {validationRunning ? <><span className="spinner-small"></span> Running Validation... {validationProgress}%</> : <>Run Validation</>}
            </button>
            <button onClick={clearAll} className="clear-all-btn">Clear All Files</button>
          </div>
        </>
      )}

      {validationResults && validationResults.status === 'completed' && (
        <ValidationResults results={validationResults} />
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading file...</p>
        </div>
      )}
    </div>
  )
}

export default ExcelValidation

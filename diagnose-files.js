import XLSX from 'xlsx';
import fs from 'fs';

// File paths
const files = {
  mainFile: './x_attm_doms_vendor_invoice.xlsx',
  ref1File: './Book1 test 2.xlsx',
  ref2File: './x_attm_doms_doms_quotation_line_items (3).xlsx'
};

console.log('🔍 EXCEL FILES DIAGNOSTIC TOOL\n');
console.log('=' .repeat(80));

// Helper to extract unique values
function extractUniqueValues(data, columnVariants) {
  const values = new Set();
  
  data.forEach(row => {
    for (const variant of columnVariants) {
      if (row[variant] !== undefined && row[variant] !== null && row[variant] !== '') {
        values.add(row[variant].toString().trim());
        break;
      }
    }
  });
  
  return Array.from(values).sort();
}

// Read and analyze each file
Object.entries(files).forEach(([fileType, filePath]) => {
  console.log(`\n📄 Analyzing: ${filePath}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ File not found!`);
      return;
    }
    
    // Read the workbook
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`   ✅ File loaded successfully`);
    console.log(`   📊 Sheet: "${sheetName}"`);
    console.log(`   📋 Total rows: ${data.length.toLocaleString()}`);
    console.log(`   📋 Columns: ${Object.keys(data[0] || {}).length}`);
    
    // Show first few column names
    if (data.length > 0) {
      const columns = Object.keys(data[0]);
      console.log(`\n   📝 Column names (first 10):`);
      columns.slice(0, 10).forEach(col => {
        console.log(`      - "${col}"`);
      });
      if (columns.length > 10) {
        console.log(`      ... and ${columns.length - 10} more columns`);
      }
    }
    
    // Extract PO numbers
    console.log(`\n   🔍 Extracting PO Numbers...`);
    const poVariants = [
      'PO_NUMBER', 'po_number', 'PO_Number', 'Po_Number', 'PO Number',
      'Po Number', 'PO NUMBER', 'PONumber', 'purchase_order', 'PURCHASE_ORDER'
    ];
    const poNumbers = extractUniqueValues(data, poVariants);
    
    if (poNumbers.length > 0) {
      console.log(`   ✅ Found ${poNumbers.length} unique PO numbers`);
      console.log(`   📋 First 10 PO numbers:`);
      poNumbers.slice(0, 10).forEach(po => {
        console.log(`      "${po}"`);
      });
      if (poNumbers.length > 10) {
        console.log(`      ... and ${poNumbers.length - 10} more`);
      }
    } else {
      console.log(`   ❌ No PO numbers found! Tried these column names:`);
      poVariants.slice(0, 5).forEach(v => console.log(`      - "${v}"`));
    }
    
    // Extract Site IDs
    console.log(`\n   🔍 Extracting Site IDs...`);
    const siteVariants = [
      'IBX', 'ibx', 'site_id', 'SITE_ID', 'Site_Id', 'SiteId',
      'ibx_center', 'IBX_CENTER', 'Number', 'number'
    ];
    const siteIds = extractUniqueValues(data, siteVariants);
    
    if (siteIds.length > 0) {
      console.log(`   ✅ Found ${siteIds.length} unique Site IDs`);
      console.log(`   📋 All Site IDs:`);
      siteIds.forEach(site => {
        console.log(`      "${site}"`);
      });
    } else {
      console.log(`   ❌ No Site IDs found! Tried these column names:`);
      siteVariants.slice(0, 5).forEach(v => console.log(`      - "${v}"`));
    }
    
    // For Reference File 1, also extract Invoice Numbers
    if (fileType === 'ref1File') {
      console.log(`\n   🔍 Extracting Invoice Numbers...`);
      const invoiceVariants = [
        'Invoice Number', 'INVOICE NUMBER', 'Invoice_Number', 
        'TRX_NUMBER', 'trx_number', 'invoice_number'
      ];
      const invoiceNumbers = extractUniqueValues(data, invoiceVariants);
      
      if (invoiceNumbers.length > 0) {
        console.log(`   ✅ Found ${invoiceNumbers.length} unique Invoice numbers`);
        console.log(`   📋 First 5 Invoice numbers:`);
        invoiceNumbers.slice(0, 5).forEach(inv => {
          console.log(`      "${inv}"`);
        });
        if (invoiceNumbers.length > 5) {
          console.log(`      ... and ${invoiceNumbers.length - 5} more`);
        }
      }
    }
    
    console.log('\n' + '─'.repeat(80));
    
  } catch (error) {
    console.log(`   ❌ Error reading file: ${error.message}`);
  }
});

// Cross-file comparison
console.log('\n\n🔄 CROSS-FILE COMPARISON');
console.log('=' .repeat(80));

try {
  // Read all files
  const mainWorkbook = XLSX.readFile(files.mainFile);
  const mainData = XLSX.utils.sheet_to_json(mainWorkbook.Sheets[mainWorkbook.SheetNames[0]]);
  
  const ref2Workbook = XLSX.readFile(files.ref2File);
  const ref2Data = XLSX.utils.sheet_to_json(ref2Workbook.Sheets[ref2Workbook.SheetNames[0]]);
  
  // Extract PO numbers from both
  const poVariants = ['PO_NUMBER', 'po_number', 'PO_Number', 'Po_Number', 'PO Number', 'Po Number'];
  const mainPOs = new Set(extractUniqueValues(mainData, poVariants));
  const ref2POs = new Set(extractUniqueValues(ref2Data, poVariants));
  
  console.log(`\n📊 PO Number Comparison:`);
  console.log(`   Main File: ${mainPOs.size} unique PO numbers`);
  console.log(`   Ref File 2: ${ref2POs.size} unique PO numbers`);
  
  // Find POs in Main but not in Ref2
  const missingInRef2 = Array.from(mainPOs).filter(po => !ref2POs.has(po));
  
  if (missingInRef2.length > 0) {
    console.log(`\n   ⚠️  ISSUE FOUND: ${missingInRef2.length} PO numbers in Main File NOT found in Reference File 2:`);
    missingInRef2.slice(0, 20).forEach(po => {
      console.log(`      ❌ "${po}"`);
    });
    if (missingInRef2.length > 20) {
      console.log(`      ... and ${missingInRef2.length - 20} more missing POs`);
    }
  } else {
    console.log(`\n   ✅ All PO numbers from Main File exist in Reference File 2`);
  }
  
  // Site ID comparison
  const siteVariants = ['IBX', 'ibx', 'site_id', 'SITE_ID', 'Site_Id', 'Number', 'number'];
  const mainSites = new Set(extractUniqueValues(mainData, siteVariants));
  const ref2Sites = new Set(extractUniqueValues(ref2Data, siteVariants));
  
  console.log(`\n📊 Site ID Comparison:`);
  console.log(`   Main File: ${mainSites.size} unique Site IDs`);
  console.log(`   Ref File 2: ${ref2Sites.size} unique Site IDs`);
  
  console.log(`\n   Main File Site IDs:`);
  Array.from(mainSites).forEach(site => console.log(`      "${site}"`));
  
  console.log(`\n   Ref File 2 Site IDs:`);
  Array.from(ref2Sites).forEach(site => console.log(`      "${site}"`));
  
  // Check for PO + Site combinations
  console.log(`\n\n🔍 DETAILED COMBINATION ANALYSIS`);
  console.log('=' .repeat(80));
  
  // Sample a few records from Main File
  console.log(`\nChecking first 10 records from Main File:\n`);
  
  mainData.slice(0, 10).forEach((row, idx) => {
    // Extract PO
    let mainPO = '';
    for (const variant of poVariants) {
      if (row[variant] !== undefined && row[variant] !== null && row[variant] !== '') {
        mainPO = row[variant].toString().trim();
        break;
      }
    }
    
    // Extract Site ID
    let mainSite = '';
    for (const variant of siteVariants) {
      if (row[variant] !== undefined && row[variant] !== null && row[variant] !== '') {
        mainSite = row[variant].toString().trim();
        break;
      }
    }
    
    console.log(`Record ${idx + 1}: PO="${mainPO}", Site="${mainSite}"`);
    
    // Check if this PO exists in Ref2
    const matchingQuotesForPO = ref2Data.filter(ref2Row => {
      let ref2PO = '';
      for (const variant of poVariants) {
        if (ref2Row[variant] !== undefined && ref2Row[variant] !== null && ref2Row[variant] !== '') {
          ref2PO = ref2Row[variant].toString().trim();
          break;
        }
      }
      return ref2PO.toUpperCase() === mainPO.toUpperCase();
    });
    
    if (matchingQuotesForPO.length === 0) {
      console.log(`   ❌ PO not found in Ref File 2`);
    } else {
      console.log(`   ✅ Found ${matchingQuotesForPO.length} quote(s) with this PO`);
      
      // Check site IDs
      const quoteSites = matchingQuotesForPO.map(ref2Row => {
        for (const variant of siteVariants) {
          if (ref2Row[variant] !== undefined && ref2Row[variant] !== null && ref2Row[variant] !== '') {
            return ref2Row[variant].toString().trim();
          }
        }
        return '';
      });
      
      const uniqueQuoteSites = [...new Set(quoteSites.filter(s => s))];
      
      if (uniqueQuoteSites.length > 0) {
        console.log(`   📋 Quote Site IDs for this PO: [${uniqueQuoteSites.join(', ')}]`);
        
        if (!uniqueQuoteSites.some(s => s.toUpperCase() === mainSite.toUpperCase())) {
          console.log(`   ⚠️  Site ID mismatch! Main has "${mainSite}", Quote has [${uniqueQuoteSites.join(', ')}]`);
        } else {
          console.log(`   ✅ Site ID matches!`);
        }
      }
    }
    console.log('');
  });
  
} catch (error) {
  console.log(`❌ Error during comparison: ${error.message}`);
}

console.log('\n' + '='.repeat(80));
console.log('DIAGNOSIS COMPLETE');
console.log('='.repeat(80));

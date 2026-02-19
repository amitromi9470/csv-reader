# Test Data (50+ rows each)

Three Excel files for **positive and negative** validation scenarios, including **rate card** validation.

## Files

| File | Rows | Description |
|------|------|-------------|
| **Base_Test_Invoice.xlsx** | 56 | Invoice line items (ILI): quote-match positive, quote negative, rate card scenarios |
| **Quote_Test.xlsx** | 55 | Quote line items (QLI) for PO001–PO005, multiple sites |
| **Rate_Card_Test.xlsx** | 57 | Rate card rows: Space & Power, Power Install NRC, Secure Cabinet, Cabinet Install NRC, Interconnection, Smart Hands, Equinix Precision Time; 2 rows with ICB flag |

## Base file scenarios (56 rows)

- **Rows 1–20:** **Positive (quote)** – PO001–PO005, sites DA1/CH1/AM2/DA2/CH2, SVC-001/SVC-002; should **Pass** when validated with Quote file.
- **Rows 21–32:** **Negative (quote)** – No PO (PO999), wrong price, excess quantity, zero charge; expect **Failed** or **For Rate Card Validation**.
- **Rows 33–55:** **Rate card** – No quote (PO-RC); descriptions: AC Power kVA, Metered Power kVA, Smart Hands NRC, Cabinet Installation, Cage Installation, Cross Connect, Equinix Precision Time. Rows 52–54 have missing **Service Start Date** (skipped). Row 54 is zero price (pass). Row 56 is **AC Power kVA** with high price (rate card fail).
- **Row 56:** **Rate card fail** – AC Power kVA with unit price 500 (above rate card); expect **Failed** when rate card file is used.

## Quote file

- Covers **PO001–PO005** with Site ID DA1, CH1, AM2, DA2, CH2.
- Item Code SVC-001 / SVC-002, OTC 10 / 100, contract terms and dates set for validation.

## Rate card file

- **u_rate_card_sub_type:** Space & Power, Power Install NRC, Secure Cabinet Express, Cabinet Install NRC, Interconnection, Smart Hands, Equinix Precision Time.
- **u_country / u_region:** United States / Americas (and one UK/EMEA).
- **u_effective_from / effective_till:** 2024-01-01 to 2026-12-31.
- **u_pricekva, u_rate, u_nrc** and Precision Time fields set for price validation.
- **2 rows** with **u_icb_flag: true** – these are skipped in rate card validation.

## How to run

1. **Excel Validation** tab → Upload **Base**: `Base_Test_Invoice.xlsx`.
2. Upload **Quote**: `Quote_Test.xlsx`.
3. (Optional) Upload **Rate Card**: `Rate_Card_Test.xlsx`.
4. Set **Price tolerance** (e.g. 5%) and **Quantity tolerance** (e.g. 20%).
5. Click **Run Validation**.

Expected: mix of **Passed**, **Failed**, and **For Rate Card Validation**; with rate card file, some “For Rate Card” lines become **Passed** or **Failed** after rate card validation.

## Regenerate

From project root:

```bash
node create-test-files.js
```

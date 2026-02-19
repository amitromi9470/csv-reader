# Rate Card Validation

For invoice lines that get **"For Rate Card Validation"** (no matching quote), you can optionally run **rate card validation** by uploading a Rate Card Excel file. The app uses the same **price tolerance** as quote validation.

## Config: `public/rate-card-types.json`

This JSON defines how to match invoice **charge_description** to rate card types (Space & Power, Power Install NRC, Secure Cabinet Express, Cabinet Install NRC, Interconnection, Smart Hands, Equinix Precision Time). It is loaded automatically from `/rate-card-types.json` (Vite serves `public/` at root).

Structure: array of 7 objects, one per type:

- `[0].space_and_power`
- `[1].power_install_nrc`
- `[2].secure_cabinet_express`
- `[3].cabinet_install_nrc`
- `[4].interconnection`
- `[5].smart_hands`
- `[6].equinix_precision_time`

Each value is an array of `{ key, subkey[], fields[] }` used to match `charge_description` and to filter rate card rows.

## Logic (aligned with ServiceNow RateCardDataHandlerUtils)

1. **Service Start Date**  
   If ILI has no `service_start_date` → **Skipped** (remain "For Rate Card Validation" with remarks).

2. **Find rate card**  
   - Match ILI `charge_description` to a type using `rate-card-types.json` (key/subkey).
   - Filter rate card rows by: `u_rate_card_sub_type`, country, region, `u_effective_from` / `effective_till` vs ILI `service_start_date`.
   - If type has `fields`, require those rate card field values to appear in `charge_description`.
   - If **ICB** flag on rate card → **Skipped**.

3. **Unit price from rate card (CUP)**  
   - **Space & Power** → `u_pricekva`  
   - **Power Install NRC** → `u_rate`  
   - **Secure Cabinet Express** → `u_pricekva`  
   - **Cabinet Install NRC** → `u_nrc`  
   - **Interconnection** → `u_nrc`  
   - **Smart Hands** → `u_rate` (NRC only; MRC/monthly skipped)  
   - **Equinix Precision Time** → Standard/Enterprise × NTP/PTP fields (`u_std_ntp_non_red`, etc.)

4. **ILI unit price**  
   - If missing but LLA and Quantity present: **Unit Price = LLA / Quantity**.

5. **Validation**  
   - If **both** ILI unit price and rate card unit price are **0** → **Passed**.  
   - If **ILI unit price > CUP × (1 + tolerance)** → **Failed**.  
   - Otherwise → **Passed**.

## Rate Card Excel columns (examples)

- `u_rate_card_sub_type` (e.g. "Space & Power", "Power Install NRC")
- `u_country`, `u_region`
- `u_effective_from`, `effective_till`
- `u_pricekva`, `u_rate`, `u_nrc`
- For Precision Time: `u_std_ntp_non_red`, `u_std_ptp_non_red`, `u_ent_ntp_non_red`, `u_ent_ptp_non_red`
- `u_icb_flag` (if true, line is skipped)
- Optional: `u_minimum_cabinet_density`, `u_amps`, `u_volt`, `u_goods_services`, `u_parameter1`, etc.

Column names are matched case-insensitively where applicable.

## UI

- **Optional** third upload: **"Rate Card File (Optional)"**.
- If uploaded, after main validation every line in **"For Rate Card Validation"** is run through rate card validation; results are updated to **Passed** or **Failed** (or stay **For Rate Card Validation** with remarks if skipped).
- Config is loaded once from `/rate-card-types.json`; you can replace `public/rate-card-types.json` to change behavior.

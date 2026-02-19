# Validation Logic — Pseudocode

## Overview

For each **Invoice Line Item (ILI)** we get its PO, find matching **Quote Line Items (QLI)** by PO, then try to match one QLI by IBX → Product/Charge → Unit Price & LLA → Quantity. Outcomes: **Passed**, **Failed**, or **For Rate Card Validation**.

---

## Main Loop (per ILI)

```
FUNCTION run_validation(base_data, quote_data, options):
    by_PO = INDEX quote_data BY PO number   // one lookup per PO
    cumulative_qty_map = {}   // key = "PO|product_or_description"

    FOR EACH ili IN base_data:
        po = GET PO number FROM ili
        qlis = by_PO[po]   // all quote lines for this PO

        IF qlis is EMPTY:
            MARK ili AS "For Rate Card Validation"
            REMARKS = "No matching quote line items for this PO number."
            CONTINUE to next ili

        result, remarks = VALIDATE_ili_against_qlis(ili, qlis, options, cumulative_qty_map)

        IF result == "validated":
            MARK ili AS "Passed"
        ELSE IF result == "failed":
            MARK ili AS "Failed"
        ELSE:
            MARK ili AS "For Rate Card Validation"
            REMARKS = "No QLI matched (IBX/product/charge/price/quantity)."

    RETURN all results with counts (passed, failed, for_rate_card_validation)
```

---

## Validate Single ILI Against List of QLIs

```
FUNCTION validate_ili_against_qlis(ili, qlis, options, cumulative_qty_map):
    price_tolerance = options.price_tolerance   // e.g. 0.05 = 5%
    qty_tolerance   = options.qty_tolerance     // e.g. 0.20 = 20%
    today           = options.today or NOW()

    EXTRACT FROM ili:
        po, ibx, item_code, charge_description,
        quantity, unit_price, lla

    // ----- Early exit: no charge -----
    IF unit_price == 0 AND lla == 0:
        RETURN (result = "validated", remarks = "Unit Price and LLA are zero; no charge.")

    // ----- Derive unit price if missing -----
    IF unit_price is MISSING or 0 AND lla is present AND quantity > 0:
        unit_price = lla / quantity

    // ----- Try each QLI until one matches or we fail -----
    FOR EACH qli IN qlis:

        // --- Step 1: IBX (Site ID) ---
        qli_site_id = GET Site ID FROM qli
        IF qli_site_id is present AND ibx is present:
            IF qli_site_id != ibx (case-insensitive):
                CONTINUE to next qli   // this QLI doesn't match site

        // --- Step 2: Product Code & Charge Description ---
        qli_product_code = GET Product Code FROM qli
        qli_charge_desc  = GET Charge Description FROM qli
        qli_change_desc  = GET Changed Item Description FROM qli

        product_or_desc_match = FALSE

        IF item_code is present AND qli_product_code is present:
            product_or_desc_match = (normalize(item_code) == normalize(qli_product_code))

        IF NOT product_or_desc_match:
            IF item_code is missing OR qli_product_code is missing:
                IF charge_description matches qli_charge_desc (normalized):
                    product_or_desc_match = TRUE
                IF NOT product_or_desc_match AND charge_description matches qli_change_desc:
                    product_or_desc_match = TRUE

        IF NOT product_or_desc_match:
            CONTINUE to next qli

        // --- Step 3: Unit Price and Line-Level Amount (LLA) ---
        CUP = COMPUTE_current_unit_price(qli, today)   // see below
        IF CUP is missing or <= 0:
            CONTINUE to next qli

        PF = prorata_factor(ili)   // (billing_till - billing_from) / days_in_month; default 1

        IF unit_price > CUP * (1 + price_tolerance):
            RETURN (result = "failed", remarks = "Unit price exceeds CUP*(1+tolerance)")

        ELLA = CUP * quantity * PF
        IF lla > ELLA * (1 + price_tolerance):
            RETURN (result = "failed", remarks = "LLA exceeds ELLA*(1+tolerance)")

        // --- Step 4: Quantity ---
        key = "PO" + "|" + (item_code or charge_description or "desc")
        cum_inv_qty = (cumulative_qty_map[key] or 0) + quantity
        cumulative_qty_map[key] = cum_inv_qty

        contract_period_months = GET contract_period_in_months FROM qli (default 12)
        qli_quantity = GET Quantity FROM qli

        allowed_qty = contract_period_months * qli_quantity
        IF cum_inv_qty > allowed_qty:
            RETURN (result = "failed", remarks = "Cumulative invoice quantity exceeds allowed from contract")

        IF quantity > qli_quantity * (1 + qty_tolerance):
            RETURN (result = "failed", remarks = "Quantity exceeds quote quantity*(1+tolerance)")

        // All checks passed for this QLI
        RETURN (result = "validated", remarks = "All validations passed.")

    // No QLI matched
    RETURN (result = null, remarks = "")
```

---

## Compute Current Unit Price (CUP) of QLI

```
FUNCTION compute_current_unit_price(qli, today):
    unit_price     = GET Unit Price (or OTC/MRC) FROM qli
    service_start  = GET service_start_date FROM qli
    initial_term   = GET initial_term (months) FROM qli, default 12
    term           = GET term (months) FROM qli, default 12
    initial_inc    = GET Initial_term_Increment FROM qli (as decimal, e.g. 0.05 for 5%)
    increment      = GET Increment FROM qli (as decimal, e.g. 0.03 for 3%)

    IF service_start is missing:
        RETURN unit_price

    end_initial   = service_start + initial_term months
    end_first_term = end_initial + term months

    IF today < service_start:
        RETURN unit_price   // same as initial period
    IF today < end_initial:
        RETURN unit_price
    IF today < end_first_term:
        RETURN unit_price * (1 + initial_inc)
    ELSE:
        num_completed_terms = FLOOR((today - end_initial) / term)
        RETURN unit_price * (1 + initial_inc) * (1 + increment) ^ num_completed_terms
```

---

## Prorata Factor (PF)

```
FUNCTION prorata_factor(ili):
    billing_from = GET BILLING_FROM or INVOICE_START_DATE FROM ili
    billing_till = GET BILLING_TILL or INVOICE_END_DATE FROM ili

    IF billing_from or billing_till is missing:
        RETURN 1

    total_days_in_month = number of days in month of billing_from
    days_covered = (billing_till - billing_from) in days (+ 1 for inclusive)
    RETURN MIN(1, days_covered / total_days_in_month)
```

---

## Helper: Normalize Text (for product/description match)

```
FUNCTION normalize(text):
    remove non-alphanumeric, collapse spaces, trim, lowercase
    RETURN normalized string

FUNCTION description_match(a, b):
    RETURN normalize(a) == normalize(b) OR one contains the other (normalized)
```

---

## Outcome Summary

| Outcome                     | When |
|----------------------------|------|
| **Passed**                 | At least one QLI matched and all checks (IBX, product/charge, unit price, LLA, cumulative qty, line qty) passed; or unit price and LLA are both zero. |
| **Failed**                 | A QLI matched up to a point but failed on unit price, LLA, cumulative quantity, or line quantity. |
| **For Rate Card Validation** | No QLIs for this PO; or no QLI passed IBX/product/charge/price/quantity. |

---

## Data Needed

**From ILI (base file):**  
PO number, IBX (site), Item code / Product code, Charge description, Quantity, Unit selling price, Line-level amount; optional: Billing from, Billing till.

**From QLI (quote file):**  
PO number, Site ID, Item code, Charge description, Changed item description, Quantity, Unit price (OTC/MRC), service_start_date, initial_term, term, Initial_term_Increment, Increment, contract_period_in_months.

**Options:**  
price_tolerance (e.g. 0.05), qty_tolerance (e.g. 0.20), today (date).

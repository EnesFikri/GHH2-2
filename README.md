# DiaLens – Hypoglycemia Risk Lens in Time View
A Case using Insulin ePIs - Time Annotated

DiaLens is a FHIR-based **“lens”** designed to highlight **hypoglycemia risk** for people using insulin.
It takes structured electronic Product Information (ePI) for insulins (e.g., **Humalog**, **Levemir**) and turns it into a **time-based, patient-aware view** of:

* Onset, peak, and duration of insulin action
* Factors that **increase** or **reduce** insulin effect
* Personalized **hypoglycemia risk profile**
* Clear **“what I might feel”** symptoms summary
* Simple **emergency instructions** on what to do if things go wrong

DiaLens focuses specifically on **time effect + hypo risk**.

---

## Aisha: The Persona Vector Behind DiaLens

DiaLens is built with a concrete user in mind: **Aisha**.

**Aisha’s profile (simplified):**

* Age: Adult (18–64)
* Diabetes: **Type 2**, on insulin for ~3 years
* Current insulin: Rapid-acting (e.g., Humalog) + basal (e.g., Levemir)
* Kidney function: **Impaired**
* Adherence: Sometimes misses or delays injections, rarely checks glucose
* Lifestyle:

  * Desk job
  * Lives with family in an urban area
  * Religious fasting this week

For Aisha, reading a full insulin leaflet is overwhelming. She doesn’t need 30 pages of text — she needs:

* *“When is this insulin strongest in my body?”*
* *“At what times am I more likely to go low?”*
* *“What should I watch out for during fasting?”*
* *“What do I do if I feel hypo?”*

DiaLens tries to answer exactly these questions.

---

## What DiaLens Does

Given an insulin ePI (as FHIR resources with annotated **onset / peak / duration** and **modifying factors**), DiaLens:

1. **Parses the insulin action profile**

   * Onset (start of effect, in hours)
   * Peak (time window of strongest effect)
   * Duration (total effect window)

2. **Maps this to a daily risk timeline**

   * Builds an estimated **hypoglycemia risk curve** over time
   * Marks **high-risk zones** (e.g., overlapping Humalog peak + Levemir background + fasting)

3. **Highlights factors that change insulin effect**

   * Increased effect:

     * Kidney problems
     * Missed meals / fasting
     * High physical activity
     * Alcohol, certain medicines
   * Reduced effect:

     * Large meals / high carbs
     * Infection / illness
     * Steroids / some other medicines

4. **Generates a patient-friendly summary on screen**

   * Plain language explanation like:
     *“Your rapid insulin starts working in about 15 minutes, is strongest around 1–2 hours, and lasts up to 4–5 hours.”*
   * Quick **“You may feel hypo when…”** summary based on the timeline
   * List of **early, moderate, and severe** hypoglycemia symptoms
   * **Emergency instructions** (e.g., fast carbs now, recheck, call emergency – as generic information, not prescriptions)

5. **Outputs HTML with highlighted sections**

   * Adds CSS classes to highlight relevant text in the ePI
   * Can be used inside a **smartphone UI** to show:

     * Mini chart/graphic of onset–peak–duration
     * Short text cards for risk and actions

---

## How It Works

DiaLens JavaScript follows

* Exports two main functions:

  * `getSpecification()` – returns lens metadata (e.g., version, name)
  * `enhance()` – core function that:

    * Receives ePI content (HTML) + FHIR-based categories/annotations
    * Processes the DOM with **JSDOM** (server-side) or `document` (browser)
    * Finds sections about:

      * Pharmacokinetics (onset/peak/duration)
      * Warnings for hypoglycemia
      * Interactions and special populations (e.g., renal impairment, fasting)
    * Adds:

      * Highlight classes for time-effect regions
      * A container summary block with:

        * Timelines for Humalog & Levemir
        * Text summary of hypoglycemia risk
        * Symptom checklist & emergency instructions

You can plug this into the same **focusing service** that already supports the `diabetes-lens`.

---

## Repository Structure (Suggested)

```text
.
├─ dialens-library.json      # FHIR Library resource for DiaLens
├─ dialens.js                # Lens logic (based on diabetes-lens style)
├─ demo/
│  ├─ index.html             # Smartphone-style demo screen + visualization
│  └─ mock-epi-humalog.json  # Sample insulin ePI bundle
├─ docs/
│  └─ persona-aisha.md       # Full Aisha persona description
└─ README.md                 # This file
```

---

## Example Workflow (Aisha + Humalog + Levemir)

1. Aisha’s FHIR **Patient/IPS** record contains:

   * Type 2 diabetes
   * Rapid insulin (Humalog)
   * Basal insulin (Levemir)
   * Kidney problems
   * Currently fasting

2. The system fetches the **ePI bundles** for Humalog & Levemir and passes them through DiaLens.

3. DiaLens:

   * Reads onset/peak/duration annotations for each insulin
   * Combines them into a **24-hour risk curve**
   * Applies modifiers:

     * Renal impairment → stronger / longer insulin effect
     * Fasting → higher hypo risk between doses
   * Generates a smartphone-friendly summary:

     * When Aisha is most likely to feel hypo
     * What symptoms to look for
     * What steps to take if she feels low

4. The UI renders:

   * A **simple timeline graphic** (e.g., colored bars for onset–peak–duration)
   * Text cards for:

     * “Your insulin timing”
     * “When you might feel low”
     * “What to do in an emergency”

---

## Getting Started

> This is a conceptual guide

1. Clone the repo
2. Install dependencies (if using Node/JSDOM):

```bash
npm install jsdom
```

3. Import and use the lens:

```js
const { enhance, getSpecification } = require('./dialens');

const html = /* ePI HTML */;
const categories = /* insulin timing + modifiers */;
const enhancedHtml = await enhance(categories, 'highlight');
```

4. Serve `demo/index.html` to see the **smartphone-style summary**.

---

## Safety & Disclaimer

DiaLens is **not** a medical device and **does not replace** professional medical advice.

It:

* Does **not** calculate or recommend insulin doses
* Provides **informational highlighting and summaries only**
* Must be used in systems that clearly state that **treatment decisions belong to healthcare professionals and patients working together**

Always validate content and behavior with clinicians before using DiaLens in any real-world setting.

---

## Contributing

Pull requests, issues, and ideas are welcome — especially around:

* Better modeling of hypoglycemia risk
* Support for more insulin types and ePIs
* Improved visualizations and accessibility
* Localization and plain-language improvements

# Dialens – Hypoglycaemia-Aware Insulin ePI Lens

Dialens is a prototype “smart lens” that personalizes **insulin electronic product information (ePI)** using a **user persona vector** (sample patient: *Aisha*) and exposes the result as a **FHIR `Library` + JavaScript lens**.

The goal is to help users understand:

- **When** hypoglycaemia is most likely to occur (onset, peak, duration of insulin effect)
- **What can increase or reduce insulin effect**
- **What to do** if hypoglycaemia symptoms appear, including emergency instructions

---

## 1. Components

This repository connects three main building blocks:

### 1.1 Insulin ePI (FHIR Bundles)

- ePIs for insulin products (e.g. **Humalog**, **Levemir**) are represented as FHIR `Bundle` resources.
- Each ePI is **time-annotated** with:
  - **Onset** of action (e.g. minutes after injection)
  - **Peak** effect (e.g. time window with highest effect)
  - **Duration** of action (e.g. total hours of effect)
- Additional annotations capture **factors impacting insulin effect**, such as:
  - Reduced food intake / skipped meals
  - Physical activity
  - Alcohol use
  - Concomitant medicines that **enhance** or **reduce** insulin effect

These annotations are used by the lens to highlight relevant sections in the ePI text.

---

### 1.2 User Persona Vector (Sample: Aisha)

A sample patient, **Aisha**, is encoded as an IPS-like **FHIR Bundle** including:

- `Patient` demographics
- `Condition` resources (e.g. type of diabetes, comorbidities)
- `MedicationStatement` resources for **Humalog** and **Levemir** (current insulin therapy)
- Lifestyle and risk factors (where available)

From this bundle, we derive a **persona vector** with features such as:

- Age and sex
- Type(s) of insulin used (basal / bolus)
- Dosing pattern (e.g. once daily basal + mealtime bolus)
- Hypoglycaemia risk modifiers (e.g. exercise level, dietary patterns, other medicines)

Dialens uses this persona vector to **adapt what it highlights** and how risk summaries are generated.

---

### 1.3 Dialens (FHIR Library + JavaScript)

Dialens is implemented as a FHIR **`Library`** resource whose `content` is `application/javascript` (same style as the existing `diabetes-lens`).

The JavaScript lens typically provides functions like:

- `getSpecification()`  
  Returns information about the lens (version, name, etc.).

- `enhance(listOfCategories, enhanceTag, document, response)`  
  Takes:
  - A list of annotation categories (e.g. `insulin-onset`, `insulin-peak`, `insulin-duration`, `hypoglycemia-risk-factor`)
  - The ePI HTML document
  - The current rendered response string
  - Optionally, context from the persona vector

  And returns **annotated HTML** where:
  - Sections about onset, peak, and duration are highlighted
  - Sections describing factors that increase or reduce insulin effect are emphasized
  - A **personalized hypoglycaemia summary and emergency instructions** are injected into the HTML

The lens is designed to plug into a focusing service (e.g. Gravitate Health-style “focusing” API).

---

## 2. What Dialens Highlights

For each insulin ePI (Humalog, Levemir, etc.), Dialens:

1. **Time Effect of Insulin**
   - Onset of action  
   - Peak effect window  
   - Overall duration of action  

2. **Risk Modifiers**
   - Factors that **enhance** insulin effect → increase hypoglycaemia risk  
   - Factors that **reduce** insulin effect → increase hyperglycaemia risk  

3. **User-Facing Hypoglycaemia Summary**
   - Estimated **time windows** where hypoglycaemia is most likely after injection (based on onset/peak/duration annotations)
   - Common **hypoglycaemia symptoms** (e.g. sweating, trembling, dizziness, confusion)
   - **Emergency instructions**, such as:
     - Take fast-acting carbohydrates
     - Re-check glucose after treatment
     - When to contact a healthcare professional or emergency service
     - When to inform caregivers / family

This summary can be rendered above or alongside the official ePI content, without altering the original regulatory text.

---

## 3. How It Fits Together

Conceptual data flow:

```text
[Persona: Aisha] (IPS Bundle)
      │
      ├─► Persona vector (age, insulin regimen, risk factors)
      │
      ├─► Insulin ePI Bundle (Humalog / Levemir)
      │       └─ Annotated with onset, peak, duration, and risk modifiers
      │
      └─► Dialens (FHIR Library + JS lens)
              │
              ├─ Reads annotated sections from the ePI HTML
              ├─ Cross-references persona vector (e.g. basal–bolus regimen)
              ├─ Highlights key time + risk sections
              └─ Generates hypoglycaemia summary + emergency instructions

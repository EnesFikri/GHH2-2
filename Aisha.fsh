Instance: gravitate-Aisha
InstanceOf: Bundle-uv-ips
Title:   "Aisha Gravitate's IPS"
Usage: #example
Description: "Example of International Patient Summary for Aisha Gravitate"

* identifier.system = "https://www.gravitatehealth.eu/sid/doc"
* identifier.value = "Aisha-ips-1"
* type = #document
* timestamp = "2025-01-15T09:22:00+02:00"

* entry[0].fullUrl = "https://myserver.org/Composition/aisha-comp"
* entry[=].resource = aisha-comp

* entry[+].fullUrl = "https://myserver.org/Patient/aisha-patient"
* entry[=].resource = aisha-patient

* entry[+].fullUrl = "https://myserver.org/Practitioner/aisha-pract"
* entry[=].resource = aisha-pract

// Conditions
* entry[+].fullUrl = "https://myserver.org/Condition/aisha-cond-1"
* entry[=].resource = aisha-cond-1

* entry[+].fullUrl = "https://myserver.org/Condition/aisha-cond-2"
* entry[=].resource = aisha-cond-2

// Medication Statements
* entry[+].fullUrl = "https://myserver.org/MedicationStatement/aisha-med-stat-1" // Levemir
* entry[=].resource = aisha-med-stat-1

* entry[+].fullUrl = "https://myserver.org/MedicationStatement/aisha-med-stat-2" // Humalog
* entry[=].resource = aisha-med-stat-2

* entry[+].fullUrl = "https://myserver.org/MedicationStatement/aisha-med-stat-3" // ACE inhibitor
* entry[=].resource = aisha-med-stat-3

// Medications
* entry[+].fullUrl = "https://myserver.org/Medication/aisha-med-levemir"
* entry[=].resource = aisha-med-levemir

* entry[+].fullUrl = "https://myserver.org/Medication/aisha-med-humalog"
* entry[=].resource = aisha-med-humalog

* entry[+].fullUrl = "https://myserver.org/Medication/aisha-med-ace"
* entry[=].resource = aisha-med-ace


// ====================================================== COMPOSITION ======================================================
Instance: aisha-comp
InstanceOf: Composition
Title:   "Aisha Gravitate's IPS Composition"
Usage: #inline
Description: "International Patient Summary for Aisha Gravitate"

* id = "gravitate-Aisha"
* status = #final
* text.status = #generated
* text.div = "<div xmlns=\"http://www.w3.org/1999/xhtml\">" +
  "<b>Id:</b> gravitate-Aisha<br/>" +
  "<b>Status:</b> final<br/>" +
  "<b>Type:</b> Patient summary Document<br/>" +
  "<b>Subject:</b> Aisha Gravitate<br/>" +
  "<b>Clinical summary:</b><br/><ul>" +
  "<li>Type 2 diabetes mellitus, on insulin for 3 years</li>" +
  "<li>Chronic kidney disease (renal problem)</li>" +
  "</ul>" +
  "<b>Medication Summary:</b><br/><ul>" +
  "<li>Levemir (insulin detemir) - basal long-acting insulin</li>" +
  "<li>Humalog (insulin lispro) - rapid-acting insulin before meals</li>" +
  "<li>ACE inhibitor for kidney protection and blood pressure</li>" +
  "</ul>" +
  "<b>Lifestyle &amp; context:</b><br/><ul>" +
  "<li>Age group: 18-64 years, body weight 50-80 kg</li>" +
  "<li>Moderately active, desk job</li>" +
  "<li>Lives with family in an urban area, &lt;30 minutes from clinic</li>" +
  "<li>Religious fasting this week</li>" +
  "</ul>" +
  "</div>"

* type = $loinc#60591-5 "Patient summary Document"
* subject = Reference(aisha-patient) "Aisha Gravitate"
* date = "2025-01-15T09:22:00+02:00"
* author = Reference(aisha-pract) "Dr. Maria Lopez"
* title = "Patient Summary (Aisha Gravitate)"
* confidentiality = #N

// ====================================================== COMPOSITION SECTIONS ============================================
* section[+].title = "Problem List"
* section[=].code = $loinc#11450-4 "Problem list Reported"
* section[=].entry[0] = Reference(aisha-cond-1) "Type 2 diabetes mellitus"
* section[=].entry[+] = Reference(aisha-cond-2) "Chronic kidney disease"

* section[+].title = "Medication Summary"
* section[=].code = $loinc#10160-0 "Hx of Medication use"
* section[=].entry[0] = Reference(aisha-med-stat-1) "Levemir (insulin detemir) - basal insulin"
* section[=].entry[+] = Reference(aisha-med-stat-2) "Humalog (insulin lispro) - rapid-acting insulin"
* section[=].entry[+] = Reference(aisha-med-stat-3) "ACE inhibitor"


// ====================================================== PATIENT =========================================================
Instance: aisha-patient
InstanceOf: Patient
Usage: #inline

* extension.extension.url = "code"
* extension.extension.valueCodeableConcept = urn:iso:std:iso:3166#ES "Spain"
* extension.url = "http://hl7.org/fhir/StructureDefinition/patient-citizenship"

* text.status = #generated
* text.div = "<div xmlns=\"http://www.w3.org/1999/xhtml\">" +
  "Age group: 18-64 years (exact age not recorded).<br/>" +
  "Body weight: 50-80 kg.<br/>" +
  "Renal function status: Kidney problem (chronic kidney disease).<br/>" +
  "Pregnancy status: Not pregnant.<br/>" +
  "History of severe hypoglycemia: Once.<br/>" +
  "Vision &amp; sensory limitations: Normal vision.<br/>" +
  "Current blood glucose: Not entered yet.<br/><br/>" +
  "Living condition: With family, urban area.<br/>" +
  "Access to clinic: &lt; 30 minutes.<br/>" +
  "Emergency contact: Available.<br/><br/>" +
  "Diabetes type: Type 2.<br/>" +
  "Duration of insulin use: 3 years.<br/>" +
  "Insulin type used: Levemir (basal) + Humalog (rapid-acting).<br/>" +
  "Injection site pattern: Abdomen.<br/>" +
  "Resting activity level: Moderately active, desk job.<br/>" +
  "Fasting: Yes (religious fasting this week).<br/>" +
  "Monitoring adherence: Rarely checks; occasionally missed and delayed injections." +
  "</div>"

* identifier[0].system = "https://www.gravitatehealth.eu/sid/doc"
* identifier[=].value = "Aisha-1"
* active = true
* name.family = "Gravitate"
* name.given = "Aisha"
* gender = #female
* birthDate = "1985-06-15"


// ====================================================== PRACTITIONER =====================================================
Instance: aisha-pract
InstanceOf: Practitioner
Usage: #inline

* name.family = "Lopez"
* name.given = "Maria"
* name.prefix = "Dr."


// ====================================================== CONDITIONS ======================================================

Instance: aisha-cond-1
InstanceOf: Condition-uv-ips
Usage: #inline

* clinicalStatus = $condition-clinical#active
* verificationStatus = #confirmed
* code = $sct#44054006 "Type 2 diabetes mellitus (disorder)"
* code.text = "Type 2 diabetes mellitus"
* subject = Reference(aisha-patient) "Aisha Gravitate"

Instance: aisha-cond-2
InstanceOf: Condition-uv-ips
Usage: #inline

* clinicalStatus = $condition-clinical#active
* verificationStatus = #confirmed
* code = $sct#709044004 "Chronic kidney disease (disorder)"
* code.text = "Chronic kidney disease"
* subject = Reference(aisha-patient) "Aisha Gravitate"


// ====================================================== MEDICATION STATEMENTS ============================================
Instance: aisha-med-stat-1
InstanceOf: MedicationStatement
Usage: #inline

* status = #active
* medicationReference = Reference(aisha-med-levemir) "Levemir (insulin detemir)"
* subject = Reference(aisha-patient) "Aisha Gravitate"
* dosage.route = $edqm#20045000 "Subcutaneous use"
* dosage.text = "Levemir once daily as basal long-acting insulin"

Instance: aisha-med-stat-2
InstanceOf: MedicationStatement
Usage: #inline

* status = #active
* medicationReference = Reference(aisha-med-humalog) "Humalog (insulin lispro)"
* subject = Reference(aisha-patient) "Aisha Gravitate"
* dosage.route = $edqm#20045000 "Subcutaneous use"
* dosage.text = "Humalog before main meals as rapid-acting insulin"

Instance: aisha-med-stat-3
InstanceOf: MedicationStatement
Usage: #inline

* status = #active
* medicationReference = Reference(aisha-med-ace) "ACE inhibitor"
* subject = Reference(aisha-patient) "Aisha Gravitate"
* dosage.route = $edqm#20053000 "Oral use"
* dosage.text = "ACE inhibitor once daily"


// ====================================================== MEDICATIONS ======================================================

Instance: aisha-med-levemir
InstanceOf: Medication
Usage: #inline

* code.text = "Levemir (insulin detemir)"
* form = $edqm#50082000 "Solution for injection"
* form.text = "Solution for injection"

Instance: aisha-med-humalog
InstanceOf: Medication
Usage: #inline

* code.text = "Humalog (insulin lispro)"
* form = $edqm#50082000 "Solution for injection"
* form.text = "Solution for injection"

Instance: aisha-med-ace
InstanceOf: Medication
Usage: #inline

* code.text = "ACE inhibitor"
* form = $edqm#10220000 "Coated tablet"
* form.text = "Coated tablet"

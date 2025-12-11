// DiaLens - Hypoglycaemia risk lens
// Based on the Gravitate Health diabetes lens style.
// Exposes getSpecification() and enhance() so it can be used as a FHIR Library lens.
//
// Expected globals (provided by the execution environment):
//   - pv   : patient-view data (JSON or string)              [optional]
//   - html : ePI HTML as string                              [required]
//   - epi  : ePI JSON (FHIR Bundle / Composition, etc.)      [optional]
//   - ips  : IPS JSON                                        [optional]

let pvData   = typeof pv   !== "undefined" ? pv   : null;
let htmlData = typeof html !== "undefined" ? html : "";
let epiData  = typeof epi  !== "undefined" ? epi  : null;
let ipsData  = typeof ips  !== "undefined" ? ips  : null;

// ---------------------------------------------------------------------------
// Specification
// ---------------------------------------------------------------------------

let getSpecification = () => {
  return "1.0.0-dialens-hypo";
};

// ---------------------------------------------------------------------------
// Domain model: insulin profiles & hypoglycaemia risk
// Times are indicative ranges in hours and MUST NOT replace the SmPC/leaflet.
// ---------------------------------------------------------------------------

const defaultInsulinProfiles = [
  {
    id: "humalog",
    name: "Humalog (insulin lispro)",
    type: "rapid-acting",
    onsetHours: [0.25, 0.5],     // ~15–30 minutes
    peakHours: [1, 3],           // ~1–3 hours
    durationHours: [3, 5],       // ~3–5 hours
    increasedHypoRiskFactors: [
      "Skipping or delaying a meal after the injection",
      "Unexpected or intense physical activity",
      "Higher dose than prescribed or dosing errors",
      "Alcohol intake (especially on an empty stomach)",
      "Kidney or liver problems"
    ],
    reducedInsulinEffectFactors: [
      "Infection, fever or acute illness",
      "Stress or corticosteroid medicines",
      "Taking less insulin than prescribed",
      "Very high carbohydrate intake without dose adjustment"
    ]
  },
  {
    id: "levemir",
    name: "Levemir (insulin detemir)",
    type: "long-acting",
    onsetHours: [1, 2],          // ~1–2 hours
    peakHours: [6, 8],           // relatively flat, modest peak
    durationHours: [18, 24],     // up to ~24 hours
    increasedHypoRiskFactors: [
      "Tight dose titration without monitoring",
      "Additional rapid-acting insulin on top of basal dose",
      "Reduced food intake or prolonged fasting",
      "Unexpected physical activity, especially at night",
      "Kidney or liver impairment"
    ],
    reducedInsulinEffectFactors: [
      "Missed or very delayed basal dose",
      "Infection, fever or other intercurrent illness",
      "Some concomitant medicines that raise blood glucose",
      "Very high carbohydrate intake without correction"
    ]
  }
];

// If epiData provides a more precise insulin profile (e.g. pre-annotated in JSON),
// DiaLens will try to use that instead of the default profiles.
function extractInsulinProfilesFromEpi(epiData) {
  try {
    if (!epiData) {
      return null;
    }

    // If epiData is a string, try to parse it.
    let epiJson = typeof epiData === "string" ? JSON.parse(epiData) : epiData;

    // Non‑standard but convenient: allow epiJson.dialensInsulinProfiles
    if (epiJson && Array.isArray(epiJson.dialensInsulinProfiles)) {
      return epiJson.dialensInsulinProfiles;
    }
  } catch (e) {
    console.log("DiaLens: could not parse epiData for custom insulin profiles:", e);
  }
  return null;
}

// Compute an approximate period where hypoglycaemia symptoms are most likely for a profile.
function computeHypoWindow(profile) {
  const onsetStart = profile.onsetHours[0];
  const peakEnd = profile.peakHours[1];
  const durationEnd = profile.durationHours[1];

  // For rapid acting: strongest risk around peak, tapering after.
  if (profile.type === "rapid-acting") {
    return {
      start: onsetStart,
      end: Math.min(peakEnd + 1, durationEnd)  // extend 1 h after peak
    };
  }

  // For long acting: generally broader moderate risk.
  if (profile.type === "long-acting") {
    return {
      start: profile.onsetHours[0] + 3,       // after onset stabilises
      end: profile.durationHours[1]           // until near end of effect
    };
  }

  // Fallback: from onset to end of action.
  return {
    start: onsetStart,
    end: durationEnd
  };
}

// Helper to format an hours range nicely.
function formatHoursRange(range) {
  const [min, max] = range;
  if (min === max) {
    return `${min} h`;
  }
  return `${min}–${max} h`;
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

function ensureDiaLensStyles(document) {
  const existing = document.getElementById("dialens-hypo-style");
  if (existing) return;

  const style = document.createElement("style");
  style.id = "dialens-hypo-style";
  style.innerHTML = `
  .dialens-hypo-card {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: linear-gradient(145deg, #0b1724, #111f30);
    color: #f5f9ff;
    border-radius: 18px;
    padding: 16px 14px 14px 14px;
    margin: 12px auto 16px auto;
    box-shadow: 0 14px 28px rgba(0, 0, 0, 0.34);
    border: 1px solid rgba(255, 255, 255, 0.04);
    max-width: 420px;
  }

  .dialens-hypo-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .dialens-pill {
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(7, 99, 255, 0.18);
    backdrop-filter: blur(12px);
    white-space: nowrap;
  }

  .dialens-hypo-title {
    font-weight: 600;
    font-size: 14px;
    margin: 0 8px 0 0;
  }

  .dialens-hypo-tagline {
    font-size: 12px;
    opacity: 0.9;
    margin: 0;
  }

  .dialens-timeline {
    margin-top: 10px;
    padding: 10px 10px 8px 10px;
    border-radius: 12px;
    background: rgba(10, 26, 46, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.04);
  }

  .dialens-insulin-name {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .dialens-insulin-type {
    font-size: 11px;
    opacity: 0.75;
    margin-bottom: 7px;
  }

  .dialens-row {
    display: grid;
    grid-template-columns: 68px 1fr;
    column-gap: 10px;
    align-items: center;
    margin-bottom: 4px;
  }

  .dialens-row-label {
    font-size: 11px;
    opacity: 0.8;
  }

  .dialens-row-value {
    font-size: 11px;
    font-weight: 500;
  }

  .dialens-mini-bar {
    position: relative;
    margin-top: 8px;
    height: 10px;
    border-radius: 999px;
    background: rgba(16, 35, 60, 0.95);
    overflow: hidden;
  }

  .dialens-mini-bar-onset {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: linear-gradient(90deg, #4fd1c5, #63b3ed);
    opacity: 0.22;
  }

  .dialens-mini-bar-peak {
    position: absolute;
    top: 0;
    bottom: 0;
    background: linear-gradient(90deg, #f6e05e, #f6ad55);
    opacity: 0.8;
  }

  .dialens-mini-bar-duration {
    position: absolute;
    top: 2px;
    bottom: 2px;
    border-radius: 999px;
    border: 1px dashed rgba(255, 255, 255, 0.22);
    left: 0;
    right: 0;
  }

  .dialens-mini-bar-x {
    display: flex;
    justify-content: space-between;
    font-size: 9px;
    opacity: 0.7;
    margin-top: 4px;
  }

  .dialens-hypo-risk-text {
    margin-top: 8px;
    font-size: 11px;
    line-height: 1.4;
    opacity: 0.94;
  }

  .dialens-hypo-section-title {
    margin-top: 10px;
    margin-bottom: 2px;
    font-size: 11px;
    font-weight: 600;
  }

  .dialens-hypo-list {
    margin: 0;
    padding-left: 16px;
    font-size: 11px;
    line-height: 1.35;
    opacity: 0.96;
  }

  .dialens-hypo-footer {
    margin-top: 8px;
    font-size: 10px;
    opacity: 0.7;
  }
  `;
  document.head.appendChild(style);
}

function createTimelineBar(document, profile) {
  const totalDuration = profile.durationHours[1];
  const onset = profile.onsetHours;
  const peak = profile.peakHours;

  const onsetStartPct = (onset[0] / totalDuration) * 100;
  const onsetEndPct   = (onset[1] / totalDuration) * 100;
  const peakStartPct  = (peak[0] / totalDuration) * 100;
  const peakEndPct    = (peak[1] / totalDuration) * 100;

  const wrapper = document.createElement("div");

  const bar = document.createElement("div");
  bar.className = "dialens-mini-bar";

  const onsetEl = document.createElement("div");
  onsetEl.className = "dialens-mini-bar-onset";
  onsetEl.style.left = `${onsetStartPct}%`;
  onsetEl.style.width = `${Math.max(2, onsetEndPct - onsetStartPct)}%`;

  const peakEl = document.createElement("div");
  peakEl.className = "dialens-mini-bar-peak";
  peakEl.style.left = `${peakStartPct}%`;
  peakEl.style.width = `${Math.max(4, peakEndPct - peakStartPct)}%`;

  const durationEl = document.createElement("div");
  durationEl.className = "dialens-mini-bar-duration";

  bar.appendChild(onsetEl);
  bar.appendChild(peakEl);
  bar.appendChild(durationEl);

  const xAxis = document.createElement("div");
  xAxis.className = "dialens-mini-bar-x";
  xAxis.innerHTML = `<span>0 h</span><span>${totalDuration} h</span>`;

  wrapper.appendChild(bar);
  wrapper.appendChild(xAxis);

  return wrapper;
}

function buildHypoCard(document, insulinProfiles) {
  ensureDiaLensStyles(document);

  const card = document.createElement("section");
  card.className = "dialens-hypo-card";
  card.setAttribute("aria-label", "DiaLens hypoglycaemia risk summary");

  // Header
  const header = document.createElement("div");
  header.className = "dialens-hypo-header";

  const titleBox = document.createElement("div");
  const title = document.createElement("h2");
  title.className = "dialens-hypo-title";
  title.textContent = "Hypoglycaemia risk timeline";

  const tagline = document.createElement("p");
  tagline.className = "dialens-hypo-tagline";
  tagline.textContent = "Based on your insulin’s onset, peak and duration.";

  titleBox.appendChild(title);
  titleBox.appendChild(tagline);

  const pill = document.createElement("div");
  pill.className = "dialens-pill";
  pill.textContent = "DiaLens";

  header.appendChild(titleBox);
  header.appendChild(pill);

  card.appendChild(header);

  // Timelines for each insulin
  insulinProfiles.forEach((profile) => {
    const section = document.createElement("div");
    section.className = "dialens-timeline";

    const name = document.createElement("div");
    name.className = "dialens-insulin-name";
    name.textContent = profile.name;

    const type = document.createElement("div");
    type.className = "dialens-insulin-type";
    type.textContent = `${profile.type.replace("-", " ")} insulin`;

    const rowOnset = document.createElement("div");
    rowOnset.className = "dialens-row";
    rowOnset.innerHTML = `
      <div class="dialens-row-label">Onset</div>
      <div class="dialens-row-value">${formatHoursRange(profile.onsetHours)}</div>
    `;

    const rowPeak = document.createElement("div");
    rowPeak.className = "dialens-row";
    rowPeak.innerHTML = `
      <div class="dialens-row-label">Peak</div>
      <div class="dialens-row-value">${formatHoursRange(profile.peakHours)}</div>
    `;

    const rowDuration = document.createElement("div");
    rowDuration.className = "dialens-row";
    rowDuration.innerHTML = `
      <div class="dialens-row-label">Duration</div>
      <div class="dialens-row-value">${formatHoursRange(profile.durationHours)}</div>
    `;

    const hypoWindow = computeHypoWindow(profile);
    const riskText = document.createElement("p");
    riskText.className = "dialens-hypo-risk-text";
    riskText.textContent =
      `You are most likely to feel low sugar symptoms roughly between ` +
      `${hypoWindow.start.toFixed(1)}–${hypoWindow.end.toFixed(1)} h after this dose, ` +
      `especially if you eat less than usual or exercise more.`;

    section.appendChild(name);
    section.appendChild(type);
    section.appendChild(rowOnset);
    section.appendChild(rowPeak);
    section.appendChild(rowDuration);
    section.appendChild(createTimelineBar(document, profile));
    section.appendChild(riskText);

    card.appendChild(section);
  });

  // Risk factors (summary across all profiles)
  const allIncrease = Array.from(
    new Set(
      insulinProfiles.flatMap((p) => p.increasedHypoRiskFactors || [])
    )
  ).slice(0, 6);

  const allDecrease = Array.from(
    new Set(
      insulinProfiles.flatMap((p) => p.reducedInsulinEffectFactors || [])
    )
  ).slice(0, 5);

  const riskTitle = document.createElement("div");
  riskTitle.className = "dialens-hypo-section-title";
  riskTitle.textContent = "Situations that increase low sugar risk";

  const riskList = document.createElement("ul");
  riskList.className = "dialens-hypo-list";
  allIncrease.forEach((txt) => {
    const li = document.createElement("li");
    li.textContent = txt;
    riskList.appendChild(li);
  });

  const reduceTitle = document.createElement("div");
  reduceTitle.className = "dialens-hypo-section-title";
  reduceTitle.textContent = "Situations that may reduce insulin effect";

  const reduceList = document.createElement("ul");
  reduceList.className = "dialens-hypo-list";
  allDecrease.forEach((txt) => {
    const li = document.createElement("li");
    li.textContent = txt;
    reduceList.appendChild(li);
  });

  card.appendChild(riskTitle);
  card.appendChild(riskList);
  card.appendChild(reduceTitle);
  card.appendChild(reduceList);

  // Emergency instructions (generic, user must follow HCP plan)
  const emergencyTitle = document.createElement("div");
  emergencyTitle.className = "dialens-hypo-section-title";
  emergencyTitle.textContent = "If you think you are having hypoglycaemia";

  const emergencyList = document.createElement("ul");
  emergencyList.className = "dialens-hypo-list";
  [
    "Check your blood glucose if you can.",
    "If low and you feel symptoms (shaky, sweaty, confused, very hungry), take fast-acting carbohydrates – for example glucose tablets, sugary drink or juice – as described in your personal plan.",
    "Re-check after about 15 minutes and repeat fast-acting carbohydrates if still low.",
    "Once better, eat a snack or meal that contains longer-acting carbohydrates.",
    "If symptoms are severe, you pass out, or you cannot swallow safely, another person should call emergency services immediately and follow your doctor’s instructions (for example, glucagon injection)."
  ].forEach((txt) => {
    const li = document.createElement("li");
    li.textContent = txt;
    emergencyList.appendChild(li);
  });

  const footer = document.createElement("div");
  footer.className = "dialens-hypo-footer";
  footer.textContent =
    "This DiaLens summary is an educational aid. It does not replace your medicine’s package leaflet or advice from your healthcare professional.";

  card.appendChild(emergencyTitle);
  card.appendChild(emergencyList);
  card.appendChild(footer);

  return card;
}

// ---------------------------------------------------------------------------
// Enhance: main entry point
// ---------------------------------------------------------------------------

let enhance = async () => {
  try {
    // Try to get insulin profiles from epiData; otherwise fall back to defaults.
    const epiProfiles = extractInsulinProfilesFromEpi(epiData);
    const insulinProfiles = epiProfiles && epiProfiles.length
      ? epiProfiles
      : defaultInsulinProfiles;

    // Server-side (Node + jsdom) vs browser.
    if (typeof window === "undefined") {
      const jsdom = await import("jsdom");
      const { JSDOM } = jsdom;
      const dom = new JSDOM(htmlData || "<html><body></body></html>");
      const document = dom.window.document;

      // Insert card at the very top of the body.
      const body = document.body || document.getElementsByTagName("body")[0];
      if (body) {
        const card = buildHypoCard(document, insulinProfiles);
        body.insertBefore(card, body.firstChild || null);
      }

      return dom.serialize();
    } else {
      const document = window.document;
      const body = document.body || document.getElementsByTagName("body")[0];
      if (body) {
        const card = buildHypoCard(document, insulinProfiles);
        body.insertBefore(card, body.firstChild || null);
      }
      // In a real browser we can return the modified outerHTML or just the original.
      return document.documentElement.outerHTML;
    }
  } catch (e) {
    console.log("DiaLens enhance error:", e);
    // On error, always return the original HTML so we do not break rendering.
    return htmlData;
  }
};

export {
  enhance,
  getSpecification
};

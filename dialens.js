// dialens.js – Hypoglycaemia risk lens for insulin ePIs

let pvData = pv;
let htmlData = html;

let epiData = epi;
let ipsData = ips;

let getSpecification = () => {
  return "1.0.0";
};

// Codes / identifiers for insulin products (Humalog, Levemir, etc.)
// TODO: replace with real Bundle.identifier and MedicinalProductDefinition.identifier values
const INSULIN_BUNDLE_IDENTIFIER_LIST = [
  "humalog-epibundle-id",
  "levemir-epibundle-id"
];

const INSULIN_PRODUCT_IDENTIFIER_LIST = [
  "HUMALOG-PRODUCT-ID",
  "LEVEMIR-PRODUCT-ID"
];

// Category codes used in the ePI annotations for time/action
// TODO: align these with real Gravitate Health category codes
const HYPO_CATEGORY_CODES = [
  "insulin-onset",
  "insulin-peak",
  "insulin-duration",
  "insulin-dose-increase-factor",
  "insulin-dose-decrease-factor"
];

// --- Helpers to parse categories into a time-risk profile -------------------

const parseTimeInfoFromCategories = (categories) => {
  const result = {
    onset: null,
    peak: null,
    duration: null,
    increaseFactors: [],
    decreaseFactors: []
  };

  if (!Array.isArray(categories)) return result;

  categories.forEach((raw) => {
    if (!raw || typeof raw !== "string") return;
    const text = raw.toLowerCase();

    if (text.includes("onset")) {
      result.onset = raw;
    } else if (text.includes("peak")) {
      result.peak = raw;
    } else if (text.includes("duration")) {
      result.duration = raw;
    } else if (
      text.includes("increase") ||
      text.includes("enhance") ||
      text.includes("higher risk")
    ) {
      result.increaseFactors.push(raw);
    } else if (
      text.includes("decrease") ||
      text.includes("reduce") ||
      text.includes("lower risk")
    ) {
      result.decreaseFactors.push(raw);
    }
  });

  return result;
};

const buildHypoPanelHTML = (language, timeInfo) => {
  const onsetText =
    timeInfo.onset ||
    "You may start to feel low sugar shortly after the injection, especially around the usual onset time for this insulin.";
  const peakText =
    timeInfo.peak ||
    "The highest risk of low blood sugar usually happens around the insulin peak effect.";
  const durationText =
    timeInfo.duration ||
    "The risk of low blood sugar can continue for several hours while the insulin is still active.";

  const incList =
    timeInfo.increaseFactors.length > 0
      ? `<ul>${timeInfo.increaseFactors
          .map((f) => `<li>${f}</li>`)
          .join("")}</ul>`
      : "<ul><li>Skipping or delaying meals</li><li>Doing more exercise than usual</li><li>Drinking alcohol</li><li>Kidney or liver problems</li></ul>";

  const decList =
    timeInfo.decreaseFactors.length > 0
      ? `<ul>${timeInfo.decreaseFactors
          .map((f) => `<li>${f}</li>`)
          .join("")}</ul>`
      : "<ul><li>Eating more carbohydrates than usual</li><li>Missing or reducing insulin doses</li></ul>";

  // Multilingual static text
  if (language?.startsWith("pt")) {
    return `
      <div class="dialens-hypo-panel">
        <h2>🩸 Perfil de risco de hipoglicemia com insulina</h2>
        <p>Com base nas anotações do folheto, este painel resume os momentos em que é mais provável sentir sintomas de hipoglicemia e fatores que podem aumentar ou reduzir o efeito da insulina.</p>

        <h3>⏱ Quando o risco é maior?</h3>
        <p><strong>Início do efeito:</strong> ${onsetText}</p>
        <p><strong>Pico de efeito:</strong> ${peakText}</p>
        <p><strong>Duração do efeito:</strong> ${durationText}</p>

        <h3>⬆ Fatores que podem aumentar o risco de hipoglicemia</h3>
        ${incList}

        <h3>⬇ Fatores que podem reduzir o efeito da insulina</h3>
        ${decList}

        <h3>🧊 Como pode sentir a hipoglicemia</h3>
        <p>Os sintomas podem incluir: tremores, suor frio, fome intensa, dor de cabeça, batimentos cardíacos acelerados, visão turva, dificuldade de concentração ou confusão.</p>

        <h3>🚨 O que fazer em caso de hipoglicemia</h3>
        <ul>
          <li>Se estiver consciente e conseguir engolir: tome 15–20 g de açúcar de ação rápida (por exemplo, sumo, comprimidos de glicose, bebida açucarada).</li>
          <li>Volte a medir a glicemia cerca de 15 minutos depois; se continuar baixa, repita.</li>
          <li>Quando melhorar, faça um pequeno lanche com hidratos de carbono e alguma proteína.</li>
          <li>Se não conseguir engolir, estiver a desmaiar ou muito confuso: um cuidador deve ligar de imediato para os serviços de emergência e usar glucagon se disponível. Não tentar dar alimentos ou líquidos pela boca.</li>
        </ul>

        <p><em>Esta informação é um apoio geral e não substitui as orientações do seu profissional de saúde ou o plano de ação que recebeu para hipoglicemia.</em></p>
      </div>
    `;
  } else if (language?.startsWith("es")) {
    return `
      <div class="dialens-hypo-panel">
        <h2>🩸 Perfil de riesgo de hipoglucemia con insulina</h2>
        <p>Según las anotaciones del prospecto, este panel resume los momentos en los que es más probable que notes síntomas de hipoglucemia y los factores que pueden aumentar o reducir el efecto de la insulina.</p>

        <h3>⏱ ¿Cuándo es mayor el riesgo?</h3>
        <p><strong>Inicio del efecto:</strong> ${onsetText}</p>
        <p><strong>Pico del efecto:</strong> ${peakText}</p>
        <p><strong>Duración del efecto:</strong> ${durationText}</p>

        <h3>⬆ Factores que pueden aumentar el riesgo de hipoglucemia</h3>
        ${incList}

        <h3>⬇ Factores que pueden reducir el efecto de la insulina</h3>
        ${decList}

        <h3>🧊 Cómo puedes sentir la hipoglucemia</h3>
        <p>Los síntomas pueden incluir: temblores, sudor frío, hambre intensa, dolor de cabeza, palpitaciones, visión borrosa, dificultad para concentrarse o confusión.</p>

        <h3>🚨 Qué hacer en caso de hipoglucemia</h3>
        <ul>
          <li>Si estás consciente y puedes tragar: toma 15–20 g de azúcar de acción rápida (por ejemplo, zumo, pastillas de glucosa, bebida azucarada).</li>
          <li>Vuelve a medir la glucemia a los 15 minutos; si sigue baja, repite.</li>
          <li>Cuando mejores, toma un pequeño tentempié con hidratos de carbono y algo de proteína.</li>
          <li>Si no puedes tragar, te desmayas o estás muy confundido: un cuidador debe llamar inmediatamente a los servicios de emergencia y usar glucagón si está disponible. No intentar dar comida o bebida por la boca.</li>
        </ul>

        <p><em>Esta información es un apoyo general y no sustituye las indicaciones de tu profesional sanitario ni el plan de acción para hipoglucemia que hayas recibido.</em></p>
      </div>
    `;
  } else if (language?.startsWith("da")) {
    return `
      <div class="dialens-hypo-panel">
        <h2>🩸 Risiko for lavt blodsukker ved insulin</h2>
        <p>Baseret på annotationerne i indlægssedlen giver dette panel et overblik over, hvornår du sandsynligvis har størst risiko for lavt blodsukker, og hvilke faktorer der kan øge eller mindske insulins virkning.</p>

        <h3>⏱ Hvornår er risikoen størst?</h3>
        <p><strong>Virkningsstart:</strong> ${onsetText}</p>
        <p><strong>Topvirkning:</strong> ${peakText}</p>
        <p><strong>Virkningsvarighed:</strong> ${durationText}</p>

        <h3>⬆ Faktorer, der kan øge risikoen for hypoglykæmi</h3>
        ${incList}

        <h3>⬇ Faktorer, der kan mindske insulins effekt</h3>
        ${decList}

        <h3>🧊 Sådan kan lavt blodsukker føles</h3>
        <p>Symptomer kan blandt andet være: rystelser, koldsved, stærk sult, hovedpine, hurtig puls, sløret syn, koncentrationsbesvær eller forvirring.</p>

        <h3>🚨 Hvad gør du ved lavt blodsukker?</h3>
        <ul>
          <li>Hvis du er vågen og kan synke: tag 15–20 g hurtigtvirkende sukker (f.eks. juice, glukosetabletter, sukkersødet drik).</li>
          <li>Mål blodsukker igen efter ca. 15 minutter; hvis det stadig er lavt, gentag.</li>
          <li>Når du har det bedre, så spis et lille måltid med kulhydrat og lidt protein.</li>
          <li>Hvis du ikke kan synke, er ved at besvime eller meget forvirret: en pårørende skal straks ringe 112 og give glucagon, hvis det er tilgængeligt. Giv ikke mad eller drikke gennem munden.</li>
        </ul>

        <p><em>Denne information er generel og erstatter ikke de råd, du har fået af din behandler, eller din personlige handlingsplan for hypoglykæmi.</em></p>
      </div>
    `;
  } else {
    // Default: English
    return `
      <div class="dialens-hypo-panel">
        <h2>🩸 Hypoglycaemia risk profile with insulin</h2>
        <p>Based on the annotations in this ePI, this panel summarises when you are most likely to feel low blood sugar symptoms and which factors can increase or reduce insulin effect.</p>

        <h3>⏱ When is the risk highest?</h3>
        <p><strong>Onset of effect:</strong> ${onsetText}</p>
        <p><strong>Peak effect:</strong> ${peakText}</p>
        <p><strong>Duration of effect:</strong> ${durationText}</p>

        <h3>⬆ Factors that may increase hypoglycaemia risk</h3>
        ${incList}

        <h3>⬇ Factors that may reduce insulin effect</h3>
        ${decList}

        <h3>🧊 How low blood sugar may feel</h3>
        <p>Symptoms may include: shaking, cold sweats, intense hunger, headache, fast heartbeat, blurred vision, trouble concentrating, or confusion.</p>

        <h3>🚨 What to do in an emergency</h3>
        <ul>
          <li>If you are awake and able to swallow: take 15–20 g of fast-acting sugar (for example, juice, glucose tablets, sugary drink).</li>
          <li>Check your blood sugar again after about 15 minutes; if it is still low, repeat.</li>
          <li>When you feel better, eat a small snack containing carbohydrates and some protein.</li>
          <li>If you cannot swallow, are passing out, or very confused: a carer should call emergency services immediately and give glucagon if available. Do not try to give food or drink by mouth.</li>
        </ul>

        <p><em>This information is general support and does not replace your healthcare professional’s advice or your personal hypoglycaemia action plan.</em></p>
      </div>
    `;
  }
};

const insertHypoRiskPanel = (listOfCategories, language, document, response) => {
  const timeInfo = parseTimeInfoFromCategories(listOfCategories || []);

  const panelHTML = buildHypoPanelHTML(language, timeInfo);

  let foundCategory = Array.isArray(listOfCategories) && listOfCategories.length > 0;

  // For now we always insert at the top of the body (same pattern as checklist lens)
  const wrapperDiv = document.createElement("div");
  wrapperDiv.innerHTML = panelHTML;

  const body = document.querySelector("body");
  if (body) {
    body.insertBefore(wrapperDiv, body.firstChild);
  }

  // Clean head, as in the original diabetes lens
  if (document.getElementsByTagName("head").length > 0) {
    document.getElementsByTagName("head")[0].remove();
  }

  // Extract HTML result
  if (document.getElementsByTagName("body").length > 0) {
    response = document.getElementsByTagName("body")[0].innerHTML;
    console.log("Response: " + response);
  } else {
    console.log("Response: " + document.documentElement.innerHTML);
    response = document.documentElement.innerHTML;
  }

  if (!response || response.trim() === "") {
    throw new Error("Annotation process failed: empty or null response");
  }

  return response;
};

// --- Main enhance() ---------------------------------------------------------

let enhance = async () => {
  if (!epiData || !epiData.entry || epiData.entry.length === 0) {
    throw new Error("ePI is empty or invalid.");
  }

  let matchFound = false;
  let languageDetected = null;

  // 1. Check Composition.language
  epiData.entry?.forEach((entry) => {
    const res = entry.resource;
    if (res?.resourceType === "Composition" && res.language) {
      languageDetected = res.language;
      console.log("🌍 Detected from Composition.language:", languageDetected);
    }
  });

  // 2. If not found, check Bundle.language
  if (!languageDetected && epiData.language) {
    languageDetected = epiData.language;
    console.log("🌍 Detected from Bundle.language:", languageDetected);
  }

  if (!languageDetected) {
    console.warn("⚠️ No language detected in Composition or Bundle.");
  }

  // Check Bundle.identifier.value for insulin bundles
  if (
    epiData.identifier &&
    INSULIN_BUNDLE_IDENTIFIER_LIST.includes(epiData.identifier.value)
  ) {
    console.log(
      "💉 Matched insulin ePI Bundle.identifier:",
      epiData.identifier.value
    );
    matchFound = true;
  }

  // Check MedicinalProductDefinition.identifier.value for insulin products
  epiData.entry.forEach((entry) => {
    const res = entry.resource;
    if (res?.resourceType === "MedicinalProductDefinition") {
      const ids = res.identifier || [];
      ids.forEach((id) => {
        if (INSULIN_PRODUCT_IDENTIFIER_LIST.includes(id.value)) {
          console.log(
            "💉 Matched insulin MedicinalProductDefinition.identifier:",
            id.value
          );
          matchFound = true;
        }
      });
    }
  });

  // Collect annotation categories from Composition extensions
  let compositions = 0;
  let categories = [];

  epiData.entry.forEach((entry) => {
    const res = entry.resource;
    if (res && res.resourceType === "Composition" && Array.isArray(res.extension)) {
      compositions++;
      res.extension.forEach((element) => {
        if (
          element.extension &&
          element.extension[1] &&
          element.extension[1].url === "concept" &&
          element.extension[1].valueCodeableReference &&
          element.extension[1].valueCodeableReference.concept &&
          Array.isArray(
            element.extension[1].valueCodeableReference.concept.coding
          )
        ) {
          element.extension[1].valueCodeableReference.concept.coding.forEach(
            (coding) => {
              if (HYPO_CATEGORY_CODES.includes(coding.code)) {
                if (element.extension[0] && element.extension[0].valueString) {
                  console.log(
                    "Hypo category extension:",
                    element.extension[0].valueString,
                    ":",
                    coding.code
                  );
                  categories.push(element.extension[0].valueString);
                }
              }
            }
          );
        }
      });
    }
  });

  if (compositions === 0) {
    throw new Error('Bad ePI: no resourceType "Composition" found');
  }

  // If this ePI is not an insulin (Humalog / Levemir / etc.), do nothing
  if (!matchFound) {
    console.log("ePI is not an insulin requiring Dialens hypoglycaemia lens");
    return htmlData;
  }

  // If matched, enhance HTML with hypoglycaemia risk panel
  let response = htmlData;
  let document;

  if (typeof window === "undefined") {
    // Node / server-side environment
    let jsdom = await import("jsdom");
    let { JSDOM } = jsdom;
    let dom = new JSDOM(htmlData);
    document = dom.window.document;
    return insertHypoRiskPanel(categories, languageDetected, document, response);
  } else {
    // Browser environment
    document = window.document;
    return insertHypoRiskPanel(categories, languageDetected, document, response);
  }
};

return {
  enhance: enhance,
  getSpecification: getSpecification
};

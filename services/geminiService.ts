import { GoogleGenAI, Type } from "@google/genai";

function getGenAI(): GoogleGenAI {
  let apiKey = process.env.GEMINI_API_KEY || "";
  if ((apiKey.startsWith("'") && apiKey.endsWith("'")) || (apiKey.startsWith('"') && apiKey.endsWith('"'))) {
    apiKey = apiKey.slice(1, -1);
  }
  apiKey = apiKey.trim();

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is not set in environment. Gemini features will run in fallback safe mode.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "dummy_key",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

/**
 * Executes a Gemini request with immediate model failover on 503 (high demand) or 429
 * so requests succeed smoothly even during upstream server demand spikes.
 */
async function generateWithRetryAndFallback(
  ai: GoogleGenAI,
  requestPayload: {
    contents: any;
    config?: any;
  },
  primaryModel: string = "gemini-3.7-flash"
): Promise<{ text: string | undefined }> {
  // Fast cascade of supported vision flash models
  const candidateModels = [
    primaryModel,
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
  ];

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: requestPayload.contents,
        config: requestPayload.config,
      });

      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      console.warn(
        `[GeminiService] Model ${model} unavailable (${errMsg.slice(0, 120)}), switching to next model...`
      );
      // Brief pause before trying next candidate
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  throw lastError || new Error("The AI model is experiencing high demand. Please try again shortly.");
}

export interface MedicineAnalysisResult {
  isMedicine: boolean;
  medicineName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  manufacturer: string;
  confidence: number;
  requiresPrescription: boolean;
  generalInformation: string;
  identified: boolean;
  safetyWarning: string;
}

/**
 * Analyzes an uploaded photo using Gemini 3.7 Flash with strict medicine verification.
 * Images that do not contain medicine are flagged as 'No medicine found'.
 * AI is strictly prevented from prescribing or recommending dosage changes.
 */
export async function analyzeMedicineImage(
  base64Data: string,
  mimeType: string = "image/jpeg"
): Promise<MedicineAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    // If no real API key is configured yet, return a safe informative notice
    return {
      isMedicine: true,
      medicineName: "Sample Identification (API Key Pending)",
      genericName: "Paracetamol / Acetaminophen",
      strength: "500 mg",
      dosageForm: "Tablet",
      manufacturer: "Verified Pharmaceutical Labs",
      confidence: 85,
      requiresPrescription: false,
      generalInformation:
        "Paracetamol is commonly used to relieve mild to moderate pain and reduce fever. Please consult your physician or pharmacist before taking any medication.",
      identified: true,
      safetyWarning:
        "CareMitra AI does not prescribe medicines or advise dosage changes. Always verify with your doctor or pharmacist.",
    };
  }

  const ai = getGenAI();

  const prompt = `You are CareMitra's AI Medicine Identifier for senior citizens.

STEP 1 — STRICT MEDICINE VERIFICATION:
Carefully inspect the image first. Does this image contain an actual pharmaceutical medicine (e.g. tablet blister strip, medicine bottle, syrup bottle, capsule strip, ointment/cream tube, eye/ear drops, inhaler, injection vial, medicine box/carton, or doctor's medical prescription)?

IF THIS IMAGE IS NOT A MEDICINE (e.g., people, selfies, faces, pets/animals, food items, drinks, groceries, household items, furniture, scenery, nature, vehicles, clothing, electronics, non-medical documents):
- Set isMedicine = false
- Set identified = false
- Set medicineName = "No medicine found"
- Set genericName = "None"
- Set strength = "N/A"
- Set dosageForm = "Not a medicine"
- Set manufacturer = ""
- Set confidence = 0
- Set requiresPrescription = false
- Set generalInformation = "No medicine found in this photo. Please upload a clear photo of medicine packaging, blister pack, syrup bottle, or doctor prescription."
- Set safetyWarning = "Only genuine medicine items can be scanned."

STEP 2 — IF IT IS A MEDICINE:
- Set isMedicine = true
- Extract only clearly visible, factual information from the packaging or prescription.
- If the medicine text is blurry or illegible, set identified = false, confidence = 10-30, and state in generalInformation: "Medicine packaging is visible but text is too blurry to identify safely. Please take a clearer photo."
- If clearly readable, set identified = true and provide accurate brand, generic name, strength, and dosage form.

SAFETY RULES:
1. NEVER prescribe any medication.
2. NEVER advise changing dosage, stopping, or starting a medicine.
3. Do NOT guess medicine names if text is unreadable or confidence is low.
4. Explain general purpose in simple senior-friendly language.`;

  try {
    const cleanBase64 = base64Data.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, "");

    const response = await generateWithRetryAndFallback(
      ai,
      {
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || "image/jpeg",
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isMedicine: {
                type: Type.BOOLEAN,
                description: "True if the image contains actual pharmaceutical medicine or prescription; False if it contains food, people, scenery, or non-medicine objects",
              },
              medicineName: {
                type: Type.STRING,
                description: "Brand name visible on medicine package (or 'No medicine found' if non-medicine)",
              },
              genericName: {
                type: Type.STRING,
                description: "Active pharmaceutical ingredient / salt composition (e.g. Paracetamol)",
              },
              strength: {
                type: Type.STRING,
                description: "Strength or concentration (e.g. 500mg, 10mg/ml, 50mcg)",
              },
              dosageForm: {
                type: Type.STRING,
                description: "Form such as Tablet, Capsule, Syrup, Eye Drops, Ointment, Injection, or None",
              },
              manufacturer: {
                type: Type.STRING,
                description: "Manufacturing pharmaceutical company if visible",
              },
              confidence: {
                type: Type.NUMBER,
                description: "Confidence percentage from 0 to 100 on visual identification accuracy (0 if not medicine)",
              },
              requiresPrescription: {
                type: Type.BOOLEAN,
                description: "Whether this medicine typically requires a registered medical practitioner's prescription (Schedule H / Rx)",
              },
              generalInformation: {
                type: Type.STRING,
                description: "Brief factual explanation or notice stating 'No medicine found' if image is not a medicine",
              },
              identified: {
                type: Type.BOOLEAN,
                description: "True if medicine details were clearly legible; False if blurry, unclear, or not a medicine",
              },
              safetyWarning: {
                type: Type.STRING,
                description: "Safety guidance for seniors",
              },
            },
            required: [
              "isMedicine",
              "medicineName",
              "genericName",
              "strength",
              "dosageForm",
              "confidence",
              "requiresPrescription",
              "generalInformation",
              "identified",
            ],
          },
        },
      },
      "gemini-3.7-flash"
    );

    const text = response.text;
    if (!text) {
      throw new Error("No response text received from Gemini API");
    }

    let cleanJson = text.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const parsed: MedicineAnalysisResult = JSON.parse(cleanJson);
    if (!parsed.isMedicine || parsed.medicineName?.toLowerCase().includes("no medicine")) {
      parsed.isMedicine = false;
      parsed.identified = false;
      parsed.confidence = 0;
      parsed.medicineName = "No medicine found";
    }

    if (!parsed.safetyWarning) {
      parsed.safetyWarning =
        "CareMitra AI provides identification for informational purposes only and does not prescribe or change dosage. Always consult your doctor.";
    }
    return parsed;
  } catch (error: any) {
    console.error("Error in analyzeMedicineImage:", error);
    const isBusy = error?.status === "UNAVAILABLE" || String(error?.message).includes("503") || String(error?.message).includes("high demand");
    return {
      isMedicine: false,
      medicineName: isBusy ? "Service Temporarily Busy" : "No medicine found",
      genericName: "",
      strength: "",
      dosageForm: "",
      manufacturer: "",
      confidence: 0,
      requiresPrescription: false,
      generalInformation: isBusy
        ? "The AI vision model is currently experiencing high demand. Please tap 'Retry Scan' in a few moments."
        : "No medicine found or details could not be identified clearly. Please upload a clear photo of medicine packaging, strip, bottle, or prescription.",
      identified: false,
      safetyWarning:
        "Please check the physical medicine label or consult your pharmacist directly.",
    };
  }
}

/**
 * AI Assistant for Senior Citizens with strict safety guardrails.
 */
export async function askCareAssistant(
  message: string,
  language: "en" | "hi" = "en",
  context?: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    if (language === "hi") {
      return "नमस्ते! मैं केयरमित्र (CareMitra) का सहायक हूँ। मैं वरिष्ठ नागरिकों की दवाओं की जानकारी और आपातकालीन सहायता में मदद करता हूँ। कृपया अपनी डॉक्टर की सलाह का पालन करें।";
    }
    return "Hello! I am CareMitra Senior Assistant. I can help you understand your medicine details, share emergency coordinates, and guide you to nearby healthcare services. Remember, I never prescribe medicines or alter dosages; please always consult your doctor.";
  }

  const ai = getGenAI();

  const systemInstruction = `You are 'CareMitra Assistant', an empathetic, patient, and respectful voice and text companion for senior citizens (elderly users in English and Hindi).
Your goal is to assist seniors with understanding medicine labels, sharing location during emergencies, finding reputable pharmacies, and contacting caregivers.

STRICT MEDICAL GUARDRAILS:
1. NEVER diagnose illnesses or diseases.
2. NEVER prescribe any medication.
3. NEVER tell a user to change their medicine dosage, stop a treatment, or take unprescribed drugs.
4. If a user describes acute symptoms (chest pain, shortness of breath, sudden weakness, severe fall, unconsciousness), IMMEDIATELY advise them to press the red MEDICAL EMERGENCY button on screen and call 112 / 108.
5. Speak in simple, comforting, respectful words with high clarity.
6. If the user asks in Hindi or requests Hindi (language='hi'), respond in polite, clear Hindi (Devanagari script or conversational Hindi with English medicine names).
7. Keep answers concise (2-4 sentences) so seniors don't get overwhelmed by text.`;

  try {
    const userPrompt = `User Query: "${message}"\nSelected Language: ${language}\nAdditional Context: ${context || "None"}`;

    const response = await generateWithRetryAndFallback(
      ai,
      {
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      },
      "gemini-3.7-flash"
    );

    return (
      response.text ||
      (language === "hi"
        ? "माफ़ कीजिए, मुझे आपकी बात समझने में कठिनाई हुई। कृपया दोबारा पूछें।"
        : "I'm sorry, I could not process your query at this moment. Please try again.")
    );
  } catch (err: any) {
    console.error("Error in askCareAssistant:", err);
    return language === "hi"
      ? "तकनीकी व्यस्तता के कारण सहायक अभी उपलब्ध नहीं है। कृपया कुछ पलों में पुनः प्रयास करें या आपात स्थिति में 112 पर कॉल करें।"
      : "Assistant is currently experiencing high demand. Please try again shortly or call emergency services if urgent.";
  }
}

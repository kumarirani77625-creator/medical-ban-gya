import React, { useState, useRef } from "react";
import {
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Volume2,
  VolumeX,
  ShoppingCart,
  RefreshCw,
  Info,
  ShieldAlert,
  Sparkles,
  Pill,
} from "lucide-react";
import { Language, MedicineAnalysisResult } from "../types.ts";
import { translations } from "../translations.ts";
import { CameraModal } from "./CameraModal.tsx";

interface MedicineScannerProps {
  language: Language;
  highContrast: boolean;
  onNavigateToPharmacy: (medicineName: string) => void;
}

// Helper to resize and compress photos before upload for fast, reliable AI processing
const resizeAndCompressImage = (dataUrl: string, maxDimension = 1200, quality = 0.85): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

export const MedicineScanner: React.FC<MedicineScannerProps> = ({
  language,
  highContrast,
  onNavigateToPharmacy,
}) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<MedicineAnalysisResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(
        language === "hi"
          ? "केवल JPG, PNG, या WEBP फोटो समर्थित हैं।"
          : "Please select a valid JPG, PNG, or WEBP image."
      );
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(
        language === "hi"
          ? "फोटो का साइज़ 10MB से कम होना चाहिए।"
          : "Image size must be under 10MB."
      );
      return;
    }

    setErrorMessage(null);
    setImageMimeType(file.type);

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === "string") {
        const imgData = reader.result;
        setSelectedImage(imgData);
        setAnalysisResult(null);
        // Automatically start AI scan immediately upon upload
        await triggerScan(imgData, file.type);
      }
    };
    reader.readAsDataURL(file);
  };

  // Camera Capture Handler
  const handleCameraCapture = async (base64Data: string) => {
    setSelectedImage(base64Data);
    setImageMimeType("image/jpeg");
    setAnalysisResult(null);
    setErrorMessage(null);
    // Automatically start AI scan immediately upon camera capture
    await triggerScan(base64Data, "image/jpeg");
  };

  // Trigger analysis for image
  const triggerScan = async (imageSrc: string, mime: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    stopSpeaking();

    try {
      // Compress and optimize image on client side for fast network upload
      const optimizedImage = await resizeAndCompressImage(imageSrc, 1280, 0.85);

      const response = await fetch("/api/analyze-medicine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: optimizedImage,
          mimeType: "image/jpeg",
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      let data: any = null;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        await response.text();
        throw new Error(
          language === "hi"
            ? "सर्वर से अमान्य उत्तर प्राप्त हुआ। कृपया पुनः प्रयास करें।"
            : "Server returned an unexpected response. Please try again."
        );
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Failed to analyze photo.");
      }

      setAnalysisResult(data);

      // Automatically read out aloud if successful to assist seniors
      if (data.identified && data.medicineName && data.isMedicine) {
        speakMedicineInfo(data);
      }
    } catch (err: any) {
      console.error("Error analyzing medicine:", err);
      setErrorMessage(
        language === "hi"
          ? err.message || "फोटो की जाँच में समस्या आई। कृपया साफ़ फोटो दोबारा अपलोड करें।"
          : err.message || "An error occurred while analyzing the medicine. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Manual Re-Analyze Medicine API Call
  const handleAnalyzeMedicine = () => {
    if (selectedImage) {
      triggerScan(selectedImage, imageMimeType);
    }
  };

  // Text-To-Speech for Elderly Accessibility
  const speakMedicineInfo = (data: MedicineAnalysisResult) => {
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    let speechText = "";
    if (language === "hi") {
      if (!data.isMedicine || data.medicineName === "No medicine found") {
        speechText = "इस फोटो में कोई दवा नहीं मिली। कृपया केवल दवा के पत्ते, शीशी, डिब्बे या डॉक्टर के पर्चे की साफ़ फोटो अपलोड करें।";
      } else if (data.identified) {
        speechText = `दवा का नाम: ${data.medicineName}। घटक: ${data.genericName || "सामान्य"}। मात्रा: ${data.strength || ""}। ${data.requiresPrescription ? "इसके लिए डॉक्टर का पर्चा आवश्यक है।" : "यह सामान्य दवा है।"}`;
      } else {
        speechText = "दवा का विवरण साफ़ समझ नहीं आ रहा है। कृपया अधिक साफ़ फोटो अपलोड करें।";
      }
    } else {
      if (!data.isMedicine || data.medicineName === "No medicine found") {
        speechText = "No medicine found in this photo. Please upload a clear photo of medicine packaging, blister pack, syrup bottle, or doctor prescription.";
      } else if (data.identified) {
        speechText = `Medicine Name: ${data.medicineName}. Generic Name: ${data.genericName}. Strength: ${data.strength}. ${data.requiresPrescription ? "Prescription is required for this medicine." : "Over the counter medicine."} ${data.generalInformation}`;
      } else {
        speechText = "Medicine details could not be identified clearly. Please upload a clearer photo or check the medicine label.";
      }
    }

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.9; // Slightly slower pace for seniors
    utterance.lang = language === "hi" ? "hi-IN" : "en-US";

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const clearPhoto = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setErrorMessage(null);
    stopSpeaking();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div id="medicine-scanner-section" className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Title Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl sm:text-4xl font-extrabold font-serif tracking-tight">
          {t.medicinePageTitle}
        </h2>
        <p className={`text-base sm:text-lg max-w-2xl mx-auto ${highContrast ? "text-yellow-200" : "text-slate-600"}`}>
          {t.medicinePageSubtitle}
        </p>
      </div>

      {/* Notice Banner: Medicine Only Scanning */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/70 dark:bg-neutral-900 border-2 border-blue-100 dark:border-neutral-800 text-xs sm:text-sm flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-slate-700 dark:text-neutral-300 leading-relaxed font-medium">
          {t.scanOnlyMedicineNotice}
        </p>
      </div>

      {/* Action Buttons: Upload & Take Photo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Upload Button */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            id="medicine-file-input"
          />
          <button
            id="btn-upload-medicine-photo"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`w-full py-4 sm:py-5 px-6 rounded-2xl border-2 flex items-center justify-center gap-3 font-extrabold text-lg sm:text-xl shadow-xs hover:shadow-md transition-all active:scale-98 ${
              highContrast
                ? "bg-neutral-900 border-yellow-400 text-yellow-300 hover:bg-neutral-950"
                : "bg-blue-600 hover:bg-blue-700 border-blue-700 text-white"
            }`}
          >
            <Upload className="w-6 h-6 shrink-0" />
            <span>{t.uploadPhotoBtn}</span>
          </button>
          <p className="text-xs text-center mt-1.5 text-slate-500 font-medium">{t.selectFileHint}</p>
        </div>

        {/* Take Photo Button */}
        <div>
          {/* Hidden capture input as instant native fallback */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            id="medicine-native-camera-input"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            id="btn-take-medicine-photo"
            type="button"
            onClick={() => {
              // Try modal camera first; if user prefers, they can also use native camera
              setIsCameraOpen(true);
            }}
            className={`w-full py-4 sm:py-5 px-6 rounded-2xl border-2 flex items-center justify-center gap-3 font-extrabold text-lg sm:text-xl shadow-xs hover:shadow-md transition-all active:scale-98 ${
              highContrast
                ? "bg-neutral-900 border-yellow-400 text-yellow-300 hover:bg-neutral-950"
                : "bg-slate-900 hover:bg-slate-800 border-slate-900 text-white"
            }`}
          >
            <Camera className="w-6 h-6 shrink-0" />
            <span>{t.takePhotoBtn}</span>
          </button>
          <p className="text-xs text-center mt-1.5 text-slate-500 font-medium">
            {language === "hi" ? "सीधे कैमरे से फोटो लें" : "Use device camera directly"}
          </p>
        </div>
      </div>

      {/* Error Message Box */}
      {errorMessage && (
        <div
          className="p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-800 flex items-start gap-3 shadow-xs"
          role="alert"
        >
          <AlertCircle className="w-6 h-6 shrink-0 text-red-600 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-base">{t.errorTitle}</h4>
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Selected Image Preview & Analyze Action */}
      {selectedImage && (
        <div
          className={`rounded-[20px] p-6 sm:p-7 border-2 shadow-xs space-y-6 ${
            highContrast
              ? "bg-black border-yellow-400 text-yellow-300"
              : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Preview Box */}
            <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-slate-50 dark:bg-neutral-900 rounded-2xl p-4 border-2 border-slate-200 dark:border-neutral-800 relative overflow-hidden">
              <div className="relative">
                <img
                  src={selectedImage}
                  alt="Selected medicine"
                  className="max-h-72 w-auto object-contain rounded-xl shadow-xs"
                />
                {isLoading && (
                  <div className="absolute inset-0 bg-blue-600/15 rounded-xl flex items-center justify-center pointer-events-none">
                    <div className="w-full h-1 bg-blue-500 shadow-md shadow-blue-500/50 animate-pulse absolute top-1/2 -translate-y-1/2"></div>
                  </div>
                )}
              </div>
              <span className="text-xs font-semibold text-slate-500 mt-2">
                {language === "hi" ? "चयनित दवा की तस्वीर" : "Selected Medicine Preview"}
              </span>
            </div>

            {/* Analysis Action Controls */}
            <div className="w-full md:w-1/2 space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>{language === "hi" ? "दवा की जाँच जारी है..." : "Scanning Medicine with AI..."}</span>
                    </>
                  ) : (
                    <span>{language === "hi" ? "फोटो तैयार है" : "Photo Ready for Analysis"}</span>
                  )}
                </h3>
                <p className="text-sm text-slate-600 dark:text-neutral-300 font-medium">
                  {isLoading
                    ? language === "hi"
                      ? "केयरमित्र AI दवा के नाम, साल्ट और निर्देशों की तुरंत पहचान कर रहा है..."
                      : "CareMitra AI is actively verifying salt formulation, dosage strength, and medicine guidelines..."
                    : language === "hi"
                    ? "केयरमित्र AI दवा के लेबल, घटक (सॉल्ट), और पावर की सटीक पहचान करेगा।"
                    : "CareMitra AI will inspect packaging details, salt formulation, strength, and prescription rules."}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  id="btn-analyze-medicine"
                  onClick={handleAnalyzeMedicine}
                  disabled={isLoading}
                  className={`w-full py-4 px-6 rounded-xl font-black text-xl flex items-center justify-center gap-3 shadow-xs transition-transform active:scale-98 disabled:opacity-50 ${
                    highContrast
                      ? "bg-yellow-400 text-black hover:bg-yellow-300"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t.scanningInProgress}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6" />
                      <span>{t.analyzeBtn}</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-clear-photo"
                  type="button"
                  onClick={clearPhoto}
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl border-2 border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-300 font-bold text-sm flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t.clearRetakeBtn}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANALYSIS RESULT DISPLAY */}
      {analysisResult && (
        <div
          id="medicine-analysis-result-card"
          className={`rounded-[20px] p-6 sm:p-8 border-2 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            highContrast
              ? "bg-black border-yellow-400 text-yellow-300"
              : "bg-white border-slate-200 text-slate-900"
          }`}
        >
          {/* Result Header & Audio Readout */}
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b-2 border-slate-100 dark:border-neutral-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-blue-50 dark:bg-neutral-800 text-blue-600 dark:text-yellow-400 border border-blue-100 dark:border-neutral-700">
                  <Pill className="w-6 h-6" />
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold">
                  {t.resultHeading}
                </h3>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-neutral-400">
                {language === "hi"
                  ? "वरिष्ठ नागरिकों की सुविधा के लिए स्पष्ट और सरल भाषा में प्रस्तुत"
                  : "Verified informational breakdown for senior citizens"}
              </p>
            </div>

            {/* Voice Readout Button */}
            <div className="flex items-center gap-2">
              {isSpeaking ? (
                <button
                  id="btn-stop-audio-readout"
                  onClick={stopSpeaking}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm flex items-center gap-2 shadow-xs animate-pulse"
                >
                  <VolumeX className="w-4 h-4" />
                  <span>{t.stopVoiceBtn}</span>
                </button>
              ) : (
                <button
                  id="btn-start-audio-readout"
                  onClick={() => speakMedicineInfo(analysisResult)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 border-2 transition-all ${
                    highContrast
                      ? "bg-yellow-400 text-black hover:bg-yellow-300 border-yellow-400"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
                  }`}
                >
                  <Volume2 className="w-4 h-4 text-blue-600" />
                  <span>{t.listenDetailsBtn}</span>
                </button>
              )}
            </div>
          </div>

          {/* CASE 0: AI MODEL TEMPORARILY BUSY / 503 */}
          {analysisResult.medicineName === "Service Temporarily Busy" ? (
            <div className="p-6 sm:p-7 rounded-2xl bg-amber-50 dark:bg-neutral-900 border-2 border-amber-300 dark:border-amber-500 space-y-4">
              <div className="flex items-start gap-3.5">
                <AlertCircle className="w-8 h-8 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="text-xl sm:text-2xl font-extrabold text-amber-900 dark:text-amber-300">
                    {language === "hi" ? "AI सेवा व्यस्त है (High Demand)" : "AI Service Temporarily Busy"}
                  </h4>
                  <p className="text-base text-amber-800 dark:text-amber-200 font-semibold leading-relaxed">
                    {analysisResult.generalInformation}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-neutral-400 font-medium">
                    {language === "hi"
                      ? "AI मॉडल पर अधिक मांग होने के कारण कुछ सेकंड बाद पुनः प्रयास करने पर यह स्वतः ठीक हो जाता है।"
                      : "Demand spikes are temporary. Tapping 'Retry Scan' will re-submit your photo immediately."}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  id="btn-retry-scan-busy"
                  onClick={handleAnalyzeMedicine}
                  className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base flex items-center gap-2 shadow-xs transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>{language === "hi" ? "पुनः स्कैन करें (Retry Scan)" : "Retry Scan Now"}</span>
                </button>
                <button
                  onClick={clearPhoto}
                  className="px-5 py-3.5 rounded-xl bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-sm"
                >
                  <span>{language === "hi" ? "रद्द करें" : "Cancel"}</span>
                </button>
              </div>
            </div>
          ) : /* CASE 1: NO MEDICINE FOUND IN PHOTO */
          !analysisResult.isMedicine || analysisResult.medicineName?.toLowerCase().includes("no medicine") ? (
            <div className="p-6 sm:p-7 rounded-2xl bg-red-50 dark:bg-neutral-900 border-2 border-red-200 dark:border-red-500 space-y-4">
              <div className="flex items-start gap-3.5">
                <AlertCircle className="w-8 h-8 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="text-xl sm:text-2xl font-extrabold text-red-900 dark:text-red-300">
                    {t.noMedicineFoundTitle}
                  </h4>
                  <p className="text-base text-red-800 dark:text-red-200 font-semibold leading-relaxed">
                    {t.noMedicineFoundDesc}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-neutral-400 font-medium">
                    {language === "hi"
                      ? "वरिष्ठ नागरिकों की सुरक्षा के लिए केयरमित्र केवल दवा के पत्ते (स्ट्रिप), शीशी, डिब्बे या डॉक्टर के पर्चे को ही स्कैन करता है।"
                      : "For senior health safety, CareMitra only processes genuine medicine packaging, blister packs, syrup bottles, or doctor prescriptions."}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  id="btn-retake-medicine-only"
                  onClick={clearPhoto}
                  className="px-6 py-3.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-extrabold text-base flex items-center gap-2 shadow-xs transition-all"
                >
                  <Camera className="w-5 h-5" />
                  <span>{language === "hi" ? "दवा की फोटो दोबारा चुनें" : "Select Medicine Photo"}</span>
                </button>
              </div>
            </div>
          ) : !analysisResult.identified || analysisResult.confidence < 40 ? (
            /* CASE 2: MEDICINE PACKAGING DETECTED BUT TEXT UNCLEAR / BLURRY */
            <div className="p-6 rounded-2xl bg-amber-50 dark:bg-neutral-900 border-2 border-amber-200 dark:border-amber-500 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-8 h-8 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-amber-900 dark:text-amber-300">
                    {language === "hi" ? "दवा का लेबल स्पष्ट नहीं है" : "Medicine Label Unclear"}
                  </h4>
                  <p className="text-base text-amber-800 dark:text-amber-200 font-medium">
                    {t.unclearWarning}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-neutral-400">
                    {language === "hi"
                      ? "वरिष्ठ नागरिकों की सुरक्षा के लिए, हम कम स्पष्टता पर दवा के नाम का अनुमान नहीं लगाते।"
                      : "For senior safety, CareMitra does not guess medicine names when visual confidence is low."}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={clearPhoto}
                  className="px-6 py-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-sm flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>{language === "hi" ? "नई साफ़ तस्वीर लें" : "Take a Clearer Photo"}</span>
                </button>
              </div>
            </div>
          ) : (
            /* CASE 3: CLEARLY IDENTIFIED MEDICINE DETAILS */
            <div className="space-y-6">
              {/* Top Highlights: Brand Name, Rx Badge, Confidence */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-neutral-400">
                    {t.fieldMedicineName}
                  </span>
                  <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-yellow-300">
                    {analysisResult.medicineName || "Identified Medicine"}
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Prescription Badge */}
                  {analysisResult.requiresPrescription ? (
                    <span className="px-3.5 py-1.5 rounded-full bg-red-100 text-red-800 border border-red-300 font-extrabold text-sm flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-red-600" />
                      <span>{t.requiresRx}</span>
                    </span>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-full bg-green-100 text-green-800 border border-green-300 font-extrabold text-sm flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>{t.otcMedicine}</span>
                    </span>
                  )}

                  {/* Confidence Level Pill */}
                  <span className="px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200 font-bold text-sm">
                    {t.confidenceLabel}: {analysisResult.confidence}%
                  </span>
                </div>
              </div>

              {/* Structured Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Generic Name */}
                <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800">
                  <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                    {t.fieldGenericName}
                  </span>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">
                    {analysisResult.genericName || "—"}
                  </p>
                </div>

                {/* Strength */}
                <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800">
                  <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                    {t.fieldStrength}
                  </span>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">
                    {analysisResult.strength || "—"}
                  </p>
                </div>

                {/* Dosage Form */}
                <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800">
                  <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                    {t.fieldDosageForm}
                  </span>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">
                    {analysisResult.dosageForm || "—"}
                  </p>
                </div>

                {/* Manufacturer */}
                <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800">
                  <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                    {t.fieldManufacturer}
                  </span>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">
                    {analysisResult.manufacturer || "Verified Pharmacy Standard"}
                  </p>
                </div>
              </div>

              {/* General Information Box */}
              {analysisResult.generalInformation && (
                <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-neutral-900 border-2 border-blue-100 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold text-base">
                    <Info className="w-5 h-5 text-blue-600" />
                    <span>{t.fieldInformation}</span>
                  </div>
                  <p className="text-base text-slate-700 dark:text-neutral-300 leading-relaxed font-medium">
                    {analysisResult.generalInformation}
                  </p>
                </div>
              )}

              {/* Prescription Notice */}
              {analysisResult.requiresPrescription && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-neutral-900 border-2 border-amber-200 dark:border-amber-600 flex items-start gap-3">
                  <ShieldAlert className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
                    {t.prescriptionNotice}
                  </p>
                </div>
              )}

              {/* Safety Warning */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-950 border-2 border-slate-200 dark:border-neutral-800 text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed font-medium">
                <strong>{t.fieldSafetyWarning}:</strong> {analysisResult.safetyWarning}
              </div>

              {/* Direct Link to Pharmacy Finder */}
              <div className="pt-2">
                <button
                  id="btn-buy-identified-medicine"
                  onClick={() =>
                    onNavigateToPharmacy(analysisResult.medicineName || analysisResult.genericName)
                  }
                  className={`w-full py-4 px-6 rounded-2xl font-extrabold text-xl flex items-center justify-center gap-3 shadow-xs transition-transform active:scale-98 ${
                    highContrast
                      ? "bg-yellow-400 text-black hover:bg-yellow-300"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  <ShoppingCart className="w-6 h-6" />
                  <span>{t.buyMedicineBtn}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        language={language}
        highContrast={highContrast}
      />
    </div>
  );
};

import React from "react";
import { Camera, ShoppingCart, AlertTriangle, Sparkles, ChevronRight, PhoneCall, ShieldCheck, ArrowRight, Building, MapPin } from "lucide-react";
import { Language } from "../types.ts";
import { translations } from "../translations.ts";

interface HomeNavigationProps {
  language: Language;
  onNavigate: (view: "home" | "scanner" | "pharmacy" | "emergency" | "assistant") => void;
  highContrast: boolean;
}

export const HomeNavigation: React.FC<HomeNavigationProps> = ({
  language,
  onNavigate,
  highContrast,
}) => {
  const t = translations[language];

  return (
    <div id="home-navigation-container" className="space-y-6 py-2">
      {/* Top Welcome / Status Hero Banner */}
      <div
        className={`rounded-[20px] p-6 sm:p-7 border-2 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          highContrast
            ? "bg-neutral-900 border-yellow-400 text-yellow-300"
            : "bg-white border-slate-200 text-slate-900"
        }`}
      >
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>{language === "hi" ? "वरिष्ठ नागरिक स्वास्थ्य मंच" : "Senior Care Platform"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.appName}
          </h1>
          <p className={`text-sm sm:text-base font-medium ${highContrast ? "text-yellow-200" : "text-slate-600"}`}>
            {t.appTagline} • {t.taglineSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 self-stretch md:self-auto">
          <button
            id="btn-quick-emergency-top"
            onClick={() => onNavigate("emergency")}
            className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs active:scale-95 transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{language === "hi" ? "आपातकाल 112" : "Emergency 112"}</span>
          </button>
        </div>
      </div>

      {/* GEOMETRIC MAIN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Medicine Photo & AI Assistant */}
        <div className="flex flex-col gap-6">
          {/* Medicine Photo Card */}
          <div
            id="card-home-medicine-scanner"
            className={`rounded-[20px] p-6 border-2 transition-all flex flex-col justify-between shadow-xs ${
              highContrast
                ? "bg-black border-yellow-400 text-yellow-300"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{t.cardMedicinePhotoTitle}</h2>
                  <p className={`text-sm ${highContrast ? "text-yellow-200" : "text-slate-600"}`}>
                    {t.cardMedicinePhotoDesc}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Camera className="w-6 h-6" />
                </div>
              </div>

              {/* Upload Box Aesthetic */}
              <div
                onClick={() => onNavigate("scanner")}
                className={`border-3 border-dashed rounded-2xl h-40 flex flex-col items-center justify-center gap-2 my-4 cursor-pointer transition-all hover:bg-slate-100/80 ${
                  highContrast
                    ? "border-yellow-400 bg-neutral-900"
                    : "border-slate-300 bg-slate-50 hover:border-blue-400"
                }`}
              >
                <div className="text-4xl">💊</div>
                <p className="font-bold text-sm text-slate-700 dark:text-neutral-300">
                  {language === "hi" ? "दवा की फोटो जाँचें" : "Click to Analyze Image"}
                </p>
                <span className="text-xs text-slate-500">JPG, PNG, WEBP</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                id="btn-home-take-photo"
                onClick={() => onNavigate("scanner")}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                  highContrast
                    ? "bg-yellow-400 text-black hover:bg-yellow-300"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                <Camera className="w-5 h-5" />
                <span>{t.takePhotoBtn}</span>
              </button>

              <button
                id="btn-home-upload-file"
                onClick={() => onNavigate("scanner")}
                className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-base border-2 flex items-center justify-center gap-2 transition-all ${
                  highContrast
                    ? "bg-neutral-900 border-yellow-400 text-yellow-300"
                    : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{t.uploadPhotoBtn}</span>
              </button>
            </div>
          </div>

          {/* AI Voice Companion Card */}
          <div
            id="card-home-ai-assistant"
            className={`rounded-[20px] p-6 border-2 transition-all flex items-center justify-between gap-4 shadow-xs ${
              highContrast
                ? "bg-neutral-900 border-yellow-400 text-yellow-300"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">
                  {t.cardAiAssistantTitle}
                </h3>
                <p className={`text-xs sm:text-sm ${highContrast ? "text-yellow-200" : "text-slate-600"}`}>
                  {t.cardAiAssistantDesc}
                </p>
              </div>
            </div>

            <button
              id="btn-nav-ai-assistant"
              onClick={() => onNavigate("assistant")}
              className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all ${
                highContrast
                  ? "bg-yellow-400 text-black hover:bg-yellow-300"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              <span>{t.cardAiAssistantAction}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Medical Emergency & Pharmacy Finder */}
        <div className="flex flex-col gap-6">
          {/* Emergency Card (Highlight in Red) */}
          <div
            id="card-home-emergency-sos"
            className={`rounded-[20px] p-6 border-2 transition-all flex flex-col justify-between shadow-xs ${
              highContrast
                ? "bg-red-950 border-red-500 text-yellow-300"
                : "bg-red-50/70 border-red-200 text-slate-900"
            }`}
          >
            <div>
              {/* Big Red Emergency Button */}
              <button
                id="btn-main-emergency-sos"
                onClick={() => onNavigate("emergency")}
                className="w-full py-4 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xl sm:text-2xl uppercase tracking-wider mb-4 shadow-md active:scale-98 transition-transform flex items-center justify-center gap-3 border-2 border-red-500"
              >
                <AlertTriangle className="w-7 h-7 animate-bounce" />
                <span>{t.cardEmergencyTitle}</span>
              </button>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between border-b border-red-200 dark:border-red-800 pb-2">
                  <span className="font-bold text-slate-700 dark:text-neutral-300">
                    {language === "hi" ? "राष्ट्रीय आपातकालीन नंबर:" : "National Emergency Hotline:"}
                  </span>
                  <span className="font-extrabold text-red-600 font-mono text-base">
                    112 / 108
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-red-200 dark:border-red-800 pb-2">
                  <span className="font-bold text-slate-700 dark:text-neutral-300">
                    {language === "hi" ? "GPS लोकेशन शेयर:" : "GPS Location Sharing:"}
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    Active GPS Ready
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                onClick={() => onNavigate("emergency")}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                <span>{t.shareLocationBtn}</span>
              </button>

              <button
                onClick={() => onNavigate("emergency")}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>{t.callEmergencyBtn}</span>
              </button>
            </div>
          </div>

          {/* Pharmacy Finder Card */}
          <div
            id="card-home-pharmacy-finder"
            className={`rounded-[20px] p-6 border-2 transition-all flex flex-col justify-between shadow-xs ${
              highContrast
                ? "bg-black border-yellow-400 text-yellow-300"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{t.cardFindMedicineTitle}</h2>
                  <p className={`text-sm ${highContrast ? "text-yellow-200" : "text-slate-600"}`}>
                    {t.cardFindMedicineDesc}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 border border-green-100">
                  <ShoppingCart className="w-6 h-6" />
                </div>
              </div>

              {/* Sample Verified Pharmacies Badges */}
              <div className="flex flex-wrap gap-2 my-3">
                {["Apollo Pharmacy", "Tata 1mg", "Netmeds", "Jan Aushadhi"].map((name, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700"
                  >
                    ✓ {name}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                id="btn-home-open-pharmacy"
                onClick={() => onNavigate("pharmacy")}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                  highContrast
                    ? "bg-yellow-400 text-black hover:bg-yellow-300"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                <span>{t.cardFindMedicineAction}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

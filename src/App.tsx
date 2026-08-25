import React, { useState } from "react";
import { Header } from "./components/Header.tsx";
import { HomeNavigation } from "./components/HomeNavigation.tsx";
import { MedicineScanner } from "./components/MedicineScanner.tsx";
import { PharmacyFinder } from "./components/PharmacyFinder.tsx";
import { EmergencyCenter } from "./components/EmergencyCenter.tsx";
import { AiAssistant } from "./components/AiAssistant.tsx";
import { Language } from "./types.ts";
import { translations } from "./translations.ts";
import { ArrowLeft, HeartPulse, ShieldAlert, PhoneCall, Sparkles } from "lucide-react";

export default function App() {
  const [language, setLanguage] = useState<Language>("en");
  const [activeView, setActiveView] = useState<"home" | "scanner" | "pharmacy" | "emergency" | "assistant">("home");
  const [fontScale, setFontScale] = useState<number>(1.0);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [pharmacySearchQuery, setPharmacySearchQuery] = useState<string>("");

  const t = translations[language];

  const handleToggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "hi" : "en"));
  };

  const handleIncreaseFont = () => {
    setFontScale((prev) => Math.min(1.3, Number((prev + 0.1).toFixed(1))));
  };

  const handleDecreaseFont = () => {
    setFontScale((prev) => Math.max(0.9, Number((prev - 0.1).toFixed(1))));
  };

  const handleToggleHighContrast = () => {
    setHighContrast((prev) => !prev);
  };

  const handleNavigateToPharmacy = (medicineName: string) => {
    setPharmacySearchQuery(medicineName);
    setActiveView("pharmacy");
  };

  return (
    <div
      id="caremitra-app-root"
      style={{ fontSize: `${fontScale * 100}%` }}
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        highContrast
          ? "bg-black text-yellow-300 antialiased"
          : "bg-slate-50 text-slate-900 antialiased"
      }`}
    >
      {/* Top Header */}
      <Header
        language={language}
        onToggleLanguage={handleToggleLanguage}
        fontScale={fontScale}
        onIncreaseFont={handleIncreaseFont}
        onDecreaseFont={handleDecreaseFont}
        highContrast={highContrast}
        onToggleHighContrast={handleToggleHighContrast}
        onNavigate={(view) => setActiveView(view)}
        activeView={activeView}
      />

      {/* Sub-header Navigation Bar (when not on home) */}
      {activeView !== "home" && (
        <div
          className={`border-b-2 px-4 sm:px-8 py-3 transition-colors ${
            highContrast
              ? "bg-neutral-950 border-yellow-400 text-yellow-300"
              : "bg-white border-slate-200 shadow-xs"
          }`}
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <button
              id="btn-back-to-home"
              onClick={() => setActiveView("home")}
              className={`px-4 py-2 rounded-xl text-sm font-extrabold flex items-center gap-2 border-2 transition-all active:scale-95 ${
                highContrast
                  ? "bg-yellow-400 text-black border-yellow-400 hover:bg-yellow-300"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.backToHome}</span>
            </button>

            {/* Quick switcher buttons */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveView("scanner")}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border-2 whitespace-nowrap transition-all ${
                  activeView === "scanner"
                    ? highContrast
                      ? "bg-yellow-400 text-black border-yellow-400"
                      : "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : highContrast
                    ? "bg-neutral-900 text-yellow-300 border-yellow-400"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {t.cardMedicinePhotoTitle}
              </button>
              <button
                onClick={() => setActiveView("pharmacy")}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border-2 whitespace-nowrap transition-all ${
                  activeView === "pharmacy"
                    ? highContrast
                      ? "bg-yellow-400 text-black border-yellow-400"
                      : "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : highContrast
                    ? "bg-neutral-900 text-yellow-300 border-yellow-400"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {t.cardFindMedicineTitle}
              </button>
              <button
                onClick={() => setActiveView("assistant")}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border-2 whitespace-nowrap transition-all ${
                  activeView === "assistant"
                    ? highContrast
                      ? "bg-yellow-400 text-black border-yellow-400"
                      : "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : highContrast
                    ? "bg-neutral-900 text-yellow-300 border-yellow-400"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {language === "hi" ? "AI साथी" : "AI Assistant"}
              </button>
              <button
                onClick={() => setActiveView("emergency")}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border-2 whitespace-nowrap transition-all ${
                  activeView === "emergency"
                    ? "bg-red-600 text-white border-red-600 shadow-xs"
                    : highContrast
                    ? "bg-red-950 text-red-300 border-red-400"
                    : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                }`}
              >
                {language === "hi" ? "आपातकाल SOS" : "Emergency SOS"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content View */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6">
        {activeView === "home" && (
          <HomeNavigation
            language={language}
            onNavigate={(view) => setActiveView(view)}
            highContrast={highContrast}
          />
        )}

        {activeView === "scanner" && (
          <MedicineScanner
            language={language}
            highContrast={highContrast}
            onNavigateToPharmacy={handleNavigateToPharmacy}
          />
        )}

        {activeView === "pharmacy" && (
          <PharmacyFinder
            language={language}
            highContrast={highContrast}
            initialQuery={pharmacySearchQuery}
          />
        )}

        {activeView === "emergency" && (
          <EmergencyCenter
            language={language}
            highContrast={highContrast}
            onNavigateHome={() => setActiveView("home")}
          />
        )}

        {activeView === "assistant" && (
          <AiAssistant
            language={language}
            highContrast={highContrast}
            onNavigate={(view) => setActiveView(view)}
          />
        )}
      </main>

      {/* Geometric Balance Footer Bar */}
      <footer
        className={`border-t-2 py-4 px-4 sm:px-8 transition-colors mt-auto ${
          highContrast
            ? "bg-neutral-950 text-yellow-200 border-yellow-400"
            : "bg-white text-slate-700 border-slate-200"
        }`}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* AI Interactive Prompt Bar */}
          <button
            id="btn-footer-ai-prompt"
            onClick={() => setActiveView("assistant")}
            className={`w-full md:w-auto flex-1 max-w-lg flex items-center gap-3 px-4 py-2.5 rounded-full border-2 text-left transition-all hover:scale-101 ${
              highContrast
                ? "bg-neutral-900 border-yellow-400 text-yellow-300 hover:bg-neutral-800"
                : "bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-300"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              AI
            </div>
            <span className="text-xs sm:text-sm font-medium truncate">
              {language === "hi"
                ? '"आज मैं आपकी सेहत या दवा में क्या मदद कर सकता हूँ?"'
                : '"How can I help you with your health today?"'}
            </span>
          </button>

          {/* Emergency Helplines & Status Indicator */}
          <div className="flex flex-wrap items-center justify-end gap-3 text-xs font-semibold">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-neutral-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
              <span>112 / 108 Emergency</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-slate-700 dark:text-neutral-300">
              <span>Elder Line: 14567</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React from "react";
import { HeartPulse, Globe, ZoomIn, ZoomOut, AlertTriangle, Sparkles, Volume2 } from "lucide-react";
import { Language } from "../types.ts";
import { translations } from "../translations.ts";

interface HeaderProps {
  language: Language;
  onToggleLanguage: () => void;
  fontScale: number;
  onIncreaseFont: () => void;
  onDecreaseFont: () => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  onNavigate: (view: "home" | "scanner" | "pharmacy" | "emergency" | "assistant") => void;
  activeView: string;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onToggleLanguage,
  fontScale,
  onIncreaseFont,
  onDecreaseFont,
  highContrast,
  onToggleHighContrast,
  onNavigate,
  activeView,
}) => {
  const t = translations[language];

  return (
    <header
      id="caremitra-header"
      className={`border-b-2 sticky top-0 z-40 transition-colors ${
        highContrast
          ? "bg-black text-yellow-300 border-yellow-400"
          : "bg-white text-slate-900 border-slate-200"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <button
          id="btn-brand-home"
          onClick={() => onNavigate("home")}
          className="flex items-center gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-2xl p-1 transition-transform active:scale-98"
          aria-label="CareMitra Home"
        >
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${
              highContrast ? "bg-yellow-400 text-black" : "bg-blue-600 text-white"
            }`}
          >
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${highContrast ? "text-yellow-300" : "text-blue-600"}`}>
                CareMitra
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  highContrast
                    ? "bg-yellow-400 text-black"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                Senior Care
              </span>
            </div>
            <p
              className={`text-xs sm:text-sm font-medium hidden sm:block ${
                highContrast ? "text-yellow-200" : "text-slate-500"
              }`}
            >
              {t.appTagline}
            </p>
          </div>
        </button>

        {/* Accessibility Toolbar & Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Text Size Scaling */}
          <div
            className={`flex items-center border-2 rounded-xl p-1 ${
              highContrast
                ? "border-yellow-400 bg-neutral-900"
                : "border-slate-200 bg-slate-50"
            }`}
            title={t.textSize}
          >
            <button
              id="btn-font-decrease"
              onClick={onDecreaseFont}
              disabled={fontScale <= 0.85}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 disabled:opacity-30 text-slate-700 font-bold transition-colors"
              aria-label="Decrease text size"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-bold font-mono">
              {Math.round(fontScale * 100)}%
            </span>
            <button
              id="btn-font-increase"
              onClick={onIncreaseFont}
              disabled={fontScale >= 1.35}
              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 disabled:opacity-30 text-slate-700 font-bold transition-colors"
              aria-label="Increase text size"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* High Contrast Toggle */}
          <button
            id="btn-toggle-contrast"
            onClick={onToggleHighContrast}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border-2 transition-all ${
              highContrast
                ? "bg-yellow-400 text-black border-yellow-300 ring-2 ring-yellow-200"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>👁️</span>
            <span className="hidden md:inline">{t.highContrast}</span>
          </button>

          {/* Language Switcher Buttons */}
          <div className="flex items-center gap-1">
            <button
              id="btn-lang-en"
              onClick={() => { if (language !== "en") onToggleLanguage(); }}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all ${
                language === "en"
                  ? highContrast
                    ? "bg-yellow-400 text-black border-yellow-400"
                    : "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : highContrast
                  ? "bg-neutral-900 text-yellow-300 border-yellow-400"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              English
            </button>
            <button
              id="btn-lang-hi"
              onClick={() => { if (language !== "hi") onToggleLanguage(); }}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all ${
                language === "hi"
                  ? highContrast
                    ? "bg-yellow-400 text-black border-yellow-400"
                    : "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : highContrast
                  ? "bg-neutral-900 text-yellow-300 border-yellow-400"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* Direct Red SOS Pill */}
          <button
            id="btn-header-emergency-sos"
            onClick={() => onNavigate("emergency")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wide flex items-center gap-2 transition-all shadow-xs active:scale-95 ${
              activeView === "emergency"
                ? "bg-red-700 text-white ring-3 ring-red-400"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{language === "hi" ? "आपातकाल SOS" : "Emergency SOS"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

import React, { useState, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Phone,
  CheckCircle2,
  Tag,
  Building,
} from "lucide-react";
import { Language, PharmacyOption } from "../types.ts";
import { translations } from "../translations.ts";

interface PharmacyFinderProps {
  language: Language;
  highContrast: boolean;
  initialQuery?: string;
}

export const PharmacyFinder: React.FC<PharmacyFinderProps> = ({
  language,
  highContrast,
  initialQuery = "",
}) => {
  const t = translations[language];

  const [query, setQuery] = useState<string>(initialQuery);
  const [pharmacies, setPharmacies] = useState<PharmacyOption[]>([]);
  const [safetyNotice, setSafetyNotice] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchPharmacies(initialQuery);
  }, [initialQuery]);

  const fetchPharmacies = async (searchMedicine: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/pharmacies?medicineName=${encodeURIComponent(searchMedicine)}`);
      if (res.ok) {
        const data = await res.json();
        setPharmacies(data.pharmacies || []);
        setSafetyNotice(data.safetyNotice || "");
      }
    } catch (e) {
      console.error("Failed to load pharmacies", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPharmacies(query);
  };

  return (
    <div id="pharmacy-finder-section" className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl sm:text-4xl font-extrabold font-serif tracking-tight">
          {t.pharmacyTitle}
        </h2>
        <p className={`text-base sm:text-lg max-w-2xl mx-auto ${highContrast ? "text-yellow-200" : "text-slate-600"}`}>
          {t.pharmacySubtitle}
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
        <div
          className={`flex items-center rounded-2xl border-2 p-1.5 shadow-xs transition-all ${
            highContrast
              ? "bg-black border-yellow-400 text-yellow-300"
              : "bg-white border-slate-300 focus-within:border-blue-600"
          }`}
        >
          <div className="pl-4 text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <input
            id="input-pharmacy-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full px-3 py-3 text-lg font-medium bg-transparent focus:outline-none placeholder:text-slate-400"
          />
          <button
            id="btn-search-pharmacy"
            type="submit"
            disabled={isLoading}
            className={`px-6 py-3.5 rounded-xl font-bold text-base shadow-xs shrink-0 transition-all ${
              highContrast
                ? "bg-yellow-400 text-black hover:bg-yellow-300"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isLoading ? "..." : t.searchBtn}
          </button>
        </div>
      </form>

      {/* Prescription Notice Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-neutral-900 border-2 border-amber-200 dark:border-amber-600 flex items-start gap-3.5 shadow-xs">
        <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-amber-900 dark:text-amber-300 text-base">
            {language === "hi" ? "दवा सुरक्षा एवं डॉक्टर का पर्चा" : "Prescription & Safety Verification"}
          </h4>
          <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
            {t.rxVerificationNotice}
          </p>
        </div>
      </div>

      {/* Active Search Context */}
      {query && (
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-neutral-300">
          <Tag className="w-4 h-4 text-blue-600" />
          <span>
            {language === "hi" ? "खोज परिणाम दवा:" : "Showing verified pharmacies for:"}{" "}
            <strong className="text-blue-700 dark:text-yellow-400 text-base underline decoration-2">{query}</strong>
          </span>
        </div>
      )}

      {/* Pharmacy Cards Listing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {pharmacies.map((pharmacy) => (
          <div
            key={pharmacy.id}
            id={`card-pharmacy-${pharmacy.id}`}
            className={`rounded-[20px] p-6 border-2 flex flex-col justify-between shadow-xs hover:shadow-md transition-all ${
              highContrast
                ? "bg-black border-yellow-400 text-yellow-300"
                : "bg-white border-slate-200 text-slate-900 hover:border-blue-400"
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="space-y-1">
                  <span className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-blue-50 dark:bg-neutral-800 text-blue-700 dark:text-yellow-400 border border-blue-200 dark:border-neutral-700">
                    {pharmacy.badge}
                  </span>
                  <h3 className="text-2xl font-bold pt-1.5">{pharmacy.name}</h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-center font-black text-xs text-slate-700 dark:text-slate-200">
                  <Building className="w-6 h-6 text-blue-600 dark:text-yellow-400" />
                </div>
              </div>

              <p className={`text-sm leading-relaxed mb-4 ${highContrast ? "text-yellow-200" : "text-slate-600"}`}>
                {pharmacy.description}
              </p>

              {pharmacy.helpline && (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-neutral-400 mb-4">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {t.helpline}: <a href={`tel:${pharmacy.helpline}`} className="hover:underline text-slate-700 dark:text-neutral-200">{pharmacy.helpline}</a>
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t-2 border-slate-100 dark:border-neutral-800">
              <a
                id={`btn-open-pharmacy-${pharmacy.id}`}
                href={pharmacy.searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full py-3.5 px-5 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-xs transition-all ${
                  highContrast
                    ? "bg-yellow-400 text-black hover:bg-yellow-300"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                <span>{t.openStore}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Senior Purchasing Guidance */}
      <div className="p-5 rounded-[20px] bg-slate-50 dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800 text-sm space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-teal-300">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <span>{language === "hi" ? "वरिष्ठ नागरिकों के लिए सुरक्षित ख़रीदारी सुझाव:" : "Senior Online Pharmacy Guidelines:"}</span>
        </div>
        <ul className="list-disc list-inside text-xs sm:text-sm text-slate-600 dark:text-neutral-300 space-y-1 font-medium">
          <li>{language === "hi" ? "दवा की एक्सपायरी डेट (Expiry Date) डिलीवरी के समय हमेशा चेक करें।" : "Always check expiration dates upon delivery before accepting parcels."}</li>
          <li>{language === "hi" ? "जेनेरिक दवाओं (Jan Aushadhi) पर बचत का विकल्प उपलब्ध होता है।" : "Ask your doctor if low-cost generic equivalents are suitable."}</li>
          <li>{language === "hi" ? "सील टूटी हुई या खुली शीशी कभी स्वीकार न करें।" : "Never accept unsealed or tampered medication containers."}</li>
        </ul>
      </div>
    </div>
  );
};

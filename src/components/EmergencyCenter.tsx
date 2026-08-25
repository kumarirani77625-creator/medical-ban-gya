import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  MapPin,
  Phone,
  PhoneCall,
  Share2,
  Copy,
  ExternalLink,
  ShieldAlert,
  Navigation,
  Building,
  User,
  Save,
  CheckCircle2,
  RefreshCw,
  Ambulance,
  HeartHandshake,
} from "lucide-react";
import {
  Language,
  EmergencyLocation,
  EmergencyContactProfile,
  Hospital,
} from "../types.ts";
import { translations } from "../translations.ts";
import {
  getEmergencyLocation,
  createLocationLink,
  shareEmergencyLocation,
} from "../utils/location.ts";

interface EmergencyCenterProps {
  language: Language;
  highContrast: boolean;
  onNavigateHome: () => void;
}

const STORAGE_KEY = "caremitra_emergency_profile";

export const EmergencyCenter: React.FC<EmergencyCenterProps> = ({
  language,
  highContrast,
  onNavigateHome,
}) => {
  const t = translations[language];

  // Confirmation state
  const [hasConfirmedEmergency, setHasConfirmedEmergency] = useState<boolean>(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [location, setLocation] = useState<EmergencyLocation | null>(null);

  // Copy status feedback
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  // Ambulance coordination
  const [ambulanceRequested, setAmbulanceRequested] = useState<boolean>(false);
  const [ambulanceResponse, setAmbulanceResponse] = useState<any>(null);
  const [isRequestingAmbulance, setIsRequestingAmbulance] = useState<boolean>(false);

  // Nearby Hospitals
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState<boolean>(false);

  // Emergency Profile (localStorage)
  const [profile, setProfile] = useState<EmergencyContactProfile>({
    userName: "",
    userPhone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    bloodGroup: "O+",
    knownConditions: "Hypertension / Diabetes",
  });
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);

  // Load saved profile on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not read profile from localStorage", e);
    }
  }, []);

  // When emergency is confirmed, fetch GPS immediately
  const handleConfirmEmergency = async () => {
    setHasConfirmedEmergency(true);
    fetchCoordinates();
  };

  const fetchCoordinates = async () => {
    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      const loc = await getEmergencyLocation();
      setLocation(loc);
      fetchHospitals(loc.latitude, loc.longitude);
    } catch (err: any) {
      console.error("GPS error:", err);
      setLocationError(err.message || "Failed to access GPS coordinates.");
      // Even if location fails, load standard hospitals
      fetchHospitals();
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const fetchHospitals = async (lat?: number, lng?: number) => {
    setIsLoadingHospitals(true);
    try {
      const query = lat !== undefined && lng !== undefined ? `?lat=${lat}&lng=${lng}` : "";
      const res = await fetch(`/api/nearby-hospitals${query}`);
      if (res.ok) {
        const data = await res.json();
        setHospitals(data.hospitals || []);
      }
    } catch (err) {
      console.error("Failed to fetch hospitals:", err);
    } finally {
      setIsLoadingHospitals(false);
    }
  };

  // Share Location (Web Share API or clipboard copy)
  const handleShareLocation = async () => {
    if (!location) return;
    const res = await shareEmergencyLocation(location, profile.userName || "Senior Patient");
    if (res.method === "CLIPBOARD" && res.success) {
      setCopiedNotice(t.copiedToClipboard);
      setTimeout(() => setCopiedNotice(null), 4000);
    }
  };

  // Ambulance Service Integration Call
  const handleCoordinateAmbulance = async () => {
    if (!location) return;

    setIsRequestingAmbulance(true);
    try {
      const res = await fetch("/api/emergency/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          patientName: profile.userName || "Senior Citizen",
          contactNumber: profile.userPhone || profile.emergencyContactPhone || "112",
          emergencyType: "Senior Citizen Emergency Assistance Request",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAmbulanceResponse(data);
        setAmbulanceRequested(true);
      }
    } catch (e) {
      console.error("Ambulance request error:", e);
    } finally {
      setIsRequestingAmbulance(false);
    }
  };

  // Save profile to localStorage
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setProfileSavedMsg(t.savedSuccess);
      setTimeout(() => setProfileSavedMsg(null), 3000);
    } catch (e) {
      console.error("Failed to save profile", e);
    }
  };

  return (
    <div id="emergency-center-section" className="space-y-8 max-w-4xl mx-auto py-2">
          {/* 1. INITIAL EMERGENCY CONFIRMATION MODAL / SCREEN */}
      {!hasConfirmedEmergency ? (
        <div
          className={`rounded-[20px] p-6 sm:p-10 border-4 shadow-xl space-y-6 text-center animate-in zoom-in-95 duration-200 ${
            highContrast
              ? "bg-red-950 border-red-400 text-yellow-300"
              : "bg-red-600 border-red-700 text-white"
          }`}
        >
          <div className="w-20 h-20 rounded-2xl bg-white text-red-600 flex items-center justify-center mx-auto shadow-md animate-bounce">
            <AlertTriangle className="w-12 h-12" />
          </div>

          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">
              {t.emergencyConfirmTitle}
            </h2>
            <p className="text-base sm:text-lg font-medium text-red-100 leading-relaxed">
              {t.emergencyConfirmDesc}
            </p>
          </div>

          {/* GIANT ACTION BUTTONS FOR SENIOR CITIZENS */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto pt-4">
            <button
              id="btn-confirm-emergency-yes"
              onClick={handleConfirmEmergency}
              className="flex-1 py-5 px-8 rounded-2xl bg-white hover:bg-red-50 text-red-700 font-extrabold text-xl sm:text-2xl shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-3 border-2 border-red-200"
            >
              <AlertTriangle className="w-7 h-7 text-red-600" />
              <span>{t.emergencyConfirmYes}</span>
            </button>

            <button
              id="btn-confirm-emergency-no"
              onClick={onNavigateHome}
              className="py-4 px-6 rounded-2xl bg-red-800/80 hover:bg-red-900 text-red-100 font-bold text-base border border-red-400/50 transition-colors"
            >
              <span>{t.emergencyConfirmNo}</span>
            </button>
          </div>
        </div>
      ) : (
        /* 2. ACTIVE EMERGENCY WORKFLOW */
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Emergency Alert Banner */}
          <div className="p-5 rounded-[20px] bg-red-600 text-white shadow-md flex flex-wrap items-center justify-between gap-4 border-2 border-red-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold tracking-tight">
                  {t.emergencyTitle}
                </h3>
                <p className="text-sm font-medium text-red-100">
                  {t.emergencySubtitle}
                </p>
              </div>
            </div>

            <button
              id="btn-call-112-direct"
              onClick={() => (window.location.href = "tel:112")}
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-red-700 font-extrabold text-lg sm:text-xl flex items-center gap-2.5 shadow-xs active:scale-95 transition-transform"
            >
              <PhoneCall className="w-6 h-6 text-red-600 animate-bounce" />
              <span>{t.callEmergencyBtn}</span>
            </button>
          </div>

          {/* GPS LOCATION STATUS CARD */}
          <div
            id="emergency-gps-card"
            className={`rounded-[20px] p-6 sm:p-7 border-2 shadow-xs space-y-5 ${
              highContrast
                ? "bg-black border-yellow-400 text-yellow-300"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center justify-between border-b-2 border-slate-100 dark:border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-6 h-6 text-red-600" />
                <h4 className="text-xl font-bold">
                  {isLoadingLocation
                    ? t.locationFetching
                    : location
                    ? t.locationSuccess
                    : t.locationFetching}
                </h4>
              </div>

              <button
                id="btn-refresh-location"
                onClick={fetchCoordinates}
                disabled={isLoadingLocation}
                className="px-3.5 py-1.5 rounded-xl border-2 border-slate-200 dark:border-neutral-700 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-neutral-800"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLocation ? "animate-spin" : ""}`} />
                <span>{language === "hi" ? "लोकेशन रीफ़्रेश करें" : "Refresh GPS"}</span>
              </button>
            </div>

            {locationError && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-neutral-900 border-2 border-amber-200 text-amber-900 dark:text-amber-300 text-sm space-y-1 font-medium">
                <strong>{t.errorTitle}:</strong> {locationError}
              </div>
            )}

            {location && (
              <div className="space-y-4">
                {/* Coordinates Display */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800">
                    <span className="text-xs text-slate-500 dark:text-neutral-400 font-bold block uppercase">
                      {t.latitudeLabel}
                    </span>
                    <span className="text-xl font-black font-mono text-slate-800 dark:text-yellow-300">
                      {location.latitude.toFixed(6)}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800">
                    <span className="text-xs text-slate-500 dark:text-neutral-400 font-bold block uppercase">
                      {t.longitudeLabel}
                    </span>
                    <span className="text-xl font-black font-mono text-slate-800 dark:text-yellow-300">
                      {location.longitude.toFixed(6)}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800">
                    <span className="text-xs text-slate-500 dark:text-neutral-400 font-bold block uppercase">
                      {t.accuracyLabel}
                    </span>
                    <span className="text-xl font-black text-green-600 dark:text-green-400">
                      ±{location.accuracy} meters
                    </span>
                  </div>
                </div>

                {/* Location Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    id="btn-share-emergency-location"
                    onClick={handleShareLocation}
                    className={`flex-1 min-w-[240px] py-4 px-6 rounded-xl font-extrabold text-lg flex items-center justify-center gap-3 shadow-xs active:scale-98 transition-transform ${
                      highContrast
                        ? "bg-yellow-400 text-black hover:bg-yellow-300"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    <Share2 className="w-6 h-6" />
                    <span>{t.shareLocationBtn}</span>
                  </button>

                  <a
                    id="btn-open-google-maps"
                    href={location.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-4 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Navigation className="w-5 h-5" />
                    <span>{t.mapsLinkBtn}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {copiedNotice && (
                  <div className="p-3 rounded-xl bg-green-50 border-2 border-green-200 text-green-900 text-sm font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span>{copiedNotice}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 1-TOUCH EMERGENCY CALLING OPTIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Call 112 */}
            <a
              id="btn-call-112-national"
              href="tel:112"
              className="p-5 rounded-[20px] bg-red-600 hover:bg-red-700 text-white border-2 border-red-700 shadow-xs flex flex-col justify-between group active:scale-98 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <PhoneCall className="w-8 h-8 group-hover:scale-105 transition-transform" />
                <span className="text-2xl font-black font-mono">112</span>
              </div>
              <div>
                <h4 className="text-lg font-bold">National Helpline</h4>
                <p className="text-xs text-red-100">Police, Fire & Ambulance</p>
              </div>
            </a>

            {/* Call 108 */}
            <a
              id="btn-call-108-ambulance"
              href="tel:108"
              className="p-5 rounded-[20px] bg-amber-600 hover:bg-amber-700 text-white border-2 border-amber-700 shadow-xs flex flex-col justify-between group active:scale-98 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <Ambulance className="w-8 h-8 group-hover:scale-105 transition-transform" />
                <span className="text-2xl font-black font-mono">108</span>
              </div>
              <div>
                <h4 className="text-lg font-bold">Ambulance Service</h4>
                <p className="text-xs text-amber-100">Direct Medical Transport</p>
              </div>
            </a>

            {/* Call Saved Emergency Contact */}
            {profile.emergencyContactPhone ? (
              <a
                id="btn-call-saved-contact"
                href={`tel:${profile.emergencyContactPhone}`}
                className="p-5 rounded-[20px] bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-700 shadow-xs flex flex-col justify-between group active:scale-98 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <HeartHandshake className="w-8 h-8 group-hover:scale-105 transition-transform" />
                  <span className="text-xs font-bold bg-blue-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Family Contact
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-bold truncate">
                    {profile.emergencyContactName || "Emergency Contact"}
                  </h4>
                  <p className="text-xs text-blue-100 font-mono">
                    {profile.emergencyContactPhone}
                  </p>
                </div>
              </a>
            ) : (
              <div className="p-5 rounded-[20px] bg-slate-50 dark:bg-neutral-900 border-2 border-dashed border-slate-300 dark:border-neutral-800 flex flex-col justify-center text-center">
                <p className="text-xs text-slate-500 dark:text-neutral-400 mb-1">
                  {language === "hi" ? "आपातकालीन संपर्क नंबर सेट करें" : "No family contact saved"}
                </p>
                <span className="text-xs font-bold text-blue-600 dark:text-yellow-400">
                  {language === "hi" ? "नीचे फ़ॉर्म में भरें" : "Configure profile below"}
                </span>
              </div>
            )}
          </div>

          {/* AMBULANCE SERVICE INTEGRATION MODULE */}
          <div
            id="ambulance-integration-card"
            className={`rounded-[20px] p-6 sm:p-7 border-2 shadow-xs space-y-4 ${
              highContrast
                ? "bg-black border-yellow-400 text-yellow-300"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-neutral-800 text-red-600 dark:text-yellow-400 flex items-center justify-center border border-red-100">
                  <Ambulance className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xl font-bold">
                    {language === "hi" ? "एम्बुलेंस सेवा समन्वय" : "Ambulance Dispatch Interface"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                    {t.ambulanceNotice}
                  </p>
                </div>
              </div>
            </div>

            {/* Real Integration Prototype Feedback */}
            {ambulanceRequested && ambulanceResponse ? (
              <div className="p-5 rounded-2xl bg-green-50 dark:bg-neutral-900 border-2 border-green-200 dark:border-green-600 space-y-3">
                <div className="flex items-center gap-2 text-green-900 dark:text-green-300 font-extrabold text-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <span>{ambulanceResponse.message}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-neutral-300 leading-relaxed font-medium">
                  {language === "hi"
                    ? "सुरक्षा सूचना: यह वास्तविक कॉल सेंटर समन्वय के लिए आपकी GPS लोकेशन तैयार रखता है। सीधे 108 या 112 पर तुरंत कॉल करें।"
                    : "Safety Notice: Coordinates and patient profile are prepared for emergency dispatch. Please call the emergency hotline directly to confirm dispatch."}
                </p>
                <div className="flex items-center gap-2 pt-1 font-mono text-xs text-slate-500">
                  <span>Request ID: {ambulanceResponse.requestId}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-neutral-300 leading-relaxed font-medium">
                  {language === "hi"
                    ? "CareMitra आपकी सटीक GPS लोकेशन तैयार करके एम्बुलेंस हेल्पलाइन से जुड़ने में मदद करता है।"
                    : "CareMitra formats your high-accuracy GPS coordinates for immediate transmission to ambulance dispatch."}
                </p>
                <button
                  id="btn-request-ambulance-service"
                  onClick={handleCoordinateAmbulance}
                  disabled={isRequestingAmbulance || !location}
                  className={`w-full py-4 px-6 rounded-xl font-extrabold text-lg flex items-center justify-center gap-3 shadow-xs active:scale-98 transition-transform ${
                    highContrast
                      ? "bg-yellow-400 text-black hover:bg-yellow-300"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  <Ambulance className="w-6 h-6" />
                  <span>
                    {isRequestingAmbulance ? "..." : t.requestAmbulanceBtn}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* NEARBY HOSPITALS LIST */}
          <div
            id="nearby-hospitals-card"
            className={`rounded-[20px] p-6 sm:p-7 border-2 shadow-xs space-y-5 ${
              highContrast
                ? "bg-black border-yellow-400 text-yellow-300"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <Building className="w-6 h-6 text-blue-600 dark:text-yellow-400" />
              <h4 className="text-2xl font-bold">
                {t.nearbyHospitalsTitle}
              </h4>
            </div>

            {isLoadingHospitals ? (
              <div className="text-center py-6 text-sm text-slate-500 font-medium">
                Loading verified nearby hospitals...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hospitals.map((hosp) => (
                  <div
                    key={hosp.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h5 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                          {hosp.name}
                        </h5>
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-extrabold text-xs shrink-0 font-mono border border-blue-200">
                          {hosp.distanceKm} km
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-neutral-400 mb-2">
                        {hosp.address}
                      </p>

                      <div className="flex items-center gap-2 text-xs font-bold text-green-700 dark:text-green-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.open24x7}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t-2 border-slate-100 dark:border-neutral-800">
                      <a
                        href={hosp.directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>{t.directionsBtn}</span>
                      </a>

                      <a
                        href={`tel:${hosp.phone.split("/")[0].trim()}`}
                        className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* EMERGENCY CONTACT PROFILE (localStorage) */}
          <div
            id="emergency-profile-card"
            className={`rounded-[20px] p-6 sm:p-7 border-2 shadow-xs space-y-5 ${
              highContrast
                ? "bg-black border-yellow-400 text-yellow-300"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-blue-600 dark:text-yellow-400" />
              <div>
                <h4 className="text-xl font-bold">
                  {t.emergencyProfileTitle}
                </h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                  {t.emergencyProfileDesc}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-neutral-400 block mb-1">
                    {t.nameLabel}
                  </label>
                  <input
                    id="input-user-name"
                    type="text"
                    value={profile.userName}
                    onChange={(e) => setProfile({ ...profile, userName: e.target.value })}
                    placeholder="e.g. Ramesh Chandra Sharma"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-neutral-700 bg-transparent text-sm font-medium focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-neutral-400 block mb-1">
                    {t.phoneLabel}
                  </label>
                  <input
                    id="input-user-phone"
                    type="tel"
                    value={profile.userPhone}
                    onChange={(e) => setProfile({ ...profile, userPhone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-neutral-700 bg-transparent text-sm font-medium focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-neutral-400 block mb-1">
                    {t.emgNameLabel}
                  </label>
                  <input
                    id="input-emg-name"
                    type="text"
                    value={profile.emergencyContactName}
                    onChange={(e) =>
                      setProfile({ ...profile, emergencyContactName: e.target.value })
                    }
                    placeholder="e.g. Amit Sharma (Son)"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-neutral-700 bg-transparent text-sm font-medium focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-neutral-400 block mb-1">
                    {t.emgPhoneLabel}
                  </label>
                  <input
                    id="input-emg-phone"
                    type="tel"
                    value={profile.emergencyContactPhone}
                    onChange={(e) =>
                      setProfile({ ...profile, emergencyContactPhone: e.target.value })
                    }
                    placeholder="e.g. +91 98111 22233"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-neutral-700 bg-transparent text-sm font-medium focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  id="btn-save-emergency-profile"
                  type="submit"
                  className={`py-3 px-6 rounded-xl font-bold text-sm flex items-center gap-2 shadow-xs transition-all ${
                    highContrast
                      ? "bg-yellow-400 text-black hover:bg-yellow-300"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{t.saveProfileBtn}</span>
                </button>

                {profileSavedMsg && (
                  <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{profileSavedMsg}</span>
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

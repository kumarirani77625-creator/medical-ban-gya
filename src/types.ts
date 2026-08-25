export type Language = "en" | "hi";

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

export interface PharmacyOption {
  id: string;
  name: string;
  badge: string;
  logoText: string;
  searchUrl: string;
  description: string;
  requiresPrescriptionVerification: boolean;
  helpline?: string;
}

export interface EmergencyLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  mapsUrl: string;
  addressString?: string;
}

export interface EmergencyContactProfile {
  userName: string;
  userPhone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bloodGroup: string;
  knownConditions: string;
}

export interface Hospital {
  id: string;
  name: string;
  distanceKm: number;
  address: string;
  phone: string;
  emergencyAvailable24x7: boolean;
  type: string;
  directionsUrl: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
  suggestedAction?: "CALL_EMERGENCY" | "SCAN_MEDICINE" | "FIND_PHARMACY";
}

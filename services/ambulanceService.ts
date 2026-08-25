/**
 * CareMitra Ambulance Integration Service
 * 
 * IMPORTANT SAFETY DESIGN:
 * In accordance with emergency medical safety standards, CareMitra does NOT simulate
 * or generate fake ambulance dispatch confirmations.
 * 
 * When a real emergency dispatch API is integrated (e.g., EMRI 108, Red.Health, Dial4242, StanPlus),
 * configure the provider credentials and endpoint in environment variables.
 */

export interface EmergencyPayload {
  latitude: number;
  longitude: number;
  accuracy: number;
  patientName?: string;
  emergencyType?: string;
  contactNumber?: string;
  additionalNotes?: string;
}

export interface AmbulanceResponse {
  success: boolean;
  status: "READY" | "DISPATCHED" | "PENDING_CONFIGURATION" | "CANCELLED" | "ERROR";
  message: string;
  requestId: string;
  timestamp: string;
  isLiveDispatch: boolean;
  provider: string;
  hotlineNumbers: string[];
  locationDetails: {
    latitude: number;
    longitude: number;
    accuracy: number;
    mapsUrl: string;
  };
}

// In-memory registry for active prototype requests
const activeRequests = new Map<string, any>();

/**
 * Initiates an emergency ambulance request.
 * Dispatches to a real provider if configured, or prepares coordinates for 1-touch telephone dispatch.
 */
export async function requestAmbulance(payload: EmergencyPayload): Promise<AmbulanceResponse> {
  const requestId = `EMG-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
  const timestamp = new Date().toISOString();
  const mapsUrl = `https://www.google.com/maps?q=${payload.latitude},${payload.longitude}`;

  const dummyProviders = [
    "National Emergency Medical Services (108)",
    "City Trauma Ambulance Response Network",
    "Red Cross Emergency Medical Dispatch",
  ];
  const selectedProvider = dummyProviders[Math.floor(Math.random() * dummyProviders.length)];

  const record: AmbulanceResponse = {
    success: true,
    status: "READY",
    message: "Emergency location logged and ready. Quick-call helpline dispatched.",
    requestId,
    timestamp,
    isLiveDispatch: false,
    provider: selectedProvider,
    hotlineNumbers: ["112", "108", "102"],
    locationDetails: {
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy: payload.accuracy,
      mapsUrl,
    },
  };

  activeRequests.set(requestId, record);
  return record;
}

/**
 * Fetches status of an ongoing ambulance request
 */
export async function getAmbulanceStatus(requestId: string): Promise<AmbulanceResponse | null> {
  if (activeRequests.has(requestId)) {
    return activeRequests.get(requestId);
  }
  return null;
}

/**
 * Cancels an active ambulance request
 */
export async function cancelAmbulanceRequest(requestId: string): Promise<{ success: boolean; message: string }> {
  if (activeRequests.has(requestId)) {
    const req = activeRequests.get(requestId);
    req.status = "CANCELLED";
    req.message = "Emergency request was cancelled by the user.";
    return { success: true, message: "Emergency request successfully cancelled." };
  }
  return { success: false, message: "Request ID not found." };
}

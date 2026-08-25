import { EmergencyLocation } from "../types.ts";

/**
 * Creates a standard Google Maps location URL from latitude and longitude
 */
export function createLocationLink(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

/**
 * Requests GPS coordinates using the browser's Geolocation API
 * Provides high-accuracy readings with timeout and error fallback.
 */
export function getEmergencyLocation(): Promise<EmergencyLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = position.timestamp || Date.now();
        const mapsUrl = createLocationLink(latitude, longitude);

        resolve({
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          timestamp,
          mapsUrl,
        });
      },
      (error) => {
        let msg = "Could not retrieve GPS location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = "Location access was denied. Please allow location permissions in your browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            msg = "GPS position is unavailable. Please ensure GPS/Location services are turned ON.";
            break;
          case error.TIMEOUT:
            msg = "Location request timed out. Please try again in an open area.";
            break;
        }
        reject(new Error(msg));
      },
      options
    );
  });
}

/**
 * Shares emergency location via Web Share API or falls back to clipboard copy
 */
export async function shareEmergencyLocation(
  location: EmergencyLocation,
  patientName: string = "Senior Citizen"
): Promise<{ method: "SHARE_API" | "CLIPBOARD"; success: boolean }> {
  const shareText = `🚨 CareMitra Medical Emergency Alert!\nPatient: ${patientName}\nGPS Location: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}\nGoogle Maps Link: ${location.mapsUrl}\nAccuracy: ~${location.accuracy} meters.\nPlease send assistance immediately!`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "🚨 CareMitra Emergency Location",
        text: shareText,
        url: location.mapsUrl,
      });
      return { method: "SHARE_API", success: true };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return { method: "SHARE_API", success: false };
      }
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(shareText);
    return { method: "CLIPBOARD", success: true };
  } catch (e) {
    // Legacy fallback
    const textArea = document.createElement("textarea");
    textArea.value = shareText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    return { method: "CLIPBOARD", success: true };
  }
}

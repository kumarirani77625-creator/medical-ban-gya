# CareMitra (केयरमित्र) — Senior Citizen Medicine & Emergency Assistance

**CareMitra** is a responsive, accessible, elderly-first web platform crafted specifically for senior citizens. It provides instant visual medicine identification, verified online pharmacy purchase links, GPS emergency coordinates sharing, 1-touch calling to emergency hotlines (112/108), and an empathetic AI voice companion in English and Hindi.

---

## 🌟 Key Features

1. **Medicine Photo Identification (`POST /api/analyze-medicine`)**
   - Take a photo using the device camera (`MediaDevices.getUserMedia`) or upload JPG, PNG, WEBP.
   - Powered server-side by Google Gemini (`gemini-3.7-flash`) with structured JSON schema response.
   - Extracts Brand Name, Generic Composition, Strength, Dosage Form, Manufacturer, Prescription Requirement, and Confidence Level.
   - Strict medical safety guardrails: AI never prescribes medicines or recommends dosage changes.
   - Audio read-aloud button for senior citizens with visual difficulties.

2. **Verified Online Pharmacy Finder (`GET /api/pharmacies`)**
   - Configurable pharmacy providers (Apollo Pharmacy, Tata 1mg, Netmeds, PharmEasy, Jan Aushadhi generic network).
   - Clear prescription requirement warnings for Schedule H medicines.

3. **1-Touch Medical Emergency SOS (`POST /api/emergency/request`)**
   - Prominent, high-contrast "MEDICAL EMERGENCY" button with a confirmation step to avoid accidental triggers.
   - High-accuracy GPS location retrieval using `navigator.geolocation.getCurrentPosition()`.
   - Generates direct Google Maps location links.
   - Quick 1-tap dial to 112 (National Emergency), 108 (Ambulance), and saved family contacts.
   - "Share My Location" via Web Share API or 1-tap clipboard copy.
   - Modular `ambulanceService.ts` integration point (does not generate fake dispatch confirmations).

4. **Nearby Hospitals & Trauma Centers (`GET /api/nearby-hospitals`)**
   - Displays nearest hospitals based on GPS coordinates with distance (km), address, 24/7 status, phone, and Google Maps driving directions.

5. **Senior AI Health Assistant (`POST /api/ai-assistant`)**
   - Voice input (Speech Recognition API) & Text-to-Speech audio readout.
   - Bilingual support in English & Hindi.
   - Strict safety instructions preventing medical diagnosis or unauthorized prescriptions.

6. **Senior Accessibility Toolbar**
   - Dynamic font size scaling (A- / A+).
   - High-contrast visual mode (yellow on black) for visual impairments.
   - 1-click English ↔ Hindi language toggle.

---

## 🚀 Installation & Local Development

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables Configuration
Copy `.env.example` to `.env` and add your Gemini API Key:

```bash
cp .env.example .env
```

In `.env`:
```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
```

### 3. Run Development Server
```bash
npm run dev
```
The server will start at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🔒 Security & Medical Safety Design

- **Server-Side API Key Security**: `GEMINI_API_KEY` is strictly accessed in Node.js backend routes (`server.ts` and `services/geminiService.ts`) and is never sent to or exposed in the client browser.
- **No Mock or Fake Dispatch**: In accordance with medical emergency safety guidelines, CareMitra does not simulate fake ambulance dispatch confirmations. It prepares live GPS coordinates and provides instant 1-touch connection to national emergency services (112, 108).
- **Strict AI Guardrails**: Gemini system instructions strictly prevent disease self-diagnosis, prescribing medicines, or advising alterations to dosages.

---

## 🔌 API Integration Extension Points

### 1. Connecting Real Ambulance Dispatch APIs
Edit `services/ambulanceService.ts`:
- Set `AMBULANCE_PROVIDER_API_URL` and `AMBULANCE_PROVIDER_API_KEY` in `.env`.
- Replace the dispatch hook in `requestAmbulance()` to invoke your provider's endpoint (e.g. EMRI 108, StanPlus, Red.Health).

### 2. Adding Custom Pharmacy Partners
Edit `services/pharmacyService.ts`:
- Add new pharmacy objects to the `pharmacies` array with their custom search URL template `{query}`.

### 3. Connecting Google Places / Maps API for Hospitals
Edit `services/hospitalService.ts`:
- Set `GOOGLE_MAPS_API_KEY` in `.env`.
- Enable the Google Places API Nearby Search query hook to retrieve live hospital listings in real-time.

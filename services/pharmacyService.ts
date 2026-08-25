/**
 * CareMitra Pharmacy Configuration Service
 * 
 * Provides verified online pharmacy search endpoints.
 * Users are guided to trusted, licensed e-pharmacies and reminded of prescription compliance.
 */

export interface Pharmacy {
  id: string;
  name: string;
  badge: string;
  logoText: string;
  searchUrlTemplate: string;
  description: string;
  requiresPrescriptionVerification: boolean;
  helpline?: string;
}

export const pharmacies: Pharmacy[] = [
  {
    id: "apollo",
    name: "Apollo Pharmacy",
    badge: "24/7 Verified Network",
    logoText: "APOLLO",
    searchUrlTemplate: "https://www.apollopharmacy.in/search-medicines/{query}",
    description: "Pan-India licensed pharmacy chain with verified authentic medications and cold-chain storage.",
    requiresPrescriptionVerification: true,
    helpline: "1860-500-0101",
  },
  {
    id: "tata1mg",
    name: "Tata 1mg",
    badge: "Trusted Partner",
    logoText: "1mg",
    searchUrlTemplate: "https://www.1mg.com/search/all?name={query}",
    description: "Reliable e-pharmacy platform with verified pharmacist prescription reviews and lab tests.",
    requiresPrescriptionVerification: true,
    helpline: "0124-4166666",
  },
  {
    id: "netmeds",
    name: "Netmeds",
    badge: "Government Licensed",
    logoText: "NETMEDS",
    searchUrlTemplate: "https://www.netmeds.com/catalogsearch/result/{query}/all",
    description: "Over 100 years of pharmaceutical legacy delivering nationwide.",
    requiresPrescriptionVerification: true,
    helpline: "72007-12345",
  },
  {
    id: "pharmeasy",
    name: "PharmEasy",
    badge: "Doorstep Delivery",
    logoText: "PHARMEASY",
    searchUrlTemplate: "https://pharmeasy.in/search/all?name={query}",
    description: "Leading healthcare delivery platform with generic medicine options and discounts for seniors.",
    requiresPrescriptionVerification: true,
    helpline: "076661-00300",
  },
  {
    id: "jan-aushadhi",
    name: "Pradhan Mantri Jan Aushadhi (Generic)",
    badge: "Affordable Generic",
    logoText: "PMBJP",
    searchUrlTemplate: "https://janaushadhi.gov.in/ProductList.aspx?q={query}",
    description: "Government of India quality generic medicines at 50% to 90% lower prices for seniors.",
    requiresPrescriptionVerification: true,
    helpline: "1800-180-8080",
  },
];

export interface FormattedPharmacyOption {
  id: string;
  name: string;
  badge: string;
  logoText: string;
  searchUrl: string;
  description: string;
  requiresPrescriptionVerification: boolean;
  helpline?: string;
}

/**
 * Builds search URLs for a given medicine name across all configured pharmacies
 */
export function getPharmaciesForMedicine(medicineName: string): {
  medicineQuery: string;
  pharmacies: FormattedPharmacyOption[];
  safetyNotice: string;
} {
  const cleanQuery = medicineName ? medicineName.trim() : "";
  const encodedQuery = encodeURIComponent(cleanQuery);

  const formattedPharmacies: FormattedPharmacyOption[] = pharmacies.map((p) => ({
    id: p.id,
    name: p.name,
    badge: p.badge,
    logoText: p.logoText,
    searchUrl: p.searchUrlTemplate.replace("{query}", encodedQuery),
    description: p.description,
    requiresPrescriptionVerification: p.requiresPrescriptionVerification,
    helpline: p.helpline,
  }));

  return {
    medicineQuery: cleanQuery,
    pharmacies: formattedPharmacies,
    safetyNotice:
      "Prescription required for Schedule H/Rx medicines. Always follow the licensed pharmacy's doctor prescription upload and verification process.",
  };
}

export function getCountryFlagClass(countryCode) {
  return String(countryCode ?? '').trim().toLowerCase();
}


// 🔹 Helper to extract campus and location
export function extractCampusAndLocation(fullName: string) {
  const [campus, ...rest] = fullName.split(" - ");
  return {
    campus: campus.trim(),
    location: rest.join(" - ").trim(),
  };
}
// app/lib/pricing.ts
export const getBaseName = (fullName: string): string => {
  const cleanName = fullName.replace(/^\d+\s*x\s*/i, ''); // "3 x Kottu" -> "Kottu"
  return cleanName.split(' ')[0].split('(')[0].trim().toUpperCase();
};
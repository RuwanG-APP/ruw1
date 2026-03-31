export const getBaseName = (fullName: string): string => {
  const cleanName = fullName.replace(/^\d+\s*x\s*/i, ''); 
  return cleanName.split(' ')[0].split('(')[0].trim().toUpperCase();
};
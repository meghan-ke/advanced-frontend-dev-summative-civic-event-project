 export const utils = {
  fmtDuration: s => { s = Math.round(Number(s) || 0); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); },

  toLocalInput(d) {
    if (!d) return "";
    const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
    return x.toISOString().slice(0, 16);
  },
  // Checks a File before upload. Returns an error message, or "" when fine.
  validateFile(file, types, maxMb) {
    if (!file) return "";
    if (!types.some(t => file.type.startsWith(t))) return "Wrong file type. Allowed: " + types.join(", ");
    if (file.size > maxMb * 1024 * 1024) return "File is too large. Maximum size is " + maxMb + " MB.";
    return "";
  }
};
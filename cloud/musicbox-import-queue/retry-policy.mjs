// Politica unica di retry della coda online Music Box.
// NESSUN file audio viene scaricato sul telefono.
export const MAX_IMPORT_ATTEMPTS = 3;
export function nextRetry(attempts, reason, now = Date.now()) {
  const n = Number(attempts);
  if (!Number.isInteger(n) || n < 1 || n >= MAX_IMPORT_ATTEMPTS) return null;
  const message = String(reason || "");
  // Non riprovare a oltranza se il contenuto non e' accessibile per motivi permanenti.
  if (!/(?:error\.api\.youtube\.login|verifica\s*\/\s*login|anti.bot|login_required|not a bot|bloccato da YouTube|HTTP\s*403|403\/token|temporaneamente non raggiungibile|timed out|timeout|econnreset)/i.test(message)) return null;
  const minutes = n === 1 ? 30 : 180;
  const time = new Date(now + minutes * 60000);
  if (!Number.isFinite(time.getTime())) return null;
  return { retryAfter: time.toISOString(), nextAttempt: n + 1, maxAttempts: MAX_IMPORT_ATTEMPTS, minutes };
}

/** Digits-only international form for wa.me (e.g. 66942728437). */
export function normalizeWhatsAppNumber(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  // Local PK mobiles often stored as 03XXXXXXXXX
  if (digits.startsWith("0")) {
    digits = `92${digits.slice(1)}`;
  }
  return digits;
}

export function getWhatsAppNumber() {
  return (
    process.env.WHATSAPP_NUMBER?.trim() ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ||
    ""
  );
}

export function whatsAppHref(rawNumber: string, text?: string) {
  const number = normalizeWhatsAppNumber(rawNumber);
  if (!number) {
    return "";
  }
  const url = new URL(`https://wa.me/${number}`);
  if (text) {
    url.searchParams.set("text", text);
  }
  return url.toString();
}

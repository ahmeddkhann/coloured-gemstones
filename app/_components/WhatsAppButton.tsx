import { WhatsAppFloat } from "@/app/_components/WhatsAppFloat";
import { getWhatsAppNumber, whatsAppHref } from "@/lib/whatsapp";

export function WhatsAppButton() {
  const number = getWhatsAppNumber();
  if (!number) {
    return null;
  }

  const href = whatsAppHref(
    number,
    "Hello! I’d like to ask about a coloured gemstone.",
  );
  if (!href) {
    return null;
  }

  return <WhatsAppFloat href={href} />;
}

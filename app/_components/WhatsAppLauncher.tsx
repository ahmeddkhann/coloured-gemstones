import { WhatsAppButton } from "@/app/_components/WhatsAppButton";
import { getWhatsAppNumber } from "@/lib/whatsapp";

/** Server wrapper: reads env and hands the number to a client-only float. */
export function WhatsAppLauncher() {
  const number = getWhatsAppNumber();
  if (!number) {
    return null;
  }
  return <WhatsAppButton number={number} />;
}

"use client";

import { WhatsAppFloat } from "@/app/_components/WhatsAppFloat";
import { whatsAppHref } from "@/lib/whatsapp";

type Props = {
  number: string;
};

export function WhatsAppButton({ number }: Props) {
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

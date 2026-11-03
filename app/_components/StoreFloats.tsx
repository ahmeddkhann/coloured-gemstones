"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { ChatBubble } from "@/app/_components/chat/ChatBubble";
import { WhatsAppFloat } from "@/app/_components/WhatsAppFloat";
import { whatsAppHref } from "@/lib/whatsapp";

type Props = {
  whatsappNumber?: string;
};

/**
 * Mounted from the client provider tree (not as an RSC sibling after
 * Suspense) so Cache Components streaming cannot strip the floats from the DOM.
 */
export function StoreFloats({ whatsappNumber = "" }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const href = whatsappNumber
    ? whatsAppHref(
        whatsappNumber,
        "Hello! I’d like to ask about a coloured gemstone.",
      )
    : "";

  return createPortal(
    <>
      <ChatBubble />
      {href ? <WhatsAppFloat href={href} /> : null}
    </>,
    document.body,
  );
}

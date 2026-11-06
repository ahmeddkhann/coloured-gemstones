"use client";

import { useEffect } from "react";

/**
 * Marks the document while any /admin page is mounted so storefront chrome
 * can hide, then clears the mark on unmount so the home navbar returns.
 */
export function AdminRouteMarker() {
  useEffect(() => {
    document.documentElement.dataset.adminRoute = "true";
    return () => {
      delete document.documentElement.dataset.adminRoute;
    };
  }, []);

  return null;
}

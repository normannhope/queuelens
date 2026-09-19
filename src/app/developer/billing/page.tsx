"use client";
import { useEffect } from "react";

// Billing became part of the broader Settings page (account info + plan,
// together, instead of a bare plan grid) — this old URL just forwards
// there so any saved link or bookmark still lands somewhere real.
export default function BillingRedirect() {
  useEffect(() => {
    window.location.replace("/developer/settings");
  }, []);
  return null;
}

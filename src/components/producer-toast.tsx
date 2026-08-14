"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Says what just happened, once, after the list reloads.
 *
 * The actions redirect here carrying the event and the producer's name. The
 * parameters are cleared straight after, so a refresh or a back-navigation
 * does not announce the same change twice.
 */
const MESSAGES: Record<string, (name: string) => string> = {
  created: (name) => `${name} added`,
  renamed: (name) => `Renamed to ${name}`,
  archived: (name) => `${name} archived`,
  restored: (name) => `${name} restored`,
};

export function ProducerToast() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const event = searchParams.get("toast");
  const name = searchParams.get("name");

  useEffect(() => {
    if (event === null || name === null) return;

    const message = MESSAGES[event]?.(name);

    if (message !== undefined) toast.success(message);

    // replace, not push: the announcement is not a place to go back to.
    router.replace("/producers");
  }, [event, name, router]);

  return null;
}

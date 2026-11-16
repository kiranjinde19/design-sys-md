/**
 * Copies text. Call it straight from the tap handler, before any other await, so the phone still counts it as a tap.
 * 1. The Clipboard API. 2. If that is missing or refused: a hidden textarea, select(), document.execCommand("copy").
 * Resolves true only when one of them really worked; false means the caller should show the text to copy by hand.
 */
export async function copyText(text: string): Promise<boolean> {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function" &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the older way.
    }
  }
  return legacyCopy(text);
}

function legacyCopy(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.setAttribute("aria-hidden", "true");
  // Off screen but real (iOS will not copy from display: none). 16px stops iOS from zooming the page.
  area.style.cssText =
    "position:fixed;top:0;left:-9999px;width:1px;height:1px;opacity:0;font-size:16px";
  document.body.appendChild(area);
  const active = document.activeElement as HTMLElement | null;
  try {
    area.focus({ preventScroll: true });
    area.select();
    area.setSelectionRange(0, text.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
    active?.focus?.({ preventScroll: true });
  }
}

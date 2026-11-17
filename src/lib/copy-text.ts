/**
 * Copies text and says whether it really worked. Call it straight from the tap handler.
 * 1. The older way first, synchronously inside the tap: a real textarea, selected, then document.execCommand("copy").
 *    Phones (iOS) accept this only inside the tap and only from an editable, selectable field, so it goes first.
 * 2. The Clipboard API, with a time limit (on some phones the promise never settles, which looked like "nothing happens").
 * Resolves true only when one of them worked; false means the caller shows the text to copy by hand.
 */
export async function copyText(text: string): Promise<boolean> {
  if (legacyCopy(text)) return true;
  if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await Promise.race([navigator.clipboard.writeText(text), new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 1500))]);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

function legacyCopy(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("aria-hidden", "true");
  area.setAttribute("tabindex", "-1");
  area.contentEditable = "true";
  area.readOnly = false;
  // Off screen but real (iOS will not copy from display: none). 16px stops iOS from zooming the page.
  area.style.cssText = "position:fixed;top:0;left:-9999px;width:1px;height:1px;opacity:0;font-size:16px";
  document.body.appendChild(area);
  const active = document.activeElement as HTMLElement | null;
  try {
    area.focus({ preventScroll: true });
    const range = document.createRange();
    range.selectNodeContents(area);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    area.setSelectionRange(0, text.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    window.getSelection()?.removeAllRanges();
    area.remove();
    active?.focus?.({ preventScroll: true });
  }
}

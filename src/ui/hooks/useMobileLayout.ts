import { useEffect, useState } from "react";

const MOBILE_MAX_WIDTH = 900;

function detectMobileLayout(): boolean {
  if (typeof window === "undefined") return false;
  const coarse =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(pointer: coarse)").matches
      : false;
  const narrow = window.innerWidth <= MOBILE_MAX_WIDTH;
  return coarse || narrow;
}

export function useMobileLayout(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => detectMobileLayout());

  useEffect(() => {
    const update = (): void => setIsMobile(detectMobileLayout());
    update();
    window.addEventListener("resize", update);
    const pointerQuery =
      typeof window.matchMedia === "function" ? window.matchMedia("(pointer: coarse)") : null;
    pointerQuery?.addEventListener("change", update);
    return (): void => {
      window.removeEventListener("resize", update);
      pointerQuery?.removeEventListener("change", update);
    };
  }, []);

  return isMobile;
}

/** Progressive enhancement: content stays readable even when observation fails. */
export function initContentMotion(root: Document, reduced: boolean) {
  const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
  const animations = new Set<Animation>();
  let observer: IntersectionObserver | undefined;
  let disposed = false;
  elements.forEach((element) => {
    // Neutralise legacy hide-before-observe CSS without changing the layout.
    element.dataset.revealReady = "true";
    element.dataset.revealed = "true";
  });
  const cleanup = () => {
    disposed = true;
    observer?.disconnect();
    animations.forEach((animation) => animation.cancel());
    animations.clear();
  };
  const view = root.defaultView;
  if (
    reduced ||
    !view ||
    !("IntersectionObserver" in view) ||
    view.matchMedia("(max-width: 639px)").matches ||
    root.querySelector("#geo-v4, .leaflet-container, [data-geospatial-app]")
  )
    return cleanup;

  const candidates = elements.filter(
    (element) =>
      element.dataset.motionPlayed !== "true" &&
      !element.parentElement?.closest("[data-reveal]"),
  );
  const play = (element: HTMLElement) => {
    if (disposed || element.dataset.motionPlayed === "true") return;
    element.dataset.motionPlayed = "true";
    if (typeof element.animate !== "function") return;
    try {
      const animation = element.animate(
        [
          { opacity: 0.72, transform: "translateY(6px)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 240, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      );
      animations.add(animation);
      animation.onfinish = () => animations.delete(animation);
      animation.oncancel = () => animations.delete(animation);
    } catch {
      /* Animation support must never block content or navigation. */
    }
  };
  try {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || disposed) continue;
          observer?.unobserve(entry.target);
          play(entry.target as HTMLElement);
        }
      },
      { threshold: 0, rootMargin: "0px" },
    );
    // Do not replay an entrance over already-visible first-paint content.
    for (const element of candidates) {
      const bounds = element.getBoundingClientRect();
      if (bounds.top < view.innerHeight && bounds.bottom > 0) {
        element.dataset.motionPlayed = "true";
      } else observer.observe(element);
    }
  } catch {
    cleanup();
  }
  return cleanup;
}

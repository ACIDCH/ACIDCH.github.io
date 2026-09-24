import { afterEach, describe, expect, it, vi } from "vitest";
import { initContentMotion } from "../src/scripts/content-motion";

function setup({
  mobile = false,
  heavy = false,
  supported = true,
  nested = false,
  top = 900,
} = {}) {
  const animation = { cancel: vi.fn(), onfinish: null, oncancel: null };
  const element = {
    dataset: {} as Record<string, string>,
    parentElement: { closest: () => (nested ? {} : null) },
    getBoundingClientRect: () => ({ top, bottom: top + 100 }),
    animate: vi.fn(() => animation),
  };
  let notify: (entries: unknown[]) => void = () => {};
  const observer = { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
  const Constructor = vi.fn(function (callback: typeof notify) {
    notify = callback;
    return observer;
  });
  vi.stubGlobal("IntersectionObserver", Constructor);
  const root = {
    querySelectorAll: () => [element],
    querySelector: () => (heavy ? {} : null),
    defaultView: {
      ...(supported ? { IntersectionObserver: Constructor } : {}),
      innerHeight: 800,
      matchMedia: () => ({ matches: mobile }),
    },
  } as unknown as Document;
  return {
    root,
    element,
    animation,
    observer,
    enter: () => notify([{ target: element, isIntersecting: true }]),
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("content motion is a fail-open enhancement", () => {
  it("ignores a queued observer callback after cleanup", () => {
    const fixture = setup();
    initContentMotion(fixture.root, false)();
    fixture.enter();
    expect(fixture.element.animate).not.toHaveBeenCalled();
  });
  it("keeps content readable if observer construction fails", () => {
    const fixture = setup();
    vi.stubGlobal("IntersectionObserver", function () {
      throw new Error("unavailable");
    });
    expect(() => initContentMotion(fixture.root, false)).not.toThrow();
    expect(fixture.element.dataset.revealed).toBe("true");
  });
  it.each([{ mobile: true }, { heavy: true }, { supported: false }])(
    "keeps content visible when skipped: %j",
    (options) => {
      const fixture = setup(options);
      initContentMotion(fixture.root, false);
      expect(fixture.element.dataset.revealed).toBe("true");
      expect(fixture.observer.observe).not.toHaveBeenCalled();
    },
  );
  it("reduced motion never starts an animation", () => {
    const fixture = setup();
    initContentMotion(fixture.root, true);
    fixture.enter();
    expect(fixture.element.animate).not.toHaveBeenCalled();
    expect(fixture.element.dataset.revealed).toBe("true");
  });
  it("animates an offscreen section only once and cancels on navigation", () => {
    const fixture = setup();
    const cleanup = initContentMotion(fixture.root, false);
    fixture.enter();
    fixture.enter();
    expect(fixture.element.animate).toHaveBeenCalledTimes(1);
    cleanup();
    fixture.enter();
    expect(fixture.animation.cancel).toHaveBeenCalledOnce();
    expect(fixture.observer.disconnect).toHaveBeenCalledOnce();
    expect(fixture.element.animate).toHaveBeenCalledTimes(1);
  });
  it.each([{ top: 100 }, { nested: true }])(
    "does not animate first-paint or nested content: %j",
    (options) => {
      const fixture = setup(options);
      initContentMotion(fixture.root, false);
      expect(fixture.observer.observe).not.toHaveBeenCalled();
    },
  );
  it("does not replay after reinitialisation", () => {
    const fixture = setup();
    initContentMotion(fixture.root, false)();
    fixture.element.dataset.motionPlayed = "true";
    fixture.observer.observe.mockClear();
    initContentMotion(fixture.root, false);
    expect(fixture.observer.observe).not.toHaveBeenCalled();
  });
  it("leaves content visible when animation throws", () => {
    const fixture = setup();
    fixture.element.animate.mockImplementation(() => {
      throw new Error("unsupported");
    });
    initContentMotion(fixture.root, false);
    expect(fixture.enter).not.toThrow();
    expect(fixture.element.dataset.revealed).toBe("true");
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { formatSharedUi, sharedUi } from "../src/i18n/shared-ui";

const read = (path: string) => readFileSync(path, "utf8");
const convertedComponents = [
  "src/components/BackToTop.astro",
  "src/components/Footer.astro",
  "src/components/GlobalSearch.astro",
  "src/components/Header.astro",
  "src/components/hero/Hero.astro",
  "src/components/HomePage.astro",
  "src/components/NoteList.astro",
  "src/components/NotesExplorer.astro",
  "src/components/PageIntro.astro",
  "src/components/Pagination.astro",
  "src/components/ProjectCard.astro",
  "src/components/ProjectList.astro",
  "src/components/SkillGrid.astro",
  "src/components/SocialLinks.astro",
  "src/components/ThemeSwitch.astro",
  "src/components/WechatQrDialog.astro",
];

describe("Phase 2C shared UI localisation", () => {
  it("provides complete, distinct English and Chinese shared copy", () => {
    expect(sharedUi.en.header.search).toBe("Search");
    expect(sharedUi.zh.header.search).toBe("搜索");
    expect(sharedUi.en.search.groups).toEqual({
      page: "Pages",
      project: "Projects",
      note: "Notes",
    });
    expect(sharedUi.zh.search.groups).toEqual({
      page: "页面",
      project: "项目",
      note: "笔记",
    });
    expect(sharedUi.en.search.pages).toHaveLength(4);
    expect(sharedUi.zh.search.pages).toHaveLength(4);
    expect(JSON.stringify(sharedUi.en)).not.toMatch(/[\u3400-\u9fff]/u);
  });

  it("formats locale-specific pagination without changing page values", () => {
    expect(
      formatSharedUi(sharedUi.en.pagination.status, { current: 2, total: 5 }),
    ).toBe("Page 2 of 5");
    expect(
      formatSharedUi(sharedUi.zh.pagination.status, { current: 2, total: 5 }),
    ).toBe("第 2 页，共 5 页");
  });

  it("keeps locale copy out of converted component implementations", () => {
    convertedComponents.forEach((path) => {
      const source = read(path);
      expect(source, path).toMatch(/i18n\/shared-ui/);
      expect(source, path).not.toMatch(/[\u3400-\u9fff]/u);
    });
  });

  it("preserves menu, search, filter, theme, contact popover and reset event contracts", () => {
    const header = read("src/components/Header.astro");
    const search = read("src/components/GlobalSearch.astro");
    const notes = read("src/components/NotesExplorer.astro");
    const theme = read("src/components/ThemeSwitch.astro");
    const wechat = read("src/components/WechatQrDialog.astro");
    const whatsapp = read("src/components/WhatsappQrPopover.astro");
    const socialLinks = read("src/components/SocialLinks.astro");
    const backToTop = read("src/components/BackToTop.astro");

    expect(header).toContain("data-menu-toggle");
    expect(header).toContain('"cancel",');
    expect(search).toContain('"keydown",');
    expect(search).toContain('event.key === "ArrowDown"');
    expect(search).toContain("results.replaceChildren()");
    expect(search).toContain(".filter((item) => item.locale === locale)");
    expect(search).toContain("opener?.focus");
    expect(notes).toContain('button.addEventListener("click"');
    expect(notes).toContain("history.replaceState");
    expect(theme).toContain("localStorage.setItem(storageKey, preference)");
    expect(wechat).toContain("data-wechat-trigger");
    expect(wechat).toContain("(hover: none), (pointer: coarse)");
    expect(wechat).toContain('document.addEventListener("click"');
    expect(wechat).toContain('document.addEventListener("keydown"');
    expect(wechat).not.toContain("<dialog");
    expect(whatsapp).toContain("data-whatsapp-trigger");
    expect(whatsapp).toContain("/contact/whatsapp-qr.svg");
    expect(whatsapp).toContain("(hover: none), (pointer: coarse)");
    expect(whatsapp).toContain('document.addEventListener("click"');
    expect(whatsapp).toContain('document.addEventListener("keydown"');
    expect(whatsapp).not.toContain("<dialog");
    expect(socialLinks).toContain("<WhatsappQrPopover />");
    expect(backToTop).toContain("button.addEventListener(");
    expect(backToTop).toContain('"click",');
    expect(backToTop).toContain("window.scrollTo");
  });
});

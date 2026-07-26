import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const locale = z.enum(["en", "zh"]);

const projects = defineCollection({
  loader: glob({
    base: "./src/content/projects",
    pattern: "**/*.{md,mdx}",
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, ""),
  }),
  schema: z.object({
    translationKey: z.string().min(1),
    locale,
    slug: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
    tools: z.array(z.string()).default([]),
    status: z.enum(["planned", "in-development", "completed"]),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    repoSlug: z.string().min(1).optional(),
    reportUrl: z.url().optional(),
    dashboardUrl: z.url().optional(),
    updatedAt: z.coerce.date().optional(),
    isPlaceholder: z.boolean().default(false),
  }),
});

const notes = defineCollection({
  loader: glob({
    base: "./src/content/notes",
    pattern: "**/*.{md,mdx}",
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, ""),
  }),
  schema: z.object({
    translationKey: z.string().min(1),
    locale,
    slug: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
    tags: z.array(z.string()).default([]),
    publishedAt: z.coerce.date().optional(),
    updatedAt: z.coerce.date().optional(),
    draft: z.boolean().default(true),
    isPlaceholder: z.boolean().default(false),
  }),
});

export const collections = { projects, notes };

import { z, defineCollection } from 'astro:content';

const post = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),

    canonical: z.string().url().optional(),

    publishDate: z.date().or(z.string()).optional(),
    draft: z.boolean().optional(),

    excerpt: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional(),
  }),
});

const project = defineCollection({
  schema: z.object({
    title: z.string(),
    weight: z.number(),
    repo: z.string(),
  }),
});

export const collections = {
  post: post,
  project: project,
};

import { z, defineCollection } from "astro:content";

const postsColection = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.date(),
    author: z.string().default("Vincent Tavernier"),
    description: z.string().optional(),
  }),
});

export const collections = {
  posts: postsColection,
};

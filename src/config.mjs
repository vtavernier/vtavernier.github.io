const CONFIG = {
  name: 'The Tavern',
  author: 'Vincent Tavernier',

  origin: process.env.SITE || 'https://vtavernier.github.io',
  basePathname: process.env.BASE_URL || '/',
  trailingSlash: false,

  title: 'The Tavern — Programming and research stuff',
  description: 'My findings and sharings on programming projects, personal or not.',
  // defaultImage: defaultImage,

  defaultTheme: 'dark:only', // Values: "system" | "light" | "dark" | "light:only" | "dark:only"

  language: 'en',
  textDirection: 'ltr',

  dateFormatter: new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }),

  googleSiteVerificationId: '9T4KIucFxDdjqi0gdKxvMbVSluLphiFhgBc3iCSAKqk',

  blog: {
    disabled: false,
    postsPerPage: 4,

    post: {
      permalink: '/posts/%slug%', // Variables: %slug%, %year%, %month%, %day%, %hour%, %minute%, %second%, %category%
      noindex: false,
      disabled: false,
    },

    list: {
      pathname: 'posts', // Blog main path, you can change this to "articles" (/articles)
      noindex: false,
      disabled: false,
    },

    category: {
      pathname: 'category', // Category main path /category/some-category
      noindex: true,
      disabled: true,
    },

    tag: {
      pathname: 'tags', // Tag main path /tag/some-tag
      noindex: true,
      disabled: false,
    },
  },
};

export const SITE = { ...CONFIG, blog: undefined };
export const BLOG = CONFIG.blog;
export const DATE_FORMATTER = CONFIG.dateFormatter;

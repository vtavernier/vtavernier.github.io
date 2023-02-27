import { SITE } from './config.mjs';
import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Blog',
      href: getBlogPermalink(),
    },
    {
      text: 'Projects',
      href: getPermalink('/projects'),
    },
    {
      text: 'Research',
      href: getPermalink('/research'),
    },
    {
      text: 'About me',
      href: getPermalink('/about'),
    },
  ],
  actions: [],
};

export const footerData = {
  links: [],
  secondaryLinks: [],
  socialLinks: [
    { ariaLabel: 'E-mail', icon: 'tabler:mail', href: 'mailto:v.tavernier@pm.me' },
    { ariaLabel: 'Github', icon: 'tabler:brand-github', href: 'https://github.com/vtavernier' },
    {
      ariaLabel: 'LinkedIn',
      icon: 'tabler:brand-linkedin',
      href: 'https://www.linkedin.com/in/vincent-tavernier-707b5012a/',
    },
    { ariaLabel: 'crates.io', icon: 'tabler:package', href: 'https://crates.io/users/vtavernier' },
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
  ],
};

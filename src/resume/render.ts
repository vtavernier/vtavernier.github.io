import raw_fr_FR from './data/Alix_Tavernier.resume.fr_FR.raw.json';
import raw_en_US from './data/Alix_Tavernier.resume.en_US.raw.json';
import { transformJsonResume } from './transforms';
import { render as renderEn } from 'jsonresume-theme-stackoverflow';
import { render as renderFr } from 'jsonresume-theme-stackoverflow-fr';

interface ResumeData {
  render: (resume: any) => string;
  resume: any;
  canonicalLang: string;
}

function getRawResumeForLang(lang: string): ResumeData {
  if (lang == 'en_US' || lang == 'en') {
    return { resume: raw_en_US, render: renderEn, canonicalLang: 'en_US' };
  } else if (lang == 'fr_FR' || lang == 'fr') {
    return { resume: raw_fr_FR, render: renderFr, canonicalLang: 'fr_FR' };
  } else {
    throw new Error(`Unsupported resume language: ${lang}`);
  }
}

export function renderResume(lang: string, includeDoctype: boolean): string {
  const { render, resume, canonicalLang } = getRawResumeForLang(lang);
  const transformed = transformJsonResume(resume, canonicalLang);
  const html = render(transformed);
  if (includeDoctype) {
    return html;
  } else {
    return html.replace(/<!doctype html.*\r\n/, '');
  }
}

export function getAvailablePages() {
  const author = 'alix-tavernier';
  return [{ params: { authorLang: `${author}_fr` } }, { params: { authorLang: `${author}_en` } }];
}

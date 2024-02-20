#!/usr/bin/env -S deno run --allow-env --allow-read --allow-write

import { transformJsonResume } from './transforms.ts';

for (const lang of ['fr_FR', 'en_US']) {
  const sourceFile = `./data/Alix_Tavernier.resume.${lang}.raw.json`;
  const destFile = `./data/Alix_Tavernier.resume.${lang}.final.json`;

  // Transform JSON resume
  const data = JSON.parse(await Deno.readTextFile(sourceFile));
  transformJsonResume(data, lang);
  await Deno.writeTextFile(destFile, JSON.stringify(data, null, '  '));
}

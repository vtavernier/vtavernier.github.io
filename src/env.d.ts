/* eslint-disable */
/// <reference path="../.astro/types.d.ts" />
/// <reference types="@astrojs/image/client" />

declare module 'jsonresume-theme-stackoverflow' {
  interface Theme {
    render(resume: any): string;
  }
  export = Theme;
}

declare module 'jsonresume-theme-stackoverflow-fr' {
  interface Theme {
    render(resume: any): string;
  }
  export = Theme;
}

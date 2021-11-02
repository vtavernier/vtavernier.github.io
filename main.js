if (document.querySelector(".mermaid")) {
  const script = document.createElement("script");
  script.onload = function () {
    const config = {
      startOnLoad: true,
      theme: "dark",
      themeVariables: {
        fontSize: '12px',
      },
    };
    mermaid.initialize(config);
  };
  script.src = "https://unpkg.com/mermaid@8.13.3/dist/mermaid.min.js";
  document.head.appendChild(script);
}

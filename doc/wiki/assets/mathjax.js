// MathJax configuration for pymdownx.arithmatex in `generic` mode.
//
// Arithmatex emits `\(…\)` and `\[…\]` inside `.arithmatex` spans rather than
// typesetting anything itself, so without this file every formula on the site
// renders as its own source. Re-typesetting on `document$` is what keeps math
// working after Material's instant navigation swaps the page without a reload.
window.MathJax = {
  tex: {
    inlineMath: [["\\(", "\\)"]],
    displayMath: [["\\[", "\\]"]],
    processEscapes: true,
    processEnvironments: true,
  },
  options: {
    ignoreHtmlClass: ".*|",
    processHtmlClass: "arithmatex",
  },
};

document$.subscribe(() => {
  MathJax.startup.output.clearCache();
  MathJax.typesetClear();
  MathJax.texReset();
  MathJax.typesetPromise();
});

// PostCSS plugin (TASK-B-002, made per-theme in TASK-B-004): in a theme's own CSS file, rules aimed at the whole
// document (:root, :host, html, body, a leading * or bare ::before/::after) are moved onto that theme's root.
// Element selectors (button, input, h1 …) are left alone on purpose: if one leaks, the isolation test must see it.
//
// Which files, and which root — taken from the path, so a new theme needs no change here:
//   src/themes/<id>/theme.css            → [data-theme-root="<id>"]
//   src/dev/isolation/heroui/heroui.css  → [data-theme-root="heroui"]   (the TASK-B-002 proof)
// Any other file is left untouched.
//
// @property registrations are global by definition (every element, <html> included, reports them), so they are
// dropped and Tailwind's own per-element fallback is kept, scoped. A theme that wants them (smooth animation of
// typed --tw-* values) puts this exact first line in its theme.css:  /* scope-to-theme-root: keep-property */
const fs = require("node:fs");

const THEME_CSS = /[\\/]src[\\/]themes[\\/]([a-z0-9-]+)[\\/]theme\.css$/;
const PROOF_CSS = /[\\/]src[\\/]dev[\\/]isolation[\\/]heroui[\\/]heroui\.css$/;
const KEEP_PROPERTY = "/* scope-to-theme-root: keep-property */";

function themeIdFor(file) {
  const m = file.match(THEME_CSS);
  if (m) return m[1];
  if (PROOF_CSS.test(file)) return "heroui";
  return null;
}

// Read from the file on disk: compilers in front of this plugin may strip comments.
function keepsProperty(file) {
  try {
    return fs.readFileSync(file, "utf8").split(/\r?\n/, 1)[0].trim() === KEEP_PROPERTY;
  } catch {
    return false;
  }
}

function rewriter(root) {
  return (selector) => {
    const s = selector.trim();
    if (/^(:root|:host|html|body)$/.test(s)) return [root];
    if (/^:host\((.+)\)$/.test(s)) return [root + s.match(/^:host\((.+)\)$/)[1]];
    if (/^(:root|html)(?=[[.:#\s>~+])/.test(s)) return [s.replace(/^(:root|html)/, root)];
    if (/^(\*|::?(before|after|backdrop|file-selector-button|placeholder|selection|marker))/.test(s)) return [`${root} ${s}`];
    return [s];
  };
}

module.exports = () => ({
  postcssPlugin: "scope-to-theme-root",
  OnceExit(css, { result }) {
    const file = (css.source && css.source.input && css.source.input.file) || result.opts.from || "";
    const id = themeIdFor(file);
    if (!id) return;
    const rewrite = rewriter(`[data-theme-root="${id}"]`);
    if (!keepsProperty(file)) {
      css.walkAtRules("property", (at) => at.remove());
      css.walkAtRules("supports", (at) => {
        if (at.parent && at.parent.type === "atrule" && at.parent.name === "layer" && at.parent.params === "properties") at.replaceWith(at.nodes);
      });
    }
    css.walkRules((rule) => {
      if (rule.parent && rule.parent.type === "atrule" && /keyframes$/.test(rule.parent.name)) return;
      rule.selectors = [...new Set(rule.selectors.flatMap(rewrite))];
    });
  },
});
module.exports.postcss = true;

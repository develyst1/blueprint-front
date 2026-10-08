// PostCSS plugin (TASK-B-002): inside the HeroUI theme's CSS only, rules that HeroUI / Tailwind aim at the
// whole document (:root, :host, html, body, a leading * or bare ::before/::after) are moved onto the theme root.
// Element selectors (button, input, h1 …) are left alone on purpose: if one leaks, the isolation test must see it.
const ROOT = '[data-theme-root="heroui"]';
const THEME_CSS = /[\\/]src[\\/]dev[\\/]isolation[\\/]heroui[\\/]heroui\.css$/;

function rewrite(selector) {
  const s = selector.trim();
  if (/^(:root|:host|html|body)$/.test(s)) return [ROOT];
  if (/^:host\((.+)\)$/.test(s)) return [ROOT + s.match(/^:host\((.+)\)$/)[1]];
  if (/^(:root|html)(?=[[.:#\s>~+])/.test(s)) return [s.replace(/^(:root|html)/, ROOT)];
  if (/^(\*|::?(before|after|backdrop|file-selector-button|placeholder|selection|marker))/.test(s)) return [`${ROOT} ${s}`];
  return [s];
}

module.exports = () => ({
  postcssPlugin: "scope-to-theme-root",
  OnceExit(root, { result }) {
    const file = (root.source && root.source.input && root.source.input.file) || result.opts.from || "";
    if (!THEME_CSS.test(file)) return;
    // @property registrations are global by definition (every element, <html> included, then reports them).
    // Drop them and keep Tailwind's own fallback — the same initial values set per element, scoped below —
    // as an unconditional rule. Cost: the few typed --tw-* values (gradients, scroll-shadow fades) no longer
    // interpolate in animations inside this theme.
    root.walkAtRules("property", (at) => at.remove());
    root.walkAtRules("supports", (at) => {
      if (at.parent && at.parent.type === "atrule" && at.parent.name === "layer" && at.parent.params === "properties") at.replaceWith(at.nodes);
    });
    root.walkRules((rule) => {
      if (rule.parent && rule.parent.type === "atrule" && /keyframes$/.test(rule.parent.name)) return;
      rule.selectors = [...new Set(rule.selectors.flatMap(rewrite))];
    });
  },
});
module.exports.postcss = true;

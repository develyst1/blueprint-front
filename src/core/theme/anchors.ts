// In-page targets the core guarantees. The core renders every page's content inside <main id="content" tabIndex={-1}>,
// so a theme's skip link is <a href={contentHref}>{words.skipToContent}</a> (SPEC-B-001 § Skip link).
export const contentId = "content";
export const contentHref = `#${contentId}`;

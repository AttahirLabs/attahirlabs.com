# Sitewide SEO and AI discoverability audit — 2026-09-23

Scope: all 94 published HTML files in this site release. This pass checks whether visitors and crawlers can reach a clearly described, canonical page, and whether machine-readable answers agree with visible content. It does not claim rankings or AI citations.

| Page group | Indexable URLs | Treatment |
| --- | ---: | --- |
| Homepage | 1 | More specific e-commerce suite description and visible lead. |
| Shopify apps | 7 | Product-specific titles, descriptions, visible status, and app links reviewed; apps hub description tightened; missing social metadata completed. |
| Blog | 71 | Blog hub title, description, and heading clarified; 19 articles gained relevant next-guide links; article social metadata completed; placeholder and mismatched FAQ schema corrected or removed. |
| Web design | 1 | Service description and social preview aligned with visible offering. |
| Free tools, duty, shipping | 4 | Tool metadata, canonicals, and share images checked; invisible shipping FAQ schema removed. |
| Contact, privacy, terms | 3 | Contact title and heading clarified; legal text retained; share images completed. |
| **Total** | **87** | All 87 appear once in the XML sitemap. |

Seven HTML routes are deliberately not indexed: four legacy article redirect fallbacks, the local accessibility-checker handoff to its own domain, the analytics preferences utility, and the internal image-review page. The handoff was removed from the sitemap because its canonical URL is on `accesschecker.attahirlabs.com`.

Release checks across all 94 files: one H1, a unique title and description for each indexable page, self-canonical URLs, complete Open Graph fields, no broken local links, and alt attributes on all images. The 87 sitemap URLs exactly match the 87 indexable canonical URLs. The 46 remaining FAQ schemas contain 306 answers, each present in visible page text. Existing article sources and historical tariff dates were preserved; this was not a new verification of every time-sensitive trade or news fact.

Google's current [AI search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide) emphasizes ordinary search fundamentals, helpful visible content, and structured data consistent with the page. This pass avoids adding special AI-only files or unsupported claims.

# Blog Style Guide — Attahir Labs

## Voice
Write like a sharp friend who happens to know this stuff. Not a professor. Not a marketer. Someone who'd explain it over coffee and wouldn't waste your time.

## Anti-AI Rules (mandatory)

### Never use these phrases:
- "In today's [anything]"
- "Let's dive in" / "dive deep"
- "It's worth noting"
- "Whether you're a beginner or expert"
- "In this comprehensive guide"
- "The landscape has changed"
- "Navigating the complexities"
- "At the end of the day"
- "It's important to note/remember"
- "Here's the thing"
- "This is where X comes in"
- "Leverage" (say "use")
- "Robust" (say "solid" or "strong")
- "Comprehensive" (say "complete" or "full")
- "Crucial" / "Critical" / "Essential" (overused — pick ONE per article max)
- "Landscape" as metaphor
- "Game-changer"
- "Streamline"

### Structure rules:
- NOT every section needs an intro sentence. Sometimes just start with the point.
- Vary paragraph length wildly. One sentence. Then five. Then two.
- Vary sentence length. Short ones hit harder. But occasionally you need a longer sentence that takes its time getting somewhere, because that's how people actually think and write.
- Don't make every list item the same grammatical structure. Mix it up.
- Some sections should be 2 sentences. Others 12. Never make them all the same.
- Don't end every section with a neat summary. Just... stop when you're done.

### Word choice:
- Use contractions (don't, won't, isn't). Always. Nobody writes "do not" in a blog post.
- Use "you" constantly. Talk TO the reader.
- Use specific numbers over vague claims ($14.50, not "significant amount")
- Swear sparingly if it fits (damn, hell). Never gratuitously.
- Say "but" and "and" to start sentences. It's fine.

### Personality:
- Have opinions. "Most guides get this wrong." "This is the part everyone skips."
- Be direct. If something is bad, say it's bad. Don't hedge with "some might argue."
- Use analogies from real life, not business jargon.
- Include at least one moment where you're blunt or slightly irreverent.
- Write like you've actually helped someone with this problem, not like you read about it.

### Formatting:
- Headers should be short and punchy, not SEO-stuffed sentences.
- Use bold for emphasis, not for every other phrase.
- Tables are fine but don't overuse them. A quick sentence often beats a table.
- Code blocks only when showing actual code. Don't put terminal commands in code blocks unless the reader will copy-paste them.

### Visual Standard:

**Article first, image last.** Do not make the hero image until the article is finalized enough to know the real angle.

Before generating a public hero, run the art-direction step:

```bash
python3 tools/blog-pipeline/art_director.py --slug {slug} --candidates 4
```

This creates `tmp/{slug}-visual-brief.json` and `tmp/{slug}-candidate-prompts.md` by comparing the article against recent hero compositions. Use one of those candidate prompts, or regenerate the brief if the concepts are still too similar.

Hero images should be:
- Article-specific editorial/stock-photo-style images, not generic SEO infographics.
- Realistic ecommerce, logistics, retail, compliance, or operations scenes tied to the article's actual argument.
- Free of readable text, fake UI copy, logos, flags-as-wallpaper, or chart/infographic gimmicks.
- Varied across posts. **Do not default to boxes in the background + laptop on a desk.** That motif is now considered overused and should require a specific reason.
- Rotate compositions deliberately: boutique/back-room racks, receiving dock, customs paperwork flat lay, product sample table, support desk, accessibility testing scene, returns counter, expiry/batch shelf, shipping scale, empty rack, supplier paperwork, or other article-specific physical evidence.
- For each new hero, compare against the last 6–10 blog heroes. If two nearby posts already use the same setting, camera angle, or prop cluster, regenerate with a different concept before publishing.
- Full-quality on the article page; cropped shorter on `/blog/` cards so mobile cards don't become giant image blocks.

Raw image QA happens before page QA:
- Build a contact sheet with `python3 tools/blog-pipeline/review_blog_images.py`.
- Reject/regenerate anything that has readable fake text, logos, weird hands, malformed products, nonsense documents, generic infographic composition, or a mismatch with the article angle.
- Check the set as a group for variety. The blog should not become 20 nearly identical laptop-and-boxes shots.
- Specifically reject repeated “desk + laptop + cardboard boxes” ecommerce stock-photo compositions unless the article is literally about that workspace setup.
- Only after raw images pass should they be wired into article heroes and `/blog/` cards.

### Blog Surface QA:

Before any public blog deploy is called done:
- Every real article page must have exactly one editorial hero figure with `data-generated-visual="editorial-gpt-image-2"` and a 3840×2160 `/assets/blog/{slug}/hero.jpg`.
- Every visible `/blog/` card must have a short cropped `post-card-image` using that same hero asset.
- The primary nav must show **Home · Duty Calculator · Blog · Contact** on every article, including older templates and moved/redirect pages.
- No stale `hero.webp` references after editorial image replacement.
- No visible frontmatter or source-callout cruft such as `--- title:` or `Background sources:`.

Run `python3 tools/blog-pipeline/audit_blog_surface.py` from the workspace root after local edits and again conceptually/live after deployment checks.

For visual/UI-sensitive work, also capture screenshots with `python3 tools/blog-pipeline/capture_blog_screenshots.py` and review both mobile and desktop views before final reporting. HTML checks are necessary, but screenshots catch the real problems: missing-looking nav links, awkward crops, giant mobile cards, weird spacing, and template drift.

### FAQ sections:
- Write answers conversationally, not like a legal document.
- Vary answer length — some are one sentence, some are a paragraph.
- Include at least one answer that's just "No." or "Yes, but..." before elaborating.

## The Test
Read it out loud. If it sounds like a person talking, ship it. If it sounds like ChatGPT, rewrite it.

# Approved suite identity

The selected direction is the original architectural homepage and dedicated product pages, with navy `#102A36`, teal `#087F8C`, ivory `#F7F8F4`, pale teal `#DDEFEF`, and secondary text `#526570`. The later muted petrol/limestone brand proposal was rejected.

StockClearance retains its published isometric boxes, discount tag, and arrow. ShelfLife retains its published countdown ring and stocked shelves. TariffShield and StoreChronicle use the approved shield/T and document/timeline designs. The corresponding app threads own Shopify updates and supplied the 1200-pixel masters in `design/approved-suite-logos` in the parent workspace. Website PNG derivatives preserve those files' artwork at 512 pixels; Shopify upload and publication status are independent of website deployment.

AccessShield and WarrantyTracker use SVG implementations of the approved accessibility person and registration/check symbols. The parent monogram is SVG. Shared CSS supplies navy/teal styling across the homepage, all app pages, blog, and tools. Existing reduced-motion, keyboard and no-JavaScript fallbacks remain in place.

TariffShield and AccessShield decorative backgrounds were edited with built-in image generation and optimized as WebP under `assets/design`. Prompt used for both:

> Edit this website decorative background only: preserve exact composition, objects, plants, architectural forms, lighting, generous empty center and landscape aspect ratio. Change purple/lavender glass to clean translucent blue-teal glass inspired by #087F8C and #DDEFEF, with navy #102A36 edges. Preserve natural green foliage and neutral ivory stone. Premium crisp professional SaaS visual, no extra objects, no text, no logo, no interface. The empty middle is essential for an HTML interface overlay. Color-only refinement.

The existing product screenshots remain truthful examples of the apps; their interface colors are not recolored to imply an app UI release.

## Mockup implementation refinement

The homepage uses three translucent glass layers and a four-tier architectural frame around a semantic HTML inventory concept. Each moving layer responds to native scroll with a small, bounded translation; mobile and reduced-motion modes keep the layers still. The concept table is explicitly labelled as sample data.

Larger approved app marks, compact editorial rows, and horizontal upcoming-product entries follow the selected composition. Detailed feature lists stay on the app hub and product pages. Install links, pricing summaries and acquisition tags remain present on the homepage. Free tools and guides use compact desktop layouts that stack on mobile. Dedicated product navigation highlights plans or launch notification, and ShelfLife uses the approved headline, “Know what expires next.”

## Homepage glass correction
The desktop hero now uses refractive glass artwork derived from the approved homepage reference, alongside semantic HTML copy and links. Mobile stacks the scene beneath the headline. Bounded desktop scroll movement respects reduced-motion preferences. Compact illustrative product summaries replace tiny marketing screenshots on the homepage only; app hub and product screenshots remain unchanged.

Assets: `assets/design/home-glass.webp` (1400px, 118 KB) and `assets/design/home-glass-small.webp` (720px, 44 KB). Generated with the built-in image-generation tool from `design/attahirlabs-unified-brand-20260922/homepage.png` in the parent workspace; resized and encoded with Sharp.

Prompt: Recreate only the approved top-right architectural glass scene: overlapping transparent teal panes, a four-compartment shelving tower labelled Stock, Costs, Expiry, Growth, reflective glass plinths, and a floating inventory concept dashboard. Square composition with an off-white #F7F8F4 background fading at the edges. Preserve realistic refraction, crisp teal edges, and the reference composition; exclude page navigation, headlines, buttons, and app rows.

## E-commerce suite and web design services
The homepage now positions Attahir Labs as an e-commerce suite: “Build a better e-commerce business.” The approved glass artwork, palette, and hero layout are preserved. A new homepage section introduces website design, Shopify store setup, and storefront redesign, with a dedicated `/web-design/` page covering the services, process, FAQs, and project contact path. Themes are not advertised for sale.

The services page uses a labelled HTML/CSS storefront concept and existing reduced-motion-aware scroll effects. Project inquiries open the visitor’s email application addressed to the established support inbox; no new form backend or email submission service is introduced. Costs and timing are scoped per project. The services footer labels the existing app agreement “App terms.”

Shared site navigation now includes Web design; product navigation remains specific to each app, with Web design available in their footer. Metadata, sitemap, contact copy, and the bounded measurement catalogue include the new offering. Website measurement recognizes a `services` surface; contact intent excludes the email subject and does not establish that an enquiry was sent or received.

## Animated business elevator
The homepage glass hero rotates through six miniature businesses: café, warehouse, fashion boutique, grocer, florist, and homewares. The opening rotation alternates between three clearly identifiable website concepts and three live app concepts. Subsequent rotations use the same warehouse, boutique, and homewares scenes to introduce StoreChronicle, AccessShield, and WarrantyTracker, labelled as upcoming apps with links to launch notification. The scene count is independent of the product count.

The foreground glass interfaces follow the elevator's shared timeline: six seconds per business and a 1.15-second transition. The café, boutique, and florist panels each have their own storefront identity, navigation, product visual, headline, and shopping call to action. They are illustrative designs, not customer case studies. App interfaces also use illustrative data.

The overlapping upright glass walls and side glazing were removed to expose the shops. Furniture and walking routes now leave clear aisles. People turn before walking, slow down at their destinations, perform a task, and return; foot cadence follows distance. Seated feet and cup handling were adjusted. Geometry-derived furniture footprints validate standing characters' paths, and tests also check people separation, floor bounds, and continuity over repeated cycles.

The bottom category strip and visible pause control were removed at the user's request. Pointer hover and keyboard focus hold the scene, arrow keys browse the businesses, and Space stops or resumes movement. Reduced-motion users see a still 3D scene and can browse instantly with arrow keys. A matching rendered poster remains available without JavaScript or WebGL. The hero stops when off-screen or the tab is hidden.

The renderer uses self-hosted Three.js 0.186.0 under its MIT license. Static repeated geometry is instanced; the expensive transmission pass was removed. Rendering follows requestAnimationFrame, with pixel density capped at 2 desktop and 1.75 mobile. Renderer and scene resources are released on navigation, while BFCache restores retain state.

Validation includes timeline tests, 93,600 furniture-clearance samples across the six rooms, continuous turn/walk checks, and browser checks for all nine panels across two rotations, desktop/mobile layout, focus and reduced-motion behavior, renderer failure, and no-JavaScript fallback. The existing site test and browser suites remain required.

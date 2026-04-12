# RigSense Technical Roadmap

This roadmap starts from the current codebase and ends at the full technical product.

Scope rules:
- This file covers product capabilities, data, workflows, platform work, operations, and launch readiness.
- This file does not cover visual polish, branding, animation, or final design tuning.
- A milestone is only complete when its exit criteria are met.
- Later milestones can overlap in implementation, but the dependency order should stay the same.

## Current Baseline

Implemented now:
- Credentials-based auth with protected account routes
- Prisma schema, migrations, and seed support
- Public parts catalog, part detail pages, guides, benchmarks, trending builds, and forum pages
- Interactive builder with compatibility analysis
- Saved builds with completion and publish/unpublish flow
- Forum questions, answers, voting, and solved answer flow

Still missing from the final product:
- Live catalog data and retailer pricing
- Stronger part discovery and filtering
- Advanced builder rules and guided build planning
- Recommendation engine and upgrade planning
- Deeper benchmark ingestion and comparison tooling
- Rich public build discovery and profile surfaces
- Threaded community discussions and moderation systems
- Admin CMS, content operations, and production-grade platform hardening

## Final Product Target

The final RigSense product should provide:
- A live PC parts catalog with searchable normalized data, retailer offers, and price freshness
- A reliable builder that explains compatibility, pricing, wattage, and upgrade tradeoffs
- Recommendations powered by price, compatibility, benchmarks, and user intent
- Compare flows for parts and builds backed by benchmark evidence
- Public build sharing, discovery, cloning, and profile-based build portfolios
- A community system that supports deeper discussion, moderation, and knowledge reuse
- Admin tools for catalog, guides, benchmarks, moderation, and operational workflows
- Production readiness across testing, observability, security, deployment, and data operations

## Milestone Order

1. Foundation hardening
2. Catalog and live pricing
3. Builder v2 and build lifecycle
4. Recommendations and guided buying
5. Benchmarks and compare
6. Public builds and profiles
7. Community and moderation
8. Admin CMS and data operations
9. Production readiness and final launch gate

## Milestone 1 - Foundation Hardening

Goal: make the current codebase safe to build on before adding major product depth.

Work to complete:
- Audit the current Prisma schema, app routes, actions, and shared libraries to identify data model gaps before more features depend on them
- Add consistent env validation, startup checks, and failure handling for database and auth dependencies
- Create clearer boundaries between domain logic, data access, and UI so catalog, builder, benchmarks, and forum logic are reusable
- Add automated coverage for the current baseline: auth flows, builder save flow, publish flow, and forum interactions
- Establish background job foundations for scheduled work such as pricing refresh and benchmark ingestion
- Add basic structured logging, analytics hooks, and error tracking interfaces
- Define CI expectations so `lint`, `test`, `typecheck`, and `build` become required gates for roadmap work

Exit criteria:
- Core flows have automated coverage and pass in CI
- Runtime configuration fails fast when env values are missing or invalid
- Background work can be scheduled without introducing ad hoc scripts later
- Shared product logic is not trapped inside page components

## Milestone 2 - Catalog and Live Pricing

Goal: turn the seeded catalog into a live, trustworthy data source for discovery and planning.

Work to complete:
- Normalize catalog data so categories, specs, brands, compatibility fields, tags, and filterable attributes are consistent across part types
- Extend the database for retailer offers, source metadata, refresh timestamps, stale-state handling, and optional price history
- Build provider adapters for at least one live pricing source plus a manual fallback workflow
- Implement scheduled price refresh jobs, retry behavior, provider health reporting, and manual refresh controls
- Add catalog search, filtering, sorting, and pagination on top of normalized data instead of only relying on seeded lists
- Surface source labels, freshness timestamps, stale warnings, and best-current-price states in the catalog, part detail pages, and builder
- Define how unavailable, partially available, or conflicting price data is resolved

Exit criteria:
- Supported categories can show live or manually maintained prices with freshness metadata
- Catalog queries support meaningful discovery by filters, search, and sort order
- Price refreshes can run automatically and be inspected when they fail
- The app no longer depends on seeded pricing as the only source of truth

## Milestone 3 - Builder V2 and Build Lifecycle

Goal: make the builder the strongest workflow in the product instead of a basic part selector.

Work to complete:
- Review all build slots and complete any missing coverage for storage, optional components, quantities, and future extensibility
- Expand the compatibility engine into modular rules for sockets, RAM generation, motherboard form factor, case clearance, PSU headroom, cooling support, and other hardware constraints
- Improve compatibility output so warnings explain why they happened and what the user can change next
- Rework build persistence to support autosave, duplicate, fork, archive, and version-safe updates
- Add build lifecycle states beyond draft/completed where needed, including validation checkpoints before a build can be published
- Make pricing and wattage summaries consistent across builder, saved builds, and public builds
- Add cloning of public builds into private drafts so discovery can feed back into planning
- Add tests around compatibility, saving, publishing, and fork/clone behavior

Exit criteria:
- Builder state is reliable and recoverable across save, edit, and publish flows
- Compatibility logic is modular, testable, and explainable
- Public builds can be turned back into private planning drafts
- Build totals and statuses are consistent everywhere they appear

## Milestone 4 - Recommendations and Guided Buying

Goal: help users decide what to buy, not just browse what exists.

Work to complete:
- Define recommendation inputs such as budget, target workload, preferred brands, noise sensitivity, upgrade path, and performance priorities
- Create deterministic scoring rules that combine compatibility, current pricing, benchmark evidence, trend signals, and inventory confidence
- Support recommendation types such as best value, performance pick, balanced pick, upgrade path, cheaper alternative, and compatible replacement
- Integrate recommendations into homepage modules, category pages, part detail pages, builder empty states, and incompatible selection recovery flows
- Add recommendation explanations so users can understand why a part or build was suggested
- Track recommendation impressions, clicks, builder conversions, and accepted substitutions for tuning later
- Keep the recommendation engine service-oriented so logic can evolve without rewriting page components

Exit criteria:
- Recommendation outputs exist for core buying scenarios and are visible in the main discovery flows
- Builder can propose valid alternatives when a selection is missing, overpriced, or incompatible
- Recommendation performance can be measured with analytics events and outcome tracking
- Recommendation logic is deterministic and testable before any future ML layer is considered

## Milestone 5 - Benchmarks and Compare

Goal: convert benchmark content into decision-support infrastructure.

Work to complete:
- Normalize benchmark data so workloads, score types, units, sources, notes, and confidence are structured consistently
- Expand the benchmark model to support multiple workloads per part or build, richer metadata, and future import pipelines
- Create side-by-side compare flows for CPUs, GPUs, and completed builds
- Link benchmark evidence directly into part pages, recommendation modules, and builder insights
- Add benchmark-derived summaries for common use cases such as esports, AAA gaming, rendering, productivity, and efficiency
- Define ingestion-ready formats so benchmark data can come from manual entry first and automation later
- Add tests around comparison logic and benchmark normalization

Exit criteria:
- Users can compare key parts or builds side by side with consistent workload-based evidence
- Recommendations and builder guidance can cite benchmark signals
- Benchmark data can be imported or curated without redesigning the schema again
- Benchmark displays are generated from normalized data rather than ad hoc page content

## Milestone 6 - Public Builds and Profiles

Goal: turn saved builds into a stronger public ecosystem for discovery and reuse.

Work to complete:
- Add public user profile pages that surface published builds, profile metadata, and authored content where relevant
- Improve public build discovery with filtering, sorting, and richer metadata beyond a simple trending list
- Support build cloning, version-safe editing, and attribution when one public build is forked into another private draft
- Add build metadata for intended use case, budget class, performance tier, and completion confidence
- Add technical engagement features that help discovery and reuse, such as bookmarks, saved comparisons, or personal watchlists if they fit the model
- Make build detail pages a true reference surface by showing compatibility status, pricing freshness, benchmark context, and related parts or alternatives

Exit criteria:
- Public builds are searchable and reusable, not just viewable
- Users have profile surfaces tied to their published work
- Build discovery feeds back into builder workflows through clone/fork behavior
- Published builds carry enough structured metadata to support search, comparison, and recommendations

## Milestone 7 - Community and Moderation

Goal: evolve the forum from basic Q&A into a durable knowledge system.

Work to complete:
- Extend the forum model to support threaded replies instead of a single flat answer layer
- Add tagging, richer categorization, and content linking for parts, builds, guides, and benchmarks
- Add moderation workflows for reports, review queues, soft hide, lock, restore, and escalation
- Add trust and anti-abuse systems such as rate limits, account reputation inputs, edit history, and action auditing
- Add subscriptions or notification-ready events for followed questions, replies, and accepted answers if they fit the account model
- Make solved-state logic work with deeper thread structures without losing clarity
- Add tests around permissions, moderation actions, and thread integrity

Exit criteria:
- Forum content can support deeper discussions than the current flat answer model
- Moderators have the tools needed to review and control content safely
- Community discussions can reference the rest of the product graph cleanly
- Abuse controls exist before traffic grows further

## Milestone 8 - Admin CMS and Data Operations

Goal: remove developer bottlenecks from catalog, editorial, benchmark, and moderation workflows.

Work to complete:
- Introduce role-based access control for admins, editors, and moderators
- Build admin CRUD for parts, offers, guides, benchmarks, featured modules, forum taxonomy, and operational settings
- Add editorial draft/publish flows, revision history, and rollback for guides and benchmark content
- Add manual correction tools for catalog data, provider conflicts, stale prices, and benchmark anomalies
- Add moderation dashboards for reports, queue management, and enforcement history
- Add operational views for provider health, refresh failures, ingestion runs, and audit logs
- Ensure all admin actions are validated, auditable, and permission-checked server side

Exit criteria:
- Content and catalog operations can be managed without direct code or database edits
- Roles and permissions are enforced consistently across admin and moderation surfaces
- Operational issues can be identified and resolved from the product itself
- Auditability exists for high-impact content and data changes

## Milestone 9 - Production Readiness and Final Launch Gate

Goal: ship the full product on a platform that is secure, observable, and maintainable.

Work to complete:
- Harden auth and security posture with session review, rate limiting, CSRF/auth checks where needed, permission audits, and secret management discipline
- Optimize database access, caching, and page revalidation strategies for public catalog, benchmarks, profiles, and builds
- Add monitoring, alerting, and incident-friendly logs for app errors, background jobs, provider failures, and moderation actions
- Finalize CI/CD with staging, migration discipline, rollback strategy, and deployment checklists
- Add end-to-end smoke coverage for primary flows: sign up, build creation, build publish, recommendation usage, compare, forum interaction, and admin operations
- Review backup and recovery plans for database and critical content
- Clean up technical debt introduced during roadmap execution and update project documentation to match the final system

Exit criteria:
- `lint`, `test`, `typecheck`, and `build` are stable release gates
- Critical user and admin flows have smoke coverage
- Platform operations are observable and recoverable
- The app can be deployed and maintained without fragile manual steps

## Dependency Rules

- Milestone 1 is the gate for the rest of the roadmap
- Milestone 2 should land before Milestones 4 and 5, because live pricing and normalized catalog data feed recommendations and comparison
- Milestone 3 should land before Milestone 6, because public build reuse depends on a mature builder lifecycle
- Milestone 5 should inform Milestone 4 scoring and Milestone 6 build metadata where benchmark evidence is used
- Milestone 7 and Milestone 8 can partially overlap, but moderation tooling needs role and audit foundations from Milestone 8
- Milestone 9 runs throughout the project, but its launch gate only closes after the product milestones are complete

## Suggested Immediate Execution Plan

Start here:
1. Finish Milestone 1 foundation hardening
2. Move directly into Milestone 2 catalog normalization and live pricing
3. Upgrade the builder lifecycle before adding heavy recommendation logic
4. Layer recommendations and benchmark compare on top of the stable catalog and builder
5. Finish with public ecosystem, community depth, admin tooling, and launch hardening

## Definition Of Done For The Final Product

RigSense reaches the final technical product state when:
- Catalog data is live, searchable, filterable, and operationally maintainable
- Builder flows are stable, explainable, and reusable across private and public build journeys
- Recommendations and benchmark comparisons actively guide decisions with measurable outcomes
- Public builds, profiles, and community systems reinforce each other instead of existing as isolated pages
- Admin and moderation workflows no longer depend on developer intervention for normal operations
- The platform is tested, observable, secure, and deployment-ready

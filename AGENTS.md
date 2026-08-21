# strapi-js Development Guide

## Project scope

This repository is a small Strapi REST SDK. The public API is a thin set of SDK objects created by a single factory. Shared code must run in Node.js, browsers, and edge runtimes.

## Architecture

- The SDK is assembled as a top-level factory that returns domain-specific sub-objects:
  - auth
  - users
  - upload
  - content
- All request logic should flow through the shared fetch adapter instead of being duplicated in each endpoint method.
- Config and base URL logic are shared and must remain consistent across all SDK methods.
- Domain modules are thin wrappers around HTTP calls; the project intentionally avoids deeper abstraction layers.
- Public types are part of the package contract and must remain stable unless a breaking change is explicitly intended.

## Repository conventions

- Keep the SDK small and explicit. Do not add framework-style abstractions or app-level layers.
- Reuse the existing fetch adapter, config helpers, and type contracts instead of creating new request patterns.
- Preserve the current factory-based API shape and method names.
- Prefer existing abstractions over duplicating request logic.
- Keep dependency counts low; do not add libraries for small utilities.
- Public API changes must be explicit and well-justified.

## Runtime constraints

- Shared code must not depend on Node-only APIs such as fs, path, process, or Buffer.
- Do not assume browser-only APIs are always present in edge or Node runtimes, and do not assume Node-only APIs are available everywhere.
- Keep request behavior compatible with the fetch environment used by ofetch.
- Preserve base URL and prefix semantics; malformed paths or stray characters are a bug.
- Handle auth tokens consistently through the central request path. Do not bypass the token flow.

## Testing requirements

- Add or update tests for every behavior change.
- Prefer tests against the public SDK behavior and request contract rather than testing implementation internals.
- Use the existing mock-server approach to validate real HTTP flows and response shapes.
- Cover request paths, auth headers, query serialization, and error normalization.
- Add a regression test for any bug fix.
- Before finishing work, run the project checks:
  - tests
  - typecheck
  - lint
  - build

## API compatibility rules

- Keep exported public APIs stable unless the change is intentionally breaking.
- Do not silently change method names, return shapes, or request semantics.
- Preserve config behavior and default values unless a migration is intentionally planned.
- Keep request and response types consistent with the current Strapi contract.
- Do not return placeholder string literal types like JSON/json where a real typed response is expected.
- If a behavior change affects consumers, document it explicitly.

## Common mistakes to avoid

- Hardcoding malformed endpoint strings or path fragments.
- Bypassing the central fetch adapter and creating ad hoc request logic.
- Adding Node-only code to shared runtime modules.
- Changing config merge order or mutating defaults in place.
- Broad refactors without preserving the current SDK boundaries.
- Using any in public interfaces or core types where a Strapi-specific type already exists.
- Swallowing or reformatting Strapi errors inconsistently.
- Changing the public object shape without updating tests and migration notes.

## Scope guardrails

This project is intentionally small and explicit. Favor compatibility, correctness, and minimal change over abstraction or cleverness.

# Termux presentation and flow completion

User approved healing at 10 coins and requested a finished view and a Termux trial, continuing the existing branch and PR.

1. Replace the obsolete Vite-only Termux launcher with an idempotent single-process launcher: dependency/version checks, native SQLite check, incremental build, browser opening through a one-time setup code. Demo works without Python; live dependencies installed only on request. Preserve all databases.
2. Extract demo actions, add one-click automatic target selection and a four-procedure walkthrough. Seed only the isolated demo. Cover demo/live separation, cure target selection, setup-code expiration/reuse and health check with integration tests.
3. Refine the existing clinical stage, doctor anatomy, crown geometry and responsive broadcast/control layout. Keep the central patient, 28 teeth and two clinicians. Add readable leaderboard, podium, procedure state, quick test dock and collapsible diagnostics. Make WebGL failures visible and avoid text worker/font network dependencies.
4. Add project Playwright acceptance tests at desktop, 390x844 and 1080x1920 on GitHub Actions, with screenshots of the four procedures. Local Chromium currently fails at Unix socket creation (EPERM); do not claim local visual verification. Inspect CI screenshots before completion if available.
5. Run current Node/Python/provider tests, build, launcher stub tests and CI, preserve legacy failure baseline, update PR and provide the exact short Termux command.

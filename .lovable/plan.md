## Goal

Give admins per-test control over gadget detection sensitivity and which gadget classes count as violations, and surface a "mark as false positive" action from the Reports event timeline that feeds back into the test's config.

## Changes

### 1. Extend `proctor_config` shape (no migration needed — JSONB)

Add fields to the existing `tests.proctor_config`:
- `confidence_threshold` (number, 0.3–0.9, default 0.55)
- `consecutive_frames` (number, 1–5, default 1) — how many detection frames in a row must see the gadget before triggering
- `watched_classes` (string[]) — allowlist of COCO-SSD classes that count as violations. Default = current 8 classes.

### 2. `WebcamProctor.tsx`

- Read new config fields with sensible defaults.
- Replace hardcoded `GADGET_CLASSES` set with `watched_classes` from config.
- Replace fixed `0.55` with `confidence_threshold`.
- Add a small counter so a gadget must be seen `consecutive_frames` times in a row before we set `detectedGadget` and start the warning countdown. Missing frame resets the counter.
- Keep existing warning → grace period → auto-submit flow untouched.

### 3. `AdminTests.tsx` — Proctor Settings section

Add to the existing "Proctor Settings" area (both create and edit forms):
- **Detection sensitivity slider** → maps to `confidence_threshold` (label: "Low sensitivity (fewer false alarms)" ↔ "High sensitivity"). Show current numeric value.
- **Consecutive frames slider** (1–5) with helper text ("How many frames in a row must detect a gadget before warning").
- **Watched gadget classes** → checkbox grid of the 8 COCO classes (`cell phone`, `laptop`, `tv`, `remote`, `keyboard`, `mouse`, `tablet`, `book`). Unchecked classes will not trigger.

Persist all fields inside `proctor_config` on save.

### 4. `AdminReports.tsx` — timeline false-positive action

In the proctor event popover, next to each event row add a "Mark as false positive" button (only for `warning` events). Clicking it opens a small confirm and applies ONE of these auto-tuning actions to that test's `proctor_config`:
- If the event's gadget is currently in `watched_classes` → remove it (per-test allowlist).
- Toast confirms which test and which class was updated.

Alternative UX kept simple: single button = "Stop flagging {gadget} in this test". No threshold auto-raise (avoids surprising admins).

### 5. Types

Update the local `ProctorConfig` interface in `WebcamProctor.tsx` and the admin form types to include the three new fields. `src/integrations/supabase/types.ts` is already `Json` for this column, no change.

## Out of scope

- No DB migration (JSONB already exists).
- No changes to student test flow beyond the proctor reading new config values.
- No global defaults UI — per-test only.

## Files touched

- `src/components/WebcamProctor.tsx`
- `src/pages/admin/AdminTests.tsx`
- `src/pages/admin/AdminReports.tsx`

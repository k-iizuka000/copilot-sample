# Consistency Review

## Scope Consistency

- MVP scope is consistent across `README.md`, `requirements.md`, `design.md`, `qa-test-design.md`, and `tasks.md`.
- MVP supports `.xlsx`, `.xlsm`, `.pptx`, and `.docx`.
- MVP excludes `.xls`, `.ppt`, `.doc`, `.xlsb`, OCR, full visual rendering, cloud processing, and VS Code Web extension support.
- Post-MVP tasks are clearly separated in `tasks.md`.

## Requirements To Design

| Requirement Area | Design Coverage | Notes |
| --- | --- | --- |
| VS Code right-click and command palette conversion | `design.md` Extension Layer and User Flow | Covered by tasks `6.1` to `6.7`. |
| No external installs | `design.md` DD-001 and architecture | Requires package verification in task `7.8`. |
| Markdown plus assets | `design.md` Output Layout, Markdown Output Model, Asset And Object Policy | Covered by tasks `2.1` to `2.6`. |
| Manifest and warnings | `design.md` Manifest Model and Error Handling | Covered by tasks `2.5`, `2.6`, `7.7`. |
| Excel cells/images/drawings/objects | `design.md` Excel Conversion Design | Covered by tasks `5.1` to `5.12`. |
| PPTX slides/text/images/notes/objects | `design.md` PowerPoint Conversion Design | Covered by tasks `4.1` to `4.7`. |
| DOCX reading order/images/objects | `design.md` Word Conversion Design | Covered by tasks `3.1` to `3.6`. |
| Security and safety | `design.md` Safety Rules and Error Handling | Covered by tasks `1.3` to `1.8`, `7.1` to `7.3`. |

## Design To Evaluation

- Every important deterministic conversion behavior has automated test coverage in `qa-test-design.md`.
- VS Code user flows have manual QA checklists.
- Security risks have explicit fixtures:
  - path traversal ZIP entries.
  - external relationships.
  - macro-bearing `.xlsm`.
- Large-file behavior has performance and truncation checks.
- Package/no-external-runtime behavior is verified by clean-environment smoke testing.

## Evaluation To Tasks

- Core safety tests appear before implementation tasks in section 1.
- Markdown/asset/manifest tests appear before writer implementation tasks in section 2.
- DOCX, PPTX, and XLSX converter tasks use fixture/snapshot tests before implementation.
- VS Code command/settings/progress tests appear before UI implementation.
- Manual QA and MVP acceptance review are explicit tasks in sections 7 and 8.

## Task Quality

- Each task has:
  - checkbox.
  - stable ID.
  - label.
  - dependencies.
  - done criteria.
  - verification method.
  - references.
- Dependencies form a plausible implementation order:
  - core safety.
  - output infrastructure.
  - format converters.
  - VS Code UI.
  - packaging and QA.
- Post-MVP work is not hidden inside MVP.

## Assumptions Recorded

- TypeScript implementation.
- Desktop VS Code target first.
- Pure JS/TS bundled dependencies only.
- No telemetry.
- No external network calls.
- No macro execution.
- Modern OOXML formats first.

## Open Decisions Before Implementation

- Final extension name and command labels.
- Default behavior for `.xlsm` macro parts:
  - recommended: ignore macro execution, do not expose macro content as usable output, record warning.
- Default Excel formula mode:
  - recommended: `valuesWithManifest`.
- Default hidden Excel sheet behavior:
  - recommended: exclude from Markdown, record in manifest.
- Whether the Markdown conversion report is appended by default:
  - recommended: yes, with a setting to disable.

## Review Result

The specification set is ready for an implementation session after the open decisions above are either confirmed or accepted as the recommended defaults.

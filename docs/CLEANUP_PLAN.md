# Cleanup Plan for Pipeline Architecture
(Milestone 7 Preparation)

## Overview
This document lists the pipeline directories to be removed using `git rm` once the local architecture is completely validated. Removing these will dramatically reduce repository bloat by eliminating duplicate/abandoned code while ensuring that no actual mobile app / website dependencies are deleted.

## Safe to Remove
1. `/renders_ai`: Old test images not currently tied to prod.
2. `/production_renders`: Large logs/outputs generated prior to canonicalization.
3. `/temp_render_test`: Old debugging temp outputs.
4. `/render_specs`: Outdated specification txt.
5. `/*.log`, `*.html`, `*.txt` at the repository root: Mostly old deployment logs and one-off debug traces.

## Action Plan
- Create branch: `cleanup/app-pipelines`
- Execute cleanup: `git rm -r temp_render_test renders_ai production_renders render_specs *.log *.html *.txt`
- Commit and retain only the strictly necessary `/app`, `/website`, `/functions`, `/pipeline_prototype/lib`, `/services`, `/workers`, `/schemas`.

*(As instructed by user, these deletions will not be executed yet.)*

# Local Pipeline Runbook

## Native Dependencies
The local pipeline requires `ffmpeg` and `colmap` to be installed and available in the system PATH.

### Verification Results
On this machine, the dependencies have been verified:
- **ffmpeg**: Installed at `/opt/homebrew/bin/ffmpeg` (v8.0.1)
- **colmap**: Installed at `/opt/homebrew/bin/colmap` (v3.13.0)

If these drop out of PATH, you can reinstall them via Homebrew:
```bash
brew install ffmpeg
brew install colmap
```

## Running the Pipeline

### 1. Starting the API & Orchestrator
To start the minimal local API that orchestrates the pipeline:
```bash
cd services/api-gateway
npm install
npm run serve
```
*(Note: As per project rules, this should only be done manually when needed. No background watchers or servers will start automatically.)*

### 2. Manual Stage Execution
To run a specific worker stage manually without the API/Orchestrator:
```bash
./scripts/run_stage.sh <jobId> <stage_name>
```

### 3. Smoke Test (End-to-End)
To run a fast validation of the entire pipeline logic using the bundled sample:
```bash
./scripts/smoke_local.sh
```
This will create a new job in `jobs/`, extract frames, segment, stub the reality twin, and generate a `model_manifest.json`.

## Rules for Laptop Performance
- Do not run heavy jobs automatically.
- Do not use background containers or daemon servers unless explicitly requested.
- Keep the website folder untouched.

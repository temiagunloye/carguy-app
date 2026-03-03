# Architecture Document: Garage Manager Pipeline

## Core Principles
1. **Local-First Executions**: The pipeline is designed to run securely and natively on macOS without mandatory cloud dependencies (S3/Firebase) during generation.
2. **Determinism**: The pipeline relies on a strict `jobs/{jobId}` folder structure where each step is reproducible and idempotent.
3. **Graceful Degradation**: Splat training is stubbed as a "Reality Twin" fallback to turntable generation until remote CUDA workers are attached.

## Directory Structure
- `/services/api-gateway`: Express/FastAPI app exposing `/captures/*` and `/models/*` REST endpoints.
- `/services/jobs-orchestrator`: A simple queue/state-machine runner that delegates stages to workers.
- `/workers/*`: Discrete scripts/modules encapsulating core processing logic.
- `/schemas/*`: JSON Schema definitions enforcing strongly-typed contracts across boundaries.

## Component Flow
1. **API Gateway** receives a capture intent from the client -> creates JobDoc.
2. **Client** uploads `capture.mp4` manually or via local storage directly.
3. **Jobs Orchestrator** detects completion -> changes state to `VALIDATING` and queues the job.
4. **Frame Worker** runs FFmpeg to extract -> evaluate sharpness -> select frames -> save to `frames/selected/`.
5. **Segmentation Worker** utilizes the wrapped `run_pipeline.py` to strip backgrounds -> yield `masks/`.
6. **Colmap Worker** processes `frames/selected/` to compute `poses.json` and sparse features.
7. **Proxy Anchor Worker** heuristic generation of `proxy.glb` and `anchors.json` mapping semantic parts.
8. **Reality Twin Worker** STUB fallback generating turntable structures mirroring splat contracts.
9. **Package Builder** aggregates all artifacts into a valid `model_manifest.json` using schemas.

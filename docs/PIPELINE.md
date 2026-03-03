# Storage Layout

All pipeline executions revolve around a strictly defined Job Directory mapping.

```text
jobs/{jobId}/
  input/
    capture.mp4
  frames/
    raw/
    selected/
  masks/
    body/
    glass/
    wheels/
    lights/
    chrome/
  normalized/
  colmap/
    sparse/
    poses.json
    points3D.ply
  proxy/
    proxy.glb
    anchors.json
  reality/
    reality_twin.json
    turntable/
  package/
    model_manifest.json
    thumbs/
  logs/
    stages.log
  metrics/
    quality.json
    segmentation_metrics.json
    colmap_metrics.json
```

## State Machine
- `UPLOADED`: API generated jobId, waiting for file payload.
- `VALIDATING`: Validating video integrity.
- `EXTRACTING`: FrameWorker running FFmpeg.
- `SEGMENTING`: SegmentationWorker wrapping `run_pipeline.py`.
- `COLMAP`: ColmapWorker resolving SLAM/SfM poses.
- `PROXY_ANCHORS`: ProxyAnchorWorker generating glb/anchors.
- `REALITY_TWIN_STUB`: Stubbing splats into turntable representations.
- `PACKAGING`: PackageBuilder validating schemas and compiling index.
- `READY`: Pipeline complete. Returns `manifest` to client.
- *(Error states: `FAILED(reason)`, `RETAKE_REQUIRED`)*

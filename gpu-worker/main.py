from __future__ import annotations

import io
import os
import json
import uuid
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import cv2
from PIL import Image

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

import requests
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import storage

from rembg import remove as rembg_remove

APP = FastAPI(title="GPU Worker", version="1.0")

# ---------------------------
# Firebase init
# ---------------------------
def init_firebase():
    if firebase_admin._apps:
        return
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if cred_path and os.path.exists(cred_path):
        firebase_admin.initialize_app(credentials.Certificate(cred_path))
    else:
        # Works if running in GCP with default credentials
        firebase_admin.initialize_app()

init_firebase()
DB = firestore.client()

PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "")
BUCKET = os.getenv("STORAGE_BUCKET", "")
if not BUCKET:
    # Best effort default
    BUCKET = f"{PROJECT_ID}.appspot.com" if PROJECT_ID else ""

ST = storage.Client()
BU = ST.bucket(BUCKET) if BUCKET else None


# ---------------------------
# Models
# ---------------------------
class SegmentCarIn(BaseModel):
    jobId: str
    carId: str

class MakePartAssetIn(BaseModel):
    jobId: str
    partId: str

class BuildFramesIn(BaseModel):
    jobId: str
    buildId: str

# ---------------------------
# Storage helpers
# ---------------------------
def gcs_download(path: str) -> bytes:
    if not BU:
        raise RuntimeError("Storage bucket not configured")
    blob = BU.blob(path)
    return blob.download_as_bytes()

def gcs_upload(path: str, data: bytes, content_type: str):
    if not BU:
        raise RuntimeError("Storage bucket not configured")
    blob = BU.blob(path)
    blob.upload_from_string(data, content_type=content_type)
    return f"gs://{BUCKET}/{path}"

def image_from_bytes(b: bytes) -> Image.Image:
    return Image.open(io.BytesIO(b)).convert("RGB")

def png_bytes_from_pil(img: Image.Image) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def jpg_bytes_from_pil(img: Image.Image, quality: int = 85) -> bytes:
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality, optimize=True)
    return buf.getvalue()

# ---------------------------
# Vision helpers (v1)
# ---------------------------
def rgba_cutout(img_rgb: Image.Image) -> Image.Image:
    """
    Returns RGBA image with background removed.
    Uses rembg as default (works now).
    """
    arr = np.array(img_rgb)
    # rembg expects bytes or PIL; we give PIL for simplicity
    out = rembg_remove(img_rgb)  # returns PIL Image with alpha
    if out.mode != "RGBA":
        out = out.convert("RGBA")
    return out

def alpha_to_mask(alpha: Image.Image) -> Image.Image:
    """
    alpha: RGBA image; returns L mask where car/part = 255
    """
    if alpha.mode != "RGBA":
        alpha = alpha.convert("RGBA")
    a = np.array(alpha)[:, :, 3]
    mask = Image.fromarray((a > 0).astype(np.uint8) * 255, mode="L")
    return mask

def estimate_wheel_centers(mask_l: Image.Image) -> List[Dict[str, float]]:
    """
    Very rough v1 heuristic:
    - find large circular-ish contours near lower half of mask
    - return up to 2 wheel centers with radii
    """
    m = np.array(mask_l)
    _, th = cv2.threshold(m, 127, 255, cv2.THRESH_BINARY)
    th = cv2.medianBlur(th, 7)

    h, w = th.shape
    roi = th[int(h * 0.45):, :]  # lower half
    contours, _ = cv2.findContours(roi, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    wheels = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < (h * w) * 0.005:
            continue
        (x, y), r = cv2.minEnclosingCircle(cnt)
        # adjust y back to full image coords
        y_full = y + int(h * 0.45)
        if r <= 5:
            continue
        wheels.append({"x": float(x), "y": float(y_full), "r": float(r), "area": float(area)})

    wheels = sorted(wheels, key=lambda d: d["area"], reverse=True)[:2]
    return wheels

def apply_paint(img_rgb: Image.Image, body_mask: Image.Image, color_hex: str) -> Image.Image:
    """
    Simple recolor: blend a solid color into masked area.
    """
    color_hex = color_hex.lstrip("#")
    if len(color_hex) != 6:
        return img_rgb
    r = int(color_hex[0:2], 16)
    g = int(color_hex[2:4], 16)
    b = int(color_hex[4:6], 16)

    img = np.array(img_rgb).astype(np.float32)
    mask = (np.array(body_mask) > 127).astype(np.float32)[..., None]

    solid = np.zeros_like(img)
    solid[..., 0] = r
    solid[..., 1] = g
    solid[..., 2] = b

    # Blend amount tuned for realism v1; adjust as needed
    out = img * (1.0 - mask * 0.35) + solid * (mask * 0.35)
    out = np.clip(out, 0, 255).astype(np.uint8)
    return Image.fromarray(out)

def paste_rgba(base_rgb: Image.Image, overlay_rgba: Image.Image, xy: Tuple[int, int]) -> Image.Image:
    base = base_rgb.convert("RGBA")
    ov = overlay_rgba.convert("RGBA")
    base.alpha_composite(ov, dest=xy)
    return base.convert("RGB")

def scale_rgba(img_rgba: Image.Image, scale: float) -> Image.Image:
    w, h = img_rgba.size
    nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
    return img_rgba.resize((nw, nh), Image.LANCZOS)

# ---------------------------
# Firestore helpers
# ---------------------------
def job_ref(job_id: str):
    return DB.collection("jobs").document(job_id)

def update_job(job_id: str, data: Dict[str, Any]):
    job_ref(job_id).set({**data, "updatedAt": firestore.SERVER_TIMESTAMP}, merge=True)

def get_car_angles(car_id: str) -> List[Dict[str, Any]]:
    angles = DB.collection("cars").document(car_id).collection("angles").stream()
    items = []
    for a in angles:
        d = a.to_dict()
        d["id"] = a.id
        items.append(d)
    items.sort(key=lambda x: x.get("angleIndex", 0))
    return items

# ---------------------------
# Endpoints
# ---------------------------
@APP.get("/health")
def health():
    return {"ok": True, "bucket": BUCKET}

@APP.post("/jobs/segment_car")
def segment_car(inp: SegmentCarIn):
    """
    For each car angle:
    - download raw image
    - remove background -> car cutout RGBA
    - derive car mask (L)
    - compute simple anchors (wheel centers heuristic)
    - store mask in Storage
    - write urls + anchors into Firestore
    """
    update_job(inp.jobId, {"status": "running", "progress": 10})

    angles = get_car_angles(inp.carId)
    if len(angles) < 10:
        raise HTTPException(status_code=400, detail=f"Expected 10 angles, found {len(angles)}")

    out_angles = []
    for idx, ang in enumerate(angles):
        raw_url = ang.get("imageUrl") or ang.get("httpUrl")
        if not raw_url:
            raise HTTPException(status_code=400, detail=f"Angle {ang.get('angleIndex')} missing imageUrl/httpUrl")

        if str(raw_url).startswith("gs://"):
            # gs://bucket/path
            _, _, bucket_and_path = raw_url.partition("gs://")
            bucket, _, path = bucket_and_path.partition("/")
            raw_bytes = gcs_download(path)
        elif str(raw_url).startswith("http"):
            # Download from public URL (demo mode)
            print(f"Downloading demo image: {raw_url}")
            resp = requests.get(raw_url)
            resp.raise_for_status()
            raw_bytes = resp.content
        else:
             raise HTTPException(status_code=400, detail=f"Invalid URL schema: {raw_url}")

        img = image_from_bytes(raw_bytes)

        cutout = rgba_cutout(img)
        mask = alpha_to_mask(cutout)

        wheels = estimate_wheel_centers(mask)
        mask_path = f"users/{ang.get('ownerId','demo')}/cars/{inp.carId}/angles/{ang.get('angleIndex')}/mask.png"
        mask_gs = gcs_upload(mask_path, png_bytes_from_pil(mask), "image/png")

        # Write back to carAngles doc
        angle_doc = DB.collection("cars").document(inp.carId).collection("angles").document(ang["id"])
        angle_doc.set({
            "carMaskUrl": mask_gs,
            "keypoints": {"wheels": wheels},
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }, merge=True)

        out_angles.append({
            "angleIndex": ang.get("angleIndex"),
            "carMaskUrl": mask_gs,
            "wheels": wheels
        })

        update_job(inp.jobId, {"progress": int(10 + (idx + 1) * 70 / len(angles))})

    update_job(inp.jobId, {"status": "done", "progress": 100})
    return {"carId": inp.carId, "angles": out_angles}

@APP.post("/jobs/make_part_asset")
def make_part_asset(inp: MakePartAssetIn):
    """
    Creates a PNG cutout asset for a part.
    Expects part doc to have at least one imageUrl (gs://) in parts/{partId}.inputImageUrl
    Stores:
      parts/{partId}/assets/part.png
      parts/{partId}/assets/mask.png
    """
    update_job(inp.jobId, {"status": "running", "progress": 10})

    part_ref = DB.collection("parts").document(inp.partId)
    part = part_ref.get().to_dict() or {}
    img_url = (part.get("inputImageUrl") or part.get("assets", {}).get("sourceImageUrl"))
    if not img_url or not str(img_url).startswith("gs://"):
        raise HTTPException(status_code=400, detail="parts/{partId}.inputImageUrl (gs://) required")

    _, _, bucket_and_path = str(img_url).partition("gs://")
    _, _, path = bucket_and_path.partition("/")
    raw_bytes = gcs_download(path)
    img = image_from_bytes(raw_bytes)

    cutout = rgba_cutout(img)  # RGBA
    mask = alpha_to_mask(cutout)

    out_png_path = f"parts/{inp.partId}/assets/part.png"
    out_mask_path = f"parts/{inp.partId}/assets/mask.png"
    png_gs = gcs_upload(out_png_path, png_bytes_from_pil(cutout), "image/png")
    mask_gs = gcs_upload(out_mask_path, png_bytes_from_pil(mask), "image/png")

    part_ref.set({
        "assets": {
            **(part.get("assets") or {}),
            "pngCutoutUrl": png_gs,
            "maskUrl": mask_gs
        },
        "updatedAt": firestore.SERVER_TIMESTAMP
    }, merge=True)

    update_job(inp.jobId, {"status": "done", "progress": 100})
    return {"partId": inp.partId, "assets": {"pngCutoutUrl": png_gs, "maskUrl": mask_gs}}

@APP.post("/jobs/build_frames")
def build_frames(inp: BuildFramesIn):
    """
    Generates 10 composited frames for a build.
    Build doc shape:
      builds/{buildId}:
        ownerId
        carId
        appliedParts: [{ partId, category, params }]
    Supported v1 categories:
      - paint/wrap: body recolor via car mask
      - spoiler/splitter/headlights/bodykit: paste PNG cutout centered (placeholder anchor)
      - wheels: placeholder (no true geometry yet); can be upgraded using wheel centers
    Output:
      builds/{buildId}/frames/{i}.jpg (gs://)
      builds/{buildId}.resultFrames.frameUrls = [gs://...]
    """
    update_job(inp.jobId, {"status": "running", "progress": 5})

    build_ref = DB.collection("builds").document(inp.buildId)
    build = build_ref.get().to_dict() or {}
    car_id = build.get("carId")
    if not car_id:
        raise HTTPException(status_code=400, detail="build.carId required")

    applied = build.get("appliedParts") or []
    angles = get_car_angles(car_id)
    if len(angles) < 10:
        raise HTTPException(status_code=400, detail=f"Expected 10 angles, found {len(angles)}")

    # Preload part assets
    part_cache: Dict[str, Dict[str, Any]] = {}
    for ap in applied:
        pid = ap.get("partId")
        if not pid:
            continue
        p = DB.collection("parts").document(pid).get().to_dict() or {}
        part_cache[pid] = p

    frame_urls: List[str] = []
    owner_id = build.get("ownerId", "demo")

    for idx, ang in enumerate(angles):
        raw_url = ang.get("imageUrl") or ang.get("httpUrl") # patch for demo logic
        if not raw_url:
            raise HTTPException(status_code=400, detail="angle.imageUrl missing")
            
        if str(raw_url).startswith("gs://"):
            _, _, bucket_and_path = str(raw_url).partition("gs://")
            _, _, raw_path = bucket_and_path.partition("/")
            base = image_from_bytes(gcs_download(raw_path))
        elif str(raw_url).startswith("http"):
             resp = requests.get(raw_url)
             base = image_from_bytes(resp.content)
        else:
             raise HTTPException(status_code=400, detail=f"Invalid URL: {raw_url}")

        # Load car mask if available for paint/wrap
        mask = None
        if ang.get("carMaskUrl"):
            _, _, bp = str(ang["carMaskUrl"]).partition("gs://")
            _, _, mask_path = bp.partition("/")
            mask = Image.open(io.BytesIO(gcs_download(mask_path))).convert("L")

        out_img = base

        # Apply parts in order
        for ap in applied:
            cat = (ap.get("category") or "").lower()
            pid = ap.get("partId")
            params = ap.get("params") or {}

            # Paint/Wrap
            if cat in ("paint", "wrap"):
                if mask is None:
                    continue
                color = params.get("color", "#2f6fed")
                out_img = apply_paint(out_img, mask, str(color))
                continue

            # PNG overlay categories
            if pid and pid in part_cache:
                assets = (part_cache[pid].get("assets") or {})
                png_url = assets.get("pngCutoutUrl")
                if png_url and str(png_url).startswith("gs://"):
                    _, _, bp = str(png_url).partition("gs://")
                    _, _, png_path = bp.partition("/")
                    part_rgba = Image.open(io.BytesIO(gcs_download(png_path))).convert("RGBA")

                    # Placeholder anchor: center-ish. Upgrade later using keypoints per category.
                    bw, bh = out_img.size
                    scale = float(params.get("scale", 0.35 if cat in ("spoiler",) else 0.30))
                    part_scaled = scale_rgba(part_rgba, scale)
                    pw, ph = part_scaled.size
                    x = int((bw - pw) * 0.5)
                    y = int((bh - ph) * (0.62 if cat in ("spoiler",) else 0.70))

                    out_img = paste_rgba(out_img, part_scaled, (x, y))
                    continue

            # Wheels placeholder (upgrade with wheel centers + rendering later)
            if cat == "wheels":
                # v1 minimal: do nothing unless you add a wheel overlay asset.
                pass

        # Save frame
        frame_path = f"builds/{inp.buildId}/frames/{ang.get('angleIndex', idx)}.jpg"
        gs = gcs_upload(frame_path, jpg_bytes_from_pil(out_img, quality=85), "image/jpeg")
        frame_urls.append(gs)

        update_job(inp.jobId, {"progress": int(5 + (idx + 1) * 90 / len(angles))})

    # Write result back
    build_ref.set({
        "resultFrames": {"frameUrls": frame_urls},
        "status": "ready",
        "updatedAt": firestore.SERVER_TIMESTAMP
    }, merge=True)

    update_job(inp.jobId, {"status": "done", "progress": 100})
    return {"buildId": inp.buildId, "resultFrames": {"frameUrls": frame_urls}}


# ---------------------------
# Optional: SAM2 integration (stub)
# ---------------------------
"""
To upgrade segmentation from rembg to SAM2:

1) Clone and install SAM2 in your worker environment:
   git clone https://github.com/facebookresearch/sam2.git && cd sam2
   pip install -e .
   (SAM2 requires python>=3.10 and torch>=2.5.1; it may compile CUDA extensions.) :contentReference[oaicite:3]{index=3}

2) Replace rgba_cutout() with SAM2-based mask prediction.
   Keep the rest of pipeline unchanged (mask -> anchors -> compositing).
"""

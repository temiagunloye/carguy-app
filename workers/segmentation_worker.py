#!/usr/bin/env python3
import os
import sys
import glob
import cv2
import json

# Add pipeline_prototype root to path so we can import lib
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "pipeline_prototype"))

from lib.segmentation import segment, download_model_if_needed
from lib.mask_refine import refine_mask
import onnxruntime as ort
import numpy as np

def run_segmentation(job_id):
    job_dir = os.path.join(ROOT, "jobs", job_id)
    selected_dir = os.path.join(job_dir, "frames", "selected")
    
    masks_dirs = {
        "body": os.path.join(job_dir, "masks", "body"),
        "glass": os.path.join(job_dir, "masks", "glass"),
        "wheels": os.path.join(job_dir, "masks", "wheels"),
        "lights": os.path.join(job_dir, "masks", "lights"),
        "chrome": os.path.join(job_dir, "masks", "chrome")
    }
    normalized_dir = os.path.join(job_dir, "normalized")
    metrics_dir = os.path.join(job_dir, "metrics")
    
    for d in masks_dirs.values():
        os.makedirs(d, exist_ok=True)
    os.makedirs(normalized_dir, exist_ok=True)
    os.makedirs(metrics_dir, exist_ok=True)
    
    model_path = os.path.join(ROOT, "pipeline_prototype", "models", "rmbg-1.4.onnx")
    download_model_if_needed(model_path)
    
    sess = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
    
    image_patterns = ["*.png", "*.jpg", "*.jpeg"]
    images = []
    for pattern in image_patterns:
        images.extend(glob.glob(os.path.join(selected_dir, pattern)))
    metrics = {"frames": {}}
    
    for img_path in images:
        filename = os.path.basename(img_path)
        img = cv2.imread(img_path)
        if img is None: continue
        
        # We process the main body mask as requested by wrapping segmentation.py
        mask, conf = segment(sess, img)
        mask, _ = refine_mask(mask, img)
        
        # Save body mask
        body_mask_path = os.path.join(masks_dirs["body"], filename)
        cv2.imwrite(body_mask_path, mask)
        
        # Save stub dummy masks for the rest
        empty_mask = np.zeros_like(mask)
        for sub_type in ["glass", "wheels", "lights", "chrome"]:
            cv2.imwrite(os.path.join(masks_dirs[sub_type], filename), empty_mask)
        
        # Normalized frame (composite against black or neutral background)
        bg = np.zeros_like(img)
        a = (mask > 0)[:, :, np.newaxis]
        norm = np.where(a, img, bg).astype(np.uint8)
        norm_path = os.path.join(normalized_dir, filename)
        cv2.imwrite(norm_path, norm)
        
        metrics["frames"][filename] = {"confidence": float(conf), "mask_pixels": int(np.sum(mask > 0))}
        print(f"Segmented {filename} - conf: {conf:.2f}")

    with open(os.path.join(metrics_dir, "segmentation_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python segmentation_worker.py <jobId>")
        sys.exit(1)
    run_segmentation(sys.argv[1])

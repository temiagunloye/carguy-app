import sys
import os
import subprocess
import json
import glob
import shutil

def run_cmd(cmd, log_file):
    with open(log_file, "w") as f:
        print(f"Executing: {cmd}")
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, shell=True, text=True)
        for line in process.stdout:
            print(line, end="")
            f.write(line)
        process.wait()
        return process.returncode

def main():
    if len(sys.argv) < 2:
        print("Usage: python train.py <jobId> [iterations]")
        sys.exit(1)
        
    job_id = sys.argv[1]
    iterations = sys.argv[2] if len(sys.argv) > 2 else "5000"
    job_dir = os.path.join("jobs", job_id)
    
    # STEP A: Validate Input
    print("STEP A: Validating input...")
    val_cmd = ["python3", "workers/splat_train_worker/validate.py", job_id]
    val_res = subprocess.run(val_cmd)
    if val_res.returncode != 0:
        print("ERROR: Validation failed.")
        sys.exit(val_res.returncode)

    # STEP B: Prepare splat directory
    print("STEP B: Preparing splat directory...")
    splat_dir = os.path.join(job_dir, "splat")
    ns_data_dir = os.path.join(splat_dir, "ns-data")
    model_dir = os.path.join(splat_dir, "model")
    preview_dir = os.path.join(splat_dir, "preview")
    
    os.makedirs(ns_data_dir, exist_ok=True)
    os.makedirs(model_dir, exist_ok=True)
    os.makedirs(preview_dir, exist_ok=True)

    # STEP C: Process COLMAP
    print("STEP C: Processing COLMAP -> Nerfstudio dataset...")
    process_log = os.path.join(splat_dir, "process.log")
    frames_path = os.path.join(job_dir, "frames", "selected")
    colmap_path = os.path.join(job_dir, "colmap", "sparse", "0")
    
    ns_process_cmd = f"ns-process-data colmap --data {frames_path} --colmap-model-path {colmap_path} --output-dir {ns_data_dir}"
    if run_cmd(ns_process_cmd, process_log) != 0:
        print("ERROR: ns-process-data failed.")
        sys.exit(1)
        
    transforms_path = os.path.join(ns_data_dir, "transforms.json")
    if not os.path.isfile(transforms_path):
        print(f"ERROR: {transforms_path} not found after processing.")
        sys.exit(1)

    # STEP D: Run Training
    print(f"STEP D: Running Training for {iterations} iterations...")
    train_log = os.path.join(splat_dir, "train.log")
    
    ns_train_cmd = f"ns-train splatfacto --data {ns_data_dir} --max-num-iterations {iterations} --viewer.websocket-port 7007 nerfstudio-data --downscale-factor 1"
    if run_cmd(ns_train_cmd, train_log) != 0:
        print("ERROR: ns-train failed.")
        sys.exit(1)

    # STEP E: Locate outputs
    print("STEP E: Locating Nerfstudio outputs...")
    # Nerfstudio outputs to ./outputs/<experiment_name>/... by default
    # The experiment name is usually the directory name of the data (ns-data)
    search_root = os.path.abspath("outputs")
    configs = glob.glob(os.path.join(search_root, "**", "*", "config.yml"), recursive=True)
    if not configs:
        print("ERROR: No config.yml found in ./outputs/. Cannot locate training artifacts.")
        sys.exit(1)
        
    latest_config = max(configs, key=os.path.getmtime)
    out_run_dir = os.path.dirname(latest_config)
    
    print(f"Found latest training artifact in: {out_run_dir}")
    for item in os.listdir(out_run_dir):
        s = os.path.join(out_run_dir, item)
        d = os.path.join(model_dir, item)
        if os.path.isdir(s):
            if os.path.exists(d): 
                shutil.rmtree(d)
            shutil.copytree(s, d)
        else:
            shutil.copy2(s, d)

    # STEP F: Artifact Validation
    print("STEP F: Validating artifacts (>1MB)...")
    valid_artifact = None
    max_size = 0
    
    for root, dirs, files in os.walk(model_dir):
        for f in files:
            full_path = os.path.join(root, f)
            size = os.path.getsize(full_path)
            if size > 1_000_000:
                if size > max_size:
                    max_size = size
                    valid_artifact = full_path

    if not valid_artifact:
        print("ERROR: Training artifact too small (< 1MB).")
        sys.exit(1)
        
    artifact_name = os.path.basename(valid_artifact)
    print(f"Found valid artifact: {artifact_name} ({max_size} bytes)")

    # STEP G: Metrics File
    print("STEP G: Writing metrics.json...")
    metrics = {
        "jobId": job_id,
        "iterations": int(iterations),
        "artifactFiles": [artifact_name],
        "artifactSizes": {artifact_name: max_size},
        "viewerUrl": "http://localhost:7007",
        "processLog": "process.log",
        "trainLog": "train.log"
    }
    metrics_path = os.path.join(splat_dir, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=4)

    # STEP H: Update Manifest Automatically
    print("STEP H: Updating manifest.json...")
    update_cmd = ["bash", "scripts/update_manifest_splat.sh", job_id]
    upd_res = subprocess.run(update_cmd)
    if upd_res.returncode != 0:
        print("ERROR: Failed to update model_manifest.json")
        sys.exit(upd_res.returncode)

    print(f"\nSUCCESS: Training complete. Artifact {valid_artifact} is {max_size} bytes.")
    print(f"Viewer available at: {metrics['viewerUrl']}")

if __name__ == "__main__":
    main()

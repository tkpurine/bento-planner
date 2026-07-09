# %% [code]
"""GPU evaluation kernel for vehicle-camera-calib.

Runs the KLT vs SuperPoint+LightGlue tracker comparison (which needs a GPU
for SPLG) and re-runs the comma2k19 real-data PoC in a clean environment.

One-time setup required before this kernel can run (see repo README):
  1. Create a GitHub fine-grained personal access token with read-only
     "Contents" access to tkpurine/vehicle-camera-calib
     (github.com/settings/tokens).
  2. In this kernel's editor: Add-ons -> Secrets -> add a secret named
     GH_PAT with that token, and attach it to this kernel.
  3. This kernel must have internet access and a GPU accelerator enabled
     (both set in kernel-metadata.json, but double check in the editor).
"""
import base64
import os
import subprocess
import sys

from kaggle_secrets import UserSecretsClient

REPO = "tkpurine/vehicle-camera-calib"
WORKDIR = "vehicle-camera-calib"


def sh(cmd, log_as=None, **kw):
    """log_as: command to print instead of cmd, for calls that embed a secret."""
    print("+", " ".join(log_as if log_as is not None else cmd), flush=True)
    subprocess.run(cmd, check=True, **kw)


def clone_private_repo():
    # Sparse checkout: only the eval-relevant code (calib/ package and the
    # two scripts this kernel runs), not the whole repository (no docs,
    # no other scripts, minimal history).
    #
    # Auth is passed as a transient `-c http.extraHeader=...` on each git
    # invocation rather than embedded in the remote URL: a token in the URL
    # gets written verbatim into .git/config, which Kaggle then persists as
    # kernel output. `-c` is process-local and never touches disk.
    token = UserSecretsClient().get_secret("GH_PAT")
    basic = base64.b64encode(f"x-access-token:{token}".encode()).decode()
    auth_header = f"http.extraHeader=Authorization: Basic {basic}"
    url = f"https://github.com/{REPO}.git"
    log_as = ["git", "-c", "http.extraHeader=(redacted)"]

    sh(["git", "-c", auth_header, "clone", "--depth", "1", "--filter=blob:none",
        "--sparse", url, WORKDIR], log_as=log_as + ["clone", "...", url, WORKDIR])
    sh(["git", "-c", auth_header, "-C", WORKDIR, "sparse-checkout", "set",
        "calib", "scripts", "requirements.txt"],
       log_as=log_as + ["-C", WORKDIR, "sparse-checkout", "set", "..."])


def install_deps():
    # torch and opencv are already present in the Kaggle GPU image;
    # LightGlue (with its bundled SuperPoint extractor) and pyquaternion
    # (used by calib/io/nuscenes.py) are the only additions.
    sh([sys.executable, "-m", "pip", "install", "-q",
        "git+https://github.com/cvg/LightGlue.git", "pyquaternion"])


NUSCENES_BASE = "https://d36yt3mvayqw5m.cloudfront.net/public/v1.0"


def fetch_nuscenes():
    # Public, anonymous, no-registration mirror (Motional's own AWS Open
    # Data bucket) -- verified reachable and correctly sized. No Kaggle
    # Dataset involved, so this sidesteps the dataset-creation bug entirely.
    os.makedirs("nuscenes", exist_ok=True)
    sh(["curl", "-sS", "-o", "nuscenes/v1.0-mini.tgz", f"{NUSCENES_BASE}/v1.0-mini.tgz"])
    sh(["curl", "-sS", "-o", "nuscenes/can_bus.zip", f"{NUSCENES_BASE}/can_bus.zip"])
    os.makedirs("nuscenes/mini", exist_ok=True)
    sh(["tar", "xzf", "nuscenes/v1.0-mini.tgz", "-C", "nuscenes/mini"])
    import zipfile
    with zipfile.ZipFile("nuscenes/can_bus.zip") as z:
        z.extractall("nuscenes/can_bus")


def main():
    clone_private_repo()
    install_deps()
    os.chdir(WORKDIR)

    # Highest-value step first (proposal 2 candidate 4, the critical path to
    # the 0.3 deg target): does the shifted cost-slice minimum (the "1 deg
    # floor") shrink when KLT is replaced with SPLG on real nuScenes data?
    # Kept ahead of the synthetic comparisons so a mid-run failure (GPU
    # allocation, timeout) still yields the answer that matters most.
    print("\n" + "=" * 70)
    print("Fetching nuScenes mini + CAN bus (public mirror, no Dataset needed)")
    print("=" * 70, flush=True)
    fetch_nuscenes()

    print("\n" + "=" * 70)
    print("nuScenes cost-slice diagnostic with SPLG (proposal 2 candidate 4)")
    print("=" * 70, flush=True)
    sh([sys.executable, "scripts/cost_slice_diagnostic.py",
        "nuscenes/mini", "nuscenes/can_bus/can_bus", "--splg"])

    # candidate-4 was only verified on scene-0061; re-check with SPLG
    # specifically on the two scenes that dominate the pooling failures
    # (scene-0103, scene-0916) before trusting that their low ground-point
    # fraction is a real scene property rather than a KLT tracking artifact
    # (see docs/next_phase_plan.md A5).
    print("\n" + "=" * 70)
    print("Bad-scene diagnosis with SPLG (does the ground-fraction finding survive?)")
    print("=" * 70, flush=True)
    sh([sys.executable, "scripts/diagnose_bad_scenes.py",
        "nuscenes/mini", "nuscenes/can_bus/can_bus", "--splg"])

    print("\n" + "=" * 70)
    print("KLT vs SuperPoint+LightGlue tracker comparison (default + wide-FOV rigs)")
    print("=" * 70, flush=True)
    sh([sys.executable, "scripts/compare_trackers.py"])

    print("\n" + "=" * 70)
    print("comma2k19 real-data PoC (re-run in a clean GPU environment)")
    print("=" * 70, flush=True)
    sh([sys.executable, "scripts/run_comma2k19.py"])

    print("\n" + "=" * 70)
    print("nuScenes multi-scene + 6-camera validation (temporal, CPU-equivalent)")
    print("=" * 70, flush=True)
    sh([sys.executable, "scripts/run_nuscenes.py", "nuscenes/mini", "nuscenes/can_bus/can_bus"])

    print("\n" + "=" * 70)
    print("nuScenes joint (epipolar+ground+cross) vs temporal-only validation")
    print("=" * 70, flush=True)
    sh([sys.executable, "scripts/run_nuscenes_joint.py", "nuscenes/mini", "nuscenes/can_bus/can_bus"])


if __name__ == "__main__":
    main()

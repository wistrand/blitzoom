#!/bin/bash
# Run full layout comparison: export BitZoom layouts (Deno), then compare (Python in Docker).
#
# Usage:
#   cd bitzoom && bash benchmarks/run-comparison.sh

set -euo pipefail
cd "$(dirname "$0")/.."

LAYOUTS=benchmarks/layouts
RESULTS=benchmarks/results
mkdir -p "$LAYOUTS" "$RESULTS"

# ─── Step 1: Export BitZoom layouts (Deno, native) ───────────────────────────

echo "=== Exporting BitZoom layouts ==="

export_bz() {
  local name="$1" alpha="$2" tag="$3"
  shift 3
  deno run --allow-read --allow-write benchmarks/export-layout.ts \
    --edges "docs/data/${name}.edges" --alpha "$alpha" --quant rank \
    "$@" --out "$LAYOUTS/${name}-${tag}.tsv"
}

# Email-EU
export_bz email-eu 0    a000
export_bz email-eu 0.5  a050
export_bz email-eu 0.75 a075
export_bz email-eu 1.0  a100

# Facebook
export_bz facebook 0    a000
export_bz facebook 0.75 a075
export_bz facebook 1.0  a100

# Power Grid
export_bz powergrid 0    a000
export_bz powergrid 0.75 a075
export_bz powergrid 1.0  a100

# MITRE ATT&CK (with properties)
deno run --allow-read --allow-write benchmarks/export-layout.ts \
  --edges docs/data/mitre-attack.edges --nodes docs/data/mitre-attack.nodes \
  --alpha 0 --quant rank \
  --out "$LAYOUTS/mitre-a000.tsv"

deno run --allow-read --allow-write benchmarks/export-layout.ts \
  --edges docs/data/mitre-attack.edges --nodes docs/data/mitre-attack.nodes \
  --alpha 0 --quant rank --weight group=5 --weight platforms=6 --weight killchain=4 \
  --out "$LAYOUTS/mitre-a000-weighted.tsv"

deno run --allow-read --allow-write benchmarks/export-layout.ts \
  --edges docs/data/mitre-attack.edges --nodes docs/data/mitre-attack.nodes \
  --alpha 0.5 --quant rank --weight group=5 --weight platforms=6 --weight killchain=4 \
  --out "$LAYOUTS/mitre-a050-weighted.tsv"

echo

# ─── Step 2: Run Python comparison in Docker ─────────────────────────────────

echo "=== Running Python comparison (Docker) ==="

DOCKER_IMG="bitzoom-bench"

# Build image if needed
if ! docker image inspect "$DOCKER_IMG" &>/dev/null; then
  echo "Building Docker image..."
  docker build -t "$DOCKER_IMG" -f benchmarks/Dockerfile benchmarks/
fi

run_compare() {
  local dataset="$1"
  shift
  echo "--- $dataset ---"
  docker run --rm \
    --user "$(id -u):$(id -g)" \
    -v "$(pwd)/docs/data:/data:ro" \
    -v "$(pwd)/benchmarks:/bench" \
    "$DOCKER_IMG" \
    python3 /bench/compare-layouts.py "$@"
}

# Helper: expand host glob to docker paths
docker_bz() {
  local pattern="$1"
  local host_files=( $LAYOUTS/${pattern}-a*.tsv )
  local docker_files=()
  for f in "${host_files[@]}"; do
    docker_files+=("/bench/layouts/$(basename "$f")")
  done
  echo "${docker_files[@]}"
}

# Email-EU (with ground truth)
run_compare "Email-EU" \
  --edges /data/email-eu.edges \
  --bitzoom $(docker_bz email-eu) \
  --ground-truth /bench/ground-truth/email-eu-departments.txt \
  --out /bench/results/email-eu.txt

# Facebook (skip UMAP — 4K×4K dense adjacency too slow)
run_compare "Facebook" \
  --edges /data/facebook.edges \
  --bitzoom $(docker_bz facebook) \
  --skip-umap \
  --out /bench/results/facebook.txt

# Power Grid (skip UMAP — 5K×5K dense adjacency too slow)
run_compare "Power Grid" \
  --edges /data/powergrid.edges \
  --bitzoom $(docker_bz powergrid) \
  --skip-umap \
  --out /bench/results/powergrid.txt

# MITRE ATT&CK (skip UMAP — 5K×5K dense adjacency too slow)
run_compare "MITRE ATT&CK" \
  --edges /data/mitre-attack.edges \
  --bitzoom $(docker_bz mitre) \
  --skip-umap \
  --out /bench/results/mitre.txt

echo
echo "=== Done. Results in $RESULTS/ ==="

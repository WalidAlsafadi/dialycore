#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../backend"
python generate_demo_data.py --patients 300 --seed 2026

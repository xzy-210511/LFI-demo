#!/usr/bin/env bash
# Usage: timing.sh <datasetId> <label> ; prints median of 5 sequential requests per endpoint
B=http://localhost:8080/api
ID=$1; L=$2
med() { sort -n | awk '{a[NR]=$1} END {print a[int((NR+1)/2)]}'; }
run() { local name=$1 url=$2 method=${3:-GET}; local ts=(); for i in 1 2 3 4 5; do ts+=("$(curl -s -o /dev/null -w '%{time_total}' -X $method "$url")"); done; printf '%s | %-38s | median %s s | runs %s\n' "$L" "$name" "$(printf '%s\n' "${ts[@]}" | med)" "${ts[*]}"; }
run "Health" "$B/health"
run "Dataset list" "$B/datasets"
run "Dataset detail" "$B/datasets/$ID"
run "Frame analysis (frame 0, row 650)" "$B/datasets/$ID/frames/0/analysis?direction=row&position=650"
run "Frame-zero amplitude preview" "$B/datasets/$ID/frames/0/amplitude-image"
run "Dynamic amplitude image, frame 1" "$B/datasets/$ID/frames/1/amplitude-image"
run "Dynamic phase image, frame 1" "$B/datasets/$ID/frames/1/phase-image"
run "Dynamic combined image, frame 1" "$B/datasets/$ID/frames/1/combined-image"
run "Integrity check (full re-read)" "$B/datasets/$ID/integrity" POST

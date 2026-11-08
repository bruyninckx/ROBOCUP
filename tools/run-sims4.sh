#!/bin/sh
# ROBOCUS 2.0 balance overhaul, round 3 (Mac/Linux): every variant in tools/bal3/*.json (base.json = the new round 3 defaults).
# Run from the ROBOCUS folder:  sh tools/run-sims4.sh [games] [parallel]
GAMES=${1:-100}; PAR=${2:-$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 4)}
echo "$GAMES games per variant, $PAR at a time"
TAGS=""
for f in tools/bal3/*.json; do
  t=o3_$(basename "$f" .json); echo; echo "=== $t ==="
  node tools/game-sim.js --page=prototypes/tabletop-2.html --tag=$t --games=$GAMES --par=$PAR --balFile=$f
  TAGS="$TAGS $t"
done
node tools/game-sim-report.js $TAGS > sims/overhaul3.txt
cat sims/overhaul3.txt
echo; echo "Saved: sims/overhaul3.txt (send it to Claude)"

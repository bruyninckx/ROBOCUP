#!/bin/sh
# ROBOCUS 2.0 balance overhaul, round 2 (Mac/Linux): every variant in tools/bal2/*.json (base.json = the new defaults, level 4 on).
# Run from the ROBOCUS folder:  sh tools/run-sims3.sh [games] [parallel]
GAMES=${1:-100}; PAR=${2:-$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 4)}
echo "$GAMES games per variant, $PAR at a time"
TAGS=""
for f in tools/bal2/*.json; do
  t=o2_$(basename "$f" .json); echo; echo "=== $t ==="
  node tools/game-sim.js --page=prototypes/tabletop-2.html --tag=$t --games=$GAMES --par=$PAR --balFile=$f
  TAGS="$TAGS $t"
done
node tools/game-sim-report.js $TAGS > sims/overhaul2.txt
cat sims/overhaul2.txt
echo; echo "Saved: sims/overhaul2.txt (send it to Claude)"

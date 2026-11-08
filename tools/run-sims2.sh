#!/bin/sh
# ROBOCUS 2.0 balance overhaul, round 1 (Mac/Linux): the baseline plus every variant in tools/bal/*.json.
# Run from the ROBOCUS folder:  sh tools/run-sims2.sh [games] [parallel]
GAMES=${1:-100}; PAR=${2:-$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 4)}
echo "$GAMES games per variant, $PAR at a time"
TAGS=o1_base
node tools/game-sim.js --page=prototypes/tabletop-2.html --tag=o1_base --games=$GAMES --par=$PAR
for f in tools/bal/*.json; do
  t=o1_$(basename "$f" .json); echo; echo "=== $t ==="
  node tools/game-sim.js --page=prototypes/tabletop-2.html --tag=$t --games=$GAMES --par=$PAR --balFile=$f
  TAGS="$TAGS $t"
done
node tools/game-sim-report.js $TAGS > sims/overhaul1.txt
cat sims/overhaul1.txt
echo; echo "Saved: sims/overhaul1.txt (send it to Claude)"

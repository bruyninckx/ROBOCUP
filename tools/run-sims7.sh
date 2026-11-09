#!/bin/sh
# ROBOCUS 2.0 balance overhaul, round 7, crew = Mechanics only (Mac/Linux): every variant in tools/bal7/*.json (base.json = the current defaults).
# Run from the ROBOCUS folder:  sh tools/run-sims7.sh [games] [parallel]
GAMES=${1:-100}; PAR=${2:-$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 4)}
echo "$GAMES games per variant, $PAR at a time"
TAGS=""
for f in tools/bal7/*.json; do
  t=o7_$(basename "$f" .json); echo; echo "=== $t ==="
  node tools/game-sim.js --page=prototypes/tabletop-2.html --tag=$t --games=$GAMES --par=$PAR --balFile=$f
  TAGS="$TAGS $t"
done
node tools/game-sim-report.js $TAGS > sims/round7.txt
cat sims/round7.txt
echo; echo "Saved: sims/round7.txt (send it to Claude)"

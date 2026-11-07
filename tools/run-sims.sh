#!/bin/sh
# same as run-sims.cmd, for Mac/Linux: sh tools/run-sims.sh [games] [parallel]
G=${1:-200}; P=${2:-$(nproc 2>/dev/null || sysctl -n hw.ncpu)}
for s in 4 1; do for w in 12 16; do node tools/game-sim.js --tag=start${s}_win$w --games=$G --par=$P --start=$s --win=$w; done; done
node tools/game-sim-report.js start4_win12 start1_win12 start4_win16 start1_win16 | tee sims/report.txt

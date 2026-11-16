@echo off
rem One-time cleanup (Kev, 16 Nov 2026): the .wt side folders were made by other sessions for experiments on 11 Nov
rem (claude/arena-25d, claude/arena-3d, claude/arena-looks). Their 4 commits were only on this PC. This puts them on
rem GitHub first, and only then removes the side folders. Run it from anywhere; double-click works.
cd /d "%~dp0\.."
echo Putting the three experiment branches on GitHub...
git push origin claude/arena-25d claude/arena-3d claude/arena-looks || (echo Push failed: nothing was removed. & pause & exit /b 1)
echo Pushed. Removing the side folders...
git worktree prune
if exist .wt rmdir /s /q .wt
git worktree list
echo Done. The experiments stay on GitHub as branches; nothing else changed.
pause

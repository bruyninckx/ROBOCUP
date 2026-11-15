// Keep a Windows PC awake while a long test runs (15 Nov: the PC went to sleep at midnight, halfway through the checks).
// A small PowerShell helper asks Windows not to sleep for as long as it lives; it is stopped when the test ends, and it
// changes no setting. On other systems, or when PowerShell is missing, it does nothing.
const { spawn } = require('child_process');
module.exports = function keepAwake() {
  if (process.platform !== 'win32') return () => {};
  let p = null;
  try {
    const ps = "$s = Add-Type -MemberDefinition '[DllImport(\"kernel32.dll\")] public static extern uint SetThreadExecutionState(uint f);' -Name W -Namespace K -PassThru; while ($true) { [void]$s::SetThreadExecutionState([uint32]2147483649); Start-Sleep -Seconds 30 }";   // ES_CONTINUOUS | ES_SYSTEM_REQUIRED
    p = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', ps], { stdio: 'ignore', windowsHide: true });
    p.on('error', () => { p = null; });
  } catch (e) { p = null; }
  const stop = () => { try { if (p) p.kill(); } catch (e) {} p = null; };
  process.on('exit', stop);
  return stop;
};

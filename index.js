import { spawn } from 'node:child_process';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

/** Host half: resolved and opened here, because the Client cannot know HOME. */
export const inject = ['webServer'];

/** One fixed target: the user-global instruction file. */
const AGENTS_MD = join(homedir(), '.dsh', 'AGENTS.md');

/**
 * Windows: Notepad restores whatever window placement it saved last time. A stale
 * placement can be a few pixels wide in a corner, which reads to the user as "the
 * click did nothing" even though the process and window both exist.
 *
 * The window is found by title rather than by the started process id: on Windows 11
 * `notepad.exe` is a launcher for the packaged app, so the process returned by
 * Start-Process usually owns no window at all.
 */
function windowsScript(file) {
  const literal = file.replace(/'/g, "''");
  return [
    "$ErrorActionPreference = 'SilentlyContinue'",
    // -WindowStyle Normal is required: this script itself runs without a console
    // (the Host spawns PowerShell with windowsHide), and Start-Process would
    // otherwise hand that hidden show-state down to Notepad.
    `Start-Process notepad.exe -ArgumentList '"${literal}"' -WindowStyle Normal | Out-Null`,
    '$target = $null',
    'for ($i = 0; $i -lt 60; $i++) {',
    '  Start-Sleep -Milliseconds 100',
    "  $target = Get-Process notepad -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -like '*AGENTS.md*' } | Select-Object -First 1",
    '  if ($target) { break }',
    '}',
    'if ($target) {',
    "  Add-Type 'using System;using System.Runtime.InteropServices;public class W{[DllImport(\"user32.dll\")]public static extern bool ShowWindow(IntPtr h,int c);[DllImport(\"user32.dll\")]public static extern bool MoveWindow(IntPtr h,int x,int y,int w,int hh,bool r);[DllImport(\"user32.dll\")]public static extern bool SetForegroundWindow(IntPtr h);}'",
    '  [W]::ShowWindow($target.MainWindowHandle, 9) | Out-Null',
    '  [W]::MoveWindow($target.MainWindowHandle, 160, 120, 900, 640, $true) | Out-Null',
    '  [W]::SetForegroundWindow($target.MainWindowHandle) | Out-Null',
    '}',
  ].join('\n');
}

/**
 * Launch one editor and resolve once the process actually started.
 *
 * Windows goes through a hidden PowerShell script file (written to the temp folder)
 * so the window can be restored and raised; passing the same program as `-Command`
 * breaks on the embedded quotes. The ".md" association is unreliable and
 * `cmd /c start` only flashes a console.
 */
function launch(file) {
  let command;
  let args;
  if (process.platform === 'win32') {
    const scriptPath = join(tmpdir(), 'dsh-open-agents-md.ps1');
    writeFileSync(scriptPath, windowsScript(file), 'utf8');
    command = 'powershell.exe';
    args = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', scriptPath];
  } else if (process.platform === 'darwin') {
    command = 'open';
    args = [file];
  } else {
    command = 'xdg-open';
    args = [file];
  }

  return new Promise((resolve, reject) => {
    // No `detached`: on Windows a detached PowerShell silently fails to launch the
    // editor at all. `windowsHide` only hides the console this script runs in.
    const child = spawn(command, args, { stdio: 'ignore', windowsHide: true });
    child.once('error', reject);
    child.once('spawn', () => {
      child.unref();
      resolve(process.platform === 'win32' ? 'notepad.exe' : command);
    });
  });
}

/**
 * POST /agents-md/open
 *
 * The row in Settings -> General posts here. The route reads no request body and
 * takes no path from the caller, so the only thing it can open is this user's own
 * ~/.dsh/AGENTS.md.
 */
export function apply(ctx) {
  ctx.webServer.register({
    kind: 'exact',
    path: '/agents-md/open',
    handler: (request, response) => {
      const wantsJson = request.method === 'POST';
      const sendHtml = (status, text) => {
        response.writeHead(status, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        response.end(
          '<!doctype html><meta charset="utf-8"><title>AGENTS.md</title>' +
            '<body style="font:14px system-ui;padding:24px">' +
            `<p>${text}</p>` +
            '<script>setTimeout(function(){window.close()},300)</script>',
        );
      };
      const sendJson = (status, payload) => {
        response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify(payload));
      };

      launch(AGENTS_MD).then(
        (opener) => {
          if (wantsJson) sendJson(200, { ok: true, file: AGENTS_MD, opener });
          else sendHtml(200, `已用 ${opener} 打开：${AGENTS_MD}`);
        },
        (error) => {
          const message = String((error && error.message) || error);
          if (wantsJson) sendJson(500, { ok: false, file: AGENTS_MD, error: message });
          else sendHtml(500, `打开失败：${message}`);
        },
      );
    },
  });
}


import { spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** Host half: resolved and opened here, because the Client cannot know HOME. */
export const inject = ['webServer'];

/** One fixed target: the user-global instruction file. */
const AGENTS_MD = join(homedir(), '.dsh', 'AGENTS.md');

/**
 * Launch one editor and resolve once the process actually started.
 *
 * Windows goes straight to Notepad: the ".md" association is frequently absent,
 * in which case `cmd /c start` flashes a console and opens nothing at all.
 */
function launch(file) {
  const [command, args] =
    process.platform === 'win32'
      ? ['notepad.exe', [file]]
      : process.platform === 'darwin'
        ? ['open', [file]]
        : ['xdg-open', [file]];

  return new Promise((resolve, reject) => {
    // No windowsHide: for a GUI process it can start the window hidden, which looks
    // exactly like "the click did nothing" while the route still answers 200.
    const child = spawn(command, args, { detached: true, stdio: 'ignore' });
    child.once('error', reject);
    child.once('spawn', () => {
      child.unref();
      resolve(command);
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

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
    const child = spawn(command, args, { detached: true, stdio: 'ignore', windowsHide: true });
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
      const send = (status, payload) => {
        response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify(payload));
      };
      if (request.method !== 'POST') {
        send(405, { ok: false, error: 'use POST' });
        return;
      }
      launch(AGENTS_MD).then(
        (opener) => send(200, { ok: true, file: AGENTS_MD, opener }),
        (error) => send(500, { ok: false, file: AGENTS_MD, error: String((error && error.message) || error) }),
      );
    },
  });
}

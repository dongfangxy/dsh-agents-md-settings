import { spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** Host half: resolved and opened here, because the Client cannot know HOME. */
export const inject = ['webServer'];

/** One fixed target: the user-global instruction file. */
const AGENTS_MD = join(homedir(), '.dsh', 'AGENTS.md');

function openWithSystem(file) {
  const [command, args] =
    process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', `"${file}"`]]
      : process.platform === 'darwin'
        ? ['open', [file]]
        : ['xdg-open', [file]];
  const child = spawn(command, args, { detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
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
      try {
        openWithSystem(AGENTS_MD);
        send(200, { ok: true, file: AGENTS_MD });
      } catch (error) {
        send(500, { ok: false, file: AGENTS_MD, error: String((error && error.message) || error) });
      }
    },
  });
}

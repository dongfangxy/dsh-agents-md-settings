# AGENTS.md Settings Row — DeepSeek Harness

DeepSeek Harness reads `AGENTS.md` on every new session, but its UI has no way to
*open* that file. This small bundle adds one row to **Settings → General** that hands
the file to your editor.

![The row in Settings → General](docs/settings-row.png)

<sub>中文说明见文末。</sub>

## What it does

Clicking **用记事本打开 / Open in editor** opens `~/.dsh/AGENTS.md` in your system
editor. Nothing else: no telemetry, no network, no changes to the file itself.

On Windows the bundle launches **Notepad** directly. A `.md` file usually has no shell
association, so relying on "open with the default app" would show a picker (or do
nothing at all when started through `cmd /c start`).

## How it works

A cordis bundle with a host half and a client half:

| File | Role |
|---|---|
| `cordis.patch.yml` | inserts one row named `agents-md-settings` into the profile |
| `index.js` | host: registers `POST /agents-md/open`, resolves the path, launches the editor |
| `client.js` | client: registers the row into the `settings.general.item` slot |
| `package.json` | `dsh.bundle.patch` and `dsh.client` declarations |

The client only posts to `/agents-md/open`. The host resolves
`os.homedir()/.dsh/AGENTS.md` itself, then launches an editor — `notepad.exe` on
Windows, `open` on macOS, `xdg-open` elsewhere. On Windows it then waits for the
Notepad window, restores it, sizes it to 900×640 and raises it, because a stale saved
window placement can make an opened file look like nothing happened.

The route takes no body and no caller-supplied path, so the only file it can ever open
is the current user's own `AGENTS.md`.

## Install

This is a bundle, not an npm-published plugin. Use the profile the app actually runs —
on Windows desktop it defaults to `%ProgramData%\dsh-data\profiles\desktop`; the exact
path is in the app's `DSH_PROFILE_DIR`.

**Install it as a plugin. Never copy the folder into `node_modules`.** A copied folder
is pruned by the next `pnpm install`, and every plugin install or upgrade runs one —
that is how this bundle can disappear on its own while the patch row that points at it
stays behind. An installed package is a recorded dependency, so later installs keep it.

### As a package (recommended)

```
dsh plugin add github:dongfangxy/dsh-agents-md-settings
```

The same string works in the app: **Settings → Plugins → Add plugin**, which accepts a
package name, a Git address, a tarball or an absolute local path. The installer writes
the dependency into `<profile>/package.json` and applies the bundle's own patch row, so
later installs leave it alone. Restart DeepSeek Harness; the row appears at the bottom
of **Settings → General**.

If the row is missing after a restart, the patch row did not get applied — add it by
hand as shown under *From a local checkout* below.

### From a local checkout (development)

Use this while you are editing the source: declare a `link:` dependency on the folder
you are working in.

1. In `<profile>/package.json`, add one dependency:

   ```json
   "dependencies": {
     "@local/agents-md-settings": "link:<absolute path to the checkout>"
   }
   ```

2. Install it into the profile:

   ```
   pnpm install --dir <profile>
   ```

   `node_modules/@local/agents-md-settings` becomes a link to the checkout, and
   `pnpm-lock.yaml` records it.

3. Add one row to `<profile>/cordis.patch.yml`, matching the existing indentation:

   ```yaml
   - insert:
       - id: agents-md-settings
         name: "@local/agents-md-settings"
   ```

4. Restart DeepSeek Harness. The row appears at the bottom of **Settings → General**.

If your build exposes the `plugin_manager` tool, `install_bundle` with
`target: "<absolute path to this checkout>"` does steps 1–3 for you.

## Uninstall

Uninstall through the same surface: **Settings → Plugins** removes the package and its
patch row. By hand, drop the `@local/agents-md-settings` dependency from
`<profile>/package.json` and the `agents-md-settings` insert row from
`<profile>/cordis.patch.yml`, run `pnpm install --dir <profile>` so the folder is
cleaned up, and restart.

## Notes and limitations

- **Edits take effect on the next session.** `AGENTS.md` is read once, at the first
  request of a session, and is not watched for external changes.
- **Windows only for now**, tested on Windows 11 with the desktop app. macOS and Linux
  use `open` / `xdg-open` but are untested.
- The route listens on the app's own local origin. It opens one fixed file and accepts
  no arguments; it is not a general-purpose "run this" endpoint.
- If the row does not appear, check that the package resolved and that
  `cordis.patch.yml` still parses; a YAML typo prevents the whole patch layer from
  loading.

## Version history

| Version | Change |
|---|---|
| 1.0.2 | README: lead with `dsh plugin add github:…` so a new user installs a real package instead of copying the folder into `node_modules` and losing it on the next install. |
| 1.0.1 | README: install as a profile dependency. A folder copied into `node_modules` is deleted by the next `pnpm install`, which is why the row could vanish on its own. |
| 1.0.0 | Works end to end on Windows. Client posts to the route; host launches Notepad and raises its window. |
| 0.7.0 | Removed `detached: true` — on Windows a detached PowerShell never launched the editor, so the route answered `200` while nothing appeared. |
| 0.6.0 | Back to `fetch(POST)`: the desktop shell denies `target="_blank"`, so the anchor-based row of 0.4.0 clicked into nothing. |
| 0.5.0 | Find the Notepad window by title, then restore, resize and foreground it. |
| 0.4.0 | Row rendered as a plain link (later reverted). |
| 0.3.0 | Windows launches Notepad directly instead of `cmd /c start`. |
| 0.2.0 | Host resolves `~/.dsh/AGENTS.md` and serves `POST /agents-md/open`; the client stops sending a path. |
| 0.1.0 | First attempt: client called `session/openWorkspacePath` with `~/.dsh/AGENTS.md`; hosts that expand `~` under *Documents* opened the wrong folder. |

The three bugs worth remembering, if you build something similar:

1. `~` is not expanded by every host entry point — resolve the home directory in the
   host process instead.
2. An `<a target="_blank">` inside the desktop shell may never navigate.
3. On Windows, `spawn(..., { detached: true })` can silently fail to launch the child's
   GUI application.

## 中文说明

DSH 每个新会话都会读 `AGENTS.md`，但界面上没有入口能打开它。这个 bundle 在
**设置 → 通用** 里加一行，点一下就用系统编辑器打开 `~/.dsh/AGENTS.md`。

- 前端只负责 `POST /agents-md/open`；路径由宿主用 `os.homedir()` 解析，包里不写死
  任何人的路径。
- Windows 上直接拉起记事本，并且会把窗口还原成 900×640 提到前台（记事本可能记住
  了一个极小的窗口尺寸，看起来就像"没反应"）。
- 安装（推荐）：`dsh plugin add github:dongfangxy/dsh-agents-md-settings`，或在应用里
  走 **设置 → 插件 → Add plugin** 填同一串。安装器会把它写进 profile 的依赖、并应用
  bundle 自带的 patch 行，重启后生效。
- **不要直接把目录拷进 `node_modules`**——下一次 `pnpm install` 会把它当多余包装清掉，
  而 `cordis.patch.yml` 里那行还留着，表现就是"插件莫名其妙不见了"。要改源码时，把依赖
  改成 `link:<本目录绝对路径>` 再 `pnpm install --dir <profile>`，并手动补 `insert` 行。
- 卸载：在 设置 → 插件 里移除；或删掉依赖与 `insert` 行，重新 `pnpm install`，重启。
- 改完保存后，**下一个会话**才生效；当前会话不会重载。

## License

MIT © Chengxi Zhang

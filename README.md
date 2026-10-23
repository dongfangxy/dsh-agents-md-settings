# AGENTS.md Settings Row — DeepSeek Harness

Adds a small row to **Settings → General** in the DeepSeek Harness desktop app:

> **Agent instructions (AGENTS.md)** — open `~/.dsh/AGENTS.md` in your system editor. [Open in editor]

DeepSeek Harness reads `AGENTS.md` files on every new session but ships no way to
*find* them from the UI. This bundle adds one row that hands the file to your
operating system, so you edit and save it in whatever editor you already use.

<sub>中文见下方 [中文说明](#中文说明)。</sub>

## How it works

It is a small cordis bundle with a host half and a client half:

| Piece | Role |
|---|---|
| `cordis.patch.yml` | inserts one row named `agents-md-settings` into the profile |
| `index.js` | host half: registers `POST /agents-md/open` and opens the file |
| `client.js` | registers a component into the `settings.general.item` slot |
| `package.json` | `dsh.bundle.patch` + `dsh.client` declarations |

The Client half only posts to `/agents-md/open`. The Host half registers that route,
resolves `os.homedir() + .dsh/AGENTS.md` itself, and launches an editor: `notepad.exe`
on Windows, `open` on macOS, `xdg-open` elsewhere. The route accepts no body and no
caller-supplied path, so it can only ever open that one file, and the bundle carries
no personal paths.

> Why not let the Client send a path? It has no portable way to learn the Host's home
> directory, and `~` is not expanded by every entry point — an early version sent
> `~/.dsh/AGENTS.md` and some Windows hosts resolved it under *Documents*.

## Install

This is a local bundle, not an npm package. Pick the profile the app actually
runs — on Windows desktop it defaults to `%ProgramData%\dsh-data\profiles\desktop`
(look for `DSH_PROFILE_DIR` in the app environment).

1. Copy this folder to:

   ```
   <profile>/node_modules/@local/agents-md-settings
   ```

2. Add one row to `<profile>/cordis.patch.yml` (keep the existing indentation):

   ```yaml
   - insert:
       - id: agents-md-settings
         name: "@local/agents-md-settings"
   ```

3. Restart DeepSeek Harness. The row appears at the bottom of **Settings → General**.

If your build exposes the `plugin_manager` tool, `install_bundle` with
`{"action": "install_bundle", "target": "<absolute path to this folder>"}` does
steps 1–2 for you.

## Uninstall

Remove the row from `cordis.patch.yml`, delete `<profile>/node_modules/@local/agents-md-settings`,
and restart.

## Notes and limitations

- On Windows the row launches **Notepad** directly. A `.md` file usually has no shell
  association, and `cmd /c start` then flashes a console and opens nothing, so the
  bundle never relies on the association. macOS/Linux use the system default opener.
- Edits take effect on the **next session**: `AGENTS.md` is read once, at the
  first request of a session, and is not watched for external changes.
- The route listens on the same local origin as the app. It opens a fixed file and
  accepts no arguments; it is not a general-purpose "run this" endpoint.
- **Status: experimental.** Verified on Windows 11 only for the `0.2.0` route-based
  design; macOS/Linux use `open` / `xdg-open` and are untested. If the row does not
  appear, open an issue with the Host log line.

## 中文说明

在「设置 → 通用」里加一行，点一下就交给系统打开 `~/.dsh/AGENTS.md`，你自己用
记事本之类的编辑器改完保存即可。

DSH 每次新会话都会读 `AGENTS.md`，但界面上没有任何入口能打开它，这个插件补的
就是这一个洞。它分两半：前端往 `settings.general.item` 插槽注册一行，点击时
`POST /agents-md/open`；宿主注册这个路由，自己用 `os.homedir()` 拼出
`~/.dsh/AGENTS.md` 再交给系统打开。路由不接受任何参数，所以它只能打开这一个
文件，包里也没有写死任何人的路径。

> 为什么不让前端传路径：前端拿不到宿主的主目录，而 `~` 并不是每个入口都会展开
> ——0.1 版就踩过这个坑，某些 Windows 宿主把 `~` 解析到了**文档**目录。

安装：把目录拷到 `<profile>/node_modules/@local/agents-md-settings`，在
`<profile>/cordis.patch.yml` 里加一条 `insert` 行，重启应用。卸载反过来做即可。

注意：Windows 上直接拉起记事本（`.md` 往往没有关联，走 `cmd /c start` 会闪一下
黑框什么也不打开）；macOS/Linux 用系统默认程序。改完的内容**下一个会话**才生效，
当前会话不会重载。

## Changelog

- **0.5.0** — Windows finds the Notepad window **by title** after launching. On
  Windows 11 
otepad.exe is a launcher for the packaged app, so the started
  process owns no window; the script waits for the tab, restores it, moves it to
  900x640 and raises it. A saved placement of a few pixels was why the click looked
  inert.
- **0.4.1** — dropped `windowsHide` from the spawn options. For a GUI process that
  flag can start the window hidden, which looks exactly like "the click did nothing"
  even though the route answered `200`.
- **0.4.0** — the row is a plain `<a href="/agents-md/open">` instead of a JS button,
  so a page-level click handler cannot swallow it; the Host answers the navigation
  with a page that closes itself.
- **0.3.0** — Windows launches `notepad.exe` directly; the failure reason is shown
  in the settings row instead of being swallowed.
- **0.2.0** — the Host resolves `~/.dsh/AGENTS.md` and exposes `POST /agents-md/open`;
  the Client no longer sends a path.
- **0.1.0** — first attempt: the Client asked `session/openWorkspacePath` to open
  `~/.dsh/AGENTS.md`. Hosts that expand `~` under *Documents* opened the wrong folder.

## License

MIT




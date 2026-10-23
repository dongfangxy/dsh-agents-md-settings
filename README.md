# AGENTS.md Settings Row — DeepSeek Harness

Adds a small row to **Settings → General** in the DeepSeek Harness desktop app:

> **Agent instructions (AGENTS.md)** — open `~/.dsh/AGENTS.md` in your system editor. [Open in editor]

DeepSeek Harness reads `AGENTS.md` files on every new session but ships no way to
*find* them from the UI. This bundle adds one row that hands the file to your
operating system, so you edit and save it in whatever editor you already use.

<sub>中文见下方 [中文说明](#中文说明)。</sub>

## How it works

It is a **client-only** cordis bundle, about 80 lines:

| Piece | Role |
|---|---|
| `cordis.patch.yml` | inserts one row named `agents-md-settings` into the profile |
| `index.js` | host half, intentionally empty (`export function apply() {}`) |
| `client.js` | registers a component into the `settings.general.item` slot |
| `package.json` | `dsh.bundle.patch` + `dsh.client` declarations |

Clicking the button calls the existing Host entry point
`session/openWorkspacePath` with `~/.dsh/AGENTS.md`. The Host expands `~` to its
own home directory and opens the file with the operating-system handler, so the
bundle contains no personal paths and no platform-specific code.

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

- The row opens the file with the **system default** handler. On Windows, a `.md`
  file with no association shows the "How do you want to open this file?" picker
  once; choose Notepad (tick *Always*) and later clicks go straight there.
- Edits take effect on the **next session**: `AGENTS.md` is read once, at the
  first request of a session, and is not watched for external changes.
- The `~` expansion relies on the Host path resolver; if a future release stops
  expanding it, pass an absolute path instead.
- Tested only on Windows 11 with DSH desktop. macOS/Linux should work through the
  same code path but are untested.

## 中文说明

在「设置 → 通用」里加一行，点一下就交给系统打开 `~/.dsh/AGENTS.md`，你自己用
记事本之类的编辑器改完保存即可。

DSH 每次新会话都会读 `AGENTS.md`，但界面上没有任何入口能打开它，这个插件补的
就是这一个洞。它是纯前端 bundle：往 `settings.general.item` 插槽注册一个组件，
点击时调用宿主已有的 `session/openWorkspacePath`，由宿主把 `~` 展开成它自己的
主目录再打开——所以包里没有写死任何人的路径。

安装：把目录拷到 `<profile>/node_modules/@local/agents-md-settings`，在
`<profile>/cordis.patch.yml` 里加一条 `insert` 行，重启应用。卸载反过来做即可。

注意：`.md` 在 Windows 上没有关联时会先弹一次「如何打开」，选记事本并勾选
「始终」以后就直达；改完的内容**下一个会话**才生效，当前会话不会重载。

## License

MIT

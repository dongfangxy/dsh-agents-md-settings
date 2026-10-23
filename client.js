window.__ModuleLoader__.load({
  id: '@local/agents-md-settings',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    // A leading "~" is expanded by the Host to its own home directory, so the row
    // works for any user on any platform where DSH keeps its home at ~/.dsh.
    const TARGET = '~/.dsh/AGENTS.md';

    const styles = {
      row: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '16px 0',
        borderBottom: '1px solid var(--dsw-alias-border-secondary, rgba(128,128,128,0.2))',
      },
      text: { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 },
      title: { fontSize: '14px', lineHeight: '22px', color: 'var(--dsw-alias-label-primary, inherit)' },
      desc: { fontSize: '12px', lineHeight: '18px', color: 'var(--dsw-alias-label-secondary, rgba(128,128,128,0.9))' },
      button: {
        flex: '0 0 auto',
        padding: '6px 14px',
        fontSize: '13px',
        borderRadius: '6px',
        cursor: 'pointer',
        border: '1px solid var(--dsw-alias-border-primary, rgba(128,128,128,0.4))',
        background: 'transparent',
        color: 'var(--dsw-alias-label-primary, inherit)',
      },
    };

    const inject = ['slots', 'remote', 'remote.session'];

    function apply(ctx) {
      async function openAgentsMd() {
        const res = await ctx.remote.session.openWorkspacePath({ path: TARGET });
        const ok = res !== null && typeof res === 'object' && (res.ok === true || res.opened === true);
        if (!ok) throw new Error('host did not confirm the open');
      }

      function AgentsMdRow() {
        const [state, setState] = React.useState('idle');

        const onClick = React.useCallback(async () => {
          setState('opening');
          try {
            await openAgentsMd();
            setState('ok');
          } catch (error) {
            if (typeof console !== 'undefined') console.error('[agents-md] open failed', error);
            setState('failed');
          }
          setTimeout(() => setState('idle'), 2500);
        }, []);

        const label = state === 'opening' ? '正在打开…'
          : state === 'ok' ? '已交给系统'
            : state === 'failed' ? '打开失败'
              : '用记事本打开';

        return h('div', { style: styles.row },
          h('div', { style: styles.text },
            h('div', { style: styles.title }, 'Agent 指令文件（AGENTS.md）'),
            h('div', { style: styles.desc }, '在系统中打开 ~/.dsh/AGENTS.md，用记事本修改并保存；新会话生效。'),
          ),
          h('button', {
            type: 'button',
            style: styles.button,
            disabled: state === 'opening',
            onClick,
          }, label),
        );
      }

      ctx.slots.inject('settings.general.item', () => ctx.slots.register({
        name: 'settings.general.item',
        id: 'agents-md',
        order: 40,
      }, AgentsMdRow));
    }

    return { inject, apply };
  },
});

window.__ModuleLoader__.load({
  id: '@local/agents-md-settings',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

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
        lineHeight: '18px',
        borderRadius: '6px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        border: '1px solid var(--dsw-alias-border-primary, rgba(128,128,128,0.4))',
        background: 'transparent',
        color: 'var(--dsw-alias-label-primary, inherit)',
      },
    };

    const inject = ['slots'];

    function apply(ctx) {
      /**
       * POST, not an <a href>: the desktop shell denies target="_blank"
       * navigations, so a link click is swallowed and nothing happens at all.
       */
      async function openAgentsMd() {
        const response = await fetch('/agents-md/open', { method: 'POST' });
        const body = await response.json().catch(() => null);
        if (!response.ok || body === null || body.ok !== true) {
          throw new Error((body && body.error) || `HTTP ${response.status}`);
        }
        return body;
      }

      function AgentsMdRow() {
        const [state, setState] = React.useState('idle');
        const [detail, setDetail] = React.useState('');

        const onClick = React.useCallback(async () => {
          setState('opening');
          setDetail('');
          try {
            const body = await openAgentsMd();
            setDetail(`${body.opener} · ${body.file}`);
            setState('ok');
          } catch (error) {
            if (typeof console !== 'undefined') console.error('[agents-md] open failed', error);
            setDetail(String((error && error.message) || error));
            setState('failed');
          }
          setTimeout(() => setState('idle'), 6000);
        }, []);

        const label = state === 'opening' ? '正在打开…'
          : state === 'ok' ? '已打开'
            : state === 'failed' ? '打开失败'
              : '用记事本打开';

        const description = state === 'idle' || detail === ''
          ? '点击用记事本打开 ~/.dsh/AGENTS.md；改完保存，新会话生效。'
          : detail;

        return h('div', { style: styles.row },
          h('div', { style: styles.text },
            h('div', { style: styles.title }, 'Agent 指令文件（AGENTS.md）'),
            h('div', { style: styles.desc }, description),
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

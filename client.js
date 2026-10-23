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
      link: {
        flex: '0 0 auto',
        padding: '6px 14px',
        fontSize: '13px',
        lineHeight: '18px',
        borderRadius: '6px',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        border: '1px solid var(--dsw-alias-border-primary, rgba(128,128,128,0.4))',
        color: 'var(--dsw-alias-label-primary, inherit)',
      },
    };

    const inject = ['slots'];

    function apply(ctx) {
      /**
       * A plain anchor on purpose: the row must work even when a page-level handler
       * swallows synthetic clicks. The Host answers the navigation, launches the
       * editor, and the page it opens closes itself.
       */
      function AgentsMdRow() {
        return h('div', { style: styles.row },
          h('div', { style: styles.text },
            h('div', { style: styles.title }, 'Agent 指令文件（AGENTS.md）'),
            h('div', { style: styles.desc }, '点击用记事本打开 ~/.dsh/AGENTS.md；改完保存，新会话生效。'),
          ),
          h('a', {
            href: '/agents-md/open',
            target: '_blank',
            rel: 'noopener noreferrer',
            style: styles.link,
          }, '用记事本打开'),
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

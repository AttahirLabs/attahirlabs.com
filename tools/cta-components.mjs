// Intent links go straight to the promised destination, never another CTA.
export const PROJECT_FORM_PATH = '/web-design/start/';

export function applyCTAContract(html, relative) {
  html = html.replace(/<a\b([^>]*\bhref=")([^"]*)("[^>]*)>([\s\S]*?)<\/a>/gi, (tag, before, href, after, content) => {
    const label = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    let target = href;
    if (href === '/web-design/#start' || (relative === 'web-design/index.html' && href === '#start')
      || /^(?:Start a project|Let[’']s (?:talk about your project|build your next chapter)|Tell us what you[’']re building)(?:\s*[↗→])?$/i.test(label)) target = PROJECT_FORM_PATH;
    if (/^Explore (?:all |the )?apps(?:\s*[↗→])?$/i.test(label)) target = '/apps/';
    if (/^Get in touch(?:\s*[↗→])?$/i.test(label)) target = 'mailto:support@attahirlabs.com';
    return `<a${before}${target}${after}>${content}</a>`;
  });
  if (relative === 'index.html') {
    const routes = {apps:'/apps/', 'web-design':'/web-design/', tools:'/tools/', guides:'/blog/'};
    html = html.replace(/<nav\b[^>]*data-menu\b[^>]*>[\s\S]*?<\/nav>/, nav => nav.replace(/href="#(apps|web-design|tools|guides)"/g, (_, id) => `href="${routes[id]}"`));
  }
  return html;
}

import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import remarkGithubAdmonitions from 'remark-github-admonitions-to-directives';

export default defineConfig({
  site: 'https://aws-learn.pages.dev',
  legacy: {
    collections: true,
  },
  integrations: [
    starlight({
      title: 'AWS Learning',
      locales: {
        root: { label: 'Tiếng Việt', lang: 'vi' },
      },
      sidebar: [
        { label: 'Fundamentals', autogenerate: { directory: 'fundamentals' } },
        { label: 'Compute', autogenerate: { directory: 'compute' } },
        { label: 'Storage', autogenerate: { directory: 'storage' } },
        { label: 'Database', autogenerate: { directory: 'database' } },
        { label: 'Migration', autogenerate: { directory: 'migration' } },
        { label: 'Data Integration', autogenerate: { directory: 'data-integration' } },
        { label: 'Analytics', autogenerate: { directory: 'analytics' } },
        { label: 'Networking', autogenerate: { directory: 'networking' } },
        { label: 'Account Management', autogenerate: { directory: 'account-management' } },
        { label: 'Security', autogenerate: { directory: 'security' } },
        { label: 'Partner & Marketplace', autogenerate: { directory: 'partner-marketplace' } },
        { label: 'Monitoring & Management', autogenerate: { directory: 'monitoring-management' } },
        { label: 'Developer Tools', autogenerate: { directory: 'developer-tools' } },
        { label: 'Infrastructure as Code', autogenerate: { directory: 'iac' } },
        { label: 'Messaging & Streaming', autogenerate: { directory: 'messaging-streaming' } },
        { label: 'Global Applications Architecture', autogenerate: { directory: 'global-architecture' } },
        { label: 'Cost Management', autogenerate: { directory: 'cost-management' } },
        { label: 'Support', autogenerate: { directory: 'support' } },
        { label: 'AI/ML Services', autogenerate: { directory: 'ai-ml' } },
        { label: 'End User Computing', autogenerate: { directory: 'end-user-computing' } },
        { label: 'Application Integration', autogenerate: { directory: 'application-integration' } },
        { label: 'Beads Viewer', link: '/beads/' },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
  ],
  markdown: {
    remarkPlugins: [remarkGithubAdmonitions],
  },
});

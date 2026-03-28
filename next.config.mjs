import { createMDX } from 'fumadocs-mdx/next';
import remarkGithubAdmonitions from 'remark-github-admonitions-to-directives';
import { visit } from 'unist-util-visit';

function remarkMermaid() {
  return (tree) => {
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang !== 'mermaid') return;
      parent.children[index] = {
        type: 'mdxJsxFlowElement',
        name: 'MermaidDiagram',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'chart',
            value: node.value,
          },
        ],
        children: [],
      };
    });
  };
}

const withMDX = createMDX({
  mdxOptions: {
    remarkPlugins: [remarkGithubAdmonitions, remarkMermaid],
  },
});

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  distDir: 'dist',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default withMDX(config);

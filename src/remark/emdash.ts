import type { Transformer } from 'unified';
import type { Root } from 'mdast';
import { visit } from 'unist-util-visit';

export default function remarkEmdash(): Transformer<Root, Root> {
  return (tree: Root, _file) => {
    visit(tree, 'text', (node) => {
      node.value = node.value.replaceAll('---', '—');
    });
  };
}

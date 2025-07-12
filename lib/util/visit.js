export const visitSkip = Symbol();

/**
 * @param {import('../types.js').XastNode} node
 * @param {import('../types.js').Visitor} visitor
 * @param {any=} parentNode
 */
export const visit = (node, visitor, parentNode) => {
  const callbacks = visitor[node.type];
  if (callbacks?.enter) {
    // @ts-expect-error hard to infer
    const symbol = callbacks.enter(node, parentNode);
    if (symbol === visitSkip) {
      return;
    }
  }
  // visit root children
  if (node.type === 'root') {
    // copy children array to not lose cursor when children is spliced
    for (const child of node.children) {
      visit(child, visitor, node);
    }
  }
  // visit element children if still attached to parent
  if (node.type === 'element') {
    if (parentNode.children.includes(node)) {
      for (const child of node.children) {
        visit(child, visitor, node);
      }
    }
  }
  if (callbacks?.exit) {
    // @ts-expect-error hard to infer
    callbacks.exit(node, parentNode);
  }
};

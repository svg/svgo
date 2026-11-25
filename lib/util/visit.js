export const visitSkip = Symbol();

/**
 * @param {import('../types.js').XastNode} node
 * @param {import('../types.js').Visitor} visitor
 * @param {any=} parentNode
 * @param {number=} index
 */
export const visit = (node, visitor, parentNode, index) => {
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
    let childIndex = 0;
    for (const child of node.children) {
      visit(child, visitor, node, childIndex++);
    }
  }
  // visit element children if still attached to parent
  if (node.type === 'element') {
    if (
      (index !== undefined && parentNode.children[index] === node) ||
      parentNode.children.includes(node)
    ) {
      let childIndex = 0;
      for (const child of node.children) {
        visit(child, visitor, node, childIndex++);
      }
    }
  }
  if (callbacks?.exit) {
    // @ts-expect-error hard to infer
    callbacks.exit(node, parentNode);
  }
};

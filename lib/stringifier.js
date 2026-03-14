import { textElems } from '../plugins/_collections.js';

/**
 * @typedef {Required<import('./types.js').StringifyOptions>} Options
 *
 * @typedef State
 * @property {string} indent
 * @property {?import('./types.js').XastElement} textContext
 * @property {number} indentLevel
 */

/**
 * @param {string} char
 * @returns {string}
 */
const encodeEntity = (char) => {
  return entities[char];
};

/** @type {Options} */
const defaults = {
  doctypeStart: '<!DOCTYPE',
  doctypeEnd: '>',
  procInstStart: '<?',
  procInstEnd: '?>',
  tagOpenStart: '<',
  tagOpenEnd: '>',
  tagCloseStart: '</',
  tagCloseEnd: '>',
  tagShortStart: '<',
  tagShortEnd: '/>',
  attrStart: '="',
  attrEnd: '"',
  commentStart: '<!--',
  commentEnd: '-->',
  cdataStart: '<![CDATA[',
  cdataEnd: ']]>',
  textStart: '',
  textEnd: '',
  indent: 4,
  regEntities: /[&'"<>]/g,
  regValEntities: /[&"<>]/g,
  encodeEntity,
  pretty: false,
  useShortTags: true,
  eol: 'lf',
  finalNewline: false,
};

/** @type {Record<string, string>} */
const entities = {
  '&': '&amp;',
  "'": '&apos;',
  '"': '&quot;',
  '>': '&gt;',
  '<': '&lt;',
};

/**
 * Converts XAST to SVG string.
 *
 * @param {import('./types.js').XastRoot} data
 * @param {import('./types.js').StringifyOptions=} userOptions
 * @returns {string}
 */
export const stringifySvg = (data, userOptions = {}) => {
  /** @type {Options} */
  const config = { ...defaults, ...userOptions };
  const indent = config.indent;
  let newIndent = '    ';
  if (typeof indent === 'number' && Number.isNaN(indent) === false) {
    newIndent = indent < 0 ? '\t' : ' '.repeat(indent);
  } else if (typeof indent === 'string') {
    newIndent = indent;
  }
  /** @type {State} */
  const state = {
    indent: newIndent,
    textContext: null,
    indentLevel: 0,
  };
  const eol = config.eol === 'crlf' ? '\r\n' : '\n';
  if (config.pretty) {
    config.doctypeEnd += eol;
    config.procInstEnd += eol;
    config.commentEnd += eol;
    config.cdataEnd += eol;
    config.tagShortEnd += eol;
    config.tagOpenEnd += eol;
    config.tagCloseEnd += eol;
    config.textEnd += eol;
  }
  let svg = stringifyNode(data, config, state);
  if (config.finalNewline && svg.length > 0 && !svg.endsWith('\n')) {
    svg += eol;
  }
  return svg;
};

/**
 * @param {import('./types.js').XastParent} data
 * @param {Options} config
 * @param {State} state
 * @returns {string}
 */
const stringifyNode = (data, config, state) => {
  let svg = '';
  state.indentLevel++;
  for (const item of data.children) {
    switch (item.type) {
      case 'element':
        svg += stringifyElement(item, config, state);
        break;
      case 'text':
        svg += stringifyText(item, config, state);
        break;
      case 'doctype':
        svg += stringifyDoctype(item, config);
        break;
      case 'instruction':
        svg += stringifyInstruction(item, config);
        break;
      case 'comment':
        svg += stringifyComment(item, config);
        break;
      case 'cdata':
        svg += stringifyCdata(item, config, state);
    }
  }
  state.indentLevel--;
  return svg;
};

/**
 * Create indent string in accordance with the current node level.
 *
 * @param {Options} config
 * @param {State} state
 * @returns {string}
 */
const createIndent = (config, state) => {
  let indent = '';
  if (config.pretty && state.textContext == null) {
    indent = state.indent.repeat(state.indentLevel - 1);
  }
  return indent;
};

/**
 * @param {import('./types.js').XastDoctype} node
 * @param {Options} config
 * @returns {string}
 */
const stringifyDoctype = (node, config) => {
  return config.doctypeStart + node.data.doctype + config.doctypeEnd;
};

/**
 * @param {import('./types.js').XastInstruction} node
 * @param {Options} config
 * @returns {string}
 */
const stringifyInstruction = (node, config) => {
  return (
    config.procInstStart + node.name + ' ' + node.value + config.procInstEnd
  );
};

/**
 * @param {import('./types.js').XastComment} node
 * @param {Options} config
 * @returns {string}
 */
const stringifyComment = (node, config) => {
  return config.commentStart + node.value + config.commentEnd;
};

/**
 * @param {import('./types.js').XastCdata} node
 * @param {Options} config
 * @param {State} state
 * @returns {string}
 */
const stringifyCdata = (node, config, state) => {
  return (
    createIndent(config, state) +
    config.cdataStart +
    node.value +
    config.cdataEnd
  );
};

/**
 * @param {import('./types.js').XastElement} node
 * @param {Options} config
 * @param {State} state
 * @returns {string}
 */
const stringifyElement = (node, config, state) => {
  // empty element and short tag
  if (node.children.length === 0) {
    if (config.useShortTags) {
      return (
        createIndent(config, state) +
        config.tagShortStart +
        node.name +
        stringifyAttributes(node, config) +
        config.tagShortEnd
      );
    }

    return (
      createIndent(config, state) +
      config.tagShortStart +
      node.name +
      stringifyAttributes(node, config) +
      config.tagOpenEnd +
      config.tagCloseStart +
      node.name +
      config.tagCloseEnd
    );
  }

  // non-empty element
  let tagOpenStart = config.tagOpenStart;
  let tagOpenEnd = config.tagOpenEnd;
  let tagCloseStart = config.tagCloseStart;
  let tagCloseEnd = config.tagCloseEnd;
  let openIndent = createIndent(config, state);
  let closeIndent = createIndent(config, state);

  if (state.textContext) {
    tagOpenStart = defaults.tagOpenStart;
    tagOpenEnd = defaults.tagOpenEnd;
    tagCloseStart = defaults.tagCloseStart;
    tagCloseEnd = defaults.tagCloseEnd;
    openIndent = '';
  } else if (textElems.has(node.name)) {
    tagOpenEnd = defaults.tagOpenEnd;
    tagCloseStart = defaults.tagCloseStart;
    closeIndent = '';
    state.textContext = node;
  }

  const children = stringifyNode(node, config, state);

  if (state.textContext === node) {
    state.textContext = null;
  }

  return (
    openIndent +
    tagOpenStart +
    node.name +
    stringifyAttributes(node, config) +
    tagOpenEnd +
    children +
    closeIndent +
    tagCloseStart +
    node.name +
    tagCloseEnd
  );
};

/**
 * @param {import('./types.js').XastElement} node
 * @param {Options} config
 * @returns {string}
 */
const stringifyAttributes = (node, config) => {
  let attrs = '';
  for (const [name, value] of Object.entries(node.attributes)) {
    attrs += ' ' + name;

    if (value !== undefined) {
      const encodedValue = value
        .toString()
        .replace(config.regValEntities, config.encodeEntity);
      attrs += config.attrStart + encodedValue + config.attrEnd;
    }
  }
  return attrs;
};

/**
 * @param {import('./types.js').XastText} node
 * @param {Options} config
 * @param {State} state
 * @returns {string}
 */
const stringifyText = (node, config, state) => {
  return (
    createIndent(config, state) +
    config.textStart +
    node.value.replace(config.regEntities, config.encodeEntity) +
    (state.textContext ? '' : config.textEnd)
  );
};

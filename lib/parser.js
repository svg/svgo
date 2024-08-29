/**
 * @typedef {import('./types.js').XastNode} XastNode
 * @typedef {import('./types.js').XastInstruction} XastInstruction
 * @typedef {import('./types.js').XastDoctype} XastDoctype
 * @typedef {import('./types.js').XastComment} XastComment
 * @typedef {import('./types.js').XastRoot} XastRoot
 * @typedef {import('./types.js').XastElement} XastElement
 * @typedef {import('./types.js').XastCdata} XastCdata
 * @typedef {import('./types.js').XastText} XastText
 * @typedef {import('./types.js').XastParent} XastParent
 * @typedef {import('./types.js').XastChild} XastChild
 */

// @ts-ignore sax will be replaced with something else later
import SAX from 'sax';
import { textElems } from '../plugins/_collections.js';

class SvgoParserError extends Error {
  /**
   * @param message {string}
   * @param line {number}
   * @param column {number}
   * @param source {string}
   * @param file {void | string}
   */
  constructor(message, line, column, source, file) {
    super(message);
    this.name = 'SvgoParserError';
    this.message = `${file || '<input>'}:${line}:${column}: ${message}`;
    this.reason = message;
    this.line = line;
    this.column = column;
    this.source = source;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SvgoParserError);
    }
  }
  toString() {
    const lines = this.source.split(/\r?\n/);
    const startLine = Math.max(this.line - 3, 0);
    const endLine = Math.min(this.line + 2, lines.length);
    const lineNumberWidth = String(endLine).length;
    const startColumn = Math.max(this.column - 54, 0);
    const endColumn = Math.max(this.column + 20, 80);
    const code = lines
      .slice(startLine, endLine)
      .map((line, index) => {
        const lineSlice = line.slice(startColumn, endColumn);
        let ellipsisPrefix = '';
        let ellipsisSuffix = '';
        if (startColumn !== 0) {
          ellipsisPrefix = startColumn > line.length - 1 ? ' ' : '…';
        }
        if (endColumn < line.length - 1) {
          ellipsisSuffix = '…';
        }
        const number = startLine + 1 + index;
        const gutter = ` ${number.toString().padStart(lineNumberWidth)} | `;
        if (number === this.line) {
          const gutterSpacing = gutter.replace(/[^|]/g, ' ');
          const lineSpacing = (
            ellipsisPrefix + line.slice(startColumn, this.column - 1)
          ).replace(/[^\t]/g, ' ');
          const spacing = gutterSpacing + lineSpacing;
          return `>${gutter}${ellipsisPrefix}${lineSlice}${ellipsisSuffix}\n ${spacing}^`;
        }
        return ` ${gutter}${ellipsisPrefix}${lineSlice}${ellipsisSuffix}`;
      })
      .join('\n');
    return `${this.name}: ${this.message}\n\n${code}\n`;
  }
}

const entityDeclaration = /<!ENTITY\s+(\S+)\s+(?:'([^']+)'|"([^"]+)")\s*>/g;

const config = {
  strict: true,
  trim: false,
  normalize: false,
  lowercase: true,
  xmlns: true,
  position: true,
  unparsedEntities: true,
};

/**
 * Convert SVG (XML) string to SVG-as-JS object.
 *
 * @type {(data: string, from?: string) => XastRoot}
 */
export const parseSvg = (data, from) => {
  const sax = SAX.parser(config.strict, config);
  /**
   * @type {XastRoot}
   */
  const root = { type: 'root', children: [] };
  /**
   * @type {XastParent}
   */
  let current = root;
  /**
   * @type {XastParent[]}
   */
  const stack = [root];

  /**
   * @type {(node: XastChild) => void}
   */
  const pushToContent = (node) => {
    // TODO remove legacy parentNode in v4
    Object.defineProperty(node, 'parentNode', {
      writable: true,
      value: current,
    });
    current.children.push(node);
  };

  sax.ondoctype = (doctype) => {
    /**
     * @type {XastDoctype}
     */
    const node = {
      type: 'doctype',
      // TODO parse doctype for name, public and system to match xast
      name: 'svg',
      data: {
        doctype,
      },
    };
    pushToContent(node);
    const subsetStart = doctype.indexOf('[');
    if (subsetStart >= 0) {
      entityDeclaration.lastIndex = subsetStart;
      let entityMatch = entityDeclaration.exec(data);
      while (entityMatch != null) {
        sax.ENTITIES[entityMatch[1]] = entityMatch[2] || entityMatch[3];
        entityMatch = entityDeclaration.exec(data);
      }
    }
  };

  sax.onprocessinginstruction = (data) => {
    /**
     * @type {XastInstruction}
     */
    const node = {
      type: 'instruction',
      name: data.name,
      value: data.body,
    };
    pushToContent(node);
  };

  sax.oncomment = (comment) => {
    /**
     * @type {XastComment}
     */
    const node = {
      type: 'comment',
      value: comment.trim(),
    };
    pushToContent(node);
  };

  sax.oncdata = (cdata) => {
    /**
     * @type {XastCdata}
     */
    const node = {
      type: 'cdata',
      value: cdata,
    };
    pushToContent(node);
  };

  sax.onopentag = (data) => {
    /**
     * @type {XastElement}
     */
    let element = {
      type: 'element',
      name: data.name,
      attributes: {},
      children: [],
    };
    for (const [name, attr] of Object.entries(data.attributes)) {
      element.attributes[name] = attr.value;
    }
    pushToContent(element);
    current = element;
    stack.push(element);
  };

  sax.ontext = (text) => {
    if (current.type === 'element') {
      // prevent trimming of meaningful whitespace inside textual tags
      if (textElems.has(current.name)) {
        /**
         * @type {XastText}
         */
        const node = {
          type: 'text',
          value: text,
        };
        pushToContent(node);
      } else if (/\S/.test(text)) {
        /**
         * @type {XastText}
         */
        const node = {
          type: 'text',
          value: text.trim(),
        };
        pushToContent(node);
      }
    }
  };

  sax.onclosetag = () => {
    stack.pop();
    current = stack[stack.length - 1];
  };

  sax.onerror = (e) => {
    const reason = e.message.split('\n')[0];
    const error = new SvgoParserError(
      reason,
      sax.line + 1,
      sax.column,
      data,
      from,
    );
    if (e.message.indexOf('Unexpected end') === -1) {
      throw error;
    }
  };

  sax.write(data).close();
  return root;
};

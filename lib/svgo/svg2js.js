'use strict';

const SAX = require('@trysound/sax');
const JSAPI = require('./jsAPI.js');
const { textElems } = require('../../plugins/_collections.js');

class SvgoParserError extends Error {
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
};

/**
 * Convert SVG (XML) string to SVG-as-JS object.
 *
 * @param {String} data input data
 */
module.exports = function (data, from) {
  const sax = SAX.parser(config.strict, config);
  const root = new JSAPI({ type: 'root', children: [] });
  let current = root;
  let stack = [root];

  function pushToContent(node) {
    const wrapped = new JSAPI(node, current);
    current.children.push(wrapped);
    return wrapped;
  }

  sax.ondoctype = function (doctype) {
    pushToContent({
      type: 'doctype',
      // TODO parse doctype for name, public and system to match xast
      name: 'svg',
      data: {
        doctype,
      },
    });

    const subsetStart = doctype.indexOf('[');
    let entityMatch;

    if (subsetStart >= 0) {
      entityDeclaration.lastIndex = subsetStart;

      while ((entityMatch = entityDeclaration.exec(data)) != null) {
        sax.ENTITIES[entityMatch[1]] = entityMatch[2] || entityMatch[3];
      }
    }
  };

  sax.onprocessinginstruction = function (data) {
    pushToContent({
      type: 'instruction',
      name: data.name,
      value: data.body,
    });
  };

  sax.oncomment = function (comment) {
    pushToContent({
      type: 'comment',
      value: comment.trim(),
    });
  };

  sax.oncdata = function (cdata) {
    pushToContent({
      type: 'cdata',
      value: cdata,
    });
  };

  sax.onopentag = function (data) {
    var element = {
      type: 'element',
      name: data.name,
      attributes: {},
      children: [],
    };

    for (const [name, attr] of Object.entries(data.attributes)) {
      element.attributes[name] = attr.value;
    }

    element = pushToContent(element);
    current = element;

    stack.push(element);
  };

  sax.ontext = function (text) {
    // prevent trimming of meaningful whitespace inside textual tags
    if (textElems.includes(current.name) && !data.prefix) {
      pushToContent({
        type: 'text',
        value: text,
      });
    } else if (/\S/.test(text)) {
      pushToContent({
        type: 'text',
        value: text.trim(),
      });
    }
  };

  sax.onclosetag = function () {
    stack.pop();
    current = stack[stack.length - 1];
  };

  sax.onerror = function (e) {
    const error = new SvgoParserError(
      e.reason,
      e.line + 1,
      e.column,
      data,
      from
    );
    if (e.message.indexOf('Unexpected end') === -1) {
      throw error;
    }
  };

  sax.write(data).close();
  return root;
};

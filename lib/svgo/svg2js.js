'use strict';

var SAX = require('@trysound/sax'),
  JSAPI = require('./jsAPI.js'),
  CSSClassList = require('./css-class-list'),
  CSSStyleDeclaration = require('./css-style-declaration'),
  textElems = require('../../plugins/_collections.js').textElems,
  entityDeclaration = /<!ENTITY\s+(\S+)\s+(?:'([^']+)'|"([^"]+)")\s*>/g;

var config = {
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
module.exports = function (data) {
  var sax = SAX.parser(config.strict, config),
    root = new JSAPI({ elem: '#document', content: [] }),
    current = root,
    stack = [root];

  function pushToContent(content) {
    content = new JSAPI(content, current);

    (current.content = current.content || []).push(content);

    return content;
  }

  sax.ondoctype = function (doctype) {
    pushToContent({
      doctype: doctype,
    });

    var subsetStart = doctype.indexOf('['),
      entityMatch;

    if (subsetStart >= 0) {
      entityDeclaration.lastIndex = subsetStart;

      while ((entityMatch = entityDeclaration.exec(data)) != null) {
        sax.ENTITIES[entityMatch[1]] = entityMatch[2] || entityMatch[3];
      }
    }
  };

  sax.onprocessinginstruction = function (data) {
    pushToContent({
      processinginstruction: data,
    });
  };

  sax.oncomment = function (comment) {
    pushToContent({
      comment: comment.trim(),
    });
  };

  sax.oncdata = function (cdata) {
    pushToContent({
      cdata: cdata,
    });
  };

  sax.onopentag = function (data) {
    var elem = {
      elem: data.name,
      prefix: data.prefix,
      local: data.local,
      attrs: {},
    };

    elem.class = new CSSClassList(elem);
    elem.style = new CSSStyleDeclaration(elem);

    if (Object.keys(data.attributes).length) {
      for (const [name, attr] of Object.entries(data.attributes)) {
        if (name === 'class') {
          // has class attribute
          elem.class.hasClass();
        }

        if (name === 'style') {
          // has style attribute
          elem.style.hasStyle();
        }

        elem.attrs[name] = {
          name: name,
          value: attr.value,
          prefix: attr.prefix,
          local: attr.local,
        };
      }
    }

    elem = pushToContent(elem);
    current = elem;

    stack.push(elem);
  };

  sax.ontext = function (text) {
    // prevent trimming of meaningful whitespace inside textual tags
    if (textElems.includes(current.elem) && !data.prefix) {
      pushToContent({ text: text });
    } else if (/\S/.test(text)) {
      pushToContent({ text: text.trim() });
    }
  };

  sax.onclosetag = function () {
    stack.pop();
    current = stack[stack.length - 1];
  };

  sax.onerror = function (e) {
    e.message = 'Error in parsing SVG: ' + e.message;
    if (e.message.indexOf('Unexpected end') < 0) {
      throw e;
    }
  };

  try {
    sax.write(data).close();
    return root;
  } catch (e) {
    return { error: e.message };
  }
};

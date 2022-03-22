'use strict';

const { detachNodeFromParent } = require('../lib/xast.js');
exports.name = 'removeXSS';
exports.type = 'visitor';
exports.active = false;
exports.description = 'removes attributes and nodes which may cause XSS attack';

const ALL_EVENTS = [
  'onbegin',
  'onend',
  'onrepeat',
  'onabort',
  'onerror',
  'onresize',
  'onscroll',
  'onunload',
  'onbegin',
  'onend',
  'onrepeat',
  'oncancel',
  'oncanplay',
  'oncanplaythrough',
  'onchange',
  'onclick',
  'onclose',
  'oncuechange',
  'ondblclick',
  'ondrag',
  'ondragend',
  'ondragenter',
  'ondragleave',
  'ondragover',
  'ondragstart',
  'ondrop',
  'ondurationchange',
  'onemptied',
  'onended',
  'onerror',
  'onfocus',
  'oninput',
  'oninvalid',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onload',
  'onloadeddata',
  'onloadedmetadata',
  'onloadstart',
  'onmousedown',
  'onmouseenter',
  'onmouseleave',
  'onmousemove',
  'onmouseout',
  'onmouseover',
  'onmouseup',
  'onmousewheel',
  'onpause',
  'onplay',
  'onplaying',
  'onprogress',
  'onratechange',
  'onreset',
  'onresize',
  'onscroll',
  'onseeked',
  'onseeking',
  'onselect',
  'onshow',
  'onstalled',
  'onsubmit',
  'onsuspend',
  'ontimeupdate',
  'ontoggle',
  'onvolumechange',
  'onwaiting',
  'oncopy',
  'oncut',
  'onpaste',
  'onactivate',
  'onfocusin',
  'onfocusout']

/**
 * Remove possible XSS attacks
 *
 * Sometimes it's not enough just to remove <script> tag, XSS may be hidden under event listeners
 * @author Katya Pavlenko
 *
 * @type {import('../lib/types').Plugin<void>}
 */
exports.fn = (root, params) => {
  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'script') {
          detachNodeFromParent(node, parentNode);
          return
        }
        for (let event of ALL_EVENTS) {
            for (const [name] of Object.entries(node.attributes)) {
              if (name === event) {
                delete node.attributes[name];
              }
            }
          }
        }
    }
  };
};

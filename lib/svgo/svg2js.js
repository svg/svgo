'use strict';

const { property } = require('css-tree');

var txml = require('txml'),
    JSAPI = require('./jsAPI.js'),
    CSSClassList = require('./css-class-list'),
    CSSStyleDeclaration = require('./css-style-declaration'),
    entityDeclaration = /<!ENTITY\s+(\S+)\s+(?:'([^\']+)'|"([^\"]+)")\s*>/g;


/**
 * Convert SVG (XML) string to SVG-as-JS object.
 *
 * @param {String} data input data
 * @param {Function} callback
 */
module.exports = function(data, callback) {
    try {
        var DOM = txml.parse(data, {noChildNodes:['?xml','!DOCTYPE', '!ENTITY'], keepComments: true });

        const root = dom2js(DOM);
        callback(root);
    } catch(err) {
        callback({error: 'Error in parsing SVG: ' + err.message });
    }

};

/**
 * 
 * @param {(txml.INode | string)[]} dom 
 */
function dom2js(dom, root, ENTITIES){
    if(!root) root = new JSAPI({ elem: '#document', content: [] });
    if(!ENTITIES) ENTITIES={};
    if(!Array.isArray(dom)) return dom
    dom.forEach(n => {
        
        if (typeof n === 'object') {
            let child;
            if(n.tagName[0] === '?'){
                child = pushToContent({ processinginstruction: { 
                    name: n.tagName.substr(1),
                    body: Object.keys(n.attributes).map(name=>name+'='+JSON.stringify(n.attributes[name])).join(' '),
                } }, root)
            } else {
                const local= n.tagName.includes(':') ? n.tagName.split(':')[1] : n.tagName;
                const prefix= n.tagName.includes(':') ? n.tagName.split(':')[0] : '';
                var elem = {
                    name: n.tagName,
                    elem: n.tagName,
                    prefix,
                    local,
                    attrs: {},
                    //content: []
                };
                
                elem.class = new CSSClassList(elem);
                elem.style = new CSSStyleDeclaration(elem);

                Object.keys(n.attributes).forEach(name => {
                    if(name.startsWith('xmlns:')){
                        n.attributes[name] = ENTITIES[n.attributes[name].substr(1,n.attributes[name].length-2)] || n.attributes[name];
                    }
                    const local= name.includes(':') ? name.split(':')[1] : name;
                    let prefix= name.includes(':') ? name.split(':')[0] : '';
                    //xmlns:x="&ns_extend;"
                    if (name==='xmlns') {
                        prefix='xmlns';
                    }
                    
                    if (name === 'class') { // has class attribute
                        elem.class.hasClass();
                    }
    
                    if (name === 'style') { // has style attribute
                        elem.style.hasStyle();
                    }

                    elem.attrs[name] = {
                        name,
                        value: n.attributes[name],
                        prefix,
                        local
                    };
                });


                child = pushToContent(elem, root);
            }
            
            if (n.children) {
                dom2js(n.children, child, ENTITIES)
            }
        } else if (typeof n === 'string') {
            if(n.startsWith('<!--') && n.endsWith('-->')){
                pushToContent({
                    comment: n.substring(4,n.length-3).trim()
                }, root);
            } else if(n.startsWith('!DOCTYPE')) {
                const data = n.substr(8);
                pushToContent({
                    doctype: data
                }, root);

                var subsetStart = data.indexOf('[');

                if (subsetStart >= 0) {
                    entityDeclaration.lastIndex = subsetStart;
                    var entryLines = data.split('<!ENTITY ');
                    entryLines.shift();
                    entryLines = entryLines
                        .map(el=>el.split('>')[0])
                        .map(el=>el.split(' '));

                    entryLines.forEach(([name, rest]) => {
                        ENTITIES[name] = JSON.parse(rest)
                    });
                }
            } else if (n.includes('<![CDATA[') && n.includes(']]>')) {
                var text = n.substring(n.indexOf('<![CDATA[')+9,n.lastIndexOf(']]>')).trim();
                if (text) pushToContent({ cdata: text }, root);
            } else {
                var text = decodeEntities(n.replace(/[ \t\n]+/g, ' ').trim());
                if (text) pushToContent({ text }, root);
            }
        }else{
            pushToContent(n, root);
        }
    });

    return root;
}

function pushToContent(content, parent) {

    const jsapi = new JSAPI(content, parent);

    (parent.content = parent.content || []).push(jsapi);

    return jsapi;

}

const ALPHA_INDEX = {
    '&lt': '<',
    '&gt': '>',
    '&quot': '"',
    '&apos': '\'',
    '&amp': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': '\'',
    '&amp;': '&'
};

const CHAR_INDEX= {
    60: 'lt',
    62: 'gt',
    34: 'quot',
    39: 'apos',
    38: 'amp'
};

const CHAR_S_INDEX = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&apos;',
    '&': '&amp;'
};

function decodeEntities(str) {
    if (!str || !str.length) {
        return '';
    }
    return str.replace(/&#?[0-9a-zA-Z]+;?/g, function (s) {
        if (s.charAt(1) === '#') {
            const code = s.charAt(2).toLowerCase() === 'x' ?
                parseInt(s.substr(3), 16) :
                parseInt(s.substr(2));

            if (isNaN(code) || code < -32768 || code > 65535) {
                return '';
            }
            return String.fromCharCode(code);
        }
        return ALPHA_INDEX[s] || s;
    });
}
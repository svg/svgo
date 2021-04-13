'use strict';

const { textElems } = require('../../plugins/_collections.js');

var txml = require('txml'),
    JSAPI = require('./jsAPI.js'),
    entityDeclaration = /<!ENTITY\s+(\S+)\s+(?:'([^']+)'|"([^"]+)")\s*>/g;


/**
 * Convert SVG (XML) string to SVG-as-JS object.
 *
 * @param {String} data input data
 * @param {Function} callback
 */
module.exports = function(data) {
    try {
        var DOM = txml.parse(data, {
            noChildNodes:['?xml','!DOCTYPE', '!ENTITY'],
            keepComments: true,
            keepWhitespace: true,
            
        });

        const r = dom2js(DOM);

        return r// {r,oldR};
    } catch(err) {
        return { error: 'Error in parsing SVG: ' + err.message };
    }

};

/**
 * 
 * @param {(txml.INode | string)[]} dom 
 */
function dom2js(dom, root, ENTITIES){
    if(!root) root = new JSAPI({ type: 'root', children: [] });
    if(!ENTITIES) ENTITIES = {};
    if(!Array.isArray(dom)) return dom
    dom.forEach(n => {
        var text;
        if (typeof n === 'object') {
            let child;
            if(n.tagName[0] === '?'){
                child = pushToContent({ 
                    type: 'instruction', 
                    name: n.tagName.substr(1),
                    value: Object.keys(n.attributes).map(name=>name+'='+JSON.stringify(n.attributes[name])).join(' '),
                }, root)
            } else {
                var elem = {
                    type: 'element',
                    name: n.tagName,
                    attributes: n.attributes || {},
                    children: [],
                };

                Object.keys(n.attributes).forEach(name => {
                    if(name.startsWith('xmlns:')){
                        n.attributes[name] = ENTITIES[n.attributes[name].substr(1,n.attributes[name].length-2)] || n.attributes[name];
                    }
                    let prefix= name.includes(':') ? name.split(':')[0] : '';
                    
                    if(prefix==='xmlns' 
                        && n.attributes[name].startsWith('&') 
                        && n.attributes[name].endsWith(';') 
                        && ENTITIES[n.attributes[name].substr(1,n.attributes[name].length-2)]
                    ){
                        elem.attributes[name] = ENTITIES[n.attributes[name].substr(1,n.attributes[name].length-2)];  
                    }else{
                        elem.attributes[name] = n.attributes[name];
                    }
                });

                child = pushToContent(elem, root);
            }
            
            if (n.children) {
                dom2js(n.children, child, ENTITIES)
            }
        } else if (typeof n === 'string') {
            if(n.startsWith('<!--') && n.endsWith('-->')){
                pushToContent({
                    type: 'comment',
                    value: n.substring(4,n.length-3).trim()
                }, root);
            } else if(n.startsWith('!DOCTYPE')) {
                const data = n.substr(8);
                pushToContent({
                    type: 'doctype',
                    name: 'svg',
                    data: { doctype: data },
                }, root);

                var subsetStart = data.indexOf('[');

                if (subsetStart >= 0) {
                    entityDeclaration.lastIndex = subsetStart;
                    var entryLines = data.split('<!ENTITY ');
                    entryLines.shift();
                    entryLines = entryLines
                        .map(el=>el.split('>'))
                        .map(list => {
                            list.pop();
                            return list.join('>');
                        })
                        .map(el=>el.split(' '));

                    entryLines.forEach(([name, ...rest]) => {
                        try{
                            ENTITIES[name] = JSON.parse(rest.join(' '))
                        }catch(err){
                            console.log('---->',rest)
                        }
                    });
                }
            } else if (n.includes('<![CDATA[') && n.includes(']]>')) {
                text = n.substring(n.indexOf('<![CDATA[')+9,n.lastIndexOf(']]>'));
                if (text) pushToContent({ type:'cdata', value: text }, root);
            } else {
                text = decodeEntities(n);

                if (
                    text.trim().startsWith('&') 
                    && text.trim().endsWith(';') 
                    && ENTITIES[text.trim().substr(1,text.trim().length-2)]
                ){
                    const replacement = txml.parse(ENTITIES[text.trim().substr(1,text.trim().length-2)]);
                    dom2js(replacement, root, ENTITIES)
                }
                else if (textElems.includes(root.name)) {
                    pushToContent({
                        type: 'text',
                        value: text,
                    },root);
                } else if (/\S/.test(text)) {
                    pushToContent({
                        type: 'text',
                        value: text.trim(),
                    },root);
                }
            }
        } else {
            pushToContent(n, root);
        }
    });

    return root;
}

function pushToContent(node, current) {
    const wrapped = new JSAPI(node, current);
    current.children.push(wrapped);
    return wrapped;
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
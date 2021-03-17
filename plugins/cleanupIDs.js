'use strict';

const { parseName } = require('../lib/svgo/tools.js');

exports.type = 'full';

exports.active = true;

exports.description = 'removes unused IDs and minifies used';

exports.params = {
  remove: true,
  minify: true,
  prefix: '',
  preserve: [],
  preservePrefixes: [],
  force: false,
};

var referencesProps = new Set(require('./_collections').referencesProps),
  regReferencesUrl = /\burl\(("|')?#(.+?)\1\)/,
  regReferencesHref = /^#(.+?)$/,
  regReferencesBegin = /(\w+)\./,
  styleOrScript = ['style', 'script'],
  generateIDchars = [
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'w',
    'x',
    'y',
    'z',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
  ],
  maxIDindex = generateIDchars.length - 1;

/**
 * Remove unused and minify used IDs
 * (only if there are no any <style> or <script>).
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 *
 * @author Kir Belevich
 */
exports.fn = function (data, params) {
  var currentID,
    currentIDstring,
    IDs = new Map(),
    referencesIDs = new Map(),
    hasStyleOrScript = false,
    preserveIDs = new Set(
      Array.isArray(params.preserve)
        ? params.preserve
        : params.preserve
        ? [params.preserve]
        : []
    ),
    preserveIDPrefixes = new Set(
      Array.isArray(params.preservePrefixes)
        ? params.preservePrefixes
        : params.preservePrefixes
        ? [params.preservePrefixes]
        : []
    ),
    idValuePrefix = '#',
    idValuePostfix = '.';

  /**
   * Bananas!
   *
   * @param {Array} items input items
   * @return {Array} output items
   */
  function monkeys(items) {
    for (const item of items.children) {
      if (hasStyleOrScript === true) {
        break;
      }

      // quit if <style> or <script> present ('force' param prevents quitting)
      if (!params.force) {
        if (item.isElem(styleOrScript) && item.children.length !== 0) {
          hasStyleOrScript = true;
          continue;
        }

        // Don't remove IDs if the whole SVG consists only of defs.
        if (item.isElem('svg')) {
          var hasDefsOnly = true;

          for (var j = 0; j < item.children.length; j++) {
            if (!item.children[j].isElem('defs')) {
              hasDefsOnly = false;
              break;
            }
          }
          if (hasDefsOnly) {
            break;
          }
        }
      }
      // …and don't remove any ID if yes
      if (item.type === 'element') {
        const each = (item, fn) => {
          for (const [name, value] of Object.entries(item.attributes)) {
            fn([name, value]);
          }
        };
        for (const [name, value] of Object.entries(item.attributes)) {
          let key;
          let match;

          // save IDs
          if (name === 'id') {
            key = value;
            if (IDs.has(key)) {
              item.removeAttr('id'); // remove repeated id
            } else {
              IDs.set(key, item);
            }
          } else {
            // save references
            const { local } = parseName(name);
            if (
              referencesProps.has(name) &&
              (match = value.match(regReferencesUrl))
            ) {
              key = match[2]; // url() reference
            } else if (
              (local === 'href' && (match = value.match(regReferencesHref))) ||
              (name === 'begin' && (match = value.match(regReferencesBegin)))
            ) {
              key = match[1]; // href reference
            }
            if (key) {
              const refs = referencesIDs.get(key) || [];
              refs.push({ element: item, name, value });
              referencesIDs.set(key, refs);
            }
          }
        }
      }
      // go deeper
      if (item.type === 'root' || item.type === 'element') {
        monkeys(item);
      }
    }
    return items;
  }

  data = monkeys(data);

  if (hasStyleOrScript) {
    return data;
  }

  const idPreserved = (id) =>
    preserveIDs.has(id) || idMatchesPrefix(preserveIDPrefixes, id);

  for (const [key, refs] of referencesIDs) {
    if (IDs.has(key)) {
      // replace referenced IDs with the minified ones
      if (params.minify && !idPreserved(key)) {
        do {
          currentIDstring = getIDstring(
            (currentID = generateID(currentID)),
            params
          );
        } while (idPreserved(currentIDstring));

        IDs.get(key).attr('id').value = currentIDstring;

        for (const { element, name, value } of refs) {
          element.attributes[name] = value.includes(idValuePrefix)
            ? value.replace(
                idValuePrefix + key,
                idValuePrefix + currentIDstring
              )
            : value.replace(
                key + idValuePostfix,
                currentIDstring + idValuePostfix
              );
        }
      }
      // don't remove referenced IDs
      IDs.delete(key);
    }
  }
  // remove non-referenced IDs attributes from elements
  if (params.remove) {
    for (var keyElem of IDs) {
      if (!idPreserved(keyElem[0])) {
        keyElem[1].removeAttr('id');
      }
    }
  }
  return data;
};

/**
 * Check if an ID starts with any one of a list of strings.
 *
 * @param {Array} of prefix strings
 * @param {String} current ID
 * @return {Boolean} if currentID starts with one of the strings in prefixArray
 */
function idMatchesPrefix(prefixArray, currentID) {
  if (!currentID) return false;

  for (var prefix of prefixArray) if (currentID.startsWith(prefix)) return true;
  return false;
}

/**
 * Generate unique minimal ID.
 *
 * @param {Array} [currentID] current ID
 * @return {Array} generated ID array
 */
function generateID(currentID) {
  if (!currentID) return [0];

  currentID[currentID.length - 1]++;

  for (var i = currentID.length - 1; i > 0; i--) {
    if (currentID[i] > maxIDindex) {
      currentID[i] = 0;

      if (currentID[i - 1] !== undefined) {
        currentID[i - 1]++;
      }
    }
  }
  if (currentID[0] > maxIDindex) {
    currentID[0] = 0;
    currentID.unshift(0);
  }
  return currentID;
}

/**
 * Get string from generated ID array.
 *
 * @param {Array} arr input ID array
 * @return {String} output ID string
 */
function getIDstring(arr, params) {
  var str = params.prefix;
  return str + arr.map((i) => generateIDchars[i]).join('');
}

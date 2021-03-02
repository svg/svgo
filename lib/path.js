'use strict';

// Based on https://www.w3.org/TR/SVG11/paths.html#PathDataBNF

const argsCountPerCommand = {
  M: 2,
  m: 2,
  Z: 0,
  z: 0,
  L: 2,
  l: 2,
  H: 1,
  h: 1,
  V: 1,
  v: 1,
  C: 6,
  c: 6,
  S: 4,
  s: 4,
  Q: 4,
  q: 4,
  T: 2,
  t: 2,
  A: 7,
  a: 7,
};

const isCommand = (c) => {
  return c in argsCountPerCommand;
};

const isWsp = (c) => {
  const codePoint = c.codePointAt(0);
  return (
    codePoint === 0x20 ||
    codePoint === 0x9 ||
    codePoint === 0xd ||
    codePoint === 0xa
  );
};

const isDigit = (c) => {
  const codePoint = c.codePointAt(0);
  return 48 <= codePoint && codePoint <= 57;
};

const readNumber = (string, cursor) => {
  let i = cursor;
  let value = '';
  // none | sign | whole | decimal_point | decimal | e | exponent_sign | exponent
  let state = 'none';
  for (; i < string.length; i += 1) {
    const c = string[i];
    if (c === '+' || c === '-') {
      if (state === 'none') {
        state = 'sign';
        value += c;
        continue;
      }
      if (state === 'e') {
        state = 'exponent_sign';
        value += c;
        continue;
      }
    }
    if (isDigit(c)) {
      if (state === 'none' || state === 'sign' || state === 'whole') {
        state = 'whole';
        value += c;
        continue;
      }
      if (state === 'decimal_point' || state === 'decimal') {
        state = 'decimal';
        value += c;
        continue;
      }
      if (state === 'e' || state === 'exponent_sign' || state === 'exponent') {
        state = 'exponent';
        value += c;
        continue;
      }
    }
    if (c === '.') {
      if (state === 'none' || state === 'sign' || state === 'whole') {
        state = 'decimal_point';
        value += c;
        continue;
      }
    }
    if (c === 'E' || c == 'e') {
      if (
        state === 'whole' ||
        state === 'decimal_point' ||
        state === 'decimal'
      ) {
        state = 'e';
        value += c;
        continue;
      }
    }
    break;
  }
  const number = Number.parseFloat(value);
  if (Number.isNaN(number)) {
    return [cursor, null];
  } else {
    // step back to delegate iteration to parent loop
    return [i - 1, number];
  }
};

const parsePathData = (string) => {
  const pathData = [];
  let i = 0;
  let command = null;
  let args;
  let argsCount;
  let canHaveComma = false;
  let hadComma = false;
  for (; i < string.length; i += 1) {
    const c = string.charAt(i);
    if (isWsp(c)) {
      continue;
    }
    // allow comma only between arguments
    if (canHaveComma && c === ',') {
      if (hadComma) {
        break;
      }
      hadComma = true;
      continue;
    }
    if (isCommand(c)) {
      if (hadComma) {
        return pathData;
      }
      if (command == null) {
        // moveto should be leading command
        if (c !== 'M' && c !== 'm') {
          return pathData;
        }
      } else {
        // stop if previous command arguments are not flushed
        if (args.length !== 0) {
          return pathData;
        }
      }
      command = c;
      args = [];
      argsCount = argsCountPerCommand[command];
      canHaveComma = false;
      // flush command without arguments
      if (argsCount === 0) {
        pathData.push({ command, args });
      }
      continue;
    }
    // avoid parsing arguments if no command detected
    if (command == null) {
      return pathData;
    }
    // read next argument
    let newCursor = i;
    let number = null;
    if (command === 'A' || command === 'a') {
      const position = args.length;
      if (position === 0 || position === 1) {
        // allow only positive number without sign as first two arguments
        if (c !== '+' && c !== '-') {
          [newCursor, number] = readNumber(string, i);
        }
      }
      if (position === 2 || position === 5 || position === 6) {
        [newCursor, number] = readNumber(string, i);
      }
      if (position === 3 || position === 4) {
        // read flags
        if (c === '0') {
          number = 0;
        }
        if (c === '1') {
          number = 1;
        }
      }
    } else {
      [newCursor, number] = readNumber(string, i);
    }
    if (number == null) {
      return pathData;
    }
    args.push(number);
    canHaveComma = true;
    hadComma = false;
    i = newCursor;
    // flush arguments when necessary count is reached
    if (args.length === argsCount) {
      pathData.push({ command, args });
      // subsequent moveto coordinates are threated as implicit lineto commands
      if (command === 'M') {
        command = 'L';
      }
      if (command === 'm') {
        command = 'l';
      }
      args = [];
    }
  }
  return pathData;
};
exports.parsePathData = parsePathData;

const stringifyNumber = ({ number, precision }) => {
  let result;
  if (precision == null) {
    result = number.toString();
  } else {
    result = number.toFixed(precision);
    if (result.includes('.')) {
      result = result.replace(/\.?0+$/, '');
    }
  }
  // remove zero whole from decimal number
  if (result !== '0') {
    result = result.replace(/^0/, '').replace(/^-0/, '-');
  }
  return result;
};

// elliptical arc large-arc and sweep flags are rendered with spaces
// because many non-browser environments are not able to parse such paths
const stringifyArgs = ({ args, precision }) => {
  let result = '';
  let prev;
  for (let i = 0; i < args.length; i += 1) {
    const number = args[i];
    const numberString = stringifyNumber({ number, precision });
    // avoid space before first and negative numbers
    if (i === 0 || numberString.startsWith('-')) {
      result += numberString;
    } else if (prev.includes('.') && numberString.startsWith('.')) {
      result += numberString;
    } else {
      result += ` ${numberString}`;
    }
    prev = numberString;
  }
  return result;
};

const stringifyPathData = ({ pathData, precision }) => {
  // combine sequence of the same commands
  let combined = [];
  for (let i = 0; i < pathData.length; i += 1) {
    const { command, args } = pathData[i];
    if (i === 0) {
      combined.push({ command, args });
    } else {
      const last = combined[combined.length - 1];
      // match leading moveto with following lineto
      if (i === 1) {
        if (command === 'L') {
          last.command = 'M';
        }
        if (command === 'l') {
          last.command = 'm';
        }
      }
      if (
        (last.command === command &&
          last.command !== 'M' &&
          last.command !== 'm') ||
        // combine matching moveto and lineto sequences
        (last.command === 'M' && command === 'L') ||
        (last.command === 'm' && command === 'l')
      ) {
        last.args = [...last.args, ...args];
      } else {
        combined.push({ command, args });
      }
    }
  }
  let result = '';
  for (const { command, args } of combined) {
    result += command + stringifyArgs({ args, precision });
  }
  return result;
};
exports.stringifyPathData = stringifyPathData;

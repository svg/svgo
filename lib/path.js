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
  a: 7
};

const isCommand = c => {
  return c in argsCountPerCommand;
};

const isWsp = c => {
  const codePoint = c.codePointAt(0);
  return (
    codePoint === 0x20 ||
    codePoint === 0x9 ||
    codePoint === 0xD ||
    codePoint === 0xA
  );
};

const isDigit = c => {
  const codePoint = c.codePointAt(0);
  return 48 <= codePoint && codePoint <= 57;
};

const readNumber = (string, cursor) => {
  let i = cursor;
  let number = '';
  // none | sign | whole | decimal_point | decimal | e | exponent_sign | exponent
  let state = 'none';
  for (; i < string.length; i += 1) {
    const c = string[i];
    if (c === '+' || c === '-') {
      if (state === 'none') {
        state = 'sign'
        number += c;
        continue;
      }
      if (state === 'e') {
        state === 'exponent_sign';
        number += c;
        continue;
      }
    }
    if (isDigit(c)) {
      if (state === 'none' || state === 'sign' || state === 'whole') {
        state = 'whole';
        number += c;
        continue;
      }
      if (state === 'decimal_point' || state === 'decimal') {
        state = 'decimal';
        number += c;
        continue;
      }
      if (state === 'e' || state === 'exponent_sign' || state === 'exponent') {
        state = 'exponent';
        number += c;
        continue;
      }
    }
    if (c === '.') {
      if (state === 'none' || state === 'sign' || state === 'whole') {
        state = 'decimal_point';
        number += c;
        continue;
      }
    }
    if (c === 'E' || c == 'e') {
      if (state === 'whole' || state === 'decimal_point' || state === 'decimal') {
        state = 'e';
        number += c;
        continue;
      }
    }
    break;
  }
  if (state === 'none' || state === 'sign' || state === 'e' || state === 'exponent_sign') {
    return [i - 1, null];
  }
  // step back to delegate teration to parent loop
  return [i - 1, Number(number)];
};


// TODO do not erase args in flushing after number reading this prevents handling commas
const parsePathData = (string) => {
  const commands = [];
  let i = 0;
  let command = null;
  let args;
  let argsCount;
  for (; i < string.length; i += 1) {
    const c = string.charAt(i);
    // TODO forbid comma between commands
    if (isWsp(c) || c === ',') {
      continue;
    }
    if (isCommand(c)) {
      if (command == null) {
        // moveto should be leading command
        if (c !== 'M' && c !== 'm') {
          return commands;
        }
      } else {
        // stop if previous command arguments are miscounted
        if (argsCount !== 0 && args.length % argsCount !== 0) {
          return commands;
        }
      }
      command = c;
      args = [];
      argsCount = argsCountPerCommand[command];
      if (argsCount === 0) {
        commands.push({ name: command, args });
      }
      continue;
    }
    // avoid parsing arguments if no command detected
    if (command == null) {
      return commands;
    }
    // read next arg
    let newCursor = i;
    let number = null;
    if (command === 'A' || command === 'a') {
      const mod = args.length % argsCount;
      if (mod === 0 || mod === 1) {
        // allow only positive number without sign as first two arguments
        if (c !== '+' && c !== '-') {
          [newCursor, number] = readNumber(string, i);
        }
      }
      if (mod === 2) {
        [newCursor, number] = readNumber(string, i);
      }
      if (mod === 3 || mod === 4) {
        // read flags
        if (c === '0') {
          number = 0;
        }
        if (c === '1') {
          number = 1;
        }
      }
      if (mod === 5 || mod === 6) {
        [newCursor, number] = readNumber(string, i);
      }
    } else {
      [newCursor, number] = readNumber(string, i);
    }
    if (number == null) {
      return commands;
    } else {
      args.push(number);
    }
    i = newCursor;
    // flush args
    if (args.length >= argsCount && args.length % argsCount === 0) {
      commands.push({ name: command, args });
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
  if (args.length !== argsCount) {
    return commands;
  }
  return commands;
};
exports.parsePathData = parsePathData;

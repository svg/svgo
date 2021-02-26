'use strict';

const { expect } = require('chai');
const { parsePathData } = require('./path.js');

describe('parse path data', () => {
  it('should allow spaces between commands', () => {
    expect(parsePathData('M0 10 L \n\r\t20 30')).to.deep.equal([
      { command: 'M', args: [0, 10] },
      { command: 'L', args: [20, 30] },
    ]);
  });
  it('should allow spaces and commas between arguments', () => {
    expect(parsePathData('M0 , 10 L 20 \n\r\t30,40,50')).to.deep.equal([
      { command: 'M', args: [0, 10] },
      { command: 'L', args: [20, 30] },
      { command: 'L', args: [40, 50] },
    ]);
  });
  it('should forbid commas before commands', () => {
    expect(parsePathData(', M0 10')).to.deep.equal([]);
  });
  it('should forbid commas between commands', () => {
    expect(parsePathData('M0,10 , L 20,30')).to.deep.equal([
      { command: 'M', args: [0, 10] },
    ]);
  });
  it('should forbid commas between command name and argument', () => {
    expect(parsePathData('M0,10 L,20,30')).to.deep.equal([
      { command: 'M', args: [0, 10] },
    ]);
  });
  it('should forbid multipe commas in a row', () => {
    expect(parsePathData('M0 , , 10')).to.deep.equal([]);
  });
  it('should stop when unknown char appears', () => {
    expect(parsePathData('M0 10 , L 20 #40')).to.deep.equal([
      { command: 'M', args: [0, 10] },
    ]);
  });
  it('should stop when not enough arguments', () => {
    expect(parsePathData('M0 10 L 20 L 30 40')).to.deep.equal([
      { command: 'M', args: [0, 10] },
    ]);
  });
  it('should stop if moveto not the first command', () => {
    expect(parsePathData('L 10 20')).to.deep.equal([]);
  });
});

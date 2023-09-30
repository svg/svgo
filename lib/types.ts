import type { Parents, Root, Doctype, Instruction, Comment, Cdata, Text, Element } from 'xast';

export type StringifyOptions = {
  doctypeStart?: string;
  doctypeEnd?: string;
  procInstStart?: string;
  procInstEnd?: string;
  tagOpenStart?: string;
  tagOpenEnd?: string;
  tagCloseStart?: string;
  tagCloseEnd?: string;
  tagShortStart?: string;
  tagShortEnd?: string;
  attrStart?: string;
  attrEnd?: string;
  commentStart?: string;
  commentEnd?: string;
  cdataStart?: string;
  cdataEnd?: string;
  textStart?: string;
  textEnd?: string;
  indent?: number | string;
  regEntities?: RegExp;
  regValEntities?: RegExp;
  encodeEntity?: (char: string) => string;
  pretty?: boolean;
  useShortTags?: boolean;
  eol?: 'lf' | 'crlf';
  finalNewline?: boolean;
};

type VisitorNode<Node> = {
  enter?: (node: Node, parentNode: Parents) => void | symbol;
  exit?: (node: Node, parentNode: Parents) => void;
};

type VisitorRoot = {
  enter?: (node: Root, parentNode: null) => void;
  exit?: (node: Root, parentNode: null) => void;
};

export type Visitor = {
  doctype?: VisitorNode<Doctype>;
  instruction?: VisitorNode<Instruction>;
  comment?: VisitorNode<Comment>;
  cdata?: VisitorNode<Cdata>;
  text?: VisitorNode<Text>;
  element?: VisitorNode<Element>;
  root?: VisitorRoot;
};

export type PluginInfo = {
  path?: string;
  multipassCount: number;
};

export type Plugin<Params> = (
  root: Root,
  params: Params,
  info: PluginInfo
) => null | Visitor;

export type Specificity = [number, number, number, number];

export type StylesheetDeclaration = {
  name: string;
  value: string;
  important: boolean;
};

export type StylesheetRule = {
  dynamic: boolean;
  selector: string;
  specificity: Specificity;
  declarations: Array<StylesheetDeclaration>;
};

export type Stylesheet = {
  rules: Array<StylesheetRule>;
  parents: Map<Element, Parents>;
};

type StaticStyle = {
  type: 'static';
  inherited: boolean;
  value: string;
};

type DynamicStyle = {
  type: 'dynamic';
  inherited: boolean;
};

export type ComputedStyles = Record<string, StaticStyle | DynamicStyle>;

export type PathDataCommand =
  | 'M'
  | 'm'
  | 'Z'
  | 'z'
  | 'L'
  | 'l'
  | 'H'
  | 'h'
  | 'V'
  | 'v'
  | 'C'
  | 'c'
  | 'S'
  | 's'
  | 'Q'
  | 'q'
  | 'T'
  | 't'
  | 'A'
  | 'a';

export type PathDataItem = {
  command: PathDataCommand;
  args: Array<number>;
};

export type DataUri = 'base64' | 'enc' | 'unenc';

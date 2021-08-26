type XastDoctype = {
  type: 'doctype';
  name: string;
  data: {
    doctype: string;
  };
};

type XastInstruction = {
  type: 'instruction';
  name: string;
  value: string;
};

type XastComment = {
  type: 'comment';
  value: string;
};

type XastCdata = {
  type: 'cdata';
  value: string;
};

type XastText = {
  type: 'text';
  value: string;
};

export type XastElement = {
  type: 'element';
  name: string;
  attributes: Record<string, string>;
  children: Array<XastChild>;
};

export type XastChild =
  | XastDoctype
  | XastInstruction
  | XastComment
  | XastCdata
  | XastText
  | XastElement;

export type XastRoot = {
  type: 'root';
  children: Array<XastChild>;
};

export type XastParent = XastRoot | XastElement;

export type XastNode = XastRoot | XastChild;

type VisitorNode<Node> = {
  enter?: (node: Node, parentNode: XastParent) => void | symbol;
  exit?: (node: Node, parentNode: XastParent) => void;
};

type VisitorRoot = {
  enter?: (node: XastRoot, parentNode: null) => void;
  exit?: (node: XastRoot, parentNode: null) => void;
};

export type Visitor = {
  doctype?: VisitorNode<XastDoctype>;
  instruction?: VisitorNode<XastInstruction>;
  comment?: VisitorNode<XastComment>;
  cdata?: VisitorNode<XastCdata>;
  text?: VisitorNode<XastText>;
  element?: VisitorNode<XastElement>;
  root?: VisitorRoot;
};

export type Plugin<Params> = (root: XastRoot, params: Params) => null | Visitor;

export type Specificity = [number, number, number, number];

export type StylesheetDeclaration = {
  name: string;
  value: string;
  important: boolean;
};

export type StylesheetRule = {
  dynamic: boolean;
  selectors: string;
  specificity: Specificity;
  declarations: Array<StylesheetDeclaration>;
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

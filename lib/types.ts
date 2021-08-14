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

type XastElement = {
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

type XastRoot = {
  type: 'root';
  children: Array<XastChild>;
};

export type XastParent = XastRoot | XastElement;

export type XastNode = XastRoot | XastChild;

type VisitorNode<Node> = {
  enter?: (node: Node, parentNode: XastParent) => void;
  leave?: (node: Node, parentNode: XastParent) => void;
};

type VisitorRoot = {
  enter?: (node: XastRoot, parentNode: null) => void;
  leave?: (node: XastRoot, parentNode: null) => void;
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

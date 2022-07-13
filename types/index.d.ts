type AssetTypes =
  | 'ICON_REGULAR'
  | 'ICON_COLOR'
  | 'LOGO'
  | 'ILLUSTRATION'
  | 'AVATAR'
  | 'FLAG'
  | 'DOCUMENT'
  | 'ANIMATION';

type ValidationResult = {
  isSnakeCase?: boolean;
  isArtboardCorrect?: boolean;
  isWorkingAreaCorrect?: boolean;
  isCorrectSvg?: boolean;
  isJSON?: boolean;
  hasNoDiacriticCharacters?: boolean;
  isSuffixPresent?: boolean;
  isText?: boolean;
  areLayersIDsOrderCorrect?: boolean;
  elementsLimitation?: boolean;
  isISO3166_1Alpha2?: boolean;
  hasNoAttribute?: boolean;
  hasCorrectStripeColors?: boolean;
  isPdf?: boolean;
  isSVG?: boolean;
  hasUniqueName?: boolean;
  validationError?: boolean;
};

type XastType =
  | 'element'
  | 'text'
  | 'cdata'
  | 'comment'
  | 'instruction'
  | 'doctype';

type XastElement = {
  type: 'element';
  value?: string;
  name?: string;
  attributes?: Record<string, string>;
  children?: Array<XastChild>;
};

type XastChild = XastElement;

type XastRoot = {
  type: 'root';
  children: Array<XastChild>;
};

type XastParent = XastRoot | XastElement;

type XastNode = XastRoot | XastChild;

/**
 * Validates svg file
 *
 * @param {ArrayBuffer | string} input array buffer or base64 svg.
 * @param {string} filename Name of the asset file.
 * @param {AssetTypes} type Type of the asset.
 * @returns {ValidationResult} The resulting state of validated asset.
 */
export declare function validate(
  input: ArrayBuffer | string,
  filename: string,
  type: AssetTypes
): ValidationResult;
/**
 * Parses svg file to js object
 *
 * @param {data} string An array of numbers to add.
 * @param {from} string An array of numbers to add.
 * @returns {XastRoot} The resulting sum of all the numbers.
 */
export declare function parseSvg(data: string, from?: string): XastRoot;

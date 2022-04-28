var ASSET_TYPE = {
  ICON_REGULAR: {
    plugins: [
      {
        name: 'isCorrectSvg',
      },
      {
        name: 'isArtboardCorrect',
        params: {
          size: [24, 24],
        },
      },
      {
        name: 'isWorkingAreaCorrect',
        params: {
          size: [22, 22],
        },
      },
      {
        name: 'elementsLimitation',
        params: {
          amount: 1,
          fillOrStroke: 'stroke',
        },
      },
      {
        name: 'hasNoAttribute',
        params: {
          attribute: 'fill',
        },
      },
      {
        name: 'isSnakeCase',
      },

      {
        name: 'hasNoDiacriticCharacters',
      },
    ],
  },
  ICON_COLOR: {
    plugins: [
      {
        name: 'isCorrectSvg',
      },
      {
        name: 'isArtboardCorrect',
        params: {
          size: [24, 24],
        },
      },
      {
        name: 'hasCorrectStripeColors',
        params: {
          stripeColors: [
            '#E90A0A',
            '#26221E',
            '#FF8600',
            '#AE0000',
            '#0065B1',
            '#008520',
          ],
        },
      },
      {
        name: 'hasNoAttribute',
        params: {
          attribute: 'stroke',
        },
      },
      {
        name: 'isSnakeCase',
      },
      {
        name: 'hasNoDiacriticCharacters',
      },
    ],
  },
  LOGO: {
    plugins: [
      {
        name: 'isCorrectSvg',
      },
      {
        name: 'isArtboardCorrect',
        params: {
          size: [null, 48],
        },
      },
      {
        name: 'elementsLimitation',
        params: {
          unlimited: true,
          fillOrStroke: 'fill',
        },
      },
      {
        name: 'hasNoAttribute',
        params: {
          attribute: 'stroke',
        },
      },
      {
        name: 'isSnakeCase',
      },
      {
        name: 'isSuffixPresent',
      },
      {
        name: 'hasNoDiacriticCharacters',
      },
    ],
  },
  ILLUSTRATION: {
    plugins: [
      {
        name: 'isCorrectSvg',
      },
      {
        name: 'isArtboardCorrect',
        params: {
          size: [256, 256],
        },
      },
      {
        name: 'areLayersIDsOrderCorrect',
        params: {
          layersNameOrder: [
            'blackFill',
            'blackStroke',
            'whiteFill',
            'stripes',
            'darkmodeMask',
          ],
        },
      },
      {
        name: 'isSnakeCase',
      },
      {
        name: 'hasNoDiacriticCharacters',
      },
      {
        name: 'isSuffixPresent',
      },
    ],
  },
  FLAG: {
    plugins: [
      {
        name: 'isCorrectSvg',
      },
      {
        name: 'isArtboardCorrect',
        params: {
          size: [24, 24],
        },
      },
      {
        name: 'elementsLimitation',
        params: {
          unlimited: true,
          fillOrStroke: 'fill',
        },
      },
      {
        name: 'hasNoAttribute',
        params: {
          attribute: 'stroke',
        },
      },
      {
        name: 'isISO3166_1Alpha2',
      },
      {
        name: 'hasNoDiacriticCharacters',
      },
    ],
  },
  AVATAR: {
    plugins: [
      {
        name: 'isCorrectSvg',
      },
      {
        name: 'isArtboardCorrect',
        params: {
          size: [24, 24],
        },
      },
      {
        name: 'elementsLimitation',
        params: {
          unlimited: true,
          fillOrStroke: 'fill',
        },
      },
      {
        name: 'hasNoAttribute',
        params: {
          attribute: 'stroke',
        },
      },
      {
        name: 'isSnakeCase',
      },
      {
        name: 'hasNoDiacriticCharacters',
      },
    ],
  },
  ANIMATION: {
    plugins: [
      {
        name: 'isJSON',
      },
      {
        name: 'isSnakeCase',
      },
      {
        name: 'hasNoDiacriticCharacters',
      },
    ],
  },
};

exports.VALIDATION_ASSET_TYPE = ASSET_TYPE;

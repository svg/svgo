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
        name: 'isFillRule',
      },
      {
        name: 'hasNoDiacriticCharacters',
      },
      {
        name: 'isText',
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
        name: 'isFillRule',
      },
      {
        name: 'hasNoDiacriticCharacters',
      },
      {
        name: 'isText',
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
      {
        name: 'isText',
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
      {
        name: 'isFillRule',
      },
      {
        name: 'isText',
      },
      {
        name: 'hasIllustrationCorrectColorLayers',
        params: {
          stripeColors: {
            mass: ['#e90a0a', '#ff8600', '#ae0000', '#0065b1', '#008520'],
            sme: ['#008520', '#ff8600', '#0c4369', '#89bf00', '#006618'],
            corporate: ['#184868', '#a4bdc4', '#0095de', '#565a69', '#ff8600'],
            private: ['#36302f', '#ae0000', '#c29d67', '#645237', '#183d4d'],
            young: ['#00ff00', '#0000ff', '#ff0eb2', '#00ff00', '#0000ff'],
            affluent: [
              '#ae0000',
              '#f9b000',
              '#565a69',
              '#cf0c0f',
              '#99037b',
              '#eb6702',
            ],
          },
          blackFillAndStrokeColor: '#26221e',
        },
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
        name: 'isFillRule',
      },
      {
        name: 'hasNoDiacriticCharacters',
      },
      {
        name: 'isText',
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
      {
        name: 'isText',
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

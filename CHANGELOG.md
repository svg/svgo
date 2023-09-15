# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [3.2.1](https://github.com/mbank-design/svgo/compare/v3.2.0...v3.2.1) (2023-09-15)


### Bug Fixes

* check if there is only one element with blackStroke id in isBlackStrokeCorrect rule ([d4d6e05](https://github.com/mbank-design/svgo/commit/d4d6e050f3a0a9b3a50f9e5cb5ce2b1c4b6258e2))

## [3.2.0](https://github.com/mbank-design/svgo/compare/v3.0.3...v3.2.0) (2023-09-08)


### Features

* add fork reasoning to README ([bb3c0c4](https://github.com/mbank-design/svgo/commit/bb3c0c46ad8c665265960dc93759be5fe6e82018))
* add hasNoColorSuffix rule ([a7bed05](https://github.com/mbank-design/svgo/commit/a7bed058804bf60686c2bd16b0e7e129c25fd24f))
* add isBlackStrokeCorrect, isDarkmodeMaskCorrect rules ([ef390ae](https://github.com/mbank-design/svgo/commit/ef390ae9e9966e6ccce9b0d681bcee5e1f183219))

## [3.1.0](https://github.com/mbank-design/svgo/compare/v3.0.3...v3.1.0) (2023-03-28)


### Features

* add hasNoColorSuffix rule ([34236af](https://github.com/mbank-design/svgo/commit/34236afad97d09353343ad4090a3bbfe516c2c31))

### [3.0.3](https://github.com/mbank-design/svgo/compare/v2.23.0...v3.0.3) (2023-03-02)

## [2.23.0](https://github.com/mbank-design/svgo/compare/v2.6.1...v2.23.0) (2023-03-02)


### Features

* add hasIllustrationCorrectColorLayers rule ([#9](https://github.com/mbank-design/svgo/issues/9)) ([2bbbddf](https://github.com/mbank-design/svgo/commit/2bbbddf14c3ec6d9fa06b9b8d8087bf594ecb050))
* Add SVG validation/linting ([68b930c](https://github.com/mbank-design/svgo/commit/68b930c41d36ab383cbc2b640dadcd9dcf674e87))
* add text validation rule ([9f011e1](https://github.com/mbank-design/svgo/commit/9f011e1c132c807f97a7814fb3cc6d3e77d4ce50))
* add types ([a2f3e74](https://github.com/mbank-design/svgo/commit/a2f3e744ecb001ecb3235b40ed2444af7974c16e))
* add validate fill-rule ([138398f](https://github.com/mbank-design/svgo/commit/138398fc68bb822566550b5a54454087019569b8))
* Change 'main' package.json field to browser bundle ([5e513f2](https://github.com/mbank-design/svgo/commit/5e513f265e2edb5917d03cb612edd8220307ba17))
* export parseSvg ([377f0f0](https://github.com/mbank-design/svgo/commit/377f0f03702223a8380ba9c0d0a1b6e01ff0d8c6))
* remove fill rule from illustration ([605a740](https://github.com/mbank-design/svgo/commit/605a74044fc83933f6199fa553b9ce2563653aa1))


### Bug Fixes

* add @rollup/plugin-json to package.json ([a1781fe](https://github.com/mbank-design/svgo/commit/a1781fe9db33703b9312e94d2c176ddb75e04b42))
* add margin of error ([4ee3c8a](https://github.com/mbank-design/svgo/commit/4ee3c8a89a4effc6a5a6bb77b44260dcf842838c))
* allow to check colors despite of theme name location ([215119a](https://github.com/mbank-design/svgo/commit/215119a7e48f563d949349a35351e7511bca324a))
* asset error validation ([7dd517a](https://github.com/mbank-design/svgo/commit/7dd517abbbf1c63faa252668eecb3fcec19c5825))
* begin's attribute incorrectly modification ([#1658](https://github.com/mbank-design/svgo/issues/1658)) ([dd70f34](https://github.com/mbank-design/svgo/commit/dd70f34b6778f68285df25be8738e6be0acdeb47))
* change mass to retail ([ba10199](https://github.com/mbank-design/svgo/commit/ba10199c1b263f06dec4a8f5abdb6e19814562a7))
* merge type declarations ([e8676e7](https://github.com/mbank-design/svgo/commit/e8676e7a039e535f5f8e60a2036334d624f6a448))
* **plugin:** removeAttrs: warn without attrs ([#1582](https://github.com/mbank-design/svgo/issues/1582)) ([8af10de](https://github.com/mbank-design/svgo/commit/8af10de8d440a4bfdeffeadcba6a34bed615b25c))
* rename plugin and add new themes ([a012a6d](https://github.com/mbank-design/svgo/commit/a012a6db3bf0717a535fcf7d566d5275e852487c))
* resolve issues with hasCorrectStripeColors and findFillElementsByColors ([355ccab](https://github.com/mbank-design/svgo/commit/355ccab58951e3a6b17a4bf2bca5ce0996b56c0a))
* resolve issues with snake_case, blackFill and build ([#8](https://github.com/mbank-design/svgo/issues/8)) ([b410e71](https://github.com/mbank-design/svgo/commit/b410e7106f6442c31d583483a7b519db754f3a4d))
* resolve stripe validation issue ([b166f61](https://github.com/mbank-design/svgo/commit/b166f6188356088c5b0cc97178c8bc08886add8b))
* resolve typing error ([6f57f95](https://github.com/mbank-design/svgo/commit/6f57f95c664d9fef95aaa280b0c064eb7c783997))
* secure walkTree function errors and fulfill snake_case rules ([e6bf5b9](https://github.com/mbank-design/svgo/commit/e6bf5b929e580b3e025546bba8da9177d7aac91d))
* stricten prefix rule ([586c3b2](https://github.com/mbank-design/svgo/commit/586c3b2cc999b6c768ed754e1a9472fa6ad0e5c1))
* update and fix regex for snake_case ([65d7ba8](https://github.com/mbank-design/svgo/commit/65d7ba83db4ef6a947d41382c81be114629e77ec))
* update cli file read constant definitions ([2894135](https://github.com/mbank-design/svgo/commit/28941359b391b476a14f629c2890c09debdd895d))

## [2.22.0](https://github.com/mbank-design/svgo/compare/v2.21.0...v2.22.0) (2023-02-21)


### Features

* remove fill rule from illustration ([40323f3](https://github.com/mbank-design/svgo/commit/40323f3a17d658b655d905f7de5c21749e172662))

## [2.21.0](https://github.com/mbank-design/svgo/compare/v2.19.1...v2.21.0) (2022-11-23)


### Features

* add validate fill-rule ([39aae4b](https://github.com/mbank-design/svgo/commit/39aae4b581a70dce48713289aaf01e1cc6861498))
* export parseSvg ([2df9788](https://github.com/mbank-design/svgo/commit/2df97886a6d00aa9bf2c69fa58c2a1d98bf7fe78))

## [2.20.0](https://github.com/mbank-design/svgo/compare/v2.19.1...v2.20.0) (2022-10-26)


### Features

* export parseSvg ([2df9788](https://github.com/mbank-design/svgo/commit/2df97886a6d00aa9bf2c69fa58c2a1d98bf7fe78))

### [2.19.1](https://github.com/mbank-design/svgo/compare/v2.19.0...v2.19.1) (2022-10-26)


### Bug Fixes

* merge type declarations ([c17d6ba](https://github.com/mbank-design/svgo/commit/c17d6bacb16aa45901a80233cf0badf2a3700b8c))

## [2.19.0](https://github.com/mbank-design/svgo/compare/v2.6.1...v2.19.0) (2022-10-26)


### Features

* add hasIllustrationCorrectColorLayers rule ([#9](https://github.com/mbank-design/svgo/issues/9)) ([1b97200](https://github.com/mbank-design/svgo/commit/1b972003ae048a492de023b10ff81f42c0bd7cfc))
* Add SVG validation/linting ([0be658e](https://github.com/mbank-design/svgo/commit/0be658e150a26545a639a1e62bfaf27101c84ca8))
* add text validation rule ([6e58e4b](https://github.com/mbank-design/svgo/commit/6e58e4b1cf8be00c81f8265e3d6ac7410ab71dc9))
* add types ([516b936](https://github.com/mbank-design/svgo/commit/516b936cbfaac83bd2f277a6eb316ec920e4eb78))
* Change 'main' package.json field to browser bundle ([9ec76a1](https://github.com/mbank-design/svgo/commit/9ec76a161e6eba51e69a45b5009a32a538304436))


### Bug Fixes

* add margin of error ([9e6a802](https://github.com/mbank-design/svgo/commit/9e6a802d255e59e97a8997fddf2248c08797e5f5))
* allow to check colors despite of theme name location ([3ed1b77](https://github.com/mbank-design/svgo/commit/3ed1b771d3b978f5d6335d30f906b9dcbcd99c2b))
* asset error validation ([58b6621](https://github.com/mbank-design/svgo/commit/58b662152ee5c21fffc6d7a7e2dc9d83c689778a))
* change mass to retail ([317594f](https://github.com/mbank-design/svgo/commit/317594f0513adab824ee32be24b000cf4f91667b))
* **plugin:** removeAttrs: warn without attrs ([#1582](https://github.com/mbank-design/svgo/issues/1582)) ([8af10de](https://github.com/mbank-design/svgo/commit/8af10de8d440a4bfdeffeadcba6a34bed615b25c))
* rename plugin and add new themes ([dc17b86](https://github.com/mbank-design/svgo/commit/dc17b86a86354624834a1eaaee8585b1af8f832a))
* resolve issues with hasCorrectStripeColors and findFillElementsByColors ([6fece6f](https://github.com/mbank-design/svgo/commit/6fece6f2ed9f3685afee485749c330ce4e28e65a))
* resolve issues with snake_case, blackFill and build ([#8](https://github.com/mbank-design/svgo/issues/8)) ([0c0728b](https://github.com/mbank-design/svgo/commit/0c0728bff80772725b6673dee321df67b8e130f5))
* resolve stripe validation issue ([96ca537](https://github.com/mbank-design/svgo/commit/96ca5375cf35a38f530718b7f0c136ac485e3c10))
* resolve typing error ([7cc7476](https://github.com/mbank-design/svgo/commit/7cc7476e804c7343e3ca6a3328e967c204e8606d))
* secure walkTree function errors and fulfill snake_case rules ([f554404](https://github.com/mbank-design/svgo/commit/f554404805fb07d8e0c832ae353e9d1d0148c208))
* stricten prefix rule ([6cb5df4](https://github.com/mbank-design/svgo/commit/6cb5df49deebb404279902b16705d14304ef6be0))
* update and fix regex for snake_case ([3cb7303](https://github.com/mbank-design/svgo/commit/3cb73031d05f2900e417acc999d75c09974a32dc))
* update cli file read constant definitions ([3aad233](https://github.com/mbank-design/svgo/commit/3aad233c62760b8a4971c5732be6fc61245efa80))

## [2.18.0](https://github.com/mbank-design/svgo/compare/v2.6.1...v2.18.0) (2022-10-26)


### Features

* add hasIllustrationCorrectColorLayers rule ([#9](https://github.com/mbank-design/svgo/issues/9)) ([1b97200](https://github.com/mbank-design/svgo/commit/1b972003ae048a492de023b10ff81f42c0bd7cfc))
* Add SVG validation/linting ([0be658e](https://github.com/mbank-design/svgo/commit/0be658e150a26545a639a1e62bfaf27101c84ca8))
* add text validation rule ([6e58e4b](https://github.com/mbank-design/svgo/commit/6e58e4b1cf8be00c81f8265e3d6ac7410ab71dc9))
* add types ([516b936](https://github.com/mbank-design/svgo/commit/516b936cbfaac83bd2f277a6eb316ec920e4eb78))
* Change 'main' package.json field to browser bundle ([9ec76a1](https://github.com/mbank-design/svgo/commit/9ec76a161e6eba51e69a45b5009a32a538304436))


### Bug Fixes

* add margin of error ([9e6a802](https://github.com/mbank-design/svgo/commit/9e6a802d255e59e97a8997fddf2248c08797e5f5))
* allow to check colors despite of theme name location ([3ed1b77](https://github.com/mbank-design/svgo/commit/3ed1b771d3b978f5d6335d30f906b9dcbcd99c2b))
* asset error validation ([58b6621](https://github.com/mbank-design/svgo/commit/58b662152ee5c21fffc6d7a7e2dc9d83c689778a))
* change mass to retail ([317594f](https://github.com/mbank-design/svgo/commit/317594f0513adab824ee32be24b000cf4f91667b))
* **plugin:** removeAttrs: warn without attrs ([#1582](https://github.com/mbank-design/svgo/issues/1582)) ([8af10de](https://github.com/mbank-design/svgo/commit/8af10de8d440a4bfdeffeadcba6a34bed615b25c))
* rename plugin and add new themes ([dc17b86](https://github.com/mbank-design/svgo/commit/dc17b86a86354624834a1eaaee8585b1af8f832a))
* resolve issues with hasCorrectStripeColors and findFillElementsByColors ([6fece6f](https://github.com/mbank-design/svgo/commit/6fece6f2ed9f3685afee485749c330ce4e28e65a))
* resolve issues with snake_case, blackFill and build ([#8](https://github.com/mbank-design/svgo/issues/8)) ([0c0728b](https://github.com/mbank-design/svgo/commit/0c0728bff80772725b6673dee321df67b8e130f5))
* resolve stripe validation issue ([96ca537](https://github.com/mbank-design/svgo/commit/96ca5375cf35a38f530718b7f0c136ac485e3c10))
* resolve typing error ([7cc7476](https://github.com/mbank-design/svgo/commit/7cc7476e804c7343e3ca6a3328e967c204e8606d))
* secure walkTree function errors and fulfill snake_case rules ([f554404](https://github.com/mbank-design/svgo/commit/f554404805fb07d8e0c832ae353e9d1d0148c208))
* stricten prefix rule ([6cb5df4](https://github.com/mbank-design/svgo/commit/6cb5df49deebb404279902b16705d14304ef6be0))
* update and fix regex for snake_case ([3cb7303](https://github.com/mbank-design/svgo/commit/3cb73031d05f2900e417acc999d75c09974a32dc))
* update cli file read constant definitions ([3aad233](https://github.com/mbank-design/svgo/commit/3aad233c62760b8a4971c5732be6fc61245efa80))

### [2.17.3](https://github.com/mbank-design/svgo/compare/v2.17.2...v2.17.3) (2022-10-12)


### Bug Fixes

* stricten prefix rule ([91389db](https://github.com/mbank-design/svgo/commit/91389db945da477f6170b4371b0efaac559cd95b))

### [2.17.2](https://github.com/mbank-design/svgo/compare/v2.17.0...v2.17.2) (2022-10-12)


### Bug Fixes

* allow to check colors despite of theme name location ([9cf7dab](https://github.com/mbank-design/svgo/commit/9cf7dab2e73aecb9a2fc417a037e0aa9fe7b6815))

### [2.17.1](https://github.com/mbank-design/svgo/compare/v2.17.0...v2.17.1) (2022-10-12)


### Bug Fixes

* allow to check colors despite of theme name location ([9cf7dab](https://github.com/mbank-design/svgo/commit/9cf7dab2e73aecb9a2fc417a037e0aa9fe7b6815))

## [2.17.0](https://github.com/mbank-design/svgo/compare/v2.16.0...v2.17.0) (2022-09-29)


### Features

* add hasIllustrationCorrectColorLayers rule ([#9](https://github.com/mbank-design/svgo/issues/9)) ([d00d67f](https://github.com/mbank-design/svgo/commit/d00d67fbdf6f31078efab42a9f161831a1e575a7))


### Bug Fixes

* resolve issues with snake_case, blackFill and build ([#8](https://github.com/mbank-design/svgo/issues/8)) ([f297a7a](https://github.com/mbank-design/svgo/commit/f297a7ab5079ab58d761bf19a44cf16af924f3f4))

### [2.16.2](https://github.com/mbank-design/svgo/compare/v2.16.1...v2.16.2) (2022-09-21)

### [2.16.1](https://github.com/mbank-design/svgo/compare/v2.16.0...v2.16.1) (2022-09-21)


### Bug Fixes

* resolve issues with snake_case, blackFill and build ([#8](https://github.com/mbank-design/svgo/issues/8)) ([f297a7a](https://github.com/mbank-design/svgo/commit/f297a7ab5079ab58d761bf19a44cf16af924f3f4))

## [2.16.0](https://github.com/mbank-design/svgo/compare/v2.14.0...v2.16.0) (2022-09-11)


### Features

* Change 'main' package.json field to browser bundle ([be5f348](https://github.com/mbank-design/svgo/commit/be5f3485610a216c4b2151730b1cb32ac5c79802))
* Remove dynamic import using require() ([b5fdae0](https://github.com/mbank-design/svgo/commit/b5fdae055ae08b43481cc50910dc6b981a7e9c53))

## [2.15.0](https://github.com/mbank-design/svgo/compare/v2.14.0...v2.15.0) (2022-09-08)


### Features

* Remove dynamic import using require() ([b5fdae0](https://github.com/mbank-design/svgo/commit/b5fdae055ae08b43481cc50910dc6b981a7e9c53))

## [2.14.0](https://github.com/mbank-design/svgo/compare/v2.13.0...v2.14.0) (2022-07-13)


### Features

* add types ([a05f931](https://github.com/mbank-design/svgo/commit/a05f9310b7cc1df99624b712ae55e203564281a7))

## [2.13.0](https://github.com/mbank-design/svgo/compare/v2.6.1...v2.13.0) (2022-07-13)


### Features

* Add SVG validation/linting ([d10532c](https://github.com/mbank-design/svgo/commit/d10532cce378ab78aa0a7442b13a16fff496bd1d))
* add text validation rule ([719058b](https://github.com/mbank-design/svgo/commit/719058bc11df770060ec2f06db0f6d507e81c1e3))


### Bug Fixes

* add margin of error ([02e9a05](https://github.com/mbank-design/svgo/commit/02e9a05a4b4bb41f4d120f93ada818618c69bc68))
* asset error validation ([8b9dc86](https://github.com/mbank-design/svgo/commit/8b9dc862678a468866b4b6548d47ac993facefd7))
* change mass to retail ([c3ee751](https://github.com/mbank-design/svgo/commit/c3ee75191042e66d1cddb92572f487637f64068a))
* **plugin:** removeAttrs: warn without attrs ([#1582](https://github.com/mbank-design/svgo/issues/1582)) ([8af10de](https://github.com/mbank-design/svgo/commit/8af10de8d440a4bfdeffeadcba6a34bed615b25c))
* rename plugin and add new themes ([494e200](https://github.com/mbank-design/svgo/commit/494e20071260d3f66f76d1f9f031a40e2f39857d))
* resolve issues with hasCorrectStripeColors and findFillElementsByColors ([f9f366d](https://github.com/mbank-design/svgo/commit/f9f366d10f45b8b88db9787da24ec89475ad4452))
* resolve typing error ([654aefd](https://github.com/mbank-design/svgo/commit/654aefd564379a6d8a10fe245d04540fd76fca0f))
* secure walkTree function errors and fulfill snake_case rules ([37dff52](https://github.com/mbank-design/svgo/commit/37dff52b99342a2c19de34b1c29159de88e07388))
* update and fix regex for snake_case ([85337a7](https://github.com/mbank-design/svgo/commit/85337a7ca293a0bd9d7bc5bae13c9cb9916f111c))
* update cli file read constant definitions ([c8c4e0d](https://github.com/mbank-design/svgo/commit/c8c4e0d724027f74a697d6ccdec59d0897220911))

### [2.12.2](https://github.com/mbank-design/svgo/compare/v2.12.1...v2.12.2) (2022-04-29)


### Bug Fixes

* resolve typing error ([7deade8](https://github.com/mbank-design/svgo/commit/7deade8ec339b0b58828b05a7edb5afb8cf96495))

### [2.12.1](https://github.com/mbank-design/svgo/compare/v2.12.0...v2.12.1) (2022-04-28)


### Bug Fixes

* change mass to retail ([f68acb4](https://github.com/mbank-design/svgo/commit/f68acb41c1bb2beba6197f485e968a2f00419f1e))
* rename plugin and add new themes ([aaf16bd](https://github.com/mbank-design/svgo/commit/aaf16bd0abb4340cd19da26cf14910aa4f7ed282))

## [2.12.0](https://github.com/mbank-design/svgo/compare/v2.6.1...v2.12.0) (2022-04-20)


### Features

* Add SVG validation/linting ([8b0719a](https://github.com/mbank-design/svgo/commit/8b0719a7c22b1739b3953acef74471252cbc5a46))


### Bug Fixes

* add margin of error ([89ce236](https://github.com/mbank-design/svgo/commit/89ce236b3769fc9bea79421e22f2dfc4548cf03e))
* asset error validation ([6b740d7](https://github.com/mbank-design/svgo/commit/6b740d7268cbecf59bba65c847043550f28b9e6c))
* **plugin:** removeAttrs: warn without attrs ([#1582](https://github.com/mbank-design/svgo/issues/1582)) ([8af10de](https://github.com/mbank-design/svgo/commit/8af10de8d440a4bfdeffeadcba6a34bed615b25c))
* resolve issues with hasCorrectStripeColors and findFillElementsByColors ([cf90f4d](https://github.com/mbank-design/svgo/commit/cf90f4d76e7d4f886005baffd2d1d71d479589e3))
* secure walkTree function errors and fulfill snake_case rules ([faad7fc](https://github.com/mbank-design/svgo/commit/faad7fc6dc1fa3b42dbf7910040bc9f8642a2398))
* update and fix regex for snake_case ([ac8b4b9](https://github.com/mbank-design/svgo/commit/ac8b4b98d22779906d047c5d3000107f85ae430f))
* update cli file read constant definitions ([193d73c](https://github.com/mbank-design/svgo/commit/193d73c5a9ca225b8db1f0985c29acab453bc16c))

### [2.10.2](https://github.com/mbank-design/svgo/compare/v2.10.1...v2.10.2) (2021-12-14)


### Bug Fixes

* asset error validation ([69d26c7](https://github.com/mbank-design/svgo/commit/69d26c7385884aacc73a9841b3c5fd0a824b29c2))

### [2.10.1](https://github.com/mbank-design/svgo/compare/v2.10.0...v2.10.1) (2021-11-26)


### Bug Fixes

* add margin of error ([8a601a8](https://github.com/mbank-design/svgo/commit/8a601a808d5b425e2f482830a15d022b72b0d03a))
* update cli file read constant definitions ([c3f801c](https://github.com/mbank-design/svgo/commit/c3f801cc916d93cc11d8f0e827e77eb6022da702))

## 2.10.0 (2021-11-26)


### Features

* Add SVG validation/linting ([b8d8fa3](https://github.com/mbank-design/svgo/commit/b8d8fa3e93103bb2811b7623e163127e84f53185))
* offer ES module interop default export ([#934](https://github.com/mbank-design/svgo/issues/934)) ([3e2fd44](https://github.com/mbank-design/svgo/commit/3e2fd44a17a464514f32f526ba6cd972ab4816c5))


### Bug Fixes

* **plugin:** removeAttrs: warn without attrs ([#1582](https://github.com/mbank-design/svgo/issues/1582)) ([8af10de](https://github.com/mbank-design/svgo/commit/8af10de8d440a4bfdeffeadcba6a34bed615b25c))
* resolve issues with hasCorrectStripeColors and findFillElementsByColors ([3e39996](https://github.com/mbank-design/svgo/commit/3e39996b5998457c3916e2a368cf1d3f63a5f052))
* secure walkTree function errors and fulfill snake_case rules ([9c3a31f](https://github.com/mbank-design/svgo/commit/9c3a31fc5f79858abd9275b45c0f18c32ab97590))
* update and fix regex for snake_case ([b386772](https://github.com/mbank-design/svgo/commit/b386772d14b9ca1523fc4f65372b1c3db95f517c))

## [2.9.0](https://github.com/mbank-design/svgo/compare/v2.6.1...v2.9.0) (2021-10-07)


### Features

* Add SVG validation/linting ([acb8566](https://github.com/mbank-design/svgo/commit/acb856656f20a11e452dcdc560395aa30112eec8))


### Bug Fixes

* **plugin:** removeAttrs: warn without attrs ([#1582](https://github.com/mbank-design/svgo/issues/1582)) ([8af10de](https://github.com/mbank-design/svgo/commit/8af10de8d440a4bfdeffeadcba6a34bed615b25c))
* resolve issues with hasCorrectStripeColors and findFillElementsByColors ([3bd27d2](https://github.com/mbank-design/svgo/commit/3bd27d2bcd5620a645107c34d5e4a538f8620f22))
* secure walkTree function errors and fulfill snake_case rules ([a29f192](https://github.com/mbank-design/svgo/commit/a29f1921375399b9a988a37bb65fb39858840391))

## [2.8.0](https://github.com/mbank-design/svgo/compare/v2.6.1...v2.8.0) (2021-09-23)


### Features

* Add SVG validation/linting ([3121ed4](https://github.com/mbank-design/svgo/commit/3121ed44b33ef5a2d6d33d074905872e95fc99cb))


### Bug Fixes

* **plugin:** removeAttrs: warn without attrs ([#1582](https://github.com/mbank-design/svgo/issues/1582)) ([8af10de](https://github.com/mbank-design/svgo/commit/8af10de8d440a4bfdeffeadcba6a34bed615b25c))
* resolve issues with hasCorrectStripeColors and findFillElementsByColors ([0857e31](https://github.com/mbank-design/svgo/commit/0857e31229e08a66e72c6f5adffae16e6ab24758))
* secure walkTree function errors and fulfill snake_case rules ([d2e08d2](https://github.com/mbank-design/svgo/commit/d2e08d2b4f6bfc5d31d89c2fc34940c1671030ff))

## [2.7.0](https://github.com/mbank-design/svgo/compare/v2.5.0...v2.7.0) (2021-09-07)


### Features

* Add SVG validation/linting ([7bbac1d](https://github.com/mbank-design/svgo/commit/7bbac1d6244876b0f33fda81d71912da74d3f4a6))


### Bug Fixes

* resolve issues with hasCorrectStripeColors and findFillElementsByColors ([30f07e7](https://github.com/mbank-design/svgo/commit/30f07e7f69e376af72a98851119c641c77f1d4da))
* secure walkTree function errors and fulfill snake_case rules ([e00c89c](https://github.com/mbank-design/svgo/commit/e00c89c0c7b9c939c98a87636d011b99d3547bfa))

## [2.6.0](https://github.com/mbank-design/svgo/compare/v2.5.0...v2.6.0) (2021-08-28)


### Features

* Add SVG validation/linting ([f8a9711](https://github.com/mbank-design/svgo/commit/f8a97112ed247ec79d21bd2cac6ed598414e799d))


### Bug Fixes

* secure walkTree function errors and fulfill snake_case rules ([7a64f7d](https://github.com/mbank-design/svgo/commit/7a64f7d47a723a5f4a86b89483f2a75da40c9ed9))

### [2.4.2](https://github.com/mbank-design/svgo/compare/v2.4.1...v2.4.2) (2021-08-23)


### Bug Fixes

* secure walkTree function errors and fulfill snake_case rules ([983ee08](https://github.com/mbank-design/svgo/commit/983ee08334ba8d60e27a482f8d5454ec6e06886f))

### [2.4.1](https://github.com/mbank-design/svgo/compare/v2.4.0...v2.4.1) (2021-08-03)

## [2.4.0](https://github.com/mbank-design/svgo/compare/v2.3.3...v2.4.0) (2021-07-29)


### Features

* Add SVG validation/linting ([8e87361](https://github.com/mbank-design/svgo/commit/8e87361e2e4beffadb9ccdb27e2932d191fa3474))

### [2.3.3](https://github.com/mbank-design/svgo/compare/v2.3.2...v2.3.3) (2021-07-18)

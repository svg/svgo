[english](https://github.com/svg/svgo/blob/master/README.md) | **русский**
- - -

<img src="https://svg.github.io/svgo-logo.svg" width="200" height="200" alt="logo"/>

## SVGO [![NPM version](https://badge.fury.io/js/svgo.svg)](https://npmjs.org/package/svgo) [![Dependency Status](https://gemnasium.com/svg/svgo.svg)](https://gemnasium.com/svg/svgo) [![Build Status](https://secure.travis-ci.org/svg/svgo.svg)](https://travis-ci.org/svg/svgo) [![Coverage Status](https://img.shields.io/coveralls/svg/svgo.svg)](https://coveralls.io/r/svg/svgo?branch=master)

**SVG** **O**ptimizer – это инструмент для оптимизации векторной графики в формате SVG, написанный на Node.js.
![](https://mc.yandex.ru/watch/18431326)

## Зачем?

SVG-файлы, особенно – экспортированные из различных редакторов, содержат много избыточной и бесполезной информации, комментариев, скрытых элементов, неоптимальные или стандартные значения и другой мусор, удаление которого безопасно и не влияет на конечный результат отрисовки.

## Возможности

SVGO имеет расширяемую архитектуру, в которой почти каждая оптимизация является отдельным расширением.

Сегодня у нас есть:

| Plugin | Description |
| ------ | ----------- | 
| [addAttributesToSVGElement](https://github.com/svg/svgo/blob/master/plugins/addAttributesToSVGElement.js) | добавляет атрибуты корневому элементу `<svg>` (выключено  |по умолчанию)
| [addClassesToSVGElement](https://github.com/svg/svgo/blob/master/plugins/addClassesToSVGElement.js) | добавляет имена классов корневому элементу `<svg>` (выключено по умолчанию) |
| [cleanupAttrs](https://github.com/svg/svgo/blob/master/plugins/cleanupAttrs.js) | удаление переносов строк и лишних пробелов |
| [cleanupEnableBackground](https://github.com/svg/svgo/blob/master/plugins/cleanupEnableBackground.js) | удаление или оптимизация атрибута `enable-background`, когда это возможно |
| [cleanupIDs](https://github.com/svg/svgo/blob/master/plugins/cleanupIDs.js) | удаление неиспользуемых и сокращение используемых ID |
| [cleanupListOfValues](https://github.com/svg/svgo/blob/master/plugins/cleanupListOfValues.js) | округление числовых значений в атрибутах со списком чисел, таких как `viewBox`  |или `enableBackground`
| [cleanupNumericValues](https://github.com/svg/svgo/blob/master/plugins/cleanupNumericValues.js) | округление дробных чисел до заданной точности, удаление `px` как единицы  |измерения по-умолчанию
| [collapseGroups](https://github.com/svg/svgo/blob/master/plugins/collapseGroups.js) | схлопывание бесполезных групп `<g>` |
| [convertColors](https://github.com/svg/svgo/blob/master/plugins/convertColors.js) | конвертирование цветовых значений: из `rgb()` в `#rrggbb`, из `#rrggbb` в `#rgb` |
| [convertPathData](https://github.com/svg/svgo/blob/master/plugins/convertPathData.js) | конвертирование данных Path в относительные или абсолютные координаты, смотря что  |короче; конвертирование одних типов сегментов в другие; удаление ненужных разделителей; умное округление и тому подобное
| [convertShapeToPath](https://github.com/svg/svgo/blob/master/plugins/convertShapeToPath.js) | конвертирование простых форм в Path |
| [convertStyleToAttrs](https://github.com/svg/svgo/blob/master/plugins/convertStyleToAttrs.js) | конвертирование стилей в атрибуте `style` в отдельные svg-атрибуты |
| [convertTransform](https://github.com/svg/svgo/blob/master/plugins/convertTransform.js) | схлопывание нескольких трансформаций в одну, конвертирование матриц в короткие алиасы  |и многое другое
| [mergePaths](https://github.com/svg/svgo/blob/master/plugins/mergePaths.js) | склеивание нескольких Path в одну кривую |
| [minifyStyles](https://github.com/svg/svgo/blob/master/plugins/minifyStyles.js) | уменьшает содержимое элементов `<style>` с помощью [CSSO](https://github.com/css/csso). |
| [moveElemsAttrsToGroup](https://github.com/svg/svgo/blob/master/plugins/moveElemsAttrsToGroup.js) | перемещение совпадающих атрибутов у всех элементов внутри группы `<g>` |
| [moveGroupAttrsToElems](https://github.com/svg/svgo/blob/master/plugins/moveGroupAttrsToElems.js) | перемещение некоторых атрибутов группы на элементы внутри |
| [removeAttrs](https://github.com/svg/svgo/blob/master/plugins/removeAttrs.js) | удаляет атрибуты по указанному паттерну (выключено по умолчанию) |
| [removeComments](https://github.com/svg/svgo/blob/master/plugins/removeComments.js) | удаление комментариев |
| [removeDesc](https://github.com/svg/svgo/blob/master/plugins/removeDesc.js) | удаление `<desc>` (по умолчанию только незначимых) |
| [removeDimensions](https://github.com/svg/svgo/blob/master/plugins/removeDimensions.js) | удаляет атрибуты width/height при наличии viewBox (выключено по умолчанию) |
| [removeDoctype](https://github.com/svg/svgo/blob/master/plugins/removeDoctype.js) | удаление doctype |
| [removeEditorsNSData](https://github.com/svg/svgo/blob/master/plugins/removeEditorsNSData.js) | удаление пространств имён различных редакторов, их элементов и атрибутов |
| [removeElementsByAttr](https://github.com/svg/svgo/blob/master/plugins/removeElementsByAttr.js) | удаляет элементы по указанным ID или классам (выключено по умолчанию) |
| [removeEmptyAttrs](https://github.com/svg/svgo/blob/master/plugins/removeEmptyAttrs.js) | удаление пустых атрибутов |
| [removeEmptyContainers](https://github.com/svg/svgo/blob/master/plugins/removeEmptyContainers.js) | удаление пустых элементов-контейнеров |
| [removeEmptyText](https://github.com/svg/svgo/blob/master/plugins/removeEmptyText.js) | удаление пустых текстовых элементов |
| [removeHiddenElems](https://github.com/svg/svgo/blob/master/plugins/removeHiddenElems.js) | удаление скрытых элементов |
| [removeMetadata](https://github.com/svg/svgo/blob/master/plugins/removeMetadata.js) | удаление `<metadata>` |
| [removeNonInheritableGroupAttrs](https://github.com/svg/svgo/blob/master/plugins/removeNonInheritableGroupAttrs.js) | удаление ненаследуемых "презентационных" атрибутов групп |
| [removeRasterImage](https://github.com/svg/svgo/blob/master/plugins/removeRasterImages.js) | удаление растровых изображений (выключено по умолчанию) |
| [removeScriptElement](https://github.com/svg/svgo/blob/master/plugins/removeScriptElement.js) | удаляет элементы `<script>` (выключено по умолчанию) |
| [removeStyleElement](https://github.com/svg/svgo/blob/master/plugins/removeStyleElement.js) | удаляет элементы `<style>` (выключено по умолчанию) |
| [removeTitle](https://github.com/svg/svgo/blob/master/plugins/removeTitle.js) | удаление `<title>` (выключено по умолчанию) |
| [removeUnknownsAndDefaults](https://github.com/svg/svgo/blob/master/plugins/removeUnknownsAndDefaults.js) | удаление неизвестных элементов, контента и атрибутов |
| [removeUnusedNS](https://github.com/svg/svgo/blob/master/plugins/removeUnusedNS.js) | удаление  деклараций неиспользуемых пространств имён |
| [removeUselessDefs](https://github.com/svg/svgo/blob/master/plugins/removeUselessDefs.js) | удаление элементов в `<defs>` без `id` |
| [removeUselessStrokeAndFill](https://github.com/svg/svgo/blob/master/plugins/removeUselessStrokeAndFill.js) | удаление неиспользуемых атрибутов stroke-* и fill-* |
| [removeViewBox](https://github.com/svg/svgo/blob/master/plugins/removeViewBox.js) | удаление атрибута `viewBox`, когда это возможно |
| [removeXMLNS](https://github.com/svg/svgo/blob/master/plugins/removeXMLNS.js) | удаление атрибута xmlns (для заинлайненных svg, выключено по умолчанию) |
| [removeXMLProcInst](https://github.com/svg/svgo/blob/master/plugins/removeXMLProcInst.js) | удаление XML-инструкций |
| [sortAttrs](https://github.com/svg/svgo/blob/master/plugins/sortAttrs.js) | сортировка атрибутов элементов для удобочитаемости (выключено по умолчанию) |
| [transformsWithOnePath](https://github.com/svg/svgo/blob/master/plugins/transformsWithOnePath.js) | применение трансформаций, обрезка по реальной ширине, вертикальное  |выравнивание по центру и изменение размеров SVG с одним Path внутри

Хотите узнать, как это работает и как написать свой плагин? [Конечно же, да!](https://github.com/svg/svgo/blob/master/docs/how-it-works/ru.md).


## Как использовать

```sh
$ [sudo] npm install -g svgo
```

```
Выполнение:
  svgo [OPTIONS] [ARGS]

Параметры:
  -h, --help : Помощь
  -v, --version : Версия программы
  -i INPUT, --input=INPUT : Входной файл, "-" для STDIN
  -s STRING, --string=STRING : Входная строка SVG
  -f FOLDER, --folder=FOLDER : Входная папка, оптимизирует и перезаписывает все файлы *.svg
  -o OUTPUT, --output=OUTPUT : Выходной файл или папка (совпадает с входным по умолчанию), "-" для STDOUT
  -p PRECISION, --precision=PRECISION : Число цифр после запятой, переопределяет параметры плагинов
  --config=CONFIG : Файл конфигурации (или строка JSON) для расширения и замены настроек
  --disable=DISABLE : Выключение плагина по имени
  --enable=ENABLE : Включение плагина по имени
  --datauri=DATAURI : Результат в виде строки Data URI (base64, URI encoded или unencoded)
  --multipass : Оптимизация в несколько проходов
  --pretty : Удобочитаемое форматирование SVG
  --indent=INDENT : Размер отступа для удобочитаемого форматирования
  -q, --quiet : Подавляет вывод информации, выводятся только сообщения об ошибках
  --show-plugins : Доступные плагины

Аргументы:
  INPUT : Аналогично --input
  OUTPUT : Аналогично --output
```

* с файлами:

        $ svgo test.svg

    или:

        $ svgo test.svg test.min.svg

* со STDIN / STDOUT:

        $ cat test.svg | svgo -i - -o - > test.min.svg

* с папками

        $ svgo -f ../path/to/folder/with/svg/files

    или:

        $ svgo -f ../path/to/folder/with/svg/files -o ../path/to/folder/with/svg/output

* со строками:

        $ svgo -s '<svg version="1.1">test</svg>' -o test.min.svg

    или даже с Data URI base64:

        $ svgo -s 'data:image/svg+xml;base64,…' -o test.min.svg

* с SVGZ:

    из `.svgz` в `.svg`:

        $ gunzip -c test.svgz | svgo -i - -o test.min.svg

    из `.svg` в `.svgz`:

        $ svgo test.svg -o - | gzip -cfq9 > test.svgz

* в виде веб-приложения - [SVGOMG](https://jakearchibald.github.io/svgomg/)
* как модуль Node.js – [examples](https://github.com/svg/svgo/tree/master/examples)
* как таск для Grunt – [grunt-svgmin](https://github.com/sindresorhus/grunt-svgmin)
* как таск для Gulp – [gulp-svgmin](https://github.com/ben-eb/gulp-svgmin)
* как таск для Mimosa – [mimosa-minify-svg](https://github.com/dbashford/mimosa-minify-svg)
* как действие папки в OSX – [svgo-osx-folder-action](https://github.com/svg/svgo-osx-folder-action)
* через загрузчик в webpack – [image-webpack-loader](https://github.com/tcoopman/image-webpack-loader)
* с помощью бота в Telegram – [svgo_bot](https://github.com/maksugr/svgo_bot)
* как плагин PostCSS - [postcss-svgo](https://github.com/ben-eb/postcss-svgo)

## Лицензия и копирайты

Данное программное обеспечение выпускается под [лицензией MIT](https://github.com/svg/svgo/blob/master/LICENSE).

Логотип – [Егор Большаков](http://xizzzy.ru/).

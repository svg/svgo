## TOC
* [Введение](#intro)
* [Как это работает](#how-it-work)
  * [конфиг](#config)
  * [svg2js](#svg2js)
  * [плагины](#plugins)
      * [типы](#types)
      * [API](#api)
      * [тесты](#tests)
  * [js2svg](#js2svg)
* [Что дальше](#next)

## <a name="intro">Введение</a>
Итак, как уже было [сказано ранеее](https://github.com/svg/svgo#what-it-can-do), SVGO SVGO имеет плагинную архитектуру, в которой практически каждая оптимизация является отдельным плагином.

Плагины могут удалять и изменять SVG элементы, схлопывать контент, перемещать атрибуты и выполнять любые другие действия, которые вы захотите.

## <a name="how-it-work">Как это работает</a>
### 1. <a name="config">конфиг</a>
SVGO читает, парсит и/или расширяет [конфиг по умолчанию](https://github.com/svg/svgo/blob/master/.svgo.yml), который содержит все настройки, включая плагины. Что-то вроде этого:

```
plugins:

  - myTestPlugin
  - myTestPlugin2
  - myTestPlugin3
      param1: 1
      param2: 2

    …
```

Важно отметить, что каждый плагин:

  * находится в определённой позиции в массиве плагинов
  * может быть включён через `name: true` и выключен через `name: false`
  * может иметь свои собственные параметры `params`, которые будут доступны позже в коде плагина

- - -

### 2. <a name="svg2js">svg2js</a>
SVGO конвертирует SVG-как-XML данные в SVG-как-JS AST-представление. Что-то вроде этого:

```xml
<?xml version="1.0" standalone="no"?>
<!-- Generator: Adobe Illustrator 16.0.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg version="1.1" xmlns="http://www.w3.org/2000/svg">
    <text>test</text>
    <script><![CDATA[ alert('hello'); ]]></script>
</svg>
```

```js
{
    content: [
        {
            processinginstruction: { name: 'xml', body: 'version="1.0" standalone="no"' }
        },{
            doctype: ' svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"'
        },{
            comment: 'Generator: Adobe Illustrator 16.0.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)'
        },{
            elem: 'svg',
            prefix: '',
            local: 'svg',
            attrs: {
                version: {
                    name: 'version',
                    value: '1.1',
                    prefix: '',
                    local: 'version'
                },
                xmlns: {
                    name: 'xmlns',
                    value: 'http://www.w3.org/2000/svg',
                    prefix: 'xmlns',
                    local: ''
                }
            },
            content: [
                {
                    elem: 'text',
                    prefix: '',
                    local: 'text',
                    content: [ { text: 'test' } ]
                },{
                    elem: 'script',
                    prefix: '',
                    local: 'script',
                    content: [ { cdata: ' alert(\'hello\'); ' } ]
                }
            ]

        }
    ]
}
```

Важно отметить, что:

  * для представления различных узлов SVG в объектах есть специальные поля: `elem`, `processinginstruction`, `doctype`, `comment`, `cdata` и `text`
  * `content` – это всегда массив
  * в поле `attrs` имя атрибута всегда полное, вместе с пространством имён, если оно есть, а все детали разбиты на части в специальных полях `prefix` и `local`

- - -

### 3. <a name="plugins">плагины</a>
SVGO применяет все плагины из конфига на данные из AST. Можно посмотреть на множество примеров в [директории плагинов](https://github.com/svg/svgo/tree/master/plugins) выше.


#### 3.1 <a name="types">типы</a>
В самом простом случае процесс применения плагинов можно представить как «каждый плагин пробегается по дереву AST и выполняет какие-то действия». Но 90% обычных оптимизаций требуют каких-либо действий только на одном (текущем) элементе из дерева данных, и нет смысла копипастить рекурсивный цикл по всем элементам в каждом плагине. Это объясняет, почему у нас есть три типа плагинов:

* `perItem` - плагин работает только с текущим элементом внутри рекурсивного цикла «снаружи внутрь» (по умолчанию)
* `perItemReverse` -  плагин работает только с текущим элементом внутри рекурсивного цикла «изнутри наружу» (полезно, например, в случае необходимости схлопывать вложенные элементы один за другим)
* `full` - плагин работает с полным деревом AST и должен вернуть его же

`perItem` и `perItemReverse` плагины выполняются внутри цикла `Array.prototype.filter`, поэтому можно удалить текущий элемент просто вернув `false`.

Но это ещё не всё ;) Мы избавились от копипаста рекурсивного цикла, но каждый плагин по-прежнему пробегается по всему дереву AST, что не слишком оптимально. На самом деле, на первом шаге, где мы получаем итоговый конфиг, происходит группировка идущих подряд плагинов одного типа и один цикл обрабатывает целую такую группу:

```
plugins

  - [perItem group],
  - [perItemReverse group],
  - …
  - [perItem group],
  - …
  - [full group]
  - …

  …
```

#### 3.2 <a name="api">API</a>

И конечно же, написание плагинов не было бы таким клёвым без удобного API:

##### isElem([param])
  * Determine if item is an element (any, with a specific name or in a names array).
  * @param {String|Array} [param] element name or names arrays
  * @return {Boolean}

##### isEmpty()
  * Determine if element is empty.
  * @return {Boolean}

##### hasAttr([attr], [val])
  * Determine if element has an attribute (any, or by name or by name + value).
  * @param {String} [name] attribute name
  * @param {String} [val] attribute value (will be toString()'ed)
  * @return {Boolean}

##### attr(name, [val])
  * Get a specific attribute from an element (by name or name + value).
  * @param {String} name attribute name
  * @param {String} [val] attribute value (will be toString()'ed)
  * @return {Object|Undefined}

##### removeAttr(name, [val])
  * Remove a specific attribute (by name or name + val).
  * @param {String} name attribute name
  * @param {String} [val] attribute value
  * @return {Boolean}

##### addAttr(attr)
  * Add an attribute.
  * @param {Object} attr attribute object
  * @return {Object} created attribute

##### eachAttr(callback, [context])
  * Iterates over all attributes.
  * @param {Function} callback
  * @param {Object} [context] callback context
  * @return {Boolean} false if there are no any attributes

#### 3.3 <a name="tests">тесты</a>

Нет ничего проще, чем протестировать ваш плагин:

1. создайте `myPlugin.01.orig.svg` и `myPlugin.01.should.svg` в `test/plugins`
2. запустите `npm test`
3. PROFIT!

Можно увидеть множество примеров в [test/plugins directory](https://github.com/svg/svgo/tree/master/test/plugins).

- - -

### 4. <a name="js2svg">js2svg</a>
SVGO конвертирует обратно AST в SVG-как-XML строку.

## <a name="next">Что дальше</a>
1. Напишите свой собственный плагин :) или
2. Или подскажите идею новой оптимизации или метода API

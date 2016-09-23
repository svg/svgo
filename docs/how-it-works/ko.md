## TOC
* [들어가면서](#intro)
* [동작방법](#how-it-works)
  * [config](#1-config)
  * [svg2js](#2-svg2js)
  * [plugins](#3-plugins)
      * [types](#31-types)
      * [API](#32-api)
      * [tests](#33-tests)
  * [js2svg](#4-js2svg)
* [다음 할 일](#whats-next)


## 들어가면서
앞서 [언급했듯이](https://github.com/svg/svgo#what-it-can-do) SVGO는 플러그인 베이스의 구조를 가지고 있다. 그리고 거의 모든 최적화가 별도의 플러그인으로 되어있다.

플러그인은 SVG 구성요소를 지우거나 수정할 수 있고, 콘텐츠를 없애거나, 특성을 없애고, 당신이 원하는 다른 동작도 한다.

## 동작방법
### 1. config
SVGO는 [default config](https://github.com/svg/svgo/blob/master/.svgo.yml)를 읽거나 파싱하거나 확장할 수 있다. 여기서 defualt config란 플러그인을 포함한 모든 SVGO 설정을 담고 있다. 다음과 같이:

```yaml
plugins:
  - myTestPlugin
  - myTestPlugin2: false
  - myTestPlugin3:
      param1: 1
      param2: 2
    …
```

모든 플러그인의 주요점 :

  * 플러그인 리스트에서 특정한 위치를 가진다.
  * `name: true`에 의해 활성화되고, `name: false`에 의해 비활성화 된다.
  * 플러그인 안쪽에서 적용(이용)이 가능해지는 각자의 `params`를 가진다.

이러한 세팅들은 제공된 config 파일을 `--config` 명령 옵션을 통해 변경될 수 있다. 당신은 config에서 `full: true` 라는 파라미터를 이용하여 설정값을 바꿀 수 있고, 다음과 같은 결과를 얻을 수 있다:

```yaml
full: true
plugins:
  - myTestPlugin
  - myTestPlugin3:
      param1: 1
      param2: 2
    …
```

리스트에 들어간 플러그인의 경우에만 작동할 것이다.

- - -

### 2. svg2js
SVGO는 SVG-as-XML data를 SVG-as-JS AST representation으로 변환한다. 다음과 같이:

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

중요한 부분:

  * 다양한 SVG node들을 나타내는 특별한 오브젝트 키들이 있다. : `elem`, `processinginstruction`, `doctype`, `comment`, `cdata` 그리고 `text`,
  * `content` 는 항상 배열이다,
  * `attrs` 오브젝트 키는 full attribute name(namespace가 있다면 그것도 포함)을 나타낸다. 모든 디테일(상세부분)은 `prefix` 와 `local` 내부에 있다.

- - -

### 3. plugins
SVGO 는 config에서부터 AST data까지 모든 플러그인을 지원한다. 많은 예제들이 [plugins directory](https://github.com/svg/svgo/tree/master/plugins)에 있다. 


#### 3.1 types
프로세스를 지원하는 가장 간단한 경우의 플러그인은 "각 플러그인은 모든 AST data 에 걸쳐 어떤 동작을 수행한다."로 이야기할 수 있다. 그러나 90%의 전형적인 최적화는
데이터로부터 나온 현재의 아이템 하나에 대해서만 어떤 동작을 요구한다. 그래서 모든 플러그인이 각 아이템에 대한 재귀 순환을 매번 복사 붙여넣기가 되는 무감각한 결과를 초래한다.
그것이 우리가 plugin을 3개의 타입으로 나누는 이유이다:

* `perItem` - 플러그인은 현재의 아이템 하나에 대해서만 작동한다. 바깥에서부터 깊은 곳으로 들어가는 재귀 순환 형식(default),
* `perItemReverse` - 플러그인은 현재의 아이템 하나에 대해서만 작동한다. 깊은 곳에서 바깥으로 나가는 재귀 순환 형식(하나의 요소를 없애고자 할 때 유용함)
* `full` - 플러그인은 전체의 AST에 대해 동작하며, return 값도 같다.

`perItem` 과 `perItemReverse` 플러그인은 `Array.prototype.filter`의 재귀 순환 형식안에서 작동한다, 때문에 플러그인이 현재의 아이템을 지우길 원한다면 `return false`가 나온다.

그러나 그것이 전부는 아니다 ;). 우리는 복사 붙여넣기의 순환을 제거했다. 그러나 모든 플러그인은 여전히 모든 아주 최적화 되지 않은 SVG-as-JS data 위에 동작한다. 실제로 우리가 config를 설정하는 첫번째 단계에는 같은 타입의 플러그인의 연이은 충돌이 있고, 그래서 근본적으로 하나의 플러그인 그룹안에는 하나의 루프만을 적용시켰다.

```yaml
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

#### 3.2 API

그리고 물론, writing 플러그인은 어떤 유용한 API 없이는 제대로 작동한 적이 없다.

##### isElem([param])
  * 아이템이 하나의 엘리멘트인지 확인한다.(특정 name 이거나 names array 안에 있는 어떤 것이든)
  * @param {String|Array} [param] element name or names arrays
  * @return {Boolean}

##### isEmpty()
  * Empty인지 확인한다.
  * @return {Boolean}

##### renameElem(name)
  * Element의 이름을 변경한다.
  * @param {String} name new element name
  * @return {Object} element

##### clone()
  * 이 노드의 deep 복제를 수행한다.
  * @return {Object} element

##### hasAttr([attr], [val])
  * 엘리멘트가 attr를 가지고 있는지 확인한다.(by name 나 by name + value 에 의한 어떤 것이든)
  * @param {String} [name] attribute name
  * @param {String} [val] attribute value (will be toString()'ed)
  * @return {Boolean}

##### attr(name, [val])
  * 하나의 엘리멘트로부터 특정 attribute를 얻는다. (by name 또는 name + value).
  * @param {String} name attribute name
  * @param {String} [val] attribute value (will be toString()'ed)
  * @return {Object|Undefined}

##### removeAttr(name, [val])
  * 특정 attribute를 지운다. (by name 또는 name + val).
  * @param {String} name attribute name
  * @param {String} [val] attribute value
  * @return {Boolean}

##### addAttr(attr)
  * Attribute를 추가한다.
  * @param {Object} attr attribute object
  * @return {Object} created attribute

##### eachAttr(callback, [context])
  * 모든 Attribute를 Iterate한다.
  * @param {Function} callback
  * @param {Object} [context] callback context
  * @return {Boolean} false if there are no any attributes

#### 3.3 tests

당신의 플러그인을 테스팅 하는 것보다 쉬운 일은 없다.

1. `test/plugins` 안에 `myPlugin.01.orig.svg` 와 `myPlugin.01.should.svg` 를 넣는다
2. `npm test` 를 실행한다
3. PROFIT!

[test/plugins directory](https://github.com/svg/svgo/tree/master/test/plugins) 에서 보다 많은 예제를 볼 수 있다.

- - -

### 4. js2svg
SVGO는 AST를 SVG-as-XML 데이터 스트링으로 다시 변환한다.

## 다음 할 일
1. 당신만의 플러그인을 작성하시오 :) 또는
2. 저에게 새로운 optimization이나 API method에 대한 아이디어를 주세요

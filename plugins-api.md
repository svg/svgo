# Definitive guide about building SVGO plugins

SVGO originally is optimizer. Though not all possible optimisation are implemented
and sometimes custom transformation are required to solve problems.

SVGO v2 refreshed its plugins api with [XAST](https://github.com/syntax-tree/xast) specification and more useful visitor pattern.

Basic plugin looks like this

```js
export const myPlugin = {
  name: 'pluginName',
  fn: () => {
    // do nothing
  }
}
```

it currently does nothing but can be used in your svgo.config.js

```js
import { myPlugin } from './myPlugin.js';

export default {
  plugins: [
    myPlugin
  ]
}
```

Visitor pattern allows to access all nodes in direct order from the root to the deepest one and reversed with `enter` and `exit` callbacks.

```js
const myPlugin = {
  name: 'pluginName',
  fn: () => {
    return {
      root: {
        enter: node => { },
        exit: node => { }
      },
      element: {
        enter: node => { },
        exit: node => { }
      },
      doctype: {
        enter: node => { },
        exit: node => { }
      },
      instruction: {
        enter: node => { },
        exit: node => { }
      },
      comment: {
        enter: node => { },
        exit: node => { }
      },
      cdata: {
        enter: node => { },
        exit: node => { }
      },
      text: {
        enter: node => { },
        exit: node => { }
      }
    }
  }
}
```

All nodes except root also have an access to parentNode

```js
const myPlugin = {
  name: 'pluginName',
  fn: () => {
    return {
      element: {
        enter: (node, parentNode) => {
          parentNode.children.includes(node) // true
        },
        exit: (node, parentNode) => {
          parentNode.children.includes(node) // true
        }
      }
    }
  }
}
```

## Recipes

To remove node from parent create new array with children

```js
const myPlugin = {
  name: 'pluginName',
  fn: () => {
    return {
      element: {
        enter: (node, parentNode) => {
          parentNode.children = parentNode.children.filter((child) => child !== node);
        }
      }
    }
  }
}
```

Find all circles with specific attribute

```js
const myPlugin = {
  name: 'pluginName',
  fn: () => {
    return {
      element: {
        enter: (node, parentNode) => {
          if (node.name === 'circle' && node.attributes.fill != null) {
            node.attributes.fill = 'modify in any way'
          }
        }
      }
    }
  }
}
```

Collect all elements and analyze later

```js
const myPlugin = {
  name: 'pluginName',
  fn: () => {
    const elements = []
    return {
      element: {
        enter: (node, parentNode) => {
          elements.push(node);
        }
      },
      root: {
        // root exit is called last
        exit: () => {
          for (const element of elements) {
            // analyze and modify
          }
        }
      }
    }
  }
}
```

## Nodes interfaces

This is the root of svg document containg all other nodes

```
XastRoot {
  type: 'root',
  children: Array<
    | XastDoctype
    | XastInstruction
    | XastComment
    | XastCdata
    | XastText
    | XastElement
  >
}
```

Doctype is extracted from this markup

```
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
```

Where name is `svg` and data.doctype is `svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"`.

```
XastDoctype {
  type: 'doctype',
  name: string,
  data: {
    doctype: string
  }
}
```

Instruction is usually parse from this markup

```
<?xml version="1.0" encoding="utf-8"?>
```

Where name is `xml` and value is `version="1.0" encoding="utf-8"`

```
XastInstruction {
  type: 'instruction',
  name: string,
  value: string
}
```

Any xml comments like `<!-- value -->` are parsed as the following node

```
XastComment {
  type: 'comment',
  value: string,
}
```

Text nodes

```
XastCdata {
  type: 'cdata',
  value: string,
}
```

```
XastText {
  type: 'text',
  value: string,
}
```

The element can contain any other node except root one

```
XastElement {
  type: 'element',
  name: string,
  attributes: { [string]: string },
  children: Array<
    | XastDoctype
    | XastInstruction
    | XastComment
    | XastCdata
    | XastText
    | XastElement
  >
}
```

'use strict';

/*
In Adobe Illustrator, the only way to get it to export SVGs with meaningul class="" attributes is to use named Graphical Styles.
This is inconvenient to use as some things can't be done with Graphical Styles alone.

Instead, assign a meaningful name to a layer instead. When exporting an SVG, you can choose to use Layer Names as Object IDs.
This SVGO plugin will then copy the Object IDs over to the class attribute.

Since IDs are to be unique, if you name multiple layer with the same name, Illustrator will put the original in a data-name="" attribute.

Example where 2 lines are both named "line1":
  <line id="line1" class="cls-1" x1="0.3" y1="64.93" x2="71.14" y2="10.76"/>
  <line id="line1-2" data-name="line1" class="cls-1" x1="79.47" y1="100.35" x2="158.64" y2="8.68"/>

So this plugin will first look for a data-name attribute, then fall back to the ID and generate the output:
  <line id="line1" class="cls-1 line1" x1="0.3" y1="64.93" x2="71.14" y2="10.76"/>
  <line id="line1-2" data-name="line1" class="cls-1 line1" x1="79.47" y1="100.35" x2="158.64" y2="8.68"/>
("line1" is added to the class names for both elements)
*/

exports.type = 'perItem';

exports.active = false;

exports.description = 'Export SVG in Illustrator with layer names as object IDs and this plugin will move them to class names.';

exports.params = {
    remove: true,
    minify: true,
    prefix: ''
};

function shouldSkip(element) {
    return !element.isElem() || !element.hasAttr('id');
}

function findLayerName(element) {
    return (element.attr('data-name') || element.attr('id')).value;
}

function findExistingClasses(element) {
    return element.attr('class') || {
        name: 'class',
        value: undefined,
        prefix: '',
        local: ''
    };
}

function mergeClasses(classAttr, className) {
    classAttr.value = classAttr.value ? (classAttr.value + ' ' + className) : className;
}

exports.fn = function(data) {
    if(shouldSkip(data)) {
        return data;
    }

    var layerName = findLayerName(data);
    var classAttr = findExistingClasses(data);
    mergeClasses(classAttr, layerName);
    data.addAttr(classAttr);

    return data;
};

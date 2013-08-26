'use strict';

exports.type = 'perItem';

exports.active = true;

/**
 * Merge multiple Paths into one.
 *
 * @param {Object} item current iteration item
 * @return {Boolean} if false, item will be filtered out
 *
 * @author Kir Belevich
 */
exports.fn = function(item) {

    if (item.isElem() && !item.isEmpty()) {

        var prevContentItem,
            delim = '',
            prevContentItemKeys = null,
            prevItemPathClosed = false,
            contentItemKeys = null,
            contentItemPathClosed = false,
            equalData,
            attrName;

        item.content = item.content.filter(function(contentItem) {

            // merge only <path d="...z" />
            if (prevContentItem &&
                prevContentItem.isElem('path') &&
                prevContentItem.hasAttr('d') &&
                contentItem.isElem('path') &&
                contentItem.hasAttr('d')
            ) {

                prevItemPathClosed =  prevContentItem.attr('d').value.charAt(prevContentItem.attr('d').value.length-1) === 'z';
                contentItemPathClosed = contentItem.attr('d').value.charAt(contentItem.attr('d').value.length-1) === 'z';

                if (!prevItemPathClosed && contentItemPathClosed){
                  //console.log('Previous path not closed, current plath closed', prevContentItem.attr('d').value, contentItem.attr('d').value);
                  prevContentItem = contentItem;
                  prevContentItemKeys = null;
                  return true;
                }

                if (prevContentItemKeys === null){
                  prevContentItemKeys = Object.keys(prevContentItem.attrs);
                }

                contentItemKeys = Object.keys(contentItem.attrs);
                if (contentItemKeys.length !== 1 || prevContentItemKeys.length !== 1){
                    if (contentItemKeys.length !== prevContentItemKeys.length){
                      prevContentItem = contentItem;
                      prevContentItemKeys = null;
                      return true;
                    }

                    equalData = true;
                    for(var i = 0, I = contentItemKeys.length; i < I; i++){
                      attrName = contentItemKeys[i];
                      if (attrName != 'd'){
                        if(typeof prevContentItem.attrs[attrName] === "undefined"){
                          equalData = false;
                          break;
                        } else if (prevContentItem.attrs[attrName].value !== contentItem.attrs[attrName].value){
                          equalData = false;
                          break;
                        }
                      }
                    }
                    if (!equalData){
                      prevContentItem = contentItem;
                      prevContentItemKeys = null;
                      return true;
                    }
                }
                // "zM", but "z m"
                // looks like a FontForge parsing bug
                if (contentItem.attr('d').value.charAt(0) === 'm') {
                    delim = ' ';
                } else {
                    delim = ''; // reset delim from looping
                }

                prevContentItem.attr('d').value += delim + contentItem.attr('d').value;
                return false;
            }

            prevContentItem = contentItem;
            prevContentItemKeys = null;
            return true;

        });
    }

};

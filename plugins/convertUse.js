'use strict';

exports.type = 'full';

exports.active = true;

exports.description = 'Converts <use> links with their <defs> counterparts';

exports.params = {
    convertAll: false
}

/**
 * Converts <use> tags with the elements they link to.
 *
 * @param {Object} item current iteration item
 * @param {Object} params plugin params
 *
 * @author Nik Paro
 */
exports.fn = function(data, params) {
    
    /**
     * Find definitions among items
     *
     * @param {Object} items current iteration item
     * @param {Boolean} isDef
     * @return {Object} output definitions by id
     */
    function findDefs(items, isDef) {
        isDef = (isDef==true);
        
        var defs = {};
        
        for (var i=0; i < items.content.length; i++) {
            var item = items.content[i];
            
            if (item.isElem('defs')) {
                isDef = true;
            }
            
            // Id's are presumed to be unique. Add to defs.
            if (isDef && item.hasAttr('id')) {
                var id = '#'+item.attrs.id.value;
                defs[id] = item;
            }
            
            // Go deeper. Added elements may still contain id's.
            if (item.content) {
                defs = Object.assign(defs, findDefs(item, isDef));
            }
        }
        return defs;
    }
    
    /**
     * Find <use> tags
     *
     * @param {Object} items current iteration item
     * @return {Array} output <use> items
     */
    function findUseItems(items) {
        var useItems = [];
        
        for (var i=0; i < items.content.length; i++) {
            var item = items.content[i];
            
            if (item.isElem('use')) {
                useItems.push(item);
            }
            else if (item.content) {
                useItems = useItems.concat(findUseItems(item));
            }
        }
        
        return useItems;
    }
    
    /**
     * Replace <use> items with their definitions
     *
     * @param {Array} itemAry Array of use items we are replacing
     * @param {Object} defs definitions by id
     * @return {Array} Returns itemAry for convenience
     */
    function replaceUseItems(itemAry, defs) {
        
        for (var i=0; i < itemAry.length; i++) {
            var item = itemAry[i];
            
            if (item.isElem('use')) {
                
                var id = item.attr('xlink:href').value;
                // Make sure that we know the id before proceeding
                if (defs[id] != null) {
                    item.removeAttr('xlink:href');
                    item.renameElem('g');
                    
                    var defItem = defs[id].clone();
                    defItem.parentNode = item;
                    item.content = [ defItem ];
                }
            }
        }
        
        return itemAry;
    }
    
    /**
     * Find items by id that are in the array once and once only.
     *
     * @param {Array} itemAry Array of use items we are checking
     * @return {Array} filtered items
     */
    function uniqueOnly(itemAry) {
        
        itemAry.sort(function(a, b){
            var aID = a.attr('xlink:href').value;
            var bID = b.attr('xlink:href').value;
            if (aID < bID) return -1;
            if (aID > bID) return 1;
            return 0;
        });
        
        var uniqueItems = [];
        for (var i = 0; i < itemAry.length; i++) {
            
            var itemId = itemAry[i].attr('xlink:href').value
            // Make sure we don't call properties of undefined
            try { var prevId = itemAry[i-1].attr('xlink:href').value; }
            catch (e) { var prevID; }
            try { var nextId = itemAry[i+1].attr('xlink:href').value; }
            catch (e) { var nextID; }
            
            if ( prevId != itemId && itemId != nextId ) {
                uniqueItems.push(itemAry[i]);
            }
        }
        return uniqueItems;
    }
    
    var defs = findDefs(data);
    var useItems = findUseItems(data);
    
    if (!params.convertAll) {
        useItems = uniqueOnly(useItems);
    }
    
    replaceUseItems(useItems, defs);
    
    return data;
    
};

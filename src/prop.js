const div = document.createElement('div');

const selectProp = function(arr) {
    var idx = arr.length;
    while (idx--) {
        if (div.style[arr[idx]] !== undefined) {
            return arr[idx];
        }
    }
};

module.exports = selectProp([
    'transform',
    'msTransform',
    'oTransform',
    'mozTransform',
    'webkitTransform'
]) || '';
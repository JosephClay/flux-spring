const Matrix = require('./matrix');
const transformProp = require('./prop');

module.exports = function(obj, element) {
    const matrix = (new Matrix()).compose(obj);
    element.style[transformProp] = matrix.toString();
};
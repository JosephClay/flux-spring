import Matrix from './matrix';
import transformProp from './prop';

export default function(obj, element) {
    const matrix = (new Matrix()).compose(obj);
    element.style[transformProp] = matrix.toString();
}
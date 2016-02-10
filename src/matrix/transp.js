const valueToObject = function(value) {
    const units = /([\-\+]?[0-9]+[\.0-9]*)(deg|rad|grad|px|%)*/;
    const parts = value.match(units) || [];

    return {
        value: parseFloat(parts[1]),
        units: parts[2],
        unparsed: value
    };
};

module.exports = function statementToObject(statement, skipValues) {
    const nameAndArgs    = /(\w+)\(([^\)]+)\)/i;
    const statementParts = statement.toString().match(nameAndArgs).slice(1);
    const functionName   = statementParts[0];
    const stringValues   = statementParts[1].split(/, ?/);
    const parsedValues   = !skipValues && stringValues.map(valueToObject);

    return {
        key: functionName,
        value: parsedValues || stringValues,
        unparsed: statement
    };
};
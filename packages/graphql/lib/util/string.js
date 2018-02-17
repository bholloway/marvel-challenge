const indent = (size) => (v) => `${new Array(size).fill(' ').join('')}${v}`;
exports.indent = indent;

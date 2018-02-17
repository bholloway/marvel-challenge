const convictToMarkdown = (definition) => {
  const list = (obj) =>
    Object.entries(obj).reduce(
      (acc, [k, v]) =>
        ['doc', 'format', 'env'].every((x) => x in v) ? acc.concat(v) : acc.concat(list(v)),
      []
    );
  const items = list(definition.getSchema().properties);

  return items
    .map(({env, doc, format, default: value}) => {
      const type = Array.isArray(format) ? format.map((v) => `"${v}"`).join('|') : format;
      return [
        `* **${env}** :${type}`,
        `  ${doc}`,
        `  (${value == null ? 'required' : `default: ${JSON.stringify(value)}`})`
      ].join('\n\n');
    })
    .join('\n\n');
};
exports.convictToMarkdown = convictToMarkdown;

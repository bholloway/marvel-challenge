exports.withCustomFormats = (instance) => {
  const hexadecimal = (length) => (v) => {
    if (!new RegExp(`^[a-f0-9]{${length}}$`).test(v)) {
      throw new Error(`must be a ${length} character hex key`);
    }
    return v;
  };

  instance.addFormat({
    name: 'hexadecimal32',
    validate: hexadecimal(32),
    coerce: (v) => v
  });

  instance.addFormat({
    name: 'hexadecimal40',
    validate: hexadecimal(40),
    coerce: (v) => v
  });

  instance.addFormat({
    name: 'urlpath',
    validate: (v) => /^(?:\/[A–Za–z0–9\-._~!$&'()*+,;=:@%]+)+$/.test(v),
    coerce: (v) => v
  });

  return instance;
};

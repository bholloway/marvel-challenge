const category = require('tape');
const deepEqual = require('deep-equal');

const stimulus = require('./stimulus.json');
const snapshot = require('./snapshot.json');

const {parse, convertPrimitive} = require('./index');

const {models, resources, tree} = parse(stimulus);

category('convertPrimitive', (t) => {
  [
    ['int', 'Int'],
    ['float', 'Float'],
    ['double', 'Float'],
    ['Double', 'Float'],
    ['string', 'String'],
    ['date', 'String'],
    ['Date', 'String'],
    ['booolean', 'Booolean']
  ].forEach(([stimulus, expectation]) => {
    t.equal(convertPrimitive(stimulus), expectation, `${stimulus}`);
  });

  t.end();
});

category('models', ({name, test, end}) => {
  const takePairs = (arr) => arr.map((_, i, arr) => arr.slice(i, i + 2)).slice(0, -1);

  test(`${name}/DataContainers`, (t) => {
    const entries = Object.entries(models).filter(([name]) => /DataContainer$/.test(name));
    const values = entries.map(([_, value]) => value);

    t.ok(
      takePairs(values).every(([{results: _a, ...restA}, {results: _b, ...restB}]) =>
        deepEqual(restA, restB)
      ),
      '∀ x ∀ y, xDataContainer and yDataContainer differ only on the type of their results field'
    );

    t.ok(
      entries.every(
        ([name, {results}]) => results === name.replace(/^(\w+)DataContainer$/, '[$1]')
      ),
      '∀ Something, SomethingDataContainer contains a results field with type [Something]'
    );

    t.end();
  });

  test(`${name}/Entities`, (t) => {
    const entities = [
      'Character',
      'Comic',
      'ComicDate',
      'ComicPrice',
      'Creator',
      'Event',
      'Image',
      'Series',
      'Story',
      'TextObject',
      'Url'
    ];

    t.looseEqual(
      Object.keys(models)
        .filter((name) => !/(DataWrapper|DataContainer|List)$/.test(name))
        .sort((a, b) => a.localeCompare(b)),
      entities,
      'expected entities are present'
    );

    entities.forEach((name) => {
      t.looseEqual(models[name], snapshot.models[name], `${name}: snapshot match`);
      t.ok(
        Object.values(models[name]).every((type) =>
          [type, type.slice(1, -1)].some(
            (v) => v in models || ['Int', 'Float', 'String', 'Boolean'].includes(v)
          )
        ),
        `${name}: utilises only available types`
      );
    });

    t.end();
  });

  end();
});

category('api', ({name, test, end}) => {
  test(`${name}/resources`, (t) => {
    resources.forEach(({segments}, i) => {
      const name = segments.slice(1).join('/');
      t.looseEqual(resources[i], snapshot.resources[i], `snapshot match: ${name}`);
    });

    t.end();
  });

  test(`${name}/tree`, (t) => {
    const names = ['characters', 'comics', 'creators', 'events', 'series', 'stories'];
    t.looseEqual(Object.keys(tree).sort((a, b) => a.localeCompare(b)), names, `Consists: ${names}`);

    t.ok(Object.values(tree).every(({plural}) => !!plural), 'All contain plural');

    t.ok(Object.values(tree).every(({singular}) => !!singular), 'All contain singular');

    t.ok(
      Object.values(tree).every(({children}) => !!children && Object.keys(children).length),
      'All contain children'
    );

    t.ok(
      Object.values(tree).every(
        ({plural: {type: pluralType}, singular: {type: singularType}}) =>
          pluralType === singularType
      ),
      'Plural and singular resources have same response type'
    );

    t.ok(
      Object.values(tree).every(({children}) =>
        Object.entries(children).every(([name, {type: childType}]) => {
          const {plural: {type: pluralType}} = tree[name];
          return pluralType === childType;
        })
      ),
      'Nested resources have same response type as at the root'
    );

    t.end();
  });

  end();
});

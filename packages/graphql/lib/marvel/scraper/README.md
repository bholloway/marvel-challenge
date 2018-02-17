# Scraper

> Schema scraper for developer.marvel.com

There is a [json schema](https://gateway.marvel.com/docs/public)
available for the RESTful API at developer.marvel.com.

It consists of `api` section describing resources and a `models` section
describing entities and DTOs.

This work analyses the description with a bias towards rerepresenting it
as a GraphQL API.

## Principles

* Condense the verbose format of the available schema into a simple
type map.
* Investigate the structure of resources using automated tests.
* Discard any DTOs that would not be useful for GraphQL representation.
* Convert types into GraphQL format.

## Useful Properties

* Resources in the plural form `/characters` have the same type as those
  in the singular form `/characters/{characterId}`.

  Resources in the plural form may also be queried by parameters. The
  singular form is simply a special case placing `id` in the path.

  > A GraphQL proxy could represent both as simply `characters` and
  > use the most appropriate marvel API call based on the parrameters
  > involved.

## Redundant DTOs?

* Resources wrap responses in `DataWrapper` DTOs that provide response
  information.

  > **FooDataWrapper => FooDataContainer**
  >
  > A GraphQL proxy encapsulates the marvel API and so this layer is
  > redundant.

* Resources wrap responses in `DataContainer` DTOs that provide paging
  information.

  > **FooDataContainer retained**
  >
  > Paging is inevitable and this layer may as well be maintained as is.

* Nested resources (e.g. `/characters/{characterId}/comics`) are summary
  in form and link to other resources using `resourceURI` or
  `collectionURI` field.

  > **FooSummary => FooDataContainer**
  >
  > A GraphQL proxy would naturally follow the `URI` and expand the
  > data to its full fidelity. The type would therefore no longer be a
  > summary, but the full response type.

## Future work

- [ ] Implement less annoying snapshots for regression testing.
- [ ] Take descriptions from the swaggger model data.

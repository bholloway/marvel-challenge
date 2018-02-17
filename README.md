# marvel-challenge

> Open ended demo app using developer.marvel.com

**IMPORTANT:** This is a work in progress


## Monorepo

This project is a **monorepo** containing a number of microservices in
the `/packages` directory.

The monorepo is implemented using [yarn workspaces](https://yarnpkg.com/blog/2017/08/02/introducing-workspaces/)
and [lerna](https://github.com/lerna/lerna).

Packages:

- [x] `graphql` API that proxies `developer.marvel.com`

- [ ] `ui` application that is TBD

- [ ] `schema` microservice that validates `developer.marvel.com`
     schema against change

- [ ] ...other packages for universal code

## Usage

### Installation

**IMPORTANT:** This project requires `yarn` over `npm` due to the
workspaces feature.

First install yarn globally:

```sh
npm i -g yarn
```

And then for the project directory:

```sh
yarn install
yarn lerna bootstrap
```

The "bootstrap" command installs node modules for each package and
establishes symbolic links between packages.

Per the yarn "workspace" feature these node modules are actually
installed in the project root.

Each package has its own scripts that may be **run in bulk** by Lerna.

Typically we would use the `lerna run` command to invoke npm scripts in
bulk, across all packages. For convenience selected commands also have
a short-form script in the project root.

| task                    | command                          |
|-------------------------|----------------------------------|
| install node modules    | `yarn install && yarn bootstrap` |
| run unit tests          | `yarn test`                      |
| run code formatter      | `yarn prettier`                  |
| start microservices     | `yarn start`                     |
| build docker containers | `yarn docker`                    |

## Microservices

### Server (`/graphql`)

> Scrapes `developer.marvel.com` for API schema an implements a
corresponding GraphQL API.

Ensure you run start with environment variables for the Marvel API.

```sh
MARVEL_PUBLIC_KEY=<hexadecimal> MARVEL_PRIVATE_KEY=<hexadecimal> yarn start
```

#### Docker

First build the container

```sh
yarn docker
```

The run the container

```sh
docker run -p 3000:3000 -e "MARVEL_PUBLIC_KEY=<hexadecimal>" -e "MARVEL_PRIVATE_KEY=<hexadecimal>" marvel-challenge-graphql
```

#### Web Console

This will run the server as well as
[GraphiQL](https://medium.com/the-graphqlhub/graphiql-graphql-s-killer-app-9896242b2125) console.

Using the console try
[this query](http://localhost:3000/?query=%7B%0A%20%20characters(name%3A%20%22hulk%22)%20%7B%0A%20%20%20%20results%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20comics(limit%3A%203)%20%7B%0A%20%20%20%20%20%20%20%20results%20%7B%0A%20%20%20%20%20%20%20%20%20%20title%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20stories(limit%3A%203)%20%7B%0A%20%20%20%20%20%20%20%20results%20%7B%0A%20%20%20%20%20%20%20%20%20%20title%0A%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%20%20comics(limit%3A%203%2C%20characters%3A%201009351)%20%7B%0A%20%20%20%20results%20%7B%0A%20%20%20%20%20%20title%0A%20%20%20%20%7D%0A%20%20%7D%0A%20%20stories(limit%3A%203%2C%20characters%3A%201009351)%20%7B%0A%20%20%20%20results%20%7B%0A%20%20%20%20%20%20title%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D%0A).
You will find that the nested result for `characters/comics` and
`characters/stories` are the same as those done separately as `stories`
and `comics`with the hulk's `id`.

#### Configuration

* **NODE_ENV** :"production"|"development"|"test"

  The application environment.

  (default: "development")

* **PORT** :port

  The port to bind.

  (default: 3000)

* **IP_ADDRESS** :ipaddress

  The IP address to bind.

  (default: "127.0.0.1")

* **MARVEL_URL** :url

  The URL for the marvel API.

  (default: "http://gateway.marvel.com")

* **MARVEL_SCHEMA_PATH** :urlpath

  The path for the marvel API schema.

  (default: "/docs/public")

* **MARVEL_PUBLIC_KEY** :hexadecimal32

  A public key for the marvel API.

  (required)

* **MARVEL_PRIVATE_KEY** :hexadecimal40

  A private key for the marvel API.

  (required)

* **CACHE_TTL** :nat

  Number of seconds to cache results from mavel API, or zero for uncached.

  (default: 10)

* **CACHE_SIZE** :nat

  Number of cache results from mavel API, or zero for uncached.

  (default: 10)

#### Work in progress

- [x] Readme.md
- [x] Docker build
- [x] Scrape `developer.marvel.com` for schema
- [x] Unit tests for scraped schema
- [x] GraphQL server based on scraped schema
- [ ] Unit tests for fetch higher-order-functions
- [ ] End-to-end tests for GraphQL server
- [ ] Cloud CI
- [ ] Add datadog (statsd) metrics
- [ ] Add logging (but ensure API keys are not logged)

## Limitiations

### Monorepo

> libraries are always `latest` and cannot be pinned to older versions

This implementation is atypical in that all packages are private rather
than using a private npm repository.

Docker builds therefore [execute in the repo root directory](https://github.com/guigrpa/oao/issues/33#issuecomment-285955921)
to allow shared library code. The caviat being that libraries are always
`latest` and cannot be pinned to older versions.
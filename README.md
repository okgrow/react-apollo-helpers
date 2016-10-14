# react-apollo-helpers

Work in progress. API is subject to change!

An alternate api for [react-apollo](https://github.com/apollostack/react-apollo) with helpful defaults and less boilerplate. See the [react-apollo docs](http://dev.apollodata.com/react/) for more info.

## Features

* Works like the current `graphql()`, but with less code.
* Intelligent but overridable default names for your query and mutation propnames.
* Intuitive mutations:
  - `variables` will default to the arguments specified by your mutation `document`. You no longer have to specify them in most cases.
  - much less boilerplate than vanilla react-apollo for most mutations
  - still compatible with normal react-apollo syntax if you need/prefer it for certain mutations – just specify `props`. This will override defaults provided by this module. (see [react-apollo docs](http://dev.apollodata.com/react/) for usage)

## Basic Usage

Add react-apollo-helpers to your `package.json`:

* (future, when this is published) `npm install --save react-apollo-helpers`

Run locally: 

* clone this repo and get the path with `pwd`
* go to your app directory
* run `npm link path/to/react-apollo-helpers`

In your app:

```js
import { graphql, optimisticResponse } from 'react-apollo-helpers';
// optional, but recommmended:
import { compose } from 'recompose';
```

Specify a query:

```js
const getTodos = graphql(gql`
  query getTodos {
    todos {
      goal
    }
  }`,
  {
    // name defaults to `getTodos` – or pass `name: 'myQuery',` to set manually
    options: { /* apollo-client watchQuery options */ },
  },
);
```

Specify a mutation (`variables` and prop name will be set based on the `document`):

```js
const createTodo = graphql(gql`
  mutation createTodo ($goal: String!){
    createTodo (
      goal: $goal
    ) {
      goal
    }
  }`,
  {
    options: { /* apollo-client mutate options */ },
  }
);
```

Make a presentational component that will consume the graphql operations:

```jsx
const Todos = ({ getTodos: { todos }, createTodo }) => (
  <div>
    <form
      onSubmit={e => {
        e.preventDefault();
        createTodo(e.currentTarget.goal.value);
      }}
    >
      <input
        type="text"
        id="goal"
        placeholder="Add a todo"
      />
    </form>

    <ul>
      {
        todos.map(todo => (
          <li>
            {todo}
          </li>
        ))
      }
    </ul>
  </div>
);
```

Compose the query and mutation together with the presentational component:

```js
export default compose(todosQuery, createTodo)(Todos);
```


### optimisticResponse

For mutations, the `optimisticResponse` and `variables` objects can take a function that receives (args, ownProps):

```js
...
  options: {
    optimisticResponse: ({ goal }, ownProps) => ({
      __typename: 'Mutation',
      createTodo: {
        __typename: 'Todo',
        id: Math.random().toString(),
        goal,
      },
    }),
  },
```

or you can omit the first layer of the `optimisticResponse object`:

```js
...
  options: {
    optimisticResponse: ({ goal }, ownProps) => ({
      __typename: 'Todo',
      id: Math.random().toString(),
      goal,
    }),
  },
```

or you can specify just the fields you need to add with the `optimisticResponse()` function:

```js
import { graphql, optimisticResponse } from 'react-apollo-helpers';

...
  options: {
    optimisticResponse: optimisticResponse({
      __typename: 'Todo', // still required: use the mutation return type 
      _id: `${Random.id()}`, // add fields you need to generate
      // don't need to add goal; it will be added automatically
    }),
  },
```

### updateQueries

There is no change to how `updateQueries` works.

## Todo:

- [x] remove composition and rename function (use [recompose](https://github.com/acdlite/recompose) instead)
- [x] probably change operation spec api to match apollo-client
- [x] possibly set default query response prop (currently `data`)
- [x] simplify optimisticResponse with good defaults from document/schema
- [ ] add some common reducers for use in `updateQueries`

## Why not just do a PR against react-apollo?

Setting default prop names would be a breaking change, so let's prove in the concept here and see if people like it. If all of this ends up in react-apollo, that'd be awesome :) Then we would just deprecate this module.

## Testing

Needs tests.

## Thanks

* @jamielob for the initial inspiration
* @ecwyne for code improvements and ideas


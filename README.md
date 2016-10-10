# react-apollo-helpers

Work in progress. Not for production use.

An alternate api for [react-apollo](https://github.com/apollostack/react-apollo) with helpful defaults and less boilerplate. See the [react-apollo docs](http://dev.apollodata.com/react/) for more info.

## Features

* Intuitive mutations:
  - `variables` will default to the arguments specified by your mutation `document`. You no longer have to specify them in most cases.
  - automatically sets the prop name to the name of the mutation you are calling (use `name` as you would with a query to set a different name)
  - much less boilerplate than vanilla react-apollo for most mutations
  - still compatible with normal react-apollo syntax if you need/prefer it for certain mutations – just specify `props`. This will override defaults provided by this module. (see [react-apollo docs](http://dev.apollodata.com/react/) for usage)
* compose graphql operations together with presentational components easily and intuitively (this feature will probably be removed in favor of [recompose](https://github.com/acdlite/recompose)), but the use pattern will be nearly the same.

## Basic Usage

Add react-apollo-helpers to your `package.json`:

* (future, when this is published) `npm install --save react-apollo-helpers`

Run locally: 

* clone this repo and get the path with `pwd`
* go to your app directory
* run `npm link path/to/react-apollo-helpers`

In your app:

```js
// ...
import composeGraphQL from 'react-apollo-helpers'
```

Specify a query:

```js
const todosQuery = {
  document: gql`
    query Todos {
      todos {
        goal
      }
    }
  `,
  name: 'myQuery',
  options: { /* apollo-client watchQuery options */ }
}
```

Specify a mutation (`variables` and prop name will be set based on the `document`):

```js
const createTodoMutation = {
  document: gql`
    mutation createTodo ($goal: String!){
      createTodo (
        goal: $goal
      ) {
        goal
      }
    }
  `,
  options: { /* apollo-client mutate options */ }
}
```

Make a presentational component that will consume the graphql operations:

```
const Todos = ({ myQuery: { todos }, createTodo }) => (
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
export default composeGraphQL(todosQuery, createTodoMutation)(Todos);
```

For mutations, the `optimisticResponse` and `variables` objects can take a function that receives (args, ownProps):

```js
options: {
  optimisticResponse: ({ goal }) => ({
    __typename: 'Mutation',
    createTodo: {
      __typename: 'Todo',
      goal,
    },
  }),
},
```

shorthand operation spec with just a document:
```js
const todosQuery = gql`
  query Todos {
    todos {
      goal
    }
  }
`
```

## Todo:

[] remove composition and rename function (use [recompose](https://github.com/acdlite/recompose) instead)
[] probably change operation spec api to match apollo-client
[] possibly set default query response prop (currently `data`)
[] simplify optimisticResponse with good defaults from document/schema
[] add some common reducers for use in `updateQueries`

## Why not just do a PR against react-apollo?

Setting default prop names would be a breaking change, so let's prove in the concept here and see if people like it. If all of this ends up in react-apollo, that'd be awesome :) Then we would just deprecate this module.

## Testing

Needs tests.

## Thanks

* @jamielob for the initial inspiration
* @ecwyne for code improvements and ideas


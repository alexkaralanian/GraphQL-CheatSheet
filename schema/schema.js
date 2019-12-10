// Purpose of schema file is to instruct GQL about what type od data we have in our application.
const graphql = require('graphql');
const axios = require('axios');

const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull
} = graphql;

const CompanyType = new GraphQLObjectType({
  name: 'Company',
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    users: {
      type: new GraphQLList(UserType), // telling GQL that we will return a collection of users by passing UserType to GQLList
      async resolve(parentValue, args) {
        const { data } = await axios.get(
          `http://localhost:3000/companies/${parentValue.id}/users`
        );
        return data;
      }
    }
  })
});

const UserType = new GraphQLObjectType({
  // declare a new User type.
  // this object has 2 required properties: name and field
  // name property is always a string that dwecribed the type we are defining
  // In practice its whatever we call this type, ie 'User',
  // By convention we capitalize the first character in string
  // Fields is an object, whose keys define the properties of the type
  // Must tell GQL what data types these properties are.

  name: 'User',
  fields: () => ({
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt },
    company: {
      // THIS IS HOW DEFINE RELATIONSHIPS IN GQL.
      // Note how we arent use CompanyId in this field, and simply "company". This is why we define the Resolve function to reoslve difference between data model and data type we use in GQL. ie to populate the "companyId" in "company" field.
      type: CompanyType,
      async resolve(parentValue, args) {
        const { data } = await axios.get(
          `http://localhost:3000/companies/${parentValue.companyId}`
        );
        return data;
      }
    }
  })
});

// In order for GQL to start query and find user by ID, must use a Root Query
// A Root query allows us to jump into our graph of data
// Think of it as an entrypoint into your application.

const RootQuery = new GraphQLObjectType({
  // User is of type UserType
  // If you give me id of user youre looking for, I will reutrn a user back to you
  name: 'RootQueryType',
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLString } },
      async resolve(parentValue, args) {
        // with resolve function, we go into our db to retrieve our data
        // args is an object that gets called with whatever params were passed into query (ie user id).
        // return _.find(users, { id: args.id });
        const { data } = await axios.get(
          `http://localhost:3000/users/${args.id}`
        );
        return data;
      }
    },
    company: {
      type: CompanyType,
      args: { id: { type: GraphQLString } },
      async resolve(parentValue, { id }) {
        const { data } = await axios.get(
          `http://localhost:3000/companies/${id}`
        );
        return data;
      }
    }
  }
});

const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addUser: {
      type: UserType,
      args: {
        firstName: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: new GraphQLNonNull(GraphQLInt) },
        companyId: { type: GraphQLString }
      },
      async resolve(parentValue, { firstName, age }) {
        const { data } = await axios.post('http://localhost:3000/users', {
          firstName,
          age
        });
        return data;
      }
    },
    deleteUser: {
      type: UserType,
      args: { id: { type: new GraphQLNonNull(GraphQLString) } },
      async resolve(parentValue, { id }) {
        const { data } = await axios.delete(
          `http://localhost:3000/users/${id}`
        );
        return data;
      }
    }
  }
});

// GraphQLSchema takes a root query and returns a GraphQL Schema instance.
// We want to export this schema and make it available to other parts of our application.
module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation
});

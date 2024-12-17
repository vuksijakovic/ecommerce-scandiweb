import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://vuksijakovicbackend.freesite.online/graphql', // replace with your GraphQL API URL
  cache: new InMemoryCache(),
});

export default client;

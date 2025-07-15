import { gql } from '@apollo/client'

export const SOURCES_QUERY = gql`
  query Sources($filter: SourceFilterInput, $pagination: PaginationInput) {
    sources(filter: $filter, pagination: $pagination) {
      items {
        id
        name
        url
        rssUrl
        category
        status
        articleCount
        errorRate
        lastFetchedAt
        tier {
          level
          name
        }
        createdAt
        updatedAt
      }
      total
      hasMore
    }
  }
`

export const CREATE_SOURCE_MUTATION = gql`
  mutation CreateSource($input: CreateSourceInput!) {
    createSource(input: $input) {
      id
      name
      url
      rssUrl
      category
      status
      articleCount
      errorRate
      lastFetchedAt
      tier {
        level
        name
      }
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_SOURCE_MUTATION = gql`
  mutation UpdateSource($id: ID!, $input: UpdateSourceInput!) {
    updateSource(id: $id, input: $input) {
      id
      name
      url
      rssUrl
      category
      status
      articleCount
      errorRate
      lastFetchedAt
      tier {
        level
        name
      }
      createdAt
      updatedAt
    }
  }
`

export const DELETE_SOURCE_MUTATION = gql`
  mutation DeleteSource($id: ID!) {
    deleteSource(id: $id)
  }
`

export const EVALUATE_SOURCE_MUTATION = gql`
  mutation EvaluateSource($url: String!) {
    evaluateSource(url: $url) {
      tier
      trustScore
      criteria
    }
  }
`
import { gql } from '@apollo/client';

export const UPDATE_SOURCE_TIER = gql`
  mutation UpdateSourceTier($sourceId: String!, $tier: Int!, $reasoning: String!) {
    updateSourceTier(sourceId: $sourceId, tier: $tier, reasoning: $reasoning) {
      id
      name
      url
      tier
    }
  }
`;

export const CREATE_ARTICLE = gql`
  mutation CreateArticle($input: CreateArticleInput!) {
    createArticle(input: $input) {
      id
      title
      url
      summary
      publishedAt
      source {
        id
        name
        tier
      }
    }
  }
`;

export const UPDATE_ARTICLE = gql`
  mutation UpdateArticle($id: String!, $input: UpdateArticleInput!) {
    updateArticle(id: $id, input: $input) {
      id
      title
      url
      summary
      publishedAt
    }
  }
`;

export const DELETE_ARTICLE = gql`
  mutation DeleteArticle($id: String!) {
    deleteArticle(id: $id)
  }
`;
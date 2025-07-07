import { gql } from '@apollo/client';

export const GET_ARTICLES = gql`
  query GetArticles($filter: ArticleFilter, $limit: Int!, $offset: Int!) {
    articles(filter: $filter, limit: $limit, offset: $offset) {
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
      tags {
        id
        name
      }
    }
  }
`;

export const GET_ARTICLE = gql`
  query GetArticle($id: String!) {
    article(id: $id) {
      id
      title
      url
      summary
      content
      publishedAt
      source {
        id
        name
        url
        tier
        category
      }
      tags {
        id
        name
      }
    }
  }
`;

export const EVALUATE_SOURCE_TIER = gql`
  query EvaluateSourceTier($url: String!) {
    evaluateSourceTier(url: $url) {
      url
      tier {
        tier
        confidence
        verificationStatus
        reasoning
      }
    }
  }
`;

export const TIER_STATS = gql`
  query TierStats {
    tierStats {
      tierCounts {
        tier
        count
      }
      verifiedSourceCount
      totalSourceCount
    }
  }
`;
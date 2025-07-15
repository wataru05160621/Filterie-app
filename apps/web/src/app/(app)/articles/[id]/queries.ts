import { gql } from '@apollo/client'

export const ARTICLE_DETAIL_QUERY = gql`
  query ArticleDetail($id: ID!) {
    article(id: $id) {
      id
      title
      content
      summary
      url
      publishedAt
      readTime
      viewCount
      source {
        id
        name
        url
        tier {
          level
          name
        }
      }
      tags {
        id
        name
      }
      aiSummary {
        id
        content
        keyPoints
        generatedAt
      }
      bookmarks {
        id
        userId
      }
      relatedArticles {
        id
        title
        summary
        publishedAt
        source {
          name
          tier {
            level
          }
        }
      }
    }
  }
`

export const BOOKMARK_MUTATION = gql`
  mutation BookmarkArticle($articleId: ID!) {
    bookmarkArticle(articleId: $articleId)
  }
`

export const UNBOOKMARK_MUTATION = gql`
  mutation RemoveBookmark($articleId: ID!) {
    removeBookmark(articleId: $articleId)
  }
`

export const TRACK_READ_MUTATION = gql`
  mutation MarkArticleAsRead($articleId: ID!, $readDuration: Number) {
    markArticleAsRead(articleId: $articleId, readDuration: $readDuration)
  }
`
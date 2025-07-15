import { gql } from '@apollo/client'

export const SAVED_ARTICLES_QUERY = gql`
  query SavedArticles($filter: TrayFilterInput, $pagination: PaginationInput) {
    trays(filter: $filter, pagination: $pagination) {
      items {
        id
        name
        description
        color
        articleCount
        articles {
          id
          title
          content
          summary
          publishedAt
          source {
            id
            name
            tier {
              level
            }
          }
        }
        createdAt
        updatedAt
      }
      totalCount
    }
  }
`

export const CREATE_TRAY_MUTATION = gql`
  mutation CreateTray($input: CreateTrayInput!) {
    createTray(input: $input) {
      id
      name
      description
      color
      articleCount
      articles {
        id
        title
        content
        summary
        publishedAt
        source {
          id
          name
          tier {
            level
          }
        }
      }
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_TRAY_MUTATION = gql`
  mutation UpdateTray($id: ID!, $input: UpdateTrayInput!) {
    updateTray(id: $id, input: $input) {
      id
      name
      description
      color
      articleCount
      articles {
        id
        title
        content
        summary
        publishedAt
        source {
          id
          name
          tier {
            level
          }
        }
      }
      createdAt
      updatedAt
    }
  }
`

export const DELETE_TRAY_MUTATION = gql`
  mutation DeleteTray($id: ID!) {
    deleteTray(id: $id) {
      success
    }
  }
`

export const ADD_TO_TRAY_MUTATION = gql`
  mutation AddToTray($articleId: ID!, $trayId: ID!) {
    addToTray(articleId: $articleId, trayId: $trayId) {
      success
    }
  }
`

export const REMOVE_FROM_TRAY_MUTATION = gql`
  mutation RemoveFromTray($articleId: ID!, $trayId: ID!) {
    removeFromTray(articleId: $articleId, trayId: $trayId) {
      success
    }
  }
`

export const EXPORT_TRAY_MUTATION = gql`
  mutation ExportTray($trayId: ID!, $format: ExportFormat!) {
    exportTray(trayId: $trayId, format: $format) {
      content
      filename
      mimeType
    }
  }
`
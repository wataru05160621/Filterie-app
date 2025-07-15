import { gql } from '@apollo/client'

export const AI_SETTINGS_QUERY = gql`
  query AISettings {
    aiSettings {
      id
      userId
      aiModel
      temperature
      maxTokens
      summaryPrompt
      tagPrompt
      features {
        autoSummarize
        autoTag
        sentimentAnalysis
        keywordExtraction
      }
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_AI_SETTINGS_MUTATION = gql`
  mutation UpdateAISettings($input: UpdateAISettingsInput!) {
    updateAISettings(input: $input) {
      id
      userId
      aiModel
      temperature
      maxTokens
      summaryPrompt
      tagPrompt
      features {
        autoSummarize
        autoTag
        sentimentAnalysis
        keywordExtraction
      }
      createdAt
      updatedAt
    }
  }
`

export const AI_USAGE_STATS_QUERY = gql`
  query AIUsageStats {
    aiUsageStats {
      totalRequests
      totalTokens
      averageResponseTime
      successRate
      monthlyUsage {
        month
        requests
        tokens
      }
      featureUsage {
        summarize
        tag
        sentiment
        keyword
      }
    }
  }
`

export const TEST_AI_PROMPT_MUTATION = gql`
  mutation TestAIPrompt($prompt: String!, $sampleText: String!) {
    testAIPrompt(prompt: $prompt, sampleText: $sampleText) {
      result
      tokensUsed
      responseTime
    }
  }
`
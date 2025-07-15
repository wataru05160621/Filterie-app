import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { useRouter } from 'next/navigation';
import LoginPage from '../page';
import { gql } from '@apollo/client';
import { AuthProvider } from '@/providers/auth-provider';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
};

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      accessToken
      user {
        id
        email
        name
        avatarUrl
      }
    }
  }
`;

// Wrapper component for tests
const TestWrapper = ({ children, mocks = [] }: { children: React.ReactNode; mocks?: any[] }) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    <AuthProvider>
      {children}
    </AuthProvider>
  </MockedProvider>
);

describe('LoginPage', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    mockPush.mockClear();
  });

  it('should render login form', () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
    expect(screen.getByLabelText('パスワード')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
    expect(screen.getByLabelText('ログイン状態を保持')).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('有効なメールアドレスを入力してください')).toBeInTheDocument();
      expect(screen.getByText('パスワードは6文字以上である必要があります')).toBeInTheDocument();
    });
  });

  it('should show error for invalid email format', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText('メールアドレス');
    await user.type(emailInput, 'invalid-email');
    
    const passwordInput = screen.getByLabelText('パスワード');
    await user.type(passwordInput, 'password123');
    
    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('有効なメールアドレスを入力してください')).toBeInTheDocument();
    });
  });

  it('should successfully login user', async () => {
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: LOGIN_MUTATION,
          variables: {
            email: 'test@example.com',
            password: 'password123',
          },
        },
        result: {
          data: {
            login: {
              user: {
                id: '1',
                name: 'Test User',
                email: 'test@example.com',
                avatarUrl: null,
              },
              accessToken: 'fake-jwt-token',
            },
          },
        },
      },
    ];

    render(
      <TestWrapper mocks={mocks}>
        <LoginPage />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should show error message when login fails', async () => {
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: LOGIN_MUTATION,
          variables: {
            email: 'test@example.com',
            password: 'wrongpassword',
          },
        },
        error: new Error('メールアドレスまたはパスワードが正しくありません'),
      },
    ];

    render(
      <TestWrapper mocks={mocks}>
        <LoginPage />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');

    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('メールアドレスまたはパスワードが正しくありません')).toBeInTheDocument();
    });
  });

  it('should have link to register page', () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const registerLink = screen.getByText('アカウントを作成');
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });

  it('should have link to forgot password', () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    );

    const forgotPasswordLink = screen.getByText('パスワードを忘れた方');
    expect(forgotPasswordLink).toBeInTheDocument();
  });

  it('should disable submit button while submitting', async () => {
    const user = userEvent.setup();
    const mocks = [
      {
        request: {
          query: LOGIN_MUTATION,
          variables: {
            email: 'test@example.com',
            password: 'password123',
          },
        },
        delay: 100, // Add delay to test loading state
        result: {
          data: {
            login: {
              user: {
                id: '1',
                name: 'Test User',
                email: 'test@example.com',
                avatarUrl: null,
              },
              accessToken: 'fake-jwt-token',
            },
          },
        },
      },
    ];

    render(
      <TestWrapper mocks={mocks}>
        <LoginPage />
      </TestWrapper>
    );

    const emailInput = screen.getByLabelText('メールアドレス');
    const passwordInput = screen.getByLabelText('パスワード');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: 'ログイン' });
    await user.click(submitButton);

    // Check loading state
    expect(screen.getByRole('button', { name: 'ログイン中...' })).toBeDisabled();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});
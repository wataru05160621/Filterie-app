import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SourcesPage from '../page';

// Mock API calls
jest.mock('@/lib/api', () => ({
  getSources: jest.fn(),
  createSource: jest.fn(),
  updateSource: jest.fn(),
  deleteSource: jest.fn(),
}));

// Mock authentication hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: '1' } }),
}));

import { getSources, createSource, updateSource, deleteSource } from '@/lib/api';

describe('Sources Page', () => {
  const mockGetSources = getSources as jest.MockedFunction<typeof getSources>;
  const mockCreateSource = createSource as jest.MockedFunction<typeof createSource>;
  const mockUpdateSource = updateSource as jest.MockedFunction<typeof updateSource>;
  const mockDeleteSource = deleteSource as jest.MockedFunction<typeof deleteSource>;

  const mockSources = [
    {
      id: '1',
      name: '日本経済新聞',
      url: 'https://www.nikkei.com',
      tier: 1,
      type: 'NEWS_MEDIA',
      description: '日本の主要経済紙',
      isActive: true,
    },
    {
      id: '2',
      name: 'TechCrunch',
      url: 'https://techcrunch.com',
      tier: 2,
      type: 'TECH_BLOG',
      description: 'テクノロジーニュースサイト',
      isActive: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSources.mockResolvedValue({
      items: mockSources,
      total: 2,
      page: 1,
      totalPages: 1,
    });
  });

  it('should render sources list', async () => {
    render(<SourcesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('日本経済新聞')).toBeInTheDocument();
      expect(screen.getByText('TechCrunch')).toBeInTheDocument();
    });
  });

  it('should display tier badges', async () => {
    render(<SourcesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Tier 1')).toBeInTheDocument();
      expect(screen.getByText('Tier 2')).toBeInTheDocument();
    });
  });

  it('should filter sources by tier', async () => {
    render(<SourcesPage />);
    
    const tierFilter = screen.getByRole('combobox', { name: /Tierで絞り込み/i });
    await userEvent.selectOptions(tierFilter, '1');
    
    await waitFor(() => {
      expect(mockGetSources).toHaveBeenCalledWith(
        expect.objectContaining({ tier: 1 })
      );
    });
  });

  it('should search sources by name', async () => {
    render(<SourcesPage />);
    
    const searchInput = screen.getByPlaceholderText(/情報源を検索/i);
    await userEvent.type(searchInput, '日本経済');
    
    await waitFor(() => {
      expect(mockGetSources).toHaveBeenCalledWith(
        expect.objectContaining({ search: '日本経済' })
      );
    });
  });

  it('should open add source modal', async () => {
    render(<SourcesPage />);
    
    const addButton = screen.getByRole('button', { name: /情報源を追加/i });
    await userEvent.click(addButton);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /新しい情報源を追加/i })).toBeInTheDocument();
  });

  it('should create new source', async () => {
    mockCreateSource.mockResolvedValueOnce({
      id: '3',
      name: 'New Source',
      url: 'https://example.com',
      tier: 3,
      type: 'BLOG',
      description: 'New source description',
      isActive: true,
    });

    render(<SourcesPage />);
    
    const addButton = screen.getByRole('button', { name: /情報源を追加/i });
    await userEvent.click(addButton);
    
    const nameInput = screen.getByLabelText(/名前/i);
    const urlInput = screen.getByLabelText(/URL/i);
    const typeSelect = screen.getByLabelText(/タイプ/i);
    const descriptionInput = screen.getByLabelText(/説明/i);
    
    await userEvent.type(nameInput, 'New Source');
    await userEvent.type(urlInput, 'https://example.com');
    await userEvent.selectOptions(typeSelect, 'BLOG');
    await userEvent.type(descriptionInput, 'New source description');
    
    const submitButton = screen.getByRole('button', { name: /追加/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateSource).toHaveBeenCalledWith({
        name: 'New Source',
        url: 'https://example.com',
        type: 'BLOG',
        description: 'New source description',
      });
    });
  });

  it('should edit existing source', async () => {
    render(<SourcesPage />);
    
    await waitFor(() => {
      const editButtons = screen.getAllByRole('button', { name: /編集/i });
      userEvent.click(editButtons[0]);
    });
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByDisplayValue('日本経済新聞')).toBeInTheDocument();
  });

  it('should delete source with confirmation', async () => {
    mockDeleteSource.mockResolvedValueOnce(true);
    
    render(<SourcesPage />);
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /削除/i });
      userEvent.click(deleteButtons[0]);
    });
    
    // Confirmation dialog
    expect(screen.getByText(/本当に削除しますか？/i)).toBeInTheDocument();
    
    const confirmButton = screen.getByRole('button', { name: /確認/i });
    await userEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockDeleteSource).toHaveBeenCalledWith('1');
    });
  });

  it('should toggle source active status', async () => {
    render(<SourcesPage />);
    
    await waitFor(() => {
      const toggleButtons = screen.getAllByRole('switch');
      userEvent.click(toggleButtons[0]);
    });
    
    await waitFor(() => {
      expect(mockUpdateSource).toHaveBeenCalledWith('1', {
        isActive: false,
      });
    });
  });

  it('should paginate sources', async () => {
    mockGetSources.mockResolvedValueOnce({
      items: mockSources,
      total: 50,
      page: 1,
      totalPages: 5,
    });

    render(<SourcesPage />);
    
    await waitFor(() => {
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
    });
    
    const nextButton = screen.getByRole('button', { name: /次へ/i });
    await userEvent.click(nextButton);
    
    await waitFor(() => {
      expect(mockGetSources).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 })
      );
    });
  });

  it('should display empty state', async () => {
    mockGetSources.mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });

    render(<SourcesPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/情報源がありません/i)).toBeInTheDocument();
      expect(screen.getByText(/最初の情報源を追加してください/i)).toBeInTheDocument();
    });
  });

  it('should handle loading state', () => {
    mockGetSources.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<SourcesPage />);
    
    expect(screen.getByTestId('sources-skeleton')).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    mockGetSources.mockRejectedValueOnce(new Error('Failed to fetch sources'));
    
    render(<SourcesPage />);
    
    await waitFor(() => {
      expect(screen.getByText(/エラーが発生しました/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /再試行/i })).toBeInTheDocument();
    });
  });
});
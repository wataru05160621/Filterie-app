import { render, screen } from '@testing-library/react';
import Home from '../page';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

describe('Home Page', () => {
  it('should render the home page', () => {
    render(<Home />);
    
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('should display the hero section', () => {
    render(<Home />);
    
    expect(screen.getByText(/情報濾過ハブ/i)).toBeInTheDocument();
    expect(screen.getByText(/一次情報に素早くアクセス/i)).toBeInTheDocument();
  });

  it('should show main features', () => {
    render(<Home />);
    
    expect(screen.getByText(/信頼できる情報源/i)).toBeInTheDocument();
    expect(screen.getByText(/AI要約/i)).toBeInTheDocument();
    expect(screen.getByText(/パーソナライズ/i)).toBeInTheDocument();
  });

  it('should have call-to-action buttons', () => {
    render(<Home />);
    
    expect(screen.getByRole('link', { name: /今すぐ始める/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /詳しく見る/i })).toBeInTheDocument();
  });

  it('should display tier information', () => {
    render(<Home />);
    
    expect(screen.getByText(/Tier 1/i)).toBeInTheDocument();
    expect(screen.getByText(/一次情報源/i)).toBeInTheDocument();
    expect(screen.getByText(/Tier 2/i)).toBeInTheDocument();
    expect(screen.getByText(/信頼メディア/i)).toBeInTheDocument();
  });

  it('should have navigation links', () => {
    render(<Home />);
    
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ホーム/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /情報源/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /記事/i })).toBeInTheDocument();
  });

  it('should be responsive', () => {
    render(<Home />);
    
    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveClass('container');
    expect(mainContent).toHaveClass('mx-auto');
  });
});
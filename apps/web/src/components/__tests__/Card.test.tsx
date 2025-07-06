import { render, screen } from '@testing-library/react';
import { Card } from '../Card';

// Card component test (TDD - component doesn't exist yet)
describe('Card', () => {
  it('should render card with children', () => {
    render(
      <Card>
        <h2>Card Title</h2>
        <p>Card content</p>
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should support different variants', () => {
    const { rerender } = render(<Card variant="default">Default Card</Card>);
    
    let card = screen.getByTestId('card');
    expect(card).toHaveClass('bg-white');
    
    rerender(<Card variant="bordered">Bordered Card</Card>);
    card = screen.getByTestId('card');
    expect(card).toHaveClass('border border-gray-200');
    
    rerender(<Card variant="elevated">Elevated Card</Card>);
    card = screen.getByTestId('card');
    expect(card).toHaveClass('shadow-lg');
  });

  it('should support padding sizes', () => {
    const { rerender } = render(<Card padding="small">Small Padding</Card>);
    
    let card = screen.getByTestId('card');
    expect(card).toHaveClass('p-4');
    
    rerender(<Card padding="medium">Medium Padding</Card>);
    card = screen.getByTestId('card');
    expect(card).toHaveClass('p-6');
    
    rerender(<Card padding="large">Large Padding</Card>);
    card = screen.getByTestId('card');
    expect(card).toHaveClass('p-8');
  });

  it('should support hover effects', () => {
    render(<Card hoverable>Hoverable Card</Card>);
    
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('hover:shadow-md transition-shadow');
  });

  it('should support custom className', () => {
    render(<Card className="custom-card">Custom Card</Card>);
    
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('custom-card');
  });

  it('should render with header and footer', () => {
    render(
      <Card
        header={<h3>Card Header</h3>}
        footer={<button>Action</button>}
      >
        <p>Card Body</p>
      </Card>
    );
    
    expect(screen.getByText('Card Header')).toBeInTheDocument();
    expect(screen.getByText('Card Body')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('should support onClick handler', () => {
    const handleClick = jest.fn();
    render(<Card onClick={handleClick}>Clickable Card</Card>);
    
    const card = screen.getByTestId('card');
    card.click();
    
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(card).toHaveClass('cursor-pointer');
  });

  it('should support loading state', () => {
    render(<Card loading>Loading Card</Card>);
    
    expect(screen.getByTestId('card-skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Loading Card')).not.toBeInTheDocument();
  });
});
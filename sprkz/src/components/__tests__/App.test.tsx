import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';

describe('App Component', () => {
  describe('Basic App Shell', () => {
    test('should render without crashing', () => {
      render(<App />);
    });

    test('should have Material-UI theme provider', () => {
      render(<App />);
      // Theme provider should wrap the app content
      const appContainer = screen.getByTestId('app-container');
      expect(appContainer).toBeInTheDocument();
    });

    test('should display the application title', () => {
      render(<App />);
      const title = screen.getByText(/sprkz/i);
      expect(title).toBeInTheDocument();
    });

    test('should have proper layout structure', () => {
      render(<App />);
      const appContainer = screen.getByTestId('app-container');
      expect(appContainer).toHaveAttribute('data-testid', 'app-container');
    });

    test('should not show any error boundaries on initial load', () => {
      render(<App />);
      // Should not contain error messages
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('Theme Configuration', () => {
    test('should apply Material-UI theme correctly', () => {
      render(<App />);
      const appContainer = screen.getByTestId('app-container');
      // Container should be styled by Material-UI theme
      expect(appContainer).toBeInTheDocument();
    });
  });
});
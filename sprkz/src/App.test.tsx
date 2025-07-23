import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock mobile detection to avoid redirect during tests
jest.mock('./utils/mobileDetection', () => ({
  redirectToMobileIfNeeded: jest.fn(),
}));

test('renders app without crashing', () => {
  render(<App />);
  // App should render the PDF container which shows loading initially
  const containerElement = screen.getByTestId('pdf-form-container');
  expect(containerElement).toBeInTheDocument();
});

test('renders loading state initially', () => {
  render(<App />);
  const loadingElement = screen.getByText('Loading PDF...');
  expect(loadingElement).toBeInTheDocument();
});

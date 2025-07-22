import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('renders Sprkz application title', () => {
  render(<App />);
  const titleElement = screen.getByText(/sprkz/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders platform description', () => {
  render(<App />);
  const descriptionElement = screen.getByText(/pdf form completion platform/i);
  expect(descriptionElement).toBeInTheDocument();
});

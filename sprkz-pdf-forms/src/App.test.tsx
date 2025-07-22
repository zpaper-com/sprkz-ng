import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Sprkz PDF platform heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/Sprkz PDF Form Completion Platform/i);
  expect(headingElement).toBeInTheDocument();
});

test('renders phase 1 completion message', () => {
  render(<App />);
  const statusElement = screen.getByText(/Phase 1 Setup Complete/i);
  expect(statusElement).toBeInTheDocument();
});

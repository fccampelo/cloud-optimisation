import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const container = document.getElementById('root');

if (container) {
  const root = ReactDOM.createRoot(container);

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

root.render(
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
);
}
import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography, Paper, CircularProgress, Snackbar, Alert, IconButton, Box } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ResourceList from './components/ResourceList';
import AlertFeed from './components/AlertFeed';
import CostSummary from './components/CostSummary';
import OptimizeButton from './components/OptimizeButton';
import axios from 'axios';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Resource, AlertData, Cost, Recommendation } from './types';

const App: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [costs, setCosts] = useState<Cost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  const fetchData = async () => {
    try {
      const [resRes, resAlerts, resCosts] = await Promise.all([
        axios.get('http://localhost:3001/api/resources'),
        axios.get('http://localhost:3001/api/alerts'),
        axios.get('http://localhost:3001/api/costs'),
      ]);
      setResources(resRes.data);
      setAlerts(resAlerts.data);
      setCosts(resCosts.data);
    } catch (err: any) {
      setError('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOptimize = async () => {
    try {
      const res = await axios.post<{ recommendations: Recommendation[] }>('http://localhost:3001/api/optimise');
      alert('Recommendations:\n' + res.data.recommendations.map(r => `Resource ${r.resourceId}: ${r.action} (${r.reason})`).join('\n'));
    } catch (err: any) {
      setError('Error running optimisation');
    }
  };

  const theme = createTheme({ palette: { mode } });

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" mt={10}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Snackbar open autoHideDuration={6000} onClose={() => setError(null)}>
          <Alert severity="error">{error}</Alert>
        </Snackbar>
      </Container>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Container sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" gutterBottom>
            CloudOps Control Dashboard
          </Typography>
          <IconButton onClick={toggleMode} color="inherit">
            {theme.palette.mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
          </IconButton>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <ResourceList resources={resources} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <AlertFeed alerts={alerts} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <CostSummary costs={costs} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} display="flex" alignItems="center" justifyContent="center">
            <OptimizeButton onOptimize={handleOptimize} />
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
};

export default App;
// Minimal Vercel serverless function wrapper
// Routes all API requests to the built Express server

let server = null;

async function initializeServer() {
  if (server) return server;
  
  // Dynamically import the built server
  const { default: app } = await import('../app/api-server/dist/index.mjs');
  server = app;
  return server;
}

export default async (req, res) => {
  try {
    const app = await initializeServer();
    return app(req, res);
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

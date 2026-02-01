import app from '../app.js';

// Vercel Serverless Function handler
export default function handler(req, res) {
  return app(req, res);
}


const getBackendUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000/';
    }
  }
  // In production, using relative URL '/' is recommended.
  // This works out-of-the-box if deploying as a single project (monorepo) on Vercel,
  // or if using Vercel rewrites (proxies) in a multi-project deployment.
  // If you prefer to call the backend directly on a different domain, replace '/' with your backend URL (e.g., 'https://your-api.vercel.app/').
  return '/';
};

export const url: string = getBackendUrl();
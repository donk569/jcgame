import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AppStoreProvider } from './store/AppStore';
import './index.css';

// 部署在子路径时（如 GitHub Pages 的 /jcgame/）路由要跟着走；
// 根路径部署时 BASE_URL 是 '/'，basename 归到 '/'
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppStoreProvider>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </AppStoreProvider>
  </StrictMode>,
);

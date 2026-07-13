import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { DashboardSkeleton } from './components/SkeletonLoader.jsx';
import { PageTransition } from './components/PageTransition.jsx';
import { TransitionProvider, useTransitionDirection } from './components/TransitionContext.jsx';
import './App.css';

// Code-split all routes — each page loads only when first visited
const Welcome      = lazy(() => import('./Web_Welcome_Page/Welcome.jsx').then(m => ({ default: m.Welcome })));
const EnterUserName = lazy(() => import('./Web_Login_Page/Username.jsx').then(m => ({ default: m.EnterUserName })));
const Summarizer   = lazy(() => import('./Web_Profile_Page/Summarizer.jsx').then(m => ({ default: m.Summarizer })));
const Compare      = lazy(() => import('./Web_Compare_Page/Compare.jsx').then(m => ({ default: m.Compare })));

// AnimatePresence must be a child of Router so it can read location
function AnimatedRoutes() {
  const location = useLocation();
  const { direction } = useTransitionDirection();
  return (
    <AnimatePresence custom={direction}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <ErrorBoundary>
              <Suspense fallback={null}>
                <PageTransition>
                  <Welcome />
                </PageTransition>
              </Suspense>
            </ErrorBoundary>
          }
        />
        <Route
          path="/login"
          element={
            <ErrorBoundary>
              <Suspense fallback={null}>
                <PageTransition>
                  <EnterUserName />
                </PageTransition>
              </Suspense>
            </ErrorBoundary>
          }
        />
        <Route
          path="/profile/:username"
          element={
            <ErrorBoundary>
              <Suspense fallback={<DashboardSkeleton />}>
                <PageTransition>
                  <Summarizer />
                </PageTransition>
              </Suspense>
            </ErrorBoundary>
          }
        />
        <Route
          path="/compare/:userA/:userB"
          element={
            <ErrorBoundary>
              <Suspense fallback={<DashboardSkeleton />}>
                <PageTransition>
                  <Compare />
                </PageTransition>
              </Suspense>
            </ErrorBoundary>
          }
        />
        {/* 404 fallback */}
        <Route
          path="*"
          element={
            <PageTransition>
              <div className="state-screen" style={{ position: 'fixed', inset: 0 }}>
                <div className="state-icon">🔭</div>
                <h1 className="state-title">Page not found</h1>
                <p className="state-message">The page you're looking for doesn't exist.</p>
                <a href="/" className="btn-primary" style={{ textDecoration: 'none' }}>Go home</a>
              </div>
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <TransitionProvider>
        <AnimatedRoutes />
      </TransitionProvider>
    </Router>
  );
}

export default App;
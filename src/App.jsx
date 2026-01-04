import React, { Suspense, lazy } from 'react';
import './App.scss';
import Content from './Components/Content'; // Keep Home eager for LCP

import Header from './Components/Header';
import Footer from './Components/Footer';
import { ThemeProvider } from './context/ThemeContext';
import { lazyWithPreload } from './utils/lazyWithPreload';

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

// Lazy load components
const PublicationComponenet = lazy(() => import('./Components/Publications'));
const ProjectsComponent = lazy(() => import('./Components/Projects'));
const BlogComponent = lazy(() => import('./Components/Blog'));
const BlogPostComponent = lazy(() => import('./Components/BlogPost'));
const GalleryAudit = lazy(() => import('./Components/GalleryAudit'));
const NamingHelper = lazy(() => import('./Components/NamingHelper'));

// Use lazyWithPreload for Photography page to enable intent-based prefetching
const PhotographyContainer = lazyWithPreload(() => import('./Components/Photography'));

// Simple loading spinner
const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '60vh', 
    color: 'var(--accent-color)',
    fontFamily: 'var(--heading-font)',
    fontSize: '1.2rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em'
  }}>
    Loading...
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <Router basename="/portfolio">
          <div className="app-layout">
            <Header />
            <main className="dynamic-area">
              <div className="site-content">
                <Suspense fallback={<LoadingSpinner />}>
                  <Switch>
                    <Route exact path="/projects">
                      <ProjectsComponent />
                    </Route>
                    <Route exact path="/blog">
                      <BlogComponent />
                    </Route>
                    <Route path="/blog/:slug">
                      <BlogPostComponent />
                    </Route>

                    <Route path="/naming-helper">
                      <NamingHelper />
                    </Route>
                    <Route path="/publications">
                      <PublicationComponenet />
                    </Route>
                    <Route exact path="/photography">
                      <PhotographyContainer />
                    </Route>

                    <Route path="/audit">
                       <GalleryAudit />
                    </Route>
                    <Route exact path="/">
                      <Content />
                    </Route>
                  </Switch>
                </Suspense>
              </div>
            </main>
            <Footer />
          </div>
        </Router>
      </div>
    </ThemeProvider>
  );
}

export default App;
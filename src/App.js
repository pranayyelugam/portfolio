import React, { useState, useEffect } from 'react';
import './App.scss';
import Content from './Components/Content';
import Header from './Components/Header';
import Footer from './Components/Footer';
import MapPageComponent from './Components/MapPage';
import BooksComponent from './Components/Books';
import MapUser from './Components/MapUser'
import PublicationComponenet from './Components/Publications'

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import ProjectsComponent from './Components/Projects';
import BlogComponent from './Components/Blog';
import PhotographyContainer from './Components/Photography';


function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile({ isMobile: window.innerWidth < 480 });
  }, []);

  return (
    <div className="App">
      <Router>
        <Header />
        <div className="dynamic-area">
          <div className="site-content">
            <Switch>
              <Route path="/portfolio/maps/:id" >
                <MapUser />
              </Route>
              <Route exact path="/portfolio/projects/how_many_indian_cities_can_you_name">
                <MapPageComponent />
              </Route>
              <Route exact path="/portfolio/projects">
                <ProjectsComponent isMobile={isMobile} />
              </Route>
              <Route path="/portfolio/blog">
                <BlogComponent />
              </Route>
              <Route path="/portfolio/books">
                <BooksComponent />
              </Route>
              <Route path="/portfolio/publications">
                <PublicationComponenet />
              </Route>
              <Route path="/portfolio/interests">
                <BooksComponent />
              </Route>
              <Route exact path="/portfolio/photography">
                <PhotographyContainer />
              </Route>
              <Route exact path="/portfolio">
                <Content />
              </Route>
            </Switch>
          </div>
        </div>
      </Router>

      <Footer />

    </div>
  );
}

export default App;
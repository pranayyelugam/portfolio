import React from 'react';
import './App.scss';
import Content from './Components/Content';
import Header from './Components/Header';
import Footer from './Components/Footer';
import BlogComponent from './Components/Blog';
import BooksComponent from './Components/Books';
import MapUser from './Components/MapUser'

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import ProjectsComponent from './Components/Projects';


function App() {
  return (
    <div className="App">
      <Router basename={process.env.PUBLIC_URL}>
        <Header />
        <div className="dynamic-area">
          <div className="site-content">
            <Switch>
              <Route path={process.env.PUBLIC_URL + '/portfolio/maps/:id'}  >
                <MapUser />
              </Route>
              <Route exact path={process.env.PUBLIC_URL + '/portfolio/projects/indiacities'} >
                <BlogComponent />
              </Route>
              <Route exact path={process.env.PUBLIC_URL + '/portfolio/projects'} >
                <ProjectsComponent />
              </Route>
              <Route path={process.env.PUBLIC_URL + '/portfolio/cv'} >
                <BooksComponent />
              </Route>
              <Route path={process.env.PUBLIC_URL + '/portfolio/books'} >
                <BooksComponent />
              </Route>
              <Route path={process.env.PUBLIC_URL + '/portfolio/interests'} >
                <BooksComponent />
              </Route>
              <Route exact path={process.env.PUBLIC_URL + '/portfolio'} >
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
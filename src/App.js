import React from 'react';
import './App.scss';
import Content from './Components/Content';
import Header from './Components/Header';
import Footer from './Components/Footer';
import BlogComponent from './Components/Blog';
import BooksComponent from './Components/Books';

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";


function App() {
  return (
    <div className="App">
      <Router>
        <Header />
        <div className="dynamic-area">
          <div className="site-content">
            <Switch>
              <Route path="/portfolio/blog">
                <BlogComponent />
              </Route>
              <Route path="/portfolio/cv">
                <BlogComponent />
              </Route>
              <Route path="/portfolio/books">
                <BooksComponent />
              </Route>
              <Route path="/portfolio/interests">
                <BlogComponent />
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

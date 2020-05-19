import React from 'react';
import logo from './logo.svg';
import './App.scss';
import Content from './Content';
import Header from './Components/Header';

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import Footer from './Components/Footer';
import BlogComponent from './Components/Blog';
import BooksComponent from './Components/Books';

function App() {
  return (
    <div className="App">
      <Router>
        <div className="dynamic-area">
          <div className="site-content">
            <div className="nav-menu"><Header /></div>
            <Switch>
              <Route path="/blog">
                <BlogComponent />
              </Route>
              <Route path="/cv">
                <BlogComponent />
              </Route>
              <Route path="/books">
                <BooksComponent />
              </Route>
              <Route path="/interests">
                <BlogComponent />
              </Route>
              <Route exact path="/">
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

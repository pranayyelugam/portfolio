import React from 'react';
import logo from './logo.svg';
import './App.scss';
import Content from './Content';
import Header from './Components/Header';
import Blog from './Components/Blog';

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import Footer from './Components/Footer';

function App() {
  return (
    <div className="App">
      <Router>
        <div className="dynamic-area">
          <div className="site-content">
            <div className="nav-menu"><Header /></div>
            <Switch>
              <Route path="/blog">
                <Blog />
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

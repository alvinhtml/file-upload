/* @flow */

import * as React from 'react';
import ReactDOM, {render} from 'react-dom';
import {BrowserRouter, Switch, Route, Link} from 'react-router-dom';


import {
  Miniui
} from 'react-miniui';
import 'react-miniui/dist/miniui.css';

import Header from '~/components/Header';
import Router from '~/routes';


function App(): React.Node {
  return (
    <React.Fragment>
      <Header />
      <Router />
    </React.Fragment>
  );
}



render(
  <BrowserRouter>
    <div>
      <App />
      <div><Miniui /></div>
    </div>
  </BrowserRouter>,
document.getElementById('webApplication'));

/* @flow */

import * as React from 'react';
import ReactDOM, {render} from 'react-dom';
import {BrowserRouter, Switch, Route, Link} from 'react-router-dom';


// if use react-miniui Modal, import ActiveModal
import {ActiveModal} from 'react-miniui';

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
      <div><ActiveModal /></div>
    </div>
  </BrowserRouter>,
document.getElementById('webApplication'));

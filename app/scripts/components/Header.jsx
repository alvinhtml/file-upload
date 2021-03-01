import React, {Component} from 'react';
import {BrowserRouter, Switch, Route, Link} from 'react-router-dom';

export default class Header extends Component {

  render() {
    return(
      <div style={{padding: '24px'}}>
        <Link to="/welcome">welcome</Link>
         {' ' }| {' '}
        <Link to="/upload">File Upload</Link>
      </div>
    )
  }
}

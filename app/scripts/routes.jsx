/* @flow */

import * as React from 'react';
import {BrowserRouter, Switch, Route, Link} from 'react-router-dom';
import Welcome from './components/Welcome';
import FileUpload from './components/FileUpload';

export default function Router(): React.Node {
  return(
    <Switch>
      <Route exact path='/' component={FileUpload}/>
      <Route path='/welcome' component={Welcome}/>
      <Route path='/upload' component={FileUpload}/>
    </Switch>
  );
}

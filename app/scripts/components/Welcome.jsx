import React, {Component} from 'react';
import {request} from '~/services/SuperAgent';
import SparkMD5 from 'spark-md5';

export default class TodoList extends Component {

  constructor(props) {
    super(props)
  }
  render() {
    return(
      <h1 className="welcome">
        Hello world!
      </h1>
    )
  }
}

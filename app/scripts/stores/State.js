/* @flow */

import {Map} from 'immutable';
import type {Map as MapType} from 'immutable';
import {createStore} from 'redux';
import type {Store} from 'redux';

import {makeRootReducer} from '~/stores/Reducer';

type Action = {
  type: string
};
type KeyPath = Array<string>;
type RootReducer = {
  rootReducer: Function,
  addCursorHandler: Function
}

const {rootReducer, addCursorHandler}: RootReducer = makeRootReducer();

const store: Store<MapType<string, any>, Action> = createStore(rootReducer, new Map());

const {getState, subscribe, dispatch} = store;

export function observe(paths: Array<KeyPath>, listener: Function): Function {
  let state = getState();
  return subscribe(() => {
    const newState = getState();
    if (paths.some(path => state.getIn(path) !== newState.getIn(path))) {
      listener();
    }
    state = newState;
  });
}

export {dispatch, getState, addCursorHandler};

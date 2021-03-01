/* @flow */

import {Map} from 'immutable';
import type {Map as MapType} from 'immutable';
import Cursor from 'immutable-cursor';


type Payload = Object;
type Action = {
  type: string
};
type KeyPath = Array<string>;
type CursorHandler = (cursor: MapType<string, any>, action: Action) => void;
type Reducer = (state: any, action: Action) => any;

// 当 State 更新时，打印 log
function stateLogger(newState: any, prevState: any, changedPath: KeyPath) {
  const newVal = newState.getIn(changedPath);
  console.info('changed', changedPath, ':', newVal);
}


function preventCursorExpires(currState, prevState, changedPath = []) {
  if (prevState !== currState) {
    throw new Error(`Attempted to alter an expired cursor: ${changedPath.join('/')}`);
  }
}

// 创建 Reducer
export function createReducer(
  path: KeyPath,
  handler: CursorHandler
): Reducer {
  return (state: mixed, action: Action) => {
    let currentState = state;

    const onChange = (newState, prevState, changedPath = []) => {
      if (newState === currentState) {
        return;
      }

      if (process.env.NODE_ENV !== 'production') {
        preventCursorExpires(currentState, prevState, changedPath);
        stateLogger(newState, prevState, changedPath);
      }

      currentState = newState;
    };

    // Cursor 提供了可以直接访问深层数据的引用
    const cursor = Cursor.from(state, path, onChange);

    // withMutations 函数内允许创建临时可变副本，例如 list.push(4).push(5).push(6) 只会创建一个list
    cursor.withMutations(c => {
      handler(c, action);
    });

    return currentState;
  };
}

type RootReducer = {
  addCursorHandler: (path: KeyPath, defaultState: mixed, handler: CursorHandler) => void,
  rootReducer: (state: Map<any, any>, action: Action) => Map<string, any>
}

export function makeRootReducer(): RootReducer {
  const reducers = [];
  const defaultStates = [];

  function addCursorHandler(path: KeyPath, defaultState: mixed, handler: CursorHandler): void {
    reducers.push(createReducer(path, handler));
    defaultStates.push({
      path,
      defaultState
    });
  }

  function rootReducer(state: Map<any, any>, action: Action): Map<string, any> {
    while (defaultStates.length > 0) {
      const {path, defaultState} = defaultStates.shift();
      if (process.env.NODE_ENV !== 'production') {
        if (state.hasIn(path)) {
          throw new Error(`path [${path.join(', ')}] already reserved in global redux store`);
        }
      }
      state = state.setIn(path, defaultState);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.groupCollapsed('action', action.type);
      console.info('payload', action);
    }

    state = reducers.reduce((s, reducer) => reducer(s, action), state);

    if (process.env.NODE_ENV !== 'production') {
      console.groupEnd();
    }

    return state;
  }

  return {
    rootReducer,
    addCursorHandler
  };
}

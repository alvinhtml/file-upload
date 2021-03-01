/* @flow */

import {List} from 'immutable';
import {dispatch} from '../stores/State';
import {ActionTypes} from '../Constants';
import {TodoList} from '~/services/TodoList';

export async function loadTodos(): Promise<Array<?Object>> {
  const todos = await new TodoList().get();

  dispatch({
    type: ActionTypes.TODO_LIST_LOAD_SUCCESS,
    todos
  });

  return todos;
}

export async function createTodo(payload: {title: string}): Promise<void> {
  const response = await new TodoList().create(payload);

  // console.log("response", response);
}

export async function removeTodo(id: number): Promise<void> {
  const response = await new TodoList().remove(id);

  // console.log("response", response);
}

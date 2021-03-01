/* @flow */

import superAgent from 'superagent';
import {
  defaultHandler
} from '~/services/ErrorHandler';

const superagent: typeof superAgent = superAgent;

// 将 agent.end 方法改为返回一个 Promise 对象
const promiseWrapper = function(agent) {
  const originEnd = agent.end;
  agent.end = function(callback) {
    return new Promise((resolve, reject) => {
      originEnd.call(agent, (error, res) => {
        if (callback) {
          try {
            resolve(callback(res));
          } catch (err) {
            reject(err);
          }
          return;
        }

        if (res.error) {
          defaultHandler(res);
          reject(res);
          return;
        }

        resolve(res);
      });
    });
  };
};

const errorWrapper = function(agent: typeof superAgent) {
  agent.addErrorHandler = function(callback) {
    agent.on('error', callback);
  };
};

const middleware = function(agent: typeof superAgent): void {
  agent.type('json');
  agent.use(promiseWrapper);
  agent.use(errorWrapper);
};

// 支持 options 请求
superagent.options = function(url: string, data: any, fn: Function) {
  const req = superagent('OPTIONS', url);
  if (typeof data === 'function') {
    fn = data;
    data = null;
  }
  if (data) {
    req.send(data);
  }
  if (fn) {
    req.end(fn);
  }
  return req;
};

type Request = {
  (method: string, url: string): any;
  get: Function;
  post: Function;
  del: Function;
  patch: Function;
  put: Function;
  head: Function;
  options: Function;
}

const request: Request = function(method: string, url: string): any {
  return superagent(method, url).use(middleware);
};

const methodWrapper = function(method: string): Function {
  return function(...args): any {
    return superagent[method](...args).use(middleware);
  };
};

request.get = methodWrapper('get');
request.post = methodWrapper('post');
request.del = methodWrapper('del');
request.patch = methodWrapper('patch');
request.put = methodWrapper('put');
request.head = methodWrapper('head');
request.options = methodWrapper('options');

export {
  request
};

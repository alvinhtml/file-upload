/* @flow */

const errorLogger = function(err: Error) {
  if (err.stack) {
    console.error(err.stack);
  } else {
    console.error(err);
  }
};

// 是否授权错误
function isAuthorityError(err: any): boolean {
  if (err.status !== 403) {
    return false;
  }

  return true;
}

const sessionNotifier = function(err: any) {
  if ([401, 403].includes(err.status) && !isAuthorityError(err)) {
    if (!(err.text && /unix\.sock/.test(err.text))) {
      // 重新登录授权
    }
  }
};

export function defaultHandler(err: any) {
  if (process.env.NODE_ENV !== 'production') {
    errorLogger(err);
  }

  sessionNotifier(err);
}

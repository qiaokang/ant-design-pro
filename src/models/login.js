import { routerRedux } from 'dva/router';
import { stringify } from 'qs';
import { login, getFakeCaptcha } from '../services/api';
import { setAuthority } from '../utils/authority';
import { getPageQuery } from '../utils/utils';
import { reloadAuthorized } from '../utils/Authorized';

export default {
  namespace: 'login',

  state: {
    status: undefined,
  },

  effects: {
    *login({ payload }, { call, put }) {
      const response = yield call(login, payload);
      console.log(response);
      yield put({
          type: 'changeLoginStatus',
          payload: response,
          loginType: payload.type,
        });
      // Login successfully
      if (response.code === '200') {
        // const response = yield call(login, payload);
        // yield put({
        //   type: 'changeLoginStatus',
        //   payload: response,
        // });
        reloadAuthorized();
        const urlParams = new URL(window.location.href);
        const params = getPageQuery();
        let { redirect } = params;
        if (redirect) {
          const redirectUrlParams = new URL(redirect);
          if (redirectUrlParams.origin === urlParams.origin) {
            redirect = redirect.substr(urlParams.origin.length);
            if (redirect.startsWith('/#')) {
              redirect = redirect.substr(2);
            }
          } else {
            window.location.href = redirect;
            return;
          }
        }
        yield put(routerRedux.replace(redirect || '/'));
      }
    },

    *getCaptcha({ payload }, { call }) {
      yield call(getFakeCaptcha, payload);
    },

    *logout(_, { put }) {
      yield put({
        type: 'changeLoginStatus',
        payload: {
          status: false,
          currentAuthority: 'guest',
        },
      });
      reloadAuthorized();
      yield put(
        routerRedux.push({
          pathname: '/user/login',
          search: stringify({
            redirect: window.location.href,
          }),
        })
      );
    },
  },

  reducers: {
    changeLoginStatus(state, { payload, loginType }) {
      // setAuthority(payload.currentAuthority);
      return {
        ...state,
        status: payload.code,
        type: loginType,
      };
    },
  },
};

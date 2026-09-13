import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setCredentials, logout as logoutAction } from '../store/authSlice';
import { authApi } from '../api/auth.api';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const { user: userData, token: userToken } = res.data.data;
    dispatch(setCredentials({ user: userData, token: userToken }));
    return userData;
  };

  const register = async (data: {
    email: string; firstName: string; lastName: string;
    password: string; phone?: string;
  }) => {
    const res = await authApi.register(data);
    const { user: userData, token: userToken } = res.data.data;
    dispatch(setCredentials({ user: userData, token: userToken }));
    return userData;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    dispatch(logoutAction());
  };

  return { user, token, isAuthenticated, isLoading, login, register, logout };
};

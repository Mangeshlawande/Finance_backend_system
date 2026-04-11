export const cookies = {
  accessOptions: () => ({
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   15 * 60 * 1000,           // 15 minutes
  }),
  refreshOptions: () => ({
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
    path:     '/api/v1/auth/refresh',   // only sent to this route!
  }),
  set: (res, accessToken, refreshToken) => {
    res.cookie('access_token',  accessToken,  cookies.accessOptions());
    res.cookie('refresh_token', refreshToken, cookies.refreshOptions());
  },
  clear: res => {
    res.clearCookie('access_token',  cookies.accessOptions());
    res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
  },
};
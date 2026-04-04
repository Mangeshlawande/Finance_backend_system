export const cookies = {
    options: () => ({
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
    }),
    set: (res, name, value) => res.cookie(name, value, cookies.options()),
    clear: (res, name) => res.clearCookie(name, cookies.options()),
};

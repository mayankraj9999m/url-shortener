import {refreshTokens, setCookies, verifyJWTTOKEN} from "../models/auth.model.js";

//! NEW AUTHENTICATION : using access and refresh tokens
export const verifyAuthentication = async (req, res, next) => {
    const accessToken = req.cookies['access_token'];
    const refreshToken = req.cookies['refresh_token'];

    req.user = null;

    if (!accessToken && !refreshToken) {
        return next();
    }

    if (accessToken) {
        req.user = verifyJWTTOKEN(accessToken);
        return next();
    }
    if (refreshToken) {
        try {
            const newRefObject = await refreshTokens(refreshToken);

            if (!newRefObject) return next();

            //* If refresh token is valid
            const newAccessToken = newRefObject?.accessToken;
            const newRefreshToken = newRefObject?.refreshToken;

            req.user = newRefObject?.user;

            //* Setting cookies in client's browser
            setCookies(req, res, newAccessToken, newRefreshToken);

            return next();
        } catch (error) {
            console.log(error.message);
        }
    }
    return next();
}

//* OLD : Only access token
// export const verifyAuthentication = (req, res, next) => {
//     const token = req.cookies['JWT'];
//     if (!token) {
//         req.user = null;
//         return next();
//     }
//
//     try {
//         req.user = verifyJWTTOKEN(token);
//         // console.log(req.user);
//     } catch(error) {
//         req.user = null;
//     }
//     return next();
// }
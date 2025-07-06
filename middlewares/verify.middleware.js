import {verifyJWTTOKEN} from "../models/auth.model.js";

export const verifyAuthentication = (req, res, next) => {
    const token = req.cookies['JWT'];
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        req.user = verifyJWTTOKEN(token);
        // console.log(req.user);
    } catch(error) {
        req.user = null;
    }
    return next();
}
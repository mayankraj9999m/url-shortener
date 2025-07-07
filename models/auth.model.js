import {and, eq} from "drizzle-orm";
import {db} from "../config/db.js";
import {sessionsTable, usersTable} from "../drizzle/schema.js";
// import bcrypt from "bcryptjs";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import {ACCESS_TOKEN_EXPIRY, MILLISECONDS_PER_SECOND, REFRESH_TOKEN_EXPIRY} from "../config/constants.js";

export const getUserByEmail = async (email) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (user) {
        return user;
    } else {
        return false;
    }
}

export const createUser = async (data) => {
    return db.insert(usersTable).values(data);
}

//* Hash function
export const hashPassword = async (pass) => {
    // const salt = await bcrypt.genSalt(10);
    // return await bcrypt.hash(pass, salt);
    return await argon2.hash(pass);
}

//* Compare hashes
export const comparePassword = async (password, hashed) => {
    // return await bcrypt.compare(password, hashed);
    return await argon2.verify(hashed, password);
}

//* Generate JWT Token
//? export const generateToken = (data) => {
//?     return jwt.sign(data, process.env.JWT_SECRET, {expiresIn : "30d"})
//? }

//* Verify JWT Token
export const verifyJWTTOKEN = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
}

//? Creating session, access token, refresh token
export const createSession = async (userId, {ip, userAgent}) => {
    const [session] = await db.insert(sessionsTable).values({userId, ip, userAgent});
    return session;
}

export const createAccessToken = ({id, name, email, sessionId}) => {
    return jwt.sign({id, name, email, sessionId}, process.env.JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND
    });
}

export const createRefreshToken = (sessionId) => {
    return jwt.sign({sessionId}, process.env.JWT_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND
    });
}

//? Find session by ID of the session acquired from refresh token
export const findSessionById = async (sessionId) => {
    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId));
    return session;
}

//? Find user by ID
export const findUserById = async (userId) => {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    return user;
}

//? Refresh Tokens
export const refreshTokens = async (refreshToken) => {
    try {
        const decodedToken = verifyJWTTOKEN(refreshToken);
        const currentSession = await findSessionById(decodedToken.sessionId);

        if (!currentSession || !currentSession.valid) {
            console.error("Invalid Session");
            return null;
        }

        const user = await findUserById(currentSession.userId);

        if(!user) {
            console.error("Invalid User");
            return null;
        }
        const userInfo = {
            id: user.id,
            name: user.name,
            email: user.email,
            sessionId: currentSession.id
        }

        //! Creating refresh and access tokens
        return createTokens(userInfo);

    } catch (error) {
        console.error(error);
        return null;
    }
}

export const setSessionToInvalid = async (sessionId) => {
    await db.update(sessionsTable).set({valid : false}).where(eq(sessionId, sessionsTable.id))
}

export const createTokens = (userInfo) => {
    //! We will create access token
    const accessToken = createAccessToken(userInfo);
    //! We will create refresh token
    const refreshToken = createRefreshToken(userInfo.sessionId);

    return {accessToken, refreshToken, user:userInfo};
}

export const setCookies = (req, res, accessToken, refreshToken) => {
    const baseConfig = {httpOnly: true};
    res.cookie("access_token", accessToken, {
        ...baseConfig, maxAge: ACCESS_TOKEN_EXPIRY
    })
    res.cookie("refresh_token", refreshToken, {
        ...baseConfig, maxAge: REFRESH_TOKEN_EXPIRY
    })
}

// export const getUser = async (credentials) => {
//     const {email, password} = credentials;
//     const [data] = await db.select().from(usersTable).where(
//         and(eq(usersTable.email, email), eq(usersTable.password, password))
//     );
//     if (data) {
//         return data.name;
//     } else {
//         return false;
//     }
// }
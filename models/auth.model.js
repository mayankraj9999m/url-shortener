import { and, eq, lt, gte, sql, or, isNull } from "drizzle-orm";
import { db } from "../config/db.js";
import { oauthAccountsTable, passwordResetTokensTable, sessionsTable, short_link, usersTable, verifyEmailTokensTable } from "../drizzle/schema.js";
// import bcrypt from "bcryptjs";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_EXPIRY, MILLISECONDS_PER_SECOND, REFRESH_TOKEN_EXPIRY } from "../config/constants.js";
import crypto from "crypto";
import { verifyEmailSchema } from "../validators/auth_validator.js";
import fs from "fs";
import path from "path";

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
export const createSession = async (userId, { ip, userAgent }) => {
    const [session] = await db.insert(sessionsTable).values({ userId, ip, userAgent });
    return session;
}

export const createAccessToken = (userInfo) => {
    return jwt.sign(userInfo, process.env.JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY / MILLISECONDS_PER_SECOND
    });
}

export const createRefreshToken = (sessionId) => {
    return jwt.sign({ sessionId }, process.env.JWT_SECRET, {
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

        if (!user) {
            console.error("Invalid User");
            return null;
        }
        const userInfo = {
            id: user.id,
            name: user.name,
            email: user.email,
            isEmailVerified: user.isEmailVerified,
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
    await db.update(sessionsTable).set({ valid: false }).where(eq(sessionId, sessionsTable.id))
}

export const createTokens = (userInfo) => {
    //! We will create access token
    const accessToken = createAccessToken(userInfo);
    //! We will create refresh token
    const refreshToken = createRefreshToken(userInfo.sessionId);

    return { accessToken, refreshToken, user: userInfo };
}

export const setCookies = (req, res, accessToken, refreshToken) => {
    const baseConfig = { httpOnly: true, secure: true };
    res.cookie("access_token", accessToken, {
        ...baseConfig, maxAge: ACCESS_TOKEN_EXPIRY
    })
    res.cookie("refresh_token", refreshToken, {
        ...baseConfig, maxAge: REFRESH_TOKEN_EXPIRY
    })
}

export const getAllShortLinksByUserId = async (userId) => {
    return db.select().from(short_link).where(eq(short_link.userId, userId));
}

export const generateRandomToken = (digit = 8) => {
    const min = 10 ** (digit - 1);
    const max = 10 ** (digit);

    return crypto.randomInt(min, max).toString();
}

export const insertVerifyEmailToken = async ({ userId, token }) => {
    return db.transaction(async (tx) => {
        try {
            //* delete all expired tokens from email verify tokens table
            await tx.delete(verifyEmailTokensTable).where(lt(verifyEmailTokensTable.expiresAt, sql`CURRENT_TIMESTAMP`));
            //* delete all tokens for the specific user
            await tx.delete(verifyEmailTokensTable).where(eq(verifyEmailTokensTable.userId, userId));
            await tx.insert(verifyEmailTokensTable).values({ userId, token });
        } catch (err) {
            console.error("Failed to insert verification token.", err);
            throw new Error("Unable to create verification token");
        }
    })
}

export const createEmailVerifyLink = async (req, { email, token }) => {
    // const uriEncodedEmail = encodeURIComponent(email);
    // return `${req.host}/verify-email-token?token=${token}&email=${uriEncodedEmail}`;

    //! Using URL Api
    const url = new URL(`${req.protocol}://${req.host}/verify-email-token`);
    url.searchParams.append('token', token);
    url.searchParams.append('email', email);

    return url.toString();
}

export const verifyEmailInDatabase = async (req, res, token, email) => {
    const tokenExists = await db.select({ userId: verifyEmailTokensTable.userId }).from(verifyEmailTokensTable).where(
        and(
            eq(verifyEmailTokensTable.token, token),
            gte(verifyEmailTokensTable.expiresAt, sql`CURRENT_TIMESTAMP`)
        )
    );

    if (!tokenExists.length) return null;

    //! Update users table user as a verified USER
    const [isUpdated] = await db.update(usersTable).set({ isEmailVerified: true }).where(
        and(
            eq(usersTable.id, tokenExists[0].userId),
            eq(usersTable.email, email)
        )
    );

    if (!isUpdated.affectedRows) return null;
    const userInfo = {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        isEmailVerified: true,
        sessionId: req.user.sessionId,
    }

    //! Creating new refresh and access tokens and setting them
    const newTokens = createTokens(userInfo);
    setCookies(req, res, newTokens.accessToken, newTokens.refreshToken);

    //! Delete that token now
    const isDeleted = await db.delete(verifyEmailTokensTable).where(
        eq(verifyEmailTokensTable.token, token)
    );

    return true;
}

export const changeNameInMySQL = async (name, id) => {
    return db.update(usersTable).set({ name }).where(eq(usersTable.id, id));
};

export const changeProfileUrlInMySql = async (data) => {
    const [userDetail] = await db.select().from(usersTable).where(eq(data.id, usersTable.id));
    
    if (userDetail.avatarUrl && userDetail.avatarUrl.startsWith("public/")) {
        const filePath = path.join(import.meta.dirname, "..", "public", `${userDetail.avatarUrl}`);
        
        fs.unlinkSync(filePath);
    }
    return db.update(usersTable).set(data).where(eq(usersTable.id, data.id));
}

export const changePasswordInMySql = async (credentials, userId) => {
    const { currPassword, newPassword, confirmNewPassword } = credentials;
    const [hashed] = await db.select({ hashed: usersTable.password }).from(usersTable).where(eq(userId, usersTable.id));

    if (!hashed || !hashed?.hashed) {
        return false;
    }
    if (!await comparePassword(currPassword, hashed?.hashed)) {
        return false;
    }

    const newHashed = await hashPassword(newPassword);

    return db.update(usersTable).set({ password: newHashed }).where(eq(usersTable.id, userId));
}

export const insertResetTokenInDatabase = async (tokenHash, userId) => {
    return db.insert(passwordResetTokensTable).values({ userId, tokenHash });
}

export const resetPasswordLink = (req, token) => {
    //! Using URL Api
    const url = new URL(`${req.protocol}://${req.host}/forgot-password/${token}`);
    return url.toString();
}

export const validatePasswordResetToken = async (tokenHash) => {
    return db.select().from(passwordResetTokensTable).where(
        and(
            eq(tokenHash, passwordResetTokensTable.tokenHash),
            gte(passwordResetTokensTable.expiresAt, sql`CURRENT_TIMESTAMP`)
        )
    )
}

export const resetPasswordInMySql = async (credentials, userId) => {
    const { newPassword } = credentials;
    const newHashed = await hashPassword(newPassword);

    return db.update(usersTable).set({ password: newHashed }).where(eq(usersTable.id, userId));
}

export const deleteResetTokens = async (token) => {
    return db.delete(passwordResetTokensTable).where(
        or(
            eq(token, passwordResetTokensTable.tokenHash),
            lt(passwordResetTokensTable.expiresAt, sql`CURRENT_TIMESTAMP`)
        )
    )
}

//! Get user with OAuth ID
export async function getUserWithOauthId({ email, provider }) {
    const [user] = await db
        .select({
            id: usersTable.id,
            name: usersTable.name,
            email: usersTable.email,
            isEmailVerified: usersTable.isEmailVerified,
            providerAccountId: oauthAccountsTable.providerAccountId,
            provider: oauthAccountsTable.provider,
        })
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .leftJoin(
            oauthAccountsTable,
            and(
                eq(oauthAccountsTable.provider, provider),
                eq(oauthAccountsTable.userId, usersTable.id)
            )
        );
    return user;
}

export async function linkUserWithOauth({ userId, provider, providerAccountId, avatarUrl }) {
    db.insert(oauthAccountsTable).values({
        userId,
        provider,
        providerAccountId,
    });

    if (avatarUrl) {
        await db.update(usersTable).set({ avatarUrl }).where(
            and(
                eq(usersTable.id, userId),
                isNull(usersTable.avatarUrl)
            )
        )
    }
}

export async function createUserWithOauth({ name, email, provider, providerAccountId, avatarUrl }) {
    const user = await db.transaction(async (trx) => {
        try {
            const [user] = await trx
                .insert(usersTable)
                .values({
                    email,
                    name,
                    // password: "",
                    isEmailVerified: true, // we know that google's email is valid
                    avatarUrl
                });

            await trx.insert(oauthAccountsTable).values({
                provider,
                providerAccountId,
                userId: user.insertId,
            });
            return {
                id: user.insertId,
                name,
                email,
                isEmailVerified: true, // not necessary
                provider,
                providerAccountId,
            };
        } catch (err) {
            console.error(err);
        }
    });

    return user;
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
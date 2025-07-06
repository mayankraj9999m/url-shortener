import {and, eq} from "drizzle-orm";
import {db} from "../config/db.js";
import {usersTable} from "../drizzle/schema.js";
import bcrypt from "bcryptjs";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

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
export const generateToken = (data) => {
    return jwt.sign(data, process.env.JWT_SECRET, {expiresIn : "30d"})
}

//* Verify JWT Token
export const verifyJWTTOKEN = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
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
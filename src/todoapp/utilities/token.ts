import * as jwt from "jsonwebtoken";
import config from "../config";
import * as Errors from "../errors";
import { hashids } from "../api/middleware";

export interface EmailTokenData {
    requestMethod: string;
    requestPath: string;
    emailId: string;
    parameters: any;
    requestBody: any;
}

export interface TokenDataParametersEmail {
    email: string;
    firstName: string;
}

export interface ResetPswTokenData {
    emailId: string;
    parameters: TokenDataParametersEmail;
}

interface TokenConfig {
    secret: string;
    algorithm: string;
    issuer: string;
    expiresIn?: number;
}

export async function generateEmailToken(data: EmailTokenData): Promise<string> {
    return generateToken<EmailTokenData>(data, config.emailToken);
}

export async function verifyEmailToken(token: string): Promise<EmailTokenData> {
    return verifyToken<EmailTokenData>(token, config.emailToken);
}

export async function generateResetPswToken(data: ResetPswTokenData): Promise<string> {
    return generateToken<ResetPswTokenData>(data, config.emailToken);
}


export async function verifyResetPswToken(token: string): Promise<ResetPswTokenData> {
    return verifyToken<ResetPswTokenData>(token, config.emailToken);
}

async function generateToken<T>(data: T, cfg: TokenConfig): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        jwt.sign(data, cfg.secret, {
            algorithm: cfg.algorithm,
            expiresIn: cfg.expiresIn,
            issuer: cfg.issuer,
        }, (err, token) => err ? reject(err) : resolve(token));
    });
}

function verifyToken<T>(token: string, cfg: TokenConfig): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const ignoreExpiration: boolean = !cfg.expiresIn;
        jwt.verify(token, cfg.secret, {
            algorithms: [cfg.algorithm],
            issuer: cfg.issuer,
            ignoreExpiration,
        }, (err: Error, decoded: T) => {
            if (err) {
                // catch unique error
                if (err.name === "TokenExpiredError") {
                    return reject(new Errors.TokenExpired());
                }
                if (err.name === "JsonWebTokenError") {
                    return reject(new Errors.TokenError());
                }
                return reject(err);
            }
            return resolve(decoded);
        });
    });
}

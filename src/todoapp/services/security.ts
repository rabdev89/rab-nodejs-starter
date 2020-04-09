import * as Errors from "../errors";
import * as Md5 from "nodejs-md5";
import { RequestLoggedUser } from "../api/middleware";
import { NextFunction } from "express";
import { UserRow } from "../models/user";
import { SessionRow } from "../models/userSession";

export function getIp(req: RequestLoggedUser) {
    return (req && "clientIp" in req && typeof req.clientIp === "string"
            ? req.clientIp
            : "::ffff:127.0.0.1");
}

export function getUserAgent(req: RequestLoggedUser) {
    return req.get("user-agent");
}

export interface IpHolder {
    resolvedIp: string;
}


export function encodeEtag(value: string): string {
    let encoded: string;
    Md5.string.quiet(value, (err, md5) => {
        if (err) {
            return Promise.reject(new Errors.BadGatewayError());
        } else {
            encoded = md5;
        }
    });
    return encoded;
}

export async function isAuthenticate(req: RequestLoggedUser, res: Response, next: NextFunction) {
    try {
        await isUserAuthenticate(req, true);
        next();
    } catch (err) {
        return next(err);
    }
}

export async function isUserAuthenticate(req: RequestLoggedUser, updateExpiredDate: boolean = true): Promise<void> {

}

export async function sessionExpired(sessionRow: SessionRow): Promise<boolean> {
    const nowInUTC = new Date();
    nowInUTC.setMinutes(nowInUTC.getMinutes() + nowInUTC.getTimezoneOffset());
    if (sessionRow.expiredAt < nowInUTC) {

        return Promise.resolve(true);
    }
    return Promise.resolve(false);
}

export async function createSession(
    user: UserRow,
    expiredAt: Date,
    rememberMe: boolean,
): Promise<any> {
    try {

    } catch (err) {
        console.log(err, "End createSession");
        // noinspection ES6MissingAwait
        return Promise.reject(err);
    }
}

export function sessionParam() {
    return (target: any, key: string, index: number) => {
        const flowKey = getSessionParamIndex(key);
        target[flowKey] = index;
    };
}

function getSessionParamIndex(methodName: string) {
    return `__${methodName}_session_param_index`;
}

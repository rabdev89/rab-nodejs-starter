import { NextFunction, Request, Response } from "express";
import * as Errors from "../errors";
import { ERROR_CODE } from "../errors";
import * as CookieSessionObject from "cookie-session";
import config from "../config";

const Hashids = require("hashids/cjs");

const mung = require("express-mung");

export const hashids = new Hashids(config.hashids.salt, config.hashids.alphabetLength, config.hashids.alphabet);

export const validate = (schema) => async (req: any, res: Response, next: NextFunction) => {
    req.check(schema);
    const arrayError = [];
    const showedErrors = [];
    const result = await req.getValidationResult();
    if (!result.isEmpty()) {
        result.array().forEach((element) => {
            if (showedErrors.indexOf(element.param) < 0) {
                const codeErr = ((schema[element.param].codeError)
                                 ? Number(schema[element.param].codeError)
                                 : ERROR_CODE.VALIDATION_ERROR);
                arrayError.push(new Errors.ValidationError(
                    `${element.param} - ${element.msg.toLowerCase()}`,
                    codeErr,
                    element.param,
                ));
                showedErrors.push(element.param);
            }
        });
        next(arrayError);
    } else {
        next();
    }
};

export type RequestLoggedUser = Request & CookieSessionObject;


export const Middleware = {
    Authenticator: Symbol("Middleware.authenticator"),
};

export const decodeQueryString = (pid: string, paramName?: string): number => {
    const errorMessage: string = paramName ? paramName + " - invalid public id value" : "Public Id incorrect value";
    if (pid === null) {
        return null;
    }
    if (!pid) {
        throw new Errors.ValidationIdError(errorMessage, paramName);
    }
    const value: number[] = hashids.decode(pid);
    if (value.length > 0) {
        if (value[0] < 1) {
            throw new Errors.ValidationIdError(errorMessage, paramName);
        }
        return value[0];
    } else {
        throw new Errors.ValidationIdError(errorMessage, paramName);
    }
};

export const decodeEachInObject = (obj: any) => {
    for (const key in obj) {
        if (!obj.hasOwnProperty(key) || (!key.endsWith("Id") &&
            !key.endsWith("Ids") && !key.endsWith("IdsIn") &&
            key !== "id")) {
            continue;
        }
        if ((key.endsWith("IdsIn") || key.endsWith("Ids")) && typeof obj[key] === "string") {
            obj[key] = obj[key].split(",");
        }
        if (Array.isArray(obj[key])) {
            obj[key] = obj[key].map((value) => {
                if (typeof value === "string") {
                    return decodeQueryString(value, key);
                } else {
                    decodeEachInObject(value);
                    return value;
                }
            });
            continue;
        }
        obj[key] = decodeQueryString(obj[key], key);
    }
};


const encodeArrayOfIds = (id): string => {
    if (typeof id === "number") {
        return hashids.encode(id);
    }
    return id;
};

export const encodeEachInObject = (obj: any) => {
    for (const key in obj) {
        if (!obj.hasOwnProperty(key) || !key.endsWith("Id") && !key.endsWith("Ids") && key !== "id") {
            continue;
        }
        if (typeof obj[key] === "number") {
            obj[key] = hashids.encode(obj[key]);
        } else if (Array.isArray(obj[key])) {
            obj[key] = obj[key].map(encodeArrayOfIds);
        }
    }
    for (const key in obj) {
        if (!obj.hasOwnProperty(key) || typeof obj[key] !== "object") {
            continue;
        }
        if (key === "details" || key === "initSettings") {
            continue;
        }
        encodeEachInObject(obj[key]);
    }
};

export const encodePublicId = mung.json((body) => {
    if (Array.isArray(body)) {
        body.map(encodeEachInObject);
    }
    if (typeof body === "object") {
        encodeEachInObject(body);
    }
});


export function addHeaderCORS(req: Request, res: Response, next: NextFunction) {
    if (res.headersSent) {
        next();
        return;
    }
    if (req.headers.origin !== undefined && typeof req.headers.origin === "string") {
        const origin = req.headers.origin.split("/");
        res.setHeader("Access-Control-Allow-Origin", origin[0] + "//" + origin[2]);
    } else {
        res.setHeader("Access-Control-Allow-Origin", req.protocol + "://" + req.headers.host);
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, HEAD, OPTIONS");
    res.header("Access-Control-Expose-Headers", "Overwrite, Destination, Content-Type, Depth, User-Agent, " +
        "X-File-Size, X-Requested-With, If-Modified-Since, X-File-Name, Cache-Control, Content-Language, " +
        "Expires, Last-Modified, Pragma, Cookie, Authorization, Idempotency-Key, " +
        "x-response-current-currency-code, x-response-current-language-code, x-response-default-currency-code, " +
        "x-response-default-language-code, x-response-is-active, x-response-pagination, x-response-pagination-limit, " +
        "x-response-pagination-offset, x-response-pagination-size, x-response-total, x-response-total-affected, " +
        "x-response-campaign-name-exists, x-response-maintenance-mode-start, x-response-maintenance-mode-end");
    if (req.method === "OPTIONS") {
        if (req.header("Access-Control-Request-Headers")) {
            res.setHeader("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers"));
        }
        res.status(204).end();
    } else {
        next();
    }
}

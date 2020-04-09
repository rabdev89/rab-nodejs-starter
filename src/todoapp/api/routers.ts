import * as express from "express";
const reexpress = require('express');
import { NextFunction, Request, Response } from "express";
import config, {
} from "../config";
import * as Errors from "../errors";
import { BadRequest, InternalServerError, SWError, ValidationError, ValidationUploadFileError } from "../errors";
import { interfaces } from "inversify";
import * as moment from "moment";
import {addHeaderCORS, encodePublicId} from "./middleware";
import { stripTags, stripTagsLength } from "../utilities/string";
import {
    isDateTime,
    isDateTimeNoGMT,
    isEmpty,
    isHashedId,
    isNull,
    isUndefined,
} from "../utilities/validator";
import { MulterError } from "multer";
import { getDateFromDateTime, getDateTimeFormat } from "../utilities/date";
import { IpHolder } from "../services/security";

const compression = require("compression");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const cookieSession = require("cookie-session");
const expressValidator = require("express-validator");
const codes = Errors.codes.routers;
const cookieSessionConfig = {
    name: "user-session",
    secret: config.cookieSessions.secret,
};
const requestIp = require("request-ip");

export function setupConfig(app: express.Application, container: interfaces.Container): express.Application {
    app.use(require("express-validator")());
    app.use(cookieSession(cookieSessionConfig));
    app.use(compression({}));
    app.use(bodyParser.urlencoded({
        limit: "50mb", extended: true, parameterLimit: 52428800,
    }));
    app.use(bodyParser.json({
        type: "application/json",
    }));
    app.use(methodOverride());
    app.use(validator);
    app.use(encodePublicId);
    app.use(requestIp.mw());
    app.use("/v1/*", requestLogger);
    app.use("/v1/*", addHeaderCORS);
    app.set("etag", false);

    return app;
}

export function afterSetupConfig(app: express.Application, container: interfaces.Container): express.Application {
    app.use(errorHandler);

    return app;
}

export function errorHandler(err: any,
                             req: Request & IpHolder,
                             res: Response/* & TranslatorHolder*/,
                             next: NextFunction): any {
    const reqData = requestLogData(req);

    if (res.headersSent) {
        console.log(err, "HTTP headers have already been sent", reqData);
        return next(err);
    }
    if (req.method !== "HEAD" && req.method !== "GET") {
        res.set("x-response-total-affected", "0");
    }
    if (req.method === "GET") {
        res.set("x-response-total", "0");
    }
    if (req.method === "HEAD" && err.code && err.message) {
        res.set("x-response-error-code", String(err.code));
        res.set("x-response-error-message", err.message);
    }

    if (err) {
        let error: SWError;
        // const objError = [];
        if (err instanceof SWError) {
            console.log(err, "Error", reqData);
            error = err as SWError;
        } else if (err instanceof SyntaxError) {
            console.log(err, "Validation Json Error", reqData);
            error = new BadRequest(codes.error11112001);
        } else if (err instanceof TypeError) {
            console.log(err, "Validation Type Json Error", reqData);
            error = new BadRequest(codes.error11112002);
        } else if (err instanceof MulterError) {
            console.log(err, "An error occurred during uploading file", reqData);
            error = new ValidationUploadFileError(err.message);
        } else if (Array.isArray(err)) {
            console.log(err, "An error occurred during validation method input parameters: ", reqData);
            error = err[0];
            if (err.length > 1) {
                const errorMsg = [];
                err.forEach((element) => {
                    errorMsg.push(element.message);
                });
                const messages = errorMsg.join(", ");
                err.unshift(new ValidationError(`Validation errors: ${messages}`, err[0].code));
                res.status(err[0].responseStatus).json(getErrorResponse(err/*, res.translator*/));
                next();
            }
        } else if (err.code === "LIMIT_FILE_SIZE") {
            console.log(err, "Validation Error Values", reqData);
            error = new BadRequest(codes.error11112003);
        } else if (err.message !== undefined && err.statusCode !== undefined) {
            console.log(err, "Error", reqData);
            error = new SWError(err.status, err.statusCode, err.message);
        } else {
            console.log(err, "Internal error", reqData);
            error = new InternalServerError(err);
        }
        if (req.method === "HEAD" && error.code && error.message) {
            res.set("x-response-error-code", String(error.code));
            res.set("x-response-error-message", error.message);
        }
        res.status(error.responseStatus).json(getErrorResponse(error/*, res.translator*/));
    }
}

export interface ErrorResponse {
    code: number;
    message: string;
    param?: string;
    extraData?: any;
    parameters?: ErrorResponse[];
    providerDetails?: object;
}

export function getErrorResponse(error: SWError | SWError[],
                                 /*translator: Translator = (key: string, errorData?: ErrorData) => error.message*/
): ErrorResponse[] {

    const parameters: ErrorResponse[] = [];
    if (Array.isArray(error)) {
        error.forEach((element) => {
            if (typeof element.param === "string") {
                parameters.push({
                    code: element.code,
                    message: element.message,
                    param: element.param,
                });
            }
        });
        return error[0].decorateResponseWithData({
            code: error[0].code,
            message: /*error.translateMessage ? getErrorMessageTranslation(error, translator) : */error[0].message,
            parameters,
        });
    } else {
        if (typeof error.param === "string") {
            parameters.push({
                code: error.code,
                message: error.message,
                param: error.param,
            });
        }
        return error.decorateResponseWithData({
            code: error.code,
            message: /*error.translateMessage ? getErrorMessageTranslation(error, translator) : */error.message,
            parameters,
        });
    }

}

const validator = expressValidator({
    customValidators: {
        isTypeNumber: (value) => {
            return (typeof value === "number");
        },
        isJsonOrUndefined: (value) => {
            if (isUndefined(value) || isEmpty(value) || isNull(value)) {
                return true;
            }
            try {
                JSON.parse(value);
                return true;
            } catch (err) {
                return false;
            }
        },
        isJson: (value) => {
            if (String(value).length === 0) {
                return true;
            }
            try {
                JSON.parse(value);
                return true;
            } catch (err) {
                return false;
            }
        },
        codeError: (value) => {
            return true;
        },
        isHashedId: (value) => {
            return (isHashedId(value));
        },
        isHashedIdOrUndefined: (value) => {
            return (isUndefined(value) || isHashedId(value));
        },
        isHashedIdOrNullOrUndefined: (value) => {
            return (isNull(value) || isUndefined(value) || isHashedId(value));
        },
        isHashedIdOrEmptyOrUndefined: (value) => {
            return (isEmpty(value) || isUndefined(value) || isHashedId(value));
        },
        isHashedIdsOrUndefined: (valuesString) => {
            if (valuesString === undefined) {
                return true;
            }
            const values = String(valuesString).split(",");
            for (const value of values) {
                if (!isHashedId(value)) {
                    return false;
                }
            }
            return true;
        },
        isHashedIdArrayOrUndefined: (values) => {
            if (values === undefined) {
                return true;
            }
            if (!Array.isArray(values)) {
                return false;
            }
            for (const value of values) {
                if (!isHashedId(value)) {
                    return false;
                }
            }
            return true;
        },
        isTextOrUndefined: (value) => {
            if (isUndefined(value) || isEmpty(value) || isNull(value)) {
                return true;
            }
            const val = String(value).trim();
            return val.length > 0;
        },
        isTime: (value) => {
            if (isUndefined(value) || isEmpty(value) || isNull(value)) {
                return true;
            }
            return /^([0-1]\d|2[0-3])(:[0-5]\d){2}$/.test(value);
        },
        noGMT: (value) => {
            return isDateTimeNoGMT(value);
        },
        noGMTorUndefined: (value) => {
            if (value === undefined) {
                return true;
            }
            return isDateTimeNoGMT(value);
        },
        isNotFutureDateTime: (value) => {
            if (isDateTime(value)) {
                const res = moment(value, "YYYY-MM-DDThh:ii:ss+hhmm").isValid();
                if (res) {
                    return (new Date(value).getTime() < new Date().getTime());
                }
            }
            return false;
        },
        isFutureDateTime: (value) => {
            if (isDateTime(value)) {
                const res = moment(value, "YYYY-MM-DDThh:ii:ss+hhmm").isValid();
                if (res) {
                    return (new Date(value).getTime() > new Date().getTime());
                }
            }
            return false;
        },
        isFutureDateOrToday: (value) => {
            if (isDateTime(value)) {
                value = getDateFromDateTime(value) + "00:00:00+0000";
                const today = getDateFromDateTime(getDateTimeFormat(new Date())) + "00:00:00+0000";
                const res = moment(value, "YYYY-MM-DDThh:ii:ss+hhmm").isValid();
                if (res) {
                    return (new Date(value).getTime() >= new Date(today).getTime());
                }
            }
            return false;
        },
        isVisibility: (value) => {
            return /^(private|public)$/.test(value);
        }
    },
});

function requestLogData(req: Request) {
    return {
        tag: "http",
        method: req.method,
        url: req.originalUrl,
        query: req.query,
        serverIp: req.ip,
        clientIp: ("clientIp" in req ? req["clientIp"] : null),
        sessionId: ("session" in req && typeof req["session"] === "object" && "sessionId" in req["session"]
                    ? req["session"]["sessionId"]
                    : null),
        sessionUserId: ("session" in req && typeof req["session"] === "object" && "userId" in req["session"]
                        ? req["session"]["userId"]
                        : null),
        body: req.body,
        headers: req.headers,
        userAgent: req.headers["user-agent"],
    };
}

function requestLogger(req: Request, res: Response, next: NextFunction) {
    console.log(requestLogData(req), "Http request");
    next();
}

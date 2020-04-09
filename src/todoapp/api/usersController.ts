import { NextFunction, Response } from "express";
import {
    controller,
    httpDelete,
    httpGet,
    httpHead,
    httpPatch,
    httpPost,
    httpPut,
    interfaces } from "inversify-express-utils";
import { inject } from "inversify";
import { UsersService } from "../services/usersService";
import { InterfaceUsersService, Services } from "../services/services";
import {validateRequestBody, validateRequestFilter} from "../utilities/validator";
import config from "../config";
import { RequestLoggedUser, validate } from "./middleware";
import { UserShortInfo, UserInfo } from "../entities/user";
import { getLastModifiedFormat } from "../utilities/date";
import {encodeEtag, getIp} from "../services/security";
import * as Errors from "../errors";

const validateGetAllUsers = validate({
    // includeInactive: { isStringBooleanOrUndefined: true, codeError: codes.error11001001.code },
    // offset: { isBigIntOrUndefined: true, codeError: codes.error11001002.code },
    // limit: { isBigIntOrUndefined: true, codeError: codes.error11001003.code },
    // sortBy: { isAlphabeticOrUndefined: true, codeError: codes.error11001004.code },
    // sortOrder: { isSortOrderOrUndefined: true, codeError: codes.error11001005.code },
    // searchUsers: { isSearchOrUndefined: true, codeError: codes.error11001006.code },
});

@controller("/v1")
export class UsersController implements interfaces.Controller {
    constructor(@inject(Services.Users) private usersService: InterfaceUsersService) {

    }

    @httpGet("/users")
    public async getAllUsers(req: RequestLoggedUser, res: Response, next: NextFunction) {
        try {
            await validateRequestFilter([
                "includeInactive",
                "offset",
                "limit",
                "sortBy",
                "sortOrder",
                "searchUsers",
            ], req.query);

            const users: UserShortInfo[] = await this.usersService.getAll(req.query, req.session);
            const size: string = (users) ? String(users.length) : "0";
            res.set("x-response-total", String(this.usersService.usersTotal));
            res.set("x-response-pagination", "1");
            res.set("x-response-pagination-size", size);
            res.set("x-response-pagination-offset", String(this.usersService.usersOffset));
            res.set("x-response-pagination-limit", String(this.usersService.usersLimit));
            res.send(users).end();
            next();

        } catch (err) {
            console.log(err, "End getAllUsers Error");
            next(err);
        }
    }

    @httpGet("/users/:id")
    public async getOneUser(req: RequestLoggedUser, res: Response, next: NextFunction) {
        try {
            await validateRequestFilter([
                "includeInactive",
                "currencyCode",
            ], req.query);
            const user: UserInfo = await this.usersService.getOneInfo(req.params.id, req.query, req.session);
            res.set("x-response-total", "1");
            res.set("x-response-pagination", "0");
            res.set("Last-Modified", getLastModifiedFormat(user.updatedAt));
            res.send(user).end();
        } catch (err) {
            res.set("x-response-total", "0");
            console.log(err, "End getOneUser Error");
            next(err);
        }
    }

    @httpPost("/users/login")
    public async loginUser(req: RequestLoggedUser, res: Response, next: NextFunction) {
        try {
            await validateRequestBody([
                "email",
                "password",
                "rememberMe",
            ], req.body);
            const result: UserInfo = await this.usersService.login(req.body, req.session, req);
            req.session.userId = result.id;
            res.set("x-response-total-affected", "1");
            res.send(result);
            next();
        } catch (err) {
            console.log(err, "End log in User Error");
            next(err);
        }
    }

    @httpPost("/users/login/facebook")
    public async loginFacebook(req: RequestLoggedUser, res: Response, next: NextFunction) {
        try {
            await validateRequestBody(["idToken"], req.body, true);
            const result = await this.usersService.loginFacebook(req.body.idToken, req.session, req);
            res.set("x-response-total-affected", "1");
            res.status(200).send(result).end();
        } catch (err) {
            res.set("x-response-total-affected", "0");
            console.log(err, "End loginFacebook Error");
            next(err);
        }
    }

    @httpPost("/users/login/google")
    public async loginGoogle(req: RequestLoggedUser, res: Response, next: NextFunction) {
        try {
            await validateRequestBody(["idToken"], req.body, true);
            const result = await this.usersService.loginGoogle(req.body.idToken, req.session, req);
            res.set("x-response-total-affected", "1");
            res.status(200).send(result).end();
        } catch (err) {
            res.set("x-response-total-affected", "0");
            console.log(err, "End loginGoogle Error");
            next(err);
        }
    }

    @httpDelete("/users/logout")
    public async logoutUser(req: RequestLoggedUser, res: Response, next: NextFunction) {
        try {
            await this.usersService.logoutUser(req.session);
            req.session = null;
            res.set("x-response-total-affected", "1");
            res.status(204).end();
        } catch (err) {
            console.log(err, "End log User out Error");
            res.set("x-response-total", undefined);
            next(err);
        }
    }

    @httpPost("/users")
    public async insertUser(req: RequestLoggedUser, res: Response, next: NextFunction) {
        try {
            await validateRequestBody([
                "email",
                "firstName",
                "lastName",
                "password",
                "birthDay",
                "male",
                "phone",
            ], req.body);
            const result = await this.usersService.addUser(req.body, req.session, req);
            res.set("x-response-total-affected", "1");
            res.status(201);
            res.send(result).end();
        } catch (err) {
            res.set("x-response-total-affected", "0");
            console.log(err, "End insertUser Error");
            next(err);
        }
    }

    @httpPost("/users/insert/many")
    public async insertManyUser(req: RequestLoggedUser, res: Response, next: NextFunction) {
        try {
            await validateRequestBody([
                "email",
                "firstName",
                "lastName",
                "password",
                "birthDay",
                "male",
                "phone",
            ], req.body);
            const result = await this.usersService.addUser(req.body, req.session, req);
            res.set("x-response-total-affected", "1");
            res.status(201);
            res.send(result).end();
        } catch (err) {
            res.set("x-response-total-affected", "0");
            console.log(err, "End insertUser Error");
            next(err);
        }
    }

    @httpPut("/users/password/update")
    public async putUserPassword(req: RequestLoggedUser, res: Response, next: NextFunction) {
        try {
            await validateRequestBody([
                "oldPassword",
                "newPassword",
                "repeatPassword",
                "token",
            ], req.body);
            const userIp = getIp(req);
            await this.usersService.putUserPassword(req.body, req.session, userIp);
            res.status(204).end();
        } catch (err) {
            console.log(err, "End putUserPassword Error");
            next(err);
        }
    }

    @httpPut("/users/password/reset")
    public async putUserPasswordReset(req: RequestLoggedUser, res: Response, next: NextFunction) {
        try {
            await validateRequestBody([
                "email",
            ], req.body);
            await this.usersService.putUserPasswordReset(req.body.email, req.session, req);
            res.status(204).end();
        } catch (err) {
            console.log(err, "End putUserPasswordReset Error");
            next(err);
        }
    }

    @httpPut("/users/:id")
    public async updateUser(req: RequestLoggedUser, res: Response, next: NextFunction) {
        try {
            if (req.body["password"] !== undefined) {
                return Promise.reject(new Errors.ForbiddenError("edit password", 1022));
            }
            await validateRequestBody([
                "email",
                "firstName",
                "lastName",
                "birthDay",
                "male",
                "phone",
                "isActive",
            ], req.body);
            const result = await this.usersService.putUser(
                req.body,
                req.params.id,
                req.session,
                req.get("If-Match"),
            );
            res.set("x-response-total-affected", "1");
            res.set("Last-Modified", getLastModifiedFormat(result.updatedAt));
            res.status(200);
            res.send(result).end();
        } catch (err) {
            res.set("x-response-total-affected", "0");
            console.log(err, "End updateUser Error");
            next(err);
        }
    }

    @httpPatch("/users/:id")
    public async patchUser(req: RequestLoggedUser, res: Response, next: NextFunction) {
        try {
            await validateRequestBody([
                "email",
                "firstName",
                "lastName",
                "birthDay",
                "male",
                "phone",
                "isActive",
            ], req.body, false, true);
            const result = await this.usersService.patchUser(req.body, req.params.id, req.session);
            res.set("x-response-total-affected", "1");
            res.status(200);
            res.send(result).end();
        } catch (err) {
            res.set("x-response-total-affected", "0");
            console.log(err, "End patchUser Error");
            next(err);
        }
    }

    @httpDelete("/users/:id")
    public async deleteUser(req: RequestLoggedUser, res: Response, next: NextFunction) {
        try {
            await this.usersService.deleteUser(Number(req.params.id), req.session);
            res.set("x-response-total-affected", "1");
            res.status(204).end();
        } catch (err) {
            res.set("x-response-total-affected", "0");
            console.log(err, "Deleting User Error");
            next(err);
        }
    }

    @httpGet("/users/session")
    public async getSession(req: RequestLoggedUser, res: Response, next: NextFunction) {
        try {
            const sessionAttrs = await UsersService.getSessionAttrs(req.session);
            res.set("x-response-pagination", "0");
            res.set("x-response-total", "1");
            res.status(200).send(sessionAttrs).end();
        } catch (err) {
            res.set("x-response-pagination", "0");
            res.set("x-response-total", "0");
            console.log(err, "End getSession Error");
            next(err);
        }
    }

    @httpPut("/users/session")
    public async updateSession(req: RequestLoggedUser, res: Response, next: NextFunction) {
        try {
            await validateRequestBody([
                "currencyCode",
                "languageCode",
            ], req.body);
            await UsersService.updateSession(req.body, req.session);
            res.set("x-response-total-affected", "1");
            res.status(204).end();
        } catch (err) {
            res.set("x-response-total-affected", "0");
            console.log(err, "End updateSession Error");
            next(err);
        }
    }

    @httpGet("/users/db/config")
    public async getAllConfig(req: RequestLoggedUser, res: Response, next: NextFunction) {
        try {
            res.send(config).end();
            next();

        } catch (err) {
            console.log(err, "End getAllConfig Error");
            next(err);
        }
    }
}

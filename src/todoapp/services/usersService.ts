const mongoose = require('mongoose');
import { injectable } from "inversify";
import { ERROR_CODE, SWError } from "../errors";
import * as Errors from "../errors";
import * as request from "request-promise-native";
import * as generatePassword from "password-generator";
import { OAuth2Client } from "google-auth-library";
import { User, mapUserAttrs, UserRow, UserRowUpdate } from "../models/user";
import { Models } from "../models/models";
import { comparePasswordBCrypt, encodePasswordBCrypt, encodePasswordMD5 } from "../utilities/security";
import { getDateTimeFormat } from "../utilities/date";
import config from "../config";
import {
    createSession, encodeEtag,
    getIp, sessionParam,
} from "./security";
import { decodeQueryString, hashids, RequestLoggedUser } from "../api/middleware";
import {
    ResetPswTokenData,
    verifyResetPswToken,
} from "../utilities/token";
import { trim } from "../utilities/string";
import { isArray } from "../utilities/validator";
import { InterfaceUsersService } from "./services";
import {
    EnumNewUserType, NewSocialUserInfo,
    NewUserInfo,
    PassResetAttempt, UserAttrs, UserChangePassword,
    UserCredentials, UserFacebookAuth,
    UserInfo,
    UserSessionHolder,
    UserShortInfo
} from "../entities/user";
import { GetFilters, UsersFilters } from "../entities/filter";
import {SessionRow, UserSessionAttrs} from "../models/userSession";
import { getUserAgentDetails } from "../utilities/userAgent";

const googleClient = new OAuth2Client(config.googleAPI.clientId);
const userModel = User;
const codes = Errors.codes.usersService;

@injectable()
export class UsersService implements InterfaceUsersService {

    public static async getSessionAttrs(session: UserSessionHolder): Promise<UserSessionAttrs> {
        try {
            let sessionRow: SessionRow;
            const sessionId = parseInt(String(session.sessionId ? session.sessionId : null), 10);

            const userId = parseInt(String(session.userId ? session.userId : null), 10);
            session.userId = (!isNaN(userId) && sessionRow.userId === userId) ? session.userId : null;
            session.sessionId = sessionRow.id;
            // const userSessionAttrs: UserSessionAttrs = sessionRow;
            // return userSessionAttrs;
        } catch (err) {
            console.log(err, "End getSessionAttrs Error");
            // noinspection ES6MissingAwait
            return Promise.reject(err);
        }
    }

    public static getPassResetAttemptsMaxDate(attempts: PassResetAttempt[]): string {
        if (!isArray(attempts) || attempts.length === 0) {
            return null;
        }
        const sorted = attempts.sort((a, b) => {
            return (new Date(a.expiredAt) === new Date(b.expiredAt)) ?
                0 :
                ((new Date(a.expiredAt) > new Date(b.expiredAt)) ? 1 : -1);
        });
        return (sorted[(sorted.length - 1)].expiredAt) ? sorted[(sorted.length - 1)].expiredAt : null;
    }

    public static countPassResetAttemptsMaxDate(attempts: PassResetAttempt[]): number {
        if (!isArray(attempts) || attempts.length === 0) {
            return null;
        }
        let count = 0;
        for (const attempt of attempts) {
            if (new Date(attempt.expiredAt) > new Date()) {
                count++;
            }
        }
        return count;
    }

    public async savePassUpdateAttempts(user: UserRow, userIp: string): Promise<UserAttrs> {
        const userAttrs = mapUserAttrs(user.userAttrs);
        const lastDate = UsersService.getPassResetAttemptsMaxDate(userAttrs.passUpdateAttempts);
        const totalAttempts = UsersService.countPassResetAttemptsMaxDate(userAttrs.passUpdateAttempts);
        if (userAttrs.passUpdateAttempts && totalAttempts >= 5 &&
            new Date(lastDate) > new Date()) {
            // noinspection ES6MissingAwait
            return Promise.reject(new Errors.Forbidden(codes.error12028009));
        } else {
            const expiredDate: Date = new Date();
            expiredDate.setSeconds(expiredDate.getSeconds() + config.resetPassword.expiresIn);
            userAttrs.passUpdateAttempts.push({
                date: getDateTimeFormat(new Date()),
                expiredAt: getDateTimeFormat(expiredDate),
                ip: userIp,
            } as PassResetAttempt);
            await userModel.update(
                { userAttrs, updatedAt: new Date() },
                { where: { _id: user._id }, }
            );
        }
        return userAttrs;
    }

    public static mapShortUserInfo(userList: UserRow, resourceUrl: string = ""): UserShortInfo {
        return {
            _id: userList._id,
            isActive: userList.isActive,
            email: userList.email,
            firstName: userList.firstName,
            lastName: userList.lastName,
            birthDay: getDateTimeFormat(new Date(userList.birthDay)),
            phone: userList.phone,
            createdAt: getDateTimeFormat(userList.createdAt),
            updatedAt: getDateTimeFormat(userList.updatedAt),
        } as UserShortInfo;
    }

    public static mapShortUsersInfo(userList: UserRow[]): UserShortInfo[] {
        const list: UserShortInfo[] = [];
        for (const user of userList) {
            list.push(UsersService.mapShortUserInfo(user));
        }
        return list;
    }

    public static mapUserInfo(userList: UserRow): UserInfo {
        return {
            _id: userList._id,
            isActive: userList.isActive,
            email: userList.email,
            firstName: userList.firstName,
            lastName: userList.lastName,
            birthDay: userList.birthDay ? getDateTimeFormat(new Date(userList.birthDay)) : null,
            male: userList.male,
            phone: userList.phone,
            createdAt: getDateTimeFormat(userList.createdAt),
            updatedAt: getDateTimeFormat(userList.updatedAt)
        } as UserInfo;
    }

    public async addSocialUser(userInfo: NewSocialUserInfo): Promise<UserRow> {
        let user: UserRow;

        userInfo.userAttrs = mapUserAttrs(userInfo.userAttrs);

        const userEmail = userInfo.email.toLowerCase().trim();

        const userExists: UserRow = await userModel.findOne({ where: { email: userEmail } });

        let userExistsAttrs: UserAttrs;
        if (userInfo) {
            userExistsAttrs = mapUserAttrs(userExists.userAttrs);
        }

        const password = generatePassword(12, false);

        if (userExists) {
            const newUser = {
                password: await encodePasswordBCrypt(password),
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
                birthDay: (userExists.birthDay ? userExists.birthDay : null),
                updatedAt: new Date(),
                isActive: true,
                userAttrs: userInfo.userAttrs,
            } as NewUserInfo;

            newUser.userAttrs.activation = true;

            await userModel.update(newUser, { where: { id: userExists._id }});
            user = await userModel.findOne({ where: { id: userExists._id } });

        } else {
            user = await userModel.create({
                password: await encodePasswordBCrypt(password),
                email: userEmail,
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
                birthDay: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                phone: null,
                isActive: true,
                userAttrs: userInfo.userAttrs,
            } as UserRow);
        }

        return user;
    }


    public usersTotal: number = 0;
    public usersOffset: number = 0;
    public usersLimit: number = 50;


    public static  getAllConfig(filters: GetFilters): {
        server: { port: number; host: string }; resetPassword: { expiresIn: number }; emailToken: { expiresIn: number; secret: string; cronSchedule: string; issuer: string; algorithm: string }; googleAPI: { uriDetails: string; uriTextSearch: string; uriNearBySearch: string; clientId: string; uriGeoCode: string; gaViewId: string; clientSecret: string; serviceAccountClientEmail: string; uriAnalyticsReportsBatchGet: string; key: string; serviceAccountPrivateKey: string }; cookieSessions: { expiresIn: number; expiresInWhenRemember: number; secret: string }; siteBaseUrl: any; awsInfo: { bucket: string; accessKeyId: string; secretAccessKey: string; baseUrl: string }; internalServer: { port: number }; logLevel: any; stripe: {}; expansions: { image: string[]; docs: string[]; video: string[] }; maxBigintValue: number; maxIntegerValue: number; cache: { checkPeriod: number; ttl: number }; smtp: { requireTLS: any; port: string | number; auth: { pass: string; user: string }; host: string; secure: any }; emailTemplatesCache: { checkPeriod: number; ttl: number }; basicAuthentication: any; resendActivation: { allowedTime: number }; environment: any; settingsCache: { checkPeriod: number; ttl: number }; notificationTemplatesCache: { checkPeriod: number; ttl: number }; countriesCache: { checkPeriod: number; ttl: number }; hashids: { salt: string; alphabet: string; alphabetLength: number }; region: any; db: { database: string; password: string; port: string | number; host: string; maxIdleTime: number; user: string; connections: string; maxConnections: number }; payPal: {}
    } {
        return config;
    }

    public async getAll(filters: UsersFilters): Promise<UserShortInfo[]> {
        try {
            let usersList;
            let usersListInfo: UserShortInfo[];
            usersList = await userModel.find().then((data: UserRow[]) => {
                return data;
            });
            if (usersList) {
                usersListInfo = await UsersService.mapShortUsersInfo(usersList);
            }

            return usersListInfo;
        } catch (err) {
            console.log(err, "End getAll Error");
            // noinspection ES6MissingAwait
            return Promise.reject(err);
        }
    }

    public async getOneInfo(userId: string,
                            filters: GetFilters,
                            session: UserSessionHolder,
                            needPermission: boolean = true): Promise<UserInfo> {
        let user: UserRow;
        try {
            user = await userModel.findOne({ _id: userId });
            if (user) {
                return UsersService.mapUserInfo(user);
            } else {
                // noinspection ES6MissingAwait
                return Promise.reject(new Errors.NotFound(codes.error12002001));
            }
        } catch (err) {
            console.log(err, "End getOneInfo Error");
            // noinspection ES6MissingAwait
            return Promise.reject(err);
        }
    }

    public async logoutUser(session: UserSessionHolder, needPermission: boolean = true): Promise<void> {
        if (needPermission) {
            // User has no permissions to logout
        }
        session.userId = undefined;
        session.sessionId = undefined;
    }

    public async login(
        credentials: UserCredentials,
        @sessionParam() session: UserSessionHolder,
        req: RequestLoggedUser): Promise<UserInfo> {
        try {
            const filter: object = {
                isActive: true, email: credentials.email.toLowerCase().trim(),
            };
            const user: UserRow = await userModel.findOne({});
            if (!user) {
                // noinspection ES6MissingAwait
                return Promise.reject(new Errors.Unauthorized(codes.error12008002));
            }

            user.userAttrs = mapUserAttrs(user.userAttrs);

            if (user.password !== encodePasswordMD5(trim(credentials.password)) &&
                await comparePasswordBCrypt(trim(credentials.password), user.password) === false
            ) {
                // noinspection ES6MissingAwait
                return Promise.reject(new Errors.PasswordDoesntMatch());
            }

            const expiresIn = (credentials.rememberMe === true) ?
                config.cookieSessions.expiresInWhenRemember :
                config.cookieSessions.expiresIn;
            const expiredDate: Date = new Date();
            expiredDate.setSeconds(expiredDate.getSeconds() + expiresIn);

            return await this.getOneInfo(user._id, {}, session);
        } catch (err) {
            console.log(err, "End login Error");
            // noinspection ES6MissingAwait
            return Promise.reject(err);
        }
    }


    public async loginFacebook(
        idToken: string,
        @sessionParam() session: UserSessionHolder,
        req: RequestLoggedUser): Promise<UserInfo> {
        try {
            const facebookRes: UserFacebookAuth = await request.get({
                uri: "https://graph.facebook.com/me",
                qs: {
                    access_token: idToken,
                    fields: "id,first_name,last_name,email",
                    format: "json",
                    method: "get",
                },
                json: true,
            }).catch((err) => {
                console.log(err, "End loginFacebook err");
                const message = err.error.error.message;
                // noinspection ES6MissingAwait
                return Promise.reject(new SWError(err.statusCode, ERROR_CODE.ERROR_LOGIN_TO_FB, message));
            });
            if (!facebookRes.email) {
                // noinspection ES6MissingAwait
                return Promise.reject(new Errors.BadRequest(codes.error12030002));
            }
            let user: UserRow = await userModel.findOne({
                email: facebookRes.email.toLowerCase().trim()
            });


                if (user) {
                    if (user.isActive === false) {
                        return Promise.reject(new Errors.BadRequest(codes.error12031003));
                    }
                    const userAttrs = mapUserAttrs(user.userAttrs);

                    if (userAttrs.facebookId === null ||
                        userAttrs.facebookId.toString() !== facebookRes.id.toString()
                    ) {
                        userAttrs.facebookId = facebookRes.id.toString();
                        // return Promise.reject(new Errors.BadRequest(codes.error12030001));
                        await userModel.update({
                            userAttrs,
                            updatedAt: new Date(),
                        }, {
                            where: { id: user._id }
                        });
                    }
                }

            const filters: GetFilters = { includeInactive: true };
            return await this.getOneInfo(user._id, filters, session, false);
        } catch (err) {
            console.log(err, "End loginFacebook Error");
            // noinspection ES6MissingAwait
            return Promise.reject(err);
        }
    }


    public async loginGoogle(idToken: string, @sessionParam() session: UserSessionHolder,
                             req: RequestLoggedUser): Promise<UserInfo> {
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: idToken,
                audience: config.googleAPI.clientId,
            }).catch((err) => {
                return Promise.reject(new SWError(400, ERROR_CODE.GOOGLE_CLIENT_TOKEN_ERROR, err.message));
            });
            const payload = ticket.getPayload();
            const googleUserId = payload["sub"];
            const googleUserEmail = payload["email"];
            const googleUserGivenName = payload["given_name"];
            const googleUserFamilyName = payload["family_name"];
            let user: UserRow = await userModel.findOne({
                where: { email: googleUserEmail.toLowerCase().trim() },
            });

                if (user) {
                    if (user.isActive === false) {
                        return Promise.reject(new Errors.BadRequest(codes.error12031003));
                    }
                    const userAttrs = mapUserAttrs(user.userAttrs);
                    if (userAttrs.googleId === null || userAttrs.googleId.toString() !== googleUserId.toString()) {
                        // return Promise.reject(new Errors.BadRequest(codes.error12031001));
                        userAttrs.googleId = googleUserId.toString();
                        await userModel.update({
                            userAttrs,
                            updatedAt: new Date(),
                        }, {
                            where: { id: user._id },
                        });
                    }
                } else {
                    const userAttrs = mapUserAttrs({
                        googleId: googleUserId,
                    });
                    const sessionAttrs = await UsersService.getSessionAttrs(session);
                    user = await this.addSocialUser({
                            type: EnumNewUserType.google,
                            firstName: googleUserGivenName,
                            lastName: googleUserFamilyName,
                            email: googleUserEmail.toLowerCase().trim(),
                            userAttrs
                        });
                }



            const filters: GetFilters = { includeInactive: true };
            return await this.getOneInfo(user._id, filters, session, false);
        } catch (err) {
            console.log(err, "End loginGoogle Error");
            // noinspection ES6MissingAwait
            return Promise.reject(err);
        }
    }


    public async addUser(user: NewUserInfo,
                         @sessionParam() session: UserSessionHolder,
                         req: RequestLoggedUser): Promise<UserInfo> {
        try {
            const ip: string = getIp(req);
            const userEmail = String(user.email).toLowerCase().trim();

            if (!user.password) {
                // noinspection ES6MissingAwait
                return Promise.reject(new Errors.BadRequest(codes.error12004001));
            }

            const userInfo: UserRow = await userModel.findOne({ email: userEmail });
            let userAttrs: UserAttrs;
            if (userInfo) {
                userAttrs = mapUserAttrs(userInfo.userAttrs);

            }

            delete user.userAttrs;
            const newUserAttrs = { activation: true } as UserAttrs;
            const newUser = {
                password: await encodePasswordBCrypt(String(user.password).trim()),
                email: userEmail,
                firstName: String(user.firstName).trim(),
                lastName: String(user.lastName).trim(),
                birthDay: (user.birthDay ? user.birthDay : null),
                createdAt: new Date(),
                updatedAt: new Date(),
                phone: ((user.phone) ? String(user.phone).trim() : null),
                isActive: false, // user will be activated only after confirmation via email
                userAttrs: mapUserAttrs(newUserAttrs),
            } as NewUserInfo;
            let createdUser: UserRow = {} as UserRow;

            if (userInfo) {

                delete newUser.createdAt;

                userAttrs.activation = true;
                newUser.userAttrs = userAttrs;

                await userModel.update(newUser, { _id: userInfo._id });
                createdUser = await userModel.findOne( {
                    email: userEmail
                });
            } else {

                createdUser = await userModel.create(newUser);

            }

            const filters: GetFilters = { includeInactive: true };

            return await this.getOneInfo(createdUser._id, filters, session, false);

        } catch (err) {
            console.log(err, "End addUser Error");
            // noinspection ES6MissingAwait
            return Promise.reject(err);
        }
    }

    public async putUser(user: NewUserInfo,
                         userId: string,
                         session: UserSessionHolder,
                         ifMatch: string): Promise<UserInfo> {
        try {

            delete user.userAttrs;
            user.updatedAt = new Date();
            const findUser = await userModel.findOne({ _id: userId });
            if (findUser) {
                if (ifMatch && ifMatch !== encodeEtag(getDateTimeFormat(findUser.updatedAt))) {
                    // noinspection ES6MissingAwait
                    return Promise.reject(new Errors.PreconditionFailed(codes.error12005009));
                }
                if (user.email) {
                    user.email = String(user.email).toLowerCase().trim();
                    if (await userModel.findOne( {
                        email: user.email,
                        _id: { $ne: userId } })) {
                        // noinspection ES6MissingAwait
                        return Promise.reject(new Errors.BadRequest(codes.error12005010));
                    }
                    if (user.email === findUser.email) {
                        delete user.email;
                    }
                    user.userAttrs.userEmail = user.email;
                }
                await userModel.where({ _id: userId }).update({
                    email: (user.email) ? user.email : findUser.email,
                    firstName: (user.firstName) ? String(user.firstName).trim() : findUser.firstName,
                    lastName: (user.lastName) ? String(user.lastName).trim() : findUser.lastName,
                    birthDay: (user.birthDay) ? user.birthDay : findUser.birthDay,
                    male: (user.male) ? user.male : findUser.male,
                    phone: (user.phone) ? user.phone : null,
                    isActive: (user.hasOwnProperty("isActive")) ? user.isActive : findUser.isActive,
                    updatedAt: new Date(),
                    userAttrs: user.userAttrs,
                } as UserRowUpdate, );

                const filters: GetFilters = { includeInactive: true };

                return await this.getOneInfo(findUser._id, filters, session, false);
            }
            // noinspection ES6MissingAwait
            return Promise.reject(new Errors.UserNotFound());
        } catch (err) {
            console.log(err, "End putUser Error");
            // noinspection ES6MissingAwait
            return Promise.reject(err);
        }
    }


    public async putUserPassword(credentials: UserChangePassword,
                                 @sessionParam() session: UserSessionHolder,
                                 userIp: string): Promise<void> {
        try {
            let user: UserRow;
            let userAttrs: UserAttrs;
            if (session.userId) {
                if (!credentials.oldPassword || !credentials.newPassword || !credentials.repeatPassword) {
                    // noinspection ES6MissingAwait
                    return Promise.reject(new Errors.BadRequest(codes.error12028005));
                }
                user = await userModel.findOne({
                    where: { id: session.userId },
                });
                userAttrs = await this.savePassUpdateAttempts(user, userIp);
                const oldPasswordMd5: string = encodePasswordMD5(trim(credentials.oldPassword));

                if (oldPasswordMd5 !== user.password &&
                    await comparePasswordBCrypt(trim(credentials.oldPassword), user.password) === false) {
                    // noinspection ES6MissingAwait
                    return Promise.reject(new Errors.BadRequest(codes.error12028001));
                }
            } else {
                if (!credentials.token || !credentials.newPassword || !credentials.repeatPassword) {
                    // noinspection ES6MissingAwait
                    return Promise.reject(new Errors.BadRequest(codes.error12028006));
                }
                // const userResetPswToken = await Models.userResetPswTokensModel.findOne({
                //     where: { token: credentials.token },
                // });
                // if (!userResetPswToken) {
                //     // noinspection ES6MissingAwait
                //     return Promise.reject(new Errors.BadRequest(codes.error12028004));
                // }
                // const tokenData: ResetPswTokenData = await verifyResetPswToken(userResetPswToken.token);
                // const emailId: number = decodeQueryString(tokenData.emailId, "emailId");
                // const emailLog: EmailLogRow = await Models.emailLogModel.findOne({ where: { id: emailId } });
                // if (!emailLog) {
                //     // noinspection ES6MissingAwait
                //     return Promise.reject(new Errors.TokenError());
                // }
                // user = await Models.userModel.findOne({
                //     where: { email: emailLog.receivers },
                // });
                // if (!user) {
                //     // noinspection ES6MissingAwait
                //     return Promise.reject(new Errors.BadRequest(codes.error12028007));
                // }
                userAttrs = mapUserAttrs(user.userAttrs);
                if (user.isActive !== true && userAttrs.activation !== true) {
                    // noinspection ES6MissingAwait
                    return Promise.reject(new Errors.BadRequest(codes.error12028010));
                }
                userAttrs = await this.savePassUpdateAttempts(user, userIp);
            }
            if (trim(credentials.newPassword) !== trim(credentials.repeatPassword)) {
                // noinspection ES6MissingAwait
                return Promise.reject(new Errors.BadRequest(codes.error12028002));
            }
            const newPasswordMd5: string = await encodePasswordBCrypt(trim(credentials.newPassword));
            userAttrs.passResetAttempts = [];
            userAttrs.passUpdateAttempts = [];

                await userModel.update(
                    { password: newPasswordMd5, updatedAt: new Date(), },
                    { where: { _id: user._id }}
                );
                // await Models.userResetPswTokensModel.destroy({
                //     where: { userId: user.id }
                // });
                const updateUser = {
                    userAttrs,
                    updatedAt: new Date(),
                } as UserRow;

                if (userAttrs.activation === true) {
                    updateUser.isActive = true;
                    userAttrs.activation = false;
                }
                await userModel.update(updateUser, {
                    where: { _id: user._id }
                });

        } catch (error) {
            console.log(error, "End putUserPassword Error");
            // noinspection ES6MissingAwait
            return Promise.reject(error);
        }
    }


    public async putUserPasswordReset(email: string,
                                      @sessionParam() session: UserSessionHolder,
                                      req: RequestLoggedUser): Promise<void> {
        try {
            const findUser = await userModel.findOne({
                where: { email: String(email).toLowerCase().trim() },
            });
            if (!findUser) {
                // noinspection ES6MissingAwait
                return Promise.reject(new Errors.NotFound(codes.error12027002));
            }
            let permissionAdmin: boolean = false;

            const userAttrs = mapUserAttrs(findUser.userAttrs);
            if (findUser.isActive !== true && userAttrs.activation !== true) {
                // noinspection ES6MissingAwait
                return Promise.reject(new Errors.NotFound(codes.error12027005));
            }
            const lastDate = UsersService.getPassResetAttemptsMaxDate(userAttrs.passResetAttempts);
            const totalAttempts = UsersService.countPassResetAttemptsMaxDate(userAttrs.passResetAttempts);
            const userIp = getIp(req);
            const expiredDate: Date = new Date();
            expiredDate.setSeconds(expiredDate.getSeconds() + config.resetPassword.expiresIn);
            if (userAttrs.passResetAttempts && totalAttempts >= 5 &&
                new Date(lastDate) > new Date()) {
                // noinspection ES6MissingAwait
                return Promise.reject(new Errors.Forbidden(codes.error12027004));
            } else {
                userAttrs.passResetAttempts.push({
                    date: getDateTimeFormat(new Date()),
                    expiredAt: getDateTimeFormat(expiredDate),
                    ip: userIp,
                } as PassResetAttempt);
            }
            // const isAllowedGenerateEmails = await EmailsService.isAllowedGenerateEmails();
            // if (!isAllowedGenerateEmails) {
            //     return;
            // }

            //     await Models.userResetPswTokensModel.destroy({
            //         where: { userId: findUser.id }
            //     });
            //     const userToken = await UsersService.sendResetPswEmail(findUser, req);
            //     await Models.userResetPswTokensModel.create({
            //             userId: findUser.id,
            //             expiredAt: expiredDate,
            //             token: userToken,
            //         } as UserResetPswTokensRow
            //         );
            //     await userModel.update({
            //         userAttrs,
            //         updatedAt: new Date(),
            //     }, {
            //         where: { id: findUser.id }
            //     });
            // });
            // if (!permissionAdmin) {
            //     await this.logoutUser(session, false);
            // }
        } catch (err) {
            console.log(err, "putUserPasswordReset end with error");
            // noinspection ES6MissingAwait
            return Promise.reject(err);
        }
    }

    public static async updateSession(sessionAttrs: UserSessionAttrs, session: UserSessionHolder): Promise<void> {
        try {

                // log.info("Start updateSession", sessionAttrs, session);

                const userSessionAttrs = await UsersService.getSessionAttrs(session);
                if (userSessionAttrs) {
                    await Models.userSessionModel.update({
                        sessionAttrs: userSessionAttrs,
                    }, {
                        where: { id: session.sessionId }
                    });

                } else {
                    // const sessionRow: SessionRow = await createSession(
                    //     null, null, currency, language, false);
                    // session.userId = sessionRow.userId;
                    // session.sessionId = sessionRow.id;
                    // log.info("Start updateSession created new session: ", sessionRow);
                }

        } catch (err) {
            console.log(err, "End updateSession Error");
            // noinspection ES6MissingAwait
            return Promise.reject(err);
        }
    }

    public async patchUser(user: NewUserInfo, userId: string, session: UserSessionHolder): Promise<UserInfo> {
        try {

            user.updatedAt = new Date();
            const findUser = await userModel.findOne({ where: { _id: userId } });
            if (findUser) {
                user.userAttrs = mapUserAttrs(findUser.userAttrs);

                if (user.email) {
                    user.email = String(user.email).toLowerCase().trim();
                    if (await userModel.findOne({ where: { email: user.email, _id: { $not: userId } } })) {
                        // noinspection ES6MissingAwait
                        return Promise.reject(new Errors.BadRequest(codes.error12013007));
                    }
                    if (user.email === findUser.email) {
                        delete user.email;
                    }
                    user.userAttrs.userEmail = user.email;
                }
                if (user.password) {
                    delete user.password;
                    // noinspection ES6MissingAwait
                    return Promise.reject(new Errors.Forbidden(codes.error12013003));
                }

                if (!user.userAttrs.userEmail) {
                    user.userAttrs.userEmail = user.email;
                }


                    user.updatedAt = new Date();
                    await userModel.update(user, { where: { _id: userId }});

                const filters: GetFilters = { includeInactive: true };
                return await this.getOneInfo(userId, filters, session, false);
            }
            // noinspection ES6MissingAwait
            return Promise.reject(new Errors.UserNotFound());
        } catch (err) {
            console.log(err, "End patchUser Error");
            // noinspection ES6MissingAwait
            return Promise.reject(err);
        }
    }


    public async deleteUser(userId: number, @sessionParam() session: UserSessionHolder): Promise<void> {
        try {
            const user = await userModel.findOne({ where: { _id: userId } });
            if (!user) {
                console.log("End deleteUser UserNotFound Error");
                // noinspection ES6MissingAwait
                return Promise.reject(new Errors.UserNotFound());
            }
            await userModel.update(
                { isActive: false, updatedAt: new Date(), },
                { where: { id: userId } }
            );
        } catch (error) {
            console.log(error, "End deleteUser Error");
            // noinspection ES6MissingAwait
            return Promise.reject(new Errors.ValidationError(error.message, 10014));
        }
    }
}

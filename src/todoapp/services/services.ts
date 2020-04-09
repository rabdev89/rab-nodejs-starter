import {
    UserSessionHolder,
    UserShortInfo,
    UserInfo,
    UserChangePassword,
    NewUserInfo,
    UserCredentials
} from "../entities/user";
import { GetFilters } from "../entities/filter";
import { RequestLoggedUser } from "../api/middleware";
import config from "../config";

export interface InterfaceUsersService {
    usersTotal: number;
    usersOffset: number;
    usersLimit: number;

    getAll(filters: GetFilters, session: UserSessionHolder): Promise<UserShortInfo[]>;

    getOneInfo(id: string, filters: GetFilters, session: UserSessionHolder): Promise<UserInfo>;

    login(credentials: UserCredentials, session: UserSessionHolder, req: RequestLoggedUser): Promise<UserInfo>;

    logoutUser(session: UserSessionHolder): Promise<void>;

    loginFacebook(idToken: string, session: UserSessionHolder, req: RequestLoggedUser): Promise<UserInfo>;

    loginGoogle(idToken: string, session: UserSessionHolder, req: RequestLoggedUser): Promise<UserInfo>;

    addUser(user: NewUserInfo, session: UserSessionHolder, req: RequestLoggedUser): Promise<UserInfo>;

    putUser(user: NewUserInfo, userId: string, session: UserSessionHolder, ifMatch: string): Promise<UserInfo>;

    patchUser(user: NewUserInfo, userId: string, session: UserSessionHolder): Promise<UserInfo>;

    deleteUser(userId: number, session: UserSessionHolder): Promise<void>;

    putUserPassword(credentials: UserChangePassword, session: UserSessionHolder, userIp: string): Promise<void>;

    putUserPasswordReset(email: string, session: UserSessionHolder, req: RequestLoggedUser): Promise<void>;

}


export const Services = {
    Users: Symbol.for("UsersService"),
};

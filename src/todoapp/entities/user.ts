export interface PassResetAttempt {
    date: string;
    expiredAt: string;
    ip: string;
}

export interface UserCredentials {
    email: string;
    password: string;
    rememberMe: boolean;
}

export interface UserInfo {
    id?: number;
    email: string;
    firstName: string;
    lastName: string;
    birthDay: string;
    phone: string;
    createdAt: string;
    updatedAt: string;
    userSettings?: UserAttrs;
    isActive: boolean;
}

export interface UserSessionHolder {
    userId: number;
    sessionId: number;
}


export interface UserSessionLifetime {
    secondsLeft: number;
}

export interface UserChangePassword {
    oldPassword: string;
    newPassword: string;
    repeatPassword: string;
    token: string;
}

export interface UserShortInfo {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    birthDay: string;
    phone: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
}

export interface UserAttrs {
    isPrivateProfile?: boolean;
    userEmail?: string;
    passResetAttempts?: PassResetAttempt[];
    passUpdateAttempts?: PassResetAttempt[];
    activationAttempts?: ActivationAttempt[];
    facebookId?: string;
    googleId?: string;
    activation?: boolean;
}

export interface NewUserInfo {
    _id: any;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    birthDay: string;
    isActive: boolean;
    userGroup?: string;
    male: string;
    phone: string;
    createdAt: Date;
    updatedAt: Date;
    userAttrs?: UserAttrs;
    inviteToken?: string;
    isAnonymous?: boolean;
}

export interface ActivationAttempt {
    date: string;
    ip: string;
}

export interface UserFacebookAuth {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
}
export enum EnumNewUserType {
    facebook = "facebook",
    google = "google",
}
export interface NewSocialUserInfo {
    type: EnumNewUserType;
    firstName: string;
    lastName: string;
    email: string;
    userAttrs: UserAttrs;
}


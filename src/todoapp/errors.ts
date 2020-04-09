import { ErrorResponse } from "./api/routers";

export enum ERROR_LEVEL {
    ERROR = 0,
    WARN = 2,
    INFO = 3,
    DEBUG = 4,
}

export enum ERROR_CODE {
    // 200-299
    NO_CONTENT = 20001,
    // 400-499
    USER_NOT_FOUND = 102,
    PASSWORDS_DO_NOT_MATCH = 103,
    USER_NEED_PERMISSIONS = 40004,
    USER_FORBIDDEN = 40005,
    USER_SESSION_NOT_FOUND = 106,
    USER_SESSION_EXPIRED = 107,
    CAMPAIGN_TYPE_NOT_FOUND = 108,
    CAMPAIGN_NOT_FOUND = 109,
    PAYMENT_NOT_FOUND = 110,
    EMAIL_TEMPLATE_NOT_FOUND = 112,
    UNKNOWN_TOKEN = 113,
    TOKEN_EXPIRED = 114,
    NOTIFICATION_TEMPLATE_NOT_FOUND = 115,
    NOTIFICATION_CATEGORY_NOT_FOUND = 116,
    VALIDATION_ERROR = 40,
    JSON_VALIDATION_ERROR = 41,
    JSON_VALIDATION_TYPE_ERROR = 42,
    VALIDATION_FILTER_ERROR = 43,
    UPLOAD_FILE_ERROR = 44,
    VALIDATION_REQUEST_BODY_ERROR = 45,
    VALIDATION_ID_ERROR = 46,
    GOOGLE_CLIENT_TOKEN_ERROR = 40021,
    ERROR_LOGIN_TO_FB = 40022,
    FILE_NOT_FOUND = 40023,
    // 500-599
    INTERNAL_SERVER_ERROR = 50000,
    BAD_QUERY_SELECT = 50004,
    BAD_GATEWAY = 50003,
    MAXMIND_IP_LOCATION_ERROR = 50004,
}

interface ErrorData {
    [field: string]: string | string[];
}

export class SWError extends Error {
    public responseStatus: number;
    public code: number;
    public param: string;
    public errorLevel: number;
    public data: ErrorData = {};
    public translateMessage: boolean;
    public providerDetails: object;

    constructor(status: number,
                code: number,
                message: string,
                level: number = ERROR_LEVEL.WARN,
                param: string = null) {
        super(message);
        this.responseStatus = status;
        this.code = code;
        this.errorLevel = level;
        this.translateMessage = true;
        this.param = param;
    }

    // noinspection TypescriptExplicitMemberType
    public getErrorLevel() {
        switch (+this.errorLevel) {
            case ERROR_LEVEL.ERROR:
                return "error";
            case ERROR_LEVEL.WARN:
                return "warn";
            case ERROR_LEVEL.INFO:
                return "info";
            case ERROR_LEVEL.DEBUG:
                return "debug";
            default:
                return "warn";
        }
    }

    /**
     * Method to help return some additional data along with regular code and message fields of error response object.
     * Override this method to add error-specific data to error response json.
     */
    public decorateResponseWithData(errorResponse: ErrorResponse): ErrorResponse[] {
        return [errorResponse];
    }
}

export interface ErrorObject {
    status?: number;
    code: number;
    message: string;
}

export interface Error400 extends ErrorObject {
    status400: boolean;
}

export interface Error491 extends ErrorObject {
    status491: boolean;
}

export interface Error403 extends ErrorObject {
    status403: boolean;
}

export interface Error404 extends ErrorObject {
    status404: boolean;
}

export interface Error409 extends ErrorObject {
    status409: boolean;
}

export interface Error412 extends ErrorObject {
    status412: boolean;
}

export function error400(errCode: number, errMessage: string): Error400 {
    return {
        status400: true,
        code: errCode,
        message: errMessage,
    } as Error400;
}

export function error491(errCode: number, errMessage: string): Error491 {
    return {
        status491: true,
        code: errCode,
        message: errMessage,
    } as Error491;
}

export function error403(errCode: number, errMessage: string): Error403 {
    return {
        status403: true,
        code: errCode,
        message: errMessage,
    } as Error403;
}

export function error404(errCode: number, errMessage: string): Error404 {
    return {
        status404: true,
        code: errCode,
        message: errMessage,
    } as Error404;
}

export function error409(errCode: number, errMessage: string): Error409 {
    return {
        status409: true,
        code: errCode,
        message: errMessage,
    } as Error409;
}

export function error412(errCode: number, errMessage: string): Error412 {
    return {
        status412: true,
        code: errCode,
        message: errMessage,
    } as Error412;
}


export const codes = {
    filters: {
        error10001001: error400(10001001, "sortBy - invalid param"),
        error10001002: error403(10001002, "User has no permissions to set includeInactive"),
        error10001003: error400(10001003, "limit - invalid param"),
        error10001004: error400(10001004, "limit is exceeded"),
    },
    request: {
        error11111001: error400(11111001, "The body from request must be an array"),
    },
    routers: {
        error11112001: error400(11112001, "Validation Json Error"),
        error11112002: error400(11112002, "Validation Type Json Error"),
        error11112003: error400(11112003, "Limit File Size"),
        error11112004: error400(11112004, "Validation Json Error"),
    },
    usersController: {

    },
    usersService: {
        // getOneInfo
        error12002001: error404(12002001, "User does not exist or does not active"),
        error12002002: error403(12002002, "User has no permissions to get users information"),
        error12002003: error403(12002003,
            "User has permissions to get only his own information"),
        error12002004: error404(12002004, "Unknown currency identifier"),
        // deleteUser
        error12003001: error403(12003001, "User has no permissions to delete users"),
        error12003002: error403(12003002, "Forbidden to delete user"),
        // addUser
        error12004001: error400(12004001, "Please enter your desired password."),
        error12004002: error400(12004002, "Unknown group identifier"),
        error12004003: error403(12004003, "You do not have permission to add a user."),
        error12004004: error404(12004004, "Resource is not found"),
        error12004005: error404(12004005, "Please check the media content to proceed."),
        error12004006: error400(12004006,
            "Looks like you already have an account. Please login using your email address."),
        error12004007: error400(12004007, "Unable to determine user location."),
        // putUser
        error12005001: error403(12005001, "User has no permissions to update user information"),
        error12005002: error403(12005002,
            "User has permissions to update only his own information"),
        error12005005: error403(12005005,
            "User has no permissions to modify active status"),
        error12005006: error400(12005006, "Category is not string"),
        error12005007: error400(12005007, "campaignCategories - invalid value"),
        error12005008: error404(12005008, "Location is not found"),
        error12005009: error412(12005009,
            "Forbidden to update user information that has been modified by another user first"),
        error12005010: error400(12013010, "An account with this email already exists"),
        // getOneShortInfo
        error12007001: error404(12007001, "User does not exist or does not active"),
        // login
        error12008001: error403(12008001, "User has no permissions to login"),
        error12008002: error491(12008002, "Username and Password doesn't match"),
        // logoutUser
        error12009001: error403(12009001, "User has no permissions to logout"),
        // getAll
        error12010001: error403(12010001, "User has no permissions to get users list"),
        error12010002: error400(12010002, "createdDateFrom - invalid value, dateFrom can't be later then dateTo"),
        // patchUser
        error12013001: error403(12013001, "User has no permissions to update user information"),
        error12013002: error403(12013002,
            "User has permissions to update only his own information"),
        error12013003: error403(12013003, "Forbidden to edit password"),
        error12013004: error403(12013004, "Forbidden to edit user group"),
        error12013005: error403(12013005, "User has no permissions to modify active status"),
        error12013006: error404(12013006, "Location is not found"),
        error12013007: error400(12013007, "An account with this email already exists"),
        // getPermissions
        error12015001: error403(12015001, "User has no permissions to get user permissions"),
        // updateSession
        error12016001: error403(12016001, "User has no permissions to update session"),
        error12016002: error404(12016002, "Currency code is not found"),
        error12016003: error404(12016003, "Language code is not found"),
        // putUserPasswordReset
        error12027001: error403(12027001, "You do not have permission to reset the password to this account."),
        error12027002: error404(12027002, "Please enter the correct email and we’ll help you create a new password."),
        error12027003: error400(12027003, "Please enter the correct email and we’ll help you create a new password."),
        error12027004: error403(12027004,
            "You have reset your password multiple times. Please contact our Support Team for assistance."),
        error12027005: error404(12027005, "Please enter the correct email and we’ll help you create a new password."),
        // putPasswordUser
        error12028001: error400(12028001, "Please check the current password you entered to proceed."),
        error12028002: error400(12028002, "Please check that the passwords match to proceed."),
        error12028004: error400(12028004, "There was a problem with this link. Please contact the Support Team."),
        error12028005: error400(12028005, "Please complete the required fields to proceed."),
        error12028006: error400(12028006, "Please complete the required fields to proceed."),
        error12028007: error400(12028007, "Please enter the correct email and we’ll help you create a new password."),
        error12028008: error403(12028008, "You do not have permission to reset the password to this account."),
        error12028009: error403(12028009,
            "You have reset your password multiple times. Please contact our Support Team for assistance."),
        error12028010: error400(12028010, "Please enter the correct email and we’ll help you create a new password."),
        // loginFacebook
        error12030001: error400(12030001,
            "Looks like you already have an account. Please login using your email address."),
        error12030002: error400(12030002, "Please check your Facebook email address to proceed."),
        error12030003: error403(12030003, "Please check your Facebook settings to proceed."),
        error12030004: error400(12030004, "Please check your Facebook profile to proceed."),
        // loginGoogle
        error12031001: error400(12031001,
            "Looks like you already have an account. Please sign in using your email address."),
        error12031002: error403(12031002, "Please check your Google account settings to proceed."),
        error12031003: error400(12031003, "Please check your Google account to proceed."),
    }
};


export class Unauthorized extends SWError {
    constructor(error: Error491) {
        super(491, error.code, error.message);
    }
}

export class Forbidden extends SWError {
    constructor(error: Error403) {
        super(403, error.code, error.message);
    }
}

export class NotFound extends SWError {
    constructor(error: Error404) {
        super(404, error.code, error.message);
    }
}

export class BadRequest extends SWError {
    constructor(error: Error400) {
        super(400, error.code, error.message);
    }
}

export class Conflict extends SWError {
    constructor(error: Error409) {
        super(409, error.code, error.message);
    }
}

export class PreconditionFailed extends SWError {
    constructor(error: Error412) {
        super(412, error.code, error.message);
    }
}

export class NoContentError extends SWError {
    constructor() {
        super(204, ERROR_CODE.NO_CONTENT, "No Content");
    }
}

export class InternalServerError extends SWError {
    constructor(error) {
        super(500,
            ERROR_CODE.INTERNAL_SERVER_ERROR,
            "Internal server error "/* + JSON.stringify(error)*/,
            ERROR_LEVEL.ERROR);
    }
}

export class BadGatewayError extends SWError {
    constructor() {
        super(500, ERROR_CODE.BAD_GATEWAY, "Bad gateway found", ERROR_LEVEL.ERROR);
    }
}

export class BadQuerySelectError extends SWError {
    constructor() {
        super(500, ERROR_CODE.BAD_QUERY_SELECT, "Bad Select query", ERROR_LEVEL.ERROR);
    }
}

export class UserNotFoundError extends SWError {
    constructor() {
        super(491, ERROR_CODE.USER_NOT_FOUND, "User does not exist or inactive");
    }
}

export class PasswordDoesntMatch extends SWError {
    constructor() {
        super(400, ERROR_CODE.PASSWORDS_DO_NOT_MATCH, "Password does not match");
    }
}

export class UserSessionNotFound extends SWError {
    constructor() {
        super(491, ERROR_CODE.USER_SESSION_NOT_FOUND, "User's session is not found or expired");
    }
}

export class UserNotFound extends SWError {
    constructor() {
        super(404, ERROR_CODE.USER_NOT_FOUND, "User not found");
    }
}

export class FileNotFound extends SWError {
    constructor() {
        super(404, ERROR_CODE.FILE_NOT_FOUND, "File not found");
    }
}

export class ForbiddenError extends SWError {
    constructor(messages: string, code?: number) {
        super(403, ((code) ? code : ERROR_CODE.USER_FORBIDDEN), `Forbidden to ${messages}`);
    }
}

export class UserSessionExpired extends SWError {
    constructor() {
        super(404, ERROR_CODE.USER_SESSION_EXPIRED, "User's session has expired");
    }
}


export class TokenError extends SWError {
    constructor() {
        super(491, ERROR_CODE.UNKNOWN_TOKEN, "Token error");
    }
}

export class TokenExpired extends SWError {
    constructor() {
        super(491, ERROR_CODE.TOKEN_EXPIRED, "Token is expired");
    }
}

export class ValidationError extends SWError {
    constructor(messages: string | string[], code?: number, param: string = null) {
        super(400,
            ((code) ? code : ERROR_CODE.VALIDATION_ERROR),
            (Array.isArray(messages) ? messages.join(", ") : messages),
            ERROR_LEVEL.WARN,
            param,
        );
    }
}

export class ValidationJsonError extends SWError {
    constructor() {
        super(400, ERROR_CODE.JSON_VALIDATION_ERROR, "Validation Json error");
    }
}

export class ValidationFilterError extends SWError {
    constructor(keys?: string[], code?: number) {
        let message = `Request filter is invalid`;
        if (keys && keys.length > 1) {
            message = message + `. Fields '${keys}' are invalid`;
        } else if (keys && keys.length === 1) {
            message = message + `. Field '${keys}' is invalid`;
        }
        super(400, ((code) ? code : ERROR_CODE.VALIDATION_FILTER_ERROR), message);
    }
}

export class ValidationUploadFileError extends SWError {
    constructor(messages: string) {
        super(400, ERROR_CODE.UPLOAD_FILE_ERROR, `Upload file error: ${messages}`);
    }
}

export class ValidationRequestBody extends SWError {
    constructor(keys?: string[], code?: number) {
        let message = `Request Body is invalid`;
        if (keys && keys.length > 1) {
            message = message + `. Fields '${keys}' are invalid`;
        } else if (keys && keys.length === 1) {
            message = message + `. Field '${keys}' is invalid`;
        }
        super(400, ((code) ? code : ERROR_CODE.VALIDATION_REQUEST_BODY_ERROR), message);
    }
}

export class ValidationIdError extends SWError {
    constructor(messages: string | string[], param: string = null) {
        super(400, ERROR_CODE.VALIDATION_ID_ERROR, `Validation error: ${messages}`, ERROR_LEVEL.WARN, param);
    }
}

export class IpLocationError extends SWError {
    constructor(private causeError) {
        super(500,
            ERROR_CODE.MAXMIND_IP_LOCATION_ERROR,
            "Ip location lookup error: " + causeError.message,
            ERROR_LEVEL.ERROR);
        this.data.message = causeError.message;
    }

    // noinspection TypescriptExplicitMemberType
    public cause() {
        return this.causeError;
    }
}

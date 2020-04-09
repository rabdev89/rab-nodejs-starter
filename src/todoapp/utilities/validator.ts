import { stripTags } from "./string";
import config from "../config";
import * as moment from "moment";
import { Filters } from "../services/filters";
import * as Errors from "../errors";
import { getDateFromDateTime, getDateTimeFormat } from "./date";

export function inEnumValues(enumObject: any, values: string | string[]): boolean {
    const enumValues = Object.values(enumObject);
    if (Array.isArray(values)) {
        for (const type of values) {
            if (enumValues.indexOf(type) === -1) {
                return false;
            }
        }
    } else {
        if (enumValues.indexOf(values) === -1) {
            return false;
        }
    }
    return true;
}

export function getEnumValues(enumObject: any): string[] {
    return Object.values(enumObject);
}

export async function validateRequestFilter(allowedParams: string[],
                                            params: object,
                                            identical?: boolean): Promise<void> {
    identical = (identical) ? identical : false;
    const notFound: string[] = [];
    const valid: boolean = Filters.checkObjectKeys(allowedParams, params, identical, notFound);
    if (!valid) {
        return Promise.reject(new Errors.ValidationFilterError(notFound));
    }
}

export async function validateRequestBody(allowedParams: string[],
                                          params: object,
                                          identical?: boolean,
                                          notEmpty?: boolean): Promise<void> {
    if (Filters.isObjectEmpty(params) && notEmpty === true) {
        return Promise.reject(new Errors.ValidationRequestBody());
    }
    identical = (identical) ? identical : false;
    const notFound: string[] = [];
    const valid: boolean = Filters.checkObjectKeys(allowedParams, params, identical, notFound);
    if (!valid) {
        return Promise.reject(new Errors.ValidationRequestBody(notFound));
    }
}

export function isUndefined(value: string): boolean {
    return (value === undefined);
}

export function isEmpty(value: string): boolean {
    return (String(value).trim().length === 0);
}

export function isNull(value: string): boolean {
    return (value === null);
}

export function isString(value: any): boolean {
    return (typeof value === "string");
}

export function isArray(values: any): boolean {
    return (Array.isArray(values));
}

export function isStringArray(values: any): boolean {
    if (Array.isArray(values)) {
        for (const value of values) {
            if (typeof value !== "string") {
                return false;
            }
        }
    } else {
        return false;
    }
    return true;
}

export function isLowercase(value: any): boolean {
    return (typeof value === "string" &&
        String(value).toLowerCase() === value);
}

export function isCampaignTitle(value: string): boolean {
    const length = stripTags(String(value)).trim().length;
    return (length >= 10 && length <= 80);
}

export function isCampaignDuration(value: string): boolean {
    return (isNumericNoDecimalPoint(value) && value !== null && +value > 0);
}
export function isContainsSpace(value: string): boolean {
    return /[\s]+/.test(String(value).trim());
}

export function isPassword(value: string): boolean {
    // validate that password is longer than or equal 8 letters and
    // contains at least one letter, one uppercase letter, one digit and one special symbol
    // also no space/whitespace
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])(?!.*\s).{8,24}$/.test(value);
}

export function notZero(value: string): boolean {
    return ((Number(value) > 0));
}

export function isInteger(value: string): boolean {
    return (/^[0-9]*$/.test(value) && Number(value) <= config.maxIntegerValue && Number(value) > -1);
}

export function isNumeric(value: string): boolean {
    return /^[\d]{1,131072}([.][\d]{0,16383})?$/.test(value);
}

export function isNumericNoDecimalPoint(value: string): boolean {
    return /^[\d]{1,131072}$/.test(value);
}

export function isHashedId(value: string): boolean {
    if (value === undefined) {
        return false;
    }
    return /^([a-zA-Z\d]{8,})$/.test(value);
}

export function isImpactedPeople(value: string): boolean {
    return (/^[1-9]{1}[0-9]*/.test(value) && Number(value) <= 2147483646);
}

export function isStringLength(value: string, min: number, max: number): boolean {
    const noTags = stripTags(value);
    return (typeof value === "string" && noTags.length >= min && noTags.length <= max);
}

export function isCampaignDescriptionHeader(value: string): boolean {
    const noTags = stripTags(value);
    return (value && noTags.length >= 50 && noTags.length <= 250);
}

export function isCampaignDescription(value: string): boolean {
    const noTags = stripTags(value);
    return (value && noTags.length >= 150 && noTags.length <= 5500);
}

export function isOrganizationDescription(value: string): boolean {
    const length = String(value).length;
    return (value && length >= 100 && length <= 5500);
}

export function isCampaignUpdateDescription(value: string): boolean {
    const length = String(value).length;
    return (value && length >= 140 && length <= 5500);
}

export function isTeamChallengeDescription(value: string): boolean {
    const length = String(value).length;
    return (value && length >= 200 && length <= 5500);
}

export function isTagName(value: string): boolean {
    const length = String(value).length;
    return (value && length >= 1 && length <= 32);
}

export function isSlug(value: string): boolean {
    const length = String(value).length;
    return (value && length >= 1 && length <= 255);
}

export function isNotFutureDateTime(value: string): boolean {
    if (isDateTime(value)) {
        const res = moment(value, "YYYY-MM-DDThh:ii:ss+hhmm").isValid();
        if (res) {
            return (new Date(value).getTime() < new Date().getTime());
        }
    }
    return false;
}
export function isFutureDateOrToday(value): boolean {
    if (isDateTime(value)) {
        value = getDateFromDateTime(value) + "00:00:00+0000";
        const today = getDateFromDateTime(getDateTimeFormat(new Date())) + "00:00:00+0000";
        const res = moment(value, "YYYY-MM-DDThh:ii:ss+hhmm").isValid();
        if (res) {
            return (new Date(value).getTime() >= new Date(today).getTime());
        }
    }
    return false;
}

export function isUrl(value: string): boolean {
    return /^((?:http(s)?:)?\/\/)[\w.-]+(?:\.[\w.-]+)+[\w\-._~:\/?#[\]@!$&'()*+,;=]+$/gm.test(value);
}

export function hasUrlUseWWWOnly(value: string): boolean {
    return /^(?:(?:http(s)?):\/\/|www\.)[\w.-]+(?:\.[\w.-]+)+[\w\-._~:\/?#[\]@!\$&'\(\)\*\+,;=.]+$/gm.test(value);
}

export function isUrlOrUndefined(value: string): boolean {
    return (isUrl(value) || isUndefined(value));
}

export function isGivebackMediaGallery(values: object[]): boolean {
    if (!isArray(values)) {
        return false;
    }
    for (const value of values) {
        if (!checkObjectKeys(["resourceImageId", "resourceImagePreviewId"], value, true) &&
            !checkObjectKeys(["videoUrl"], value, true)) {
            return false;
        }
        if (("resourceImageId" in value && !isHashedId(value["resourceImageId"])) ||
            ("resourceImagePreviewId" in value && !isHashedId(value["resourceImagePreviewId"])) ||
            ("videoUrl" in value && !isUrlOrUndefined(value["videoUrl"]))) {
            return false;
        }
    }
    return true;
}

export function isOrganizationMediaGallery(values: object[]): boolean {
    if (!isArray(values)) {
        return false;
    }
    for (const value of values) {
        if ("resourceProfileCoverImageId" in value) {
            if (!checkObjectKeys(["resourceProfileCoverImageId"], value, true)) {
                return false;
            }

            if (("resourceProfileCoverImageId" in value && !isHashedId(value["resourceProfileCoverImageId"]))) {
                return false;
            }
        } else {
            // tslint:disable-next-line:max-line-length
            if (!checkObjectKeys(["resourceProfileImageId", "resourceProfileImagePreviewId"], value, true)) {
                return false;
            }
            if (("resourceProfileImageId" in value && !isHashedId(value["resourceProfileImageId"])) ||
                ("resourceProfileImagePreviewId" in value && !isHashedId(value["resourceProfileImagePreviewId"])) ) {
                return false;
            }
        }

    }
    return true;
}

export function isBasicMediaGallery(values: object[]): boolean {
    if (!isArray(values)) {
        return false;
    }
    for (const value of values) {
        if (!checkObjectKeys(["resourceImageId", "resourceImagePreviewId"], value, true)) {
            return false;
        }
        if (("resourceImageId" in value && !isHashedId(value["resourceImageId"])) ||
            ("resourceImagePreviewId" in value && !isHashedId(value["resourceImagePreviewId"]))) {
            return false;
        }
    }
    return true;
}

export function checkObjectKeys(findValues: string[],
                                inObject: object,
                                identical?: boolean): boolean {
    const keys: string[] = Object.keys(inObject);
    let result: boolean = true;
    if (identical === true) {
        if (keys.length !== findValues.length) {
            return false;
        }
    }
    keys.forEach((key) => {
        if (findValues.indexOf(key) === -1) {
            result = false;
        }
    });
    return result;
}

export function isEmail(value: string): boolean {
    return new RegExp([
        "^(|(([A-Za-z0-9]+_+)|([A-Za-z0-9]+\\-+)|([A-Za-z0-9]+\\.{1})",
        "|([A-Za-z0-9]+\\++))*[A-Za-z0-9]+@((\\w+\\-+)|(\\w+\\.))*\\w{1,63}\\.[a-zA-Z]{2,6})$",
    ].join(""), "i").test(value);
}

export function isBigInt(value: string): boolean {
    return new RegExp([
        "^(?![\\-])(?:[0-9]{1,18}|[1-8][0-9]{18}|9(?:[01][0-9]{17}|2(?:[01][0-9]{16}|2(?:[0-2][0-9]{15}|3",
        "(?:[0-2][0-9]{14}|3(?:[0-6][0-9]{13}|7(?:[01][0-9]{12}|20(?:[0-2][0-9]{10}|3(?:[0-5][0-9]{9}|6",
        "(?:[0-7][0-9]{8}|8(?:[0-4][0-9]{7}|5(?:[0-3][0-9]{6}|4(?:[0-6][0-9]{5}|7(?:[0-6][0-9]{4}|7",
        "(?:[0-4][0-9]{3}|5(?:[0-7][0-9]{2}|80[0-7]))))))))))))))))$",
    ].join("")).test(value);
}

export function isDateTime(value: string): boolean {
    return new RegExp([
        "^(19|[2-9][0-9])(\\d\\d)-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T(0[0-9]|1[0-9]|2[0-3]):",
        "(0[0-9]|[0-5][0-9]):(0[0-9]|[0-5][0-9])([\\-\\+](0[0-9]|1[0-9]|2[0-3])(0[0-9]|[0-5][0-9]))$",
    ].join("")).test(value);
}

export function isDateTimeNoGMT(value: string): boolean {
    return new RegExp([
        "^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(\\d{2})[\\-\\+]0000$",
    ].join("")).test(value);
}

export function isDouble(value: string): boolean {
    return /^[0-9]*([.][0-9]{0,2})?$/.test(value);
}

export function isEmailTemplateTag(values: object[]): boolean {
    if (!isArray(values)) {
        return false;
    }
    for (const value of values) {
        if (!checkObjectKeys(["tag", "description", "example"], value) ||
            !("tag" in value) || value["tag"] === null) {
            return false;
        }
        if (("tag" in value && String(value["tag"]).trim().length > 32) ||
            ("description" in value && String(value["description"]).trim().length > 255) ||
            ("example" in value && String(value["example"]).trim().length > 255)) {
            return false;
        }
    }
    return true;
}

export function isTemplateTags(values: object[]): boolean {
    if (!isArray(values)) {
        return false;
    }
    for (const value of values) {
        if (!checkObjectKeys(["tag", "description", "example"], value)) {
            return false;
        }
        if (!("tag" in value)) {
            return false;
        }
        if (("tag" in value && String(value["tag"]).trim().length > 32) ||
            ("description" in value && String(value["description"]).trim().length > 255) ||
            ("example" in value && String(value["example"]).trim().length > 255)) {
            return false;
        }
    }
    return true;
}

export function isArticleTitle(value: string): boolean {
    const length = stripTags(String(value)).trim().length;
    return (length >= 10 && length <= 255);
}

export function isArticleSlug(value: string): boolean {
    if (!isString(value)) {
        return false;
    }
    const length = String(value).length;
    return (length >= 1 && length <= 255 && isLowercase(value) && /[0-9A-Za-z-]{1,32}$/.test(value));
}

export function isArticleAuthor(value: string): boolean {
    const length = stripTags(String(value)).trim().length;
    return (length >= 1 && length <= 64);
}

export function isArticleMediaGallery(values: object[]): boolean {
    if (!isArray(values)) {
        return false;
    }
    for (const value of values) {
        if (!checkObjectKeys(["resourceProfileImageId", "resourceProfileImagePreviewId"], value, true) &&
            !checkObjectKeys(["profileVideoUrl"], value, true) &&
            !checkObjectKeys(["resourceImageId", "resourceImagePreviewId"], value, true) &&
            !checkObjectKeys(["videoUrl"], value, true)) {
            return false;
        }
        if (("resourceProfileImageId" in value && !isHashedId(value["resourceProfileImageId"])) ||
            ("resourceProfileImagePreviewId" in value && !isHashedId(value["resourceProfileImagePreviewId"])) ||
            ("profileVideoUrl" in value && !isUrlOrUndefined(value["profileVideoUrl"])) ||
            ("resourceImageId" in value && !isHashedId(value["resourceImageId"])) ||
            ("resourceImagePreviewId" in value && !isHashedId(value["resourceImagePreviewId"])) ||
            ("videoUrl" in value && !isUrlOrUndefined(value["videoUrl"]))) {
            return false;
        }
    }
    return true;
}

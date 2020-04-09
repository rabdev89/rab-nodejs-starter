import { detect } from "detect-browser";
import MobileDetect = require("mobile-detect");

interface UserAgentDetails {
    userAgent: string;
    os: string;
    isPhone: string;
    isMobile: string;
    isTablet: string;
    browser: string;
    version: string;
}

export function getUserAgentDetails(userAgent: string): UserAgentDetails {
    const md = new MobileDetect(userAgent);
    if (md.mobile() || md.tablet() || md.phone()) {
        return {
            userAgent,
            os: md.os(),
            isPhone: md.phone(),
            isMobile: md.mobile(),
            isTablet: md.tablet(),
            browser: md.userAgent(),
            version: String(md.version("Webkit")),
        } as UserAgentDetails;
    } else {
        const browser = detect(userAgent);
        if (browser) {
            return {
                userAgent,
                os: browser.os,
                isPhone: null,
                isMobile: null,
                isTablet: null,
                browser: browser.name,
                version: String(browser.version),
            } as UserAgentDetails;
        }
    }
}

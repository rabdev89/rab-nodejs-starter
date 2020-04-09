/*
 * Add Auth on url
 *
 * @param value - string url
 * @return string url with auth
 */
import config from "../config";
import { slugify } from "./string";
import { hashids } from "../api/middleware";

export function getAuthUrl(url: string): string {
    let ipnUrl = "";

    if (config.basicAuthentication !== null) {

        if (url.indexOf("http://") === 0) {
            ipnUrl = config.siteBaseUrl.replace("http://",
                    "https://" + config.basicAuthentication + "@");
        } else {
            ipnUrl =  url.replace("https://",
                "https://" + config.basicAuthentication + "@");
        }
    }

    return ipnUrl;
}

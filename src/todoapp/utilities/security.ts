import * as Errors from "../errors";
import * as Md5 from "nodejs-md5";
import * as bcrypt from "bcryptjs";
const saltRounds = 10;


export function encodePasswordMD5(password: string): string {
    let encoded: string;
    Md5.string.quiet(password, (err, md5) => {
        if (err) {
            return Promise.reject(new Errors.BadGatewayError());
        } else {
            encoded = md5;
        }
    });
    return encoded;
}

export async function encodePasswordBCrypt(password: string): Promise<string> {
    try {
        return await bcrypt.hashSync(password, bcrypt.genSaltSync(saltRounds));
    } catch (err) {
        console.log(err, "End encodePasswordBCrypt Error");
        return Promise.reject(err);
    }
}

export async function comparePasswordBCrypt(password: string, hash: string): Promise<boolean> {
    try {
        // https://stackoverflow.com/questions/23015043/verify-password-hash-in-nodejs-which-was-generated-in-php
        hash = hash.replace(/^\$2y(.+)$/i, "$2a$1");
        return await bcrypt.compare(password, hash);
    } catch (err) {
        console.log(err, "End comparePasswordBCrypt Error");
        return Promise.reject(err);
    }
}

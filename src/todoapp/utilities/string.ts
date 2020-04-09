export function cutText(text: string): string {
    let cuttedText = text;
    if (text.length > 255) {
        const sentences = /^([\S\s]{1,254}[?!.]{1})(?=\s*[A-Z]|$)/gm.exec(text);
        if (sentences !== null) {
            cuttedText = sentences[0];
        } else {
            const words = /^([\S\s]{1,255})\s(?=[\S\s]|$)/gm.exec(text);
            if (words && words[0].length < 256) {
                cuttedText = words[0];
            } else {
                const word = /^(.{1,255})/gm.exec(text);
                cuttedText = (word) ? word[0].trim() : null;
            }
        }
    }
    return cuttedText;
}

export function stripTags(htmlText: string): string {
    return String(htmlText).replace(/<[^>]+>/g, "");
}

export function stripTagsLength(htmlText: string): number {
    return (htmlText) ? stripTags(htmlText).length : 0;
}

export function trim(value: string) {
    return String(value).trim();
}

export function sortByNameInObj(objArray: any[], name: string): any[] {
    if (objArray.length > 0 && !objArray[0][name]) {
        return objArray;
    }
    objArray = objArray.sort((a, b) => {
        const A = a[name].toUpperCase();
        const B = b[name].toUpperCase();
        if (A < B) {
            return -1;
        } else if (A > B) {
            return 1;
        }
        return 0;
    });
    return objArray;
}

/*
 * Replace string value using config object
 *
 * @param value - string value that needs to be replaced
 * @param configObject - object with replace configuration like { "oldValue": "newValue" }
 * @return new value if it was found
 */
export function replaceByConfig(value: string, configObject: object): string {
    const oldValues = Object.keys(configObject);
    if (oldValues.indexOf(value) > -1) {
        return configObject[value];
    }
    return value;
}

/*
 * Add single quotes to string values
 *
 * @param value - string with comma delimited values - value1,value2
 * @return string with comma delimited values in single quotes - 'value1','value2'
 */
export function addSingleQuotes(value: string): string {
    const values = String(value).split(",");
    return "'" + values.join("','") + "'";
}

/*
 * Slug string
 *
 * @param value - string
 * @return slugged string'
 */
export function slugify(str: string): string {
    const a = "àáäâãåăæąçćčđďèéěėëêęğǵḧìíïîįłḿǹńňñòóöôœøṕŕřßşśšșťțùúüûǘůűūųẃẍÿýźžż·/_,:;";
    const b = "aaaaaaaaacccddeeeeeeegghiiiiilmnnnnooooooprrsssssttuuuuuuuuuwxyyzzz------";
    const p = new RegExp(a.split("").join("|"), "g");

    return str.toString().toLowerCase()
        .replace(/\s+/g, "-") // Replace spaces with -
        .replace(p, (c) => b.charAt(a.indexOf(c))) // Replace special characters
        .replace(/&/g, "-and-") // Replace & with 'and'
        .replace(/[^\w\-]+/g, "") // Remove all non-word characters
        .replace(/--+/g, "-") // Replace multiple - with single -
        .replace(/^-+/, "") // Trim - from start of text
        .replace(/-+$/, ""); // Trim - from end of text
}

/*
 * Converting large number to K format string
 *
 * @param value - any
 * @return string
 */
export function convertToKFormat(value: any, currencySymbol?: string): any {

    if (value === null || value === undefined) {
        return value;
    }

    return ('' + value).replace(/[-\d,\.]+/gi, match => {
        if (/\..*\./.test(match)) {
            return match;
        }

        const num = Number(match.replace(/,/gi, ''));
        let abs = Math.abs(num);
        const rounder = Math.pow(10, 1);
        const isNegative = num < 0;
        let key = '';

        const powers = [
            //      { key: 'Q', value: Math.pow(10, 15) },
            { key: 'T', value: Math.pow(10, 12) },
            { key: 'B', value: Math.pow(10, 9) },
            { key: 'M', value: Math.pow(10, 6) },
            { key: 'K', value: 1000 }
        ];

        for (const power of powers) {
            let reduced = abs / power['value'];
            reduced = Math.round(reduced * rounder) / rounder;
            if (reduced >= 1) {
                abs = reduced;
                key = power['key'];
                break;
            }
        }

        return (currencySymbol || '') + (isNegative ? '-' : '') + abs + key;
    });

}


export function getDateTimeFormat(date: Date): string {
    if (!date) {
        return "0000-00-00T00:00:00+0000";
    } else {
        const dateToStr = new Date(date);
        const currDate = dateToStr.getDate();
        const currMonth = dateToStr.getMonth() + 1;
        const currYear = dateToStr.getFullYear();
        const currHour = dateToStr.getHours();
        const currMinutes = dateToStr.getMinutes();
        const currSeconds = dateToStr.getSeconds();

        return currYear + "-" + ("0" + currMonth).slice(-2) + "-" + ("0" + currDate).slice(-2) + "T" + ("0" + currHour)
            .slice(-2) + ":" + ("0" + currMinutes).slice(-2) + ":" + ("0" + currSeconds).slice(-2) + "+0000";
    }
}

export function getWeekDay(date) {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days[date.getDay()];
}

export function getMonthName(date) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return monthNames[date.getMonth()];
}

export function getLastModifiedFormat(date: string | Date): string {
    // Sun, 13 Jan 2013 00:34:12 GMT
    const dateToStr = (date instanceof Date) ? date : new Date(date);
    const currDay = getWeekDay(dateToStr);
    const currDate = dateToStr.getDate();
    const currMonth = getMonthName(dateToStr);
    const currYear = dateToStr.getFullYear();
    const currHour = dateToStr.getHours();
    const currMinutes = dateToStr.getMinutes();
    const currSeconds = dateToStr.getSeconds();
    return currDay + ", " + currDate + " " + currMonth + " " + currYear + " " + ("0" + currHour).slice(-2) +
        ":" + ("0" + currMinutes).slice(-2) + ":" + ("0" + currSeconds).slice(-2) + " GMT";
}
export function getDateFromDateTime(dateTime: string): string {
    const result = dateTime.match( /^(\d{4}-\d{2}-\d{2})T/i );
    return result[0];
}

export function updateTimeInPeriod(startDate: string, endDate: string): [string, string] {
    startDate = getDateFromDateTime(startDate) + "00:00:00+0000";
    endDate = getDateFromDateTime(endDate) + "23:59:59+0000";
    return [startDate, endDate];
}

export function getDayOrdinal(date: string | Date): string {
    const dateToStr = new Date(date);
    const currDate = dateToStr.getDate();
    switch (currDate) {
        case 1:
        case 21:
            return currDate + "st";
        case 2:
        case 22:
            return currDate + "nd";
        case 3:
        case 23:
            return currDate + "rd";
        default:
            return currDate + "th";
    }
}

export function monthDiff(startDate: string | Date, endDate: string | Date) {
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const years = d2.getFullYear() - d1.getFullYear();
    return (years * 12) + (d2.getMonth() - d1.getMonth()) + 1 ;
}

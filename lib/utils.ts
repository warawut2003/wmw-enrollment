
export function parseDate(dateString: string): Date | null {
    if (!dateString) return null;
    try {
        const [day, month, year] = dateString.split('/');
        if (!day || !month || !year) return null;
        const isoDate = new Date(`${parseInt(year)}-${month}-${day}`);
        if (isNaN(isoDate.getTime())) return null;
        return isoDate;
    } catch (error) {
        console.error("Error parsing date:", dateString, error);
        return null;
    }
}
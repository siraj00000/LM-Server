const getDates = (date: string, months: number): { startDate: Date, endDate: Date } => {
    const startDate = new Date(date);
    const endDate = new Date(startDate);

    // Calculate the end date by subtracting months while maintaining the day of the month
    endDate.setMonth(startDate.getMonth() - months);
    endDate.setDate(1); // Set the end date to the 1st day of the month

    // Increment the start date by one day to ensure it's included in the range
    startDate.setDate(startDate.getDate() + 1);

    return { startDate, endDate };
};

export const getCustomDateRange = (date: string, months: number): { startDate: Date, endDate: Date } => {
    const endDate = new Date(date); // Provided end date

    // Calculate the start date based on the provided end date and the logic for month range
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - months, 1); // Adjusted to start from the 1st
    return { startDate, endDate };
};

export default getDates;

export const formatBytesToMB = (bytes: number): string => {
    const megabytes = bytes / (1024 * 1024); // Convert bytes to megabytes
    return megabytes.toFixed(2) + ' MB'; // Display size with two decimal places
};
 
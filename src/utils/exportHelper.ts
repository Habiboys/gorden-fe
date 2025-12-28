/**
 * Exports data to a CSV file.
 * @param data Array of objects to export
 * @param filename Name of the file to download (without extension)
 * @param headers Optional mapping of field keys to display names
 */
export const exportToCSV = (data: any[], filename: string, headers?: Record<string, string>) => {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Get keys from first object or use provided headers keys
    const keys = headers ? Object.keys(headers) : Object.keys(data[0]);

    // Create header row
    const headerRow = headers ? keys.map(key => headers[key]).join(',') : keys.join(',');

    // Create rows
    const rows = data.map(row => {
        return keys.map(key => {
            let cell = row[key] === null || row[key] === undefined ? '' : row[key];

            // Handle special characters and string formatting
            cell = cell.toString().replace(/"/g, '""'); // Escape double quotes
            if (cell.search(/("|,|\n)/g) >= 0) {
                cell = `"${cell}"`; // Quote cells containing delimiters
            }
            return cell;
        }).join(',');
    });

    const csvContent = [headerRow, ...rows].join('\n');

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

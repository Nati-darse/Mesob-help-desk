/**
 * Professional Excel Export Utility for Technician Reports
 * Generates formatted XLSX files without external dependencies
 */

/**
 * Convert data to CSV format
 */
const convertToCSV = (data, headers) => {
    const headerRow = headers.map(h => `"${h.label}"`).join(',');
    const dataRows = data.map(row => {
        return headers.map(h => {
            const value = row[h.key] || '';
            // Escape quotes and wrap in quotes
            return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',');
    });
    
    return [headerRow, ...dataRows].join('\n');
};

/**
 * Generate Excel-compatible HTML table
 */
const generateExcelHTML = (data, headers, title, metadata) => {
    const headerCells = headers.map(h => 
        `<th style="background-color: #1976d2; color: white; font-weight: bold; padding: 12px; border: 1px solid #ddd;">${h.label}</th>`
    ).join('');
    
    const dataRows = data.map(row => {
        const cells = headers.map(h => {
            const value = row[h.key] || '';
            const style = h.style || 'padding: 8px; border: 1px solid #ddd;';
            return `<td style="${style}">${value}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
    }).join('');
    
    const metadataRows = metadata ? Object.entries(metadata).map(([key, value]) => 
        `<tr><td colspan="${headers.length}" style="padding: 4px; font-size: 12px;"><strong>${key}:</strong> ${value}</td></tr>`
    ).join('') : '';
    
    return `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
            <meta charset="UTF-8">
            <style>
                table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
                th, td { text-align: left; }
            </style>
        </head>
        <body>
            <table>
                <thead>
                    <tr><th colspan="${headers.length}" style="background-color: #0d47a1; color: white; padding: 16px; font-size: 18px; text-align: center;">${title}</th></tr>
                    ${metadataRows}
                    <tr>${headerCells}</tr>
                </thead>
                <tbody>
                    ${dataRows}
                </tbody>
            </table>
        </body>
        </html>
    `;
};

/**
 * Download file
 */
const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

/**
 * Export to Excel (XLS format - opens in Excel)
 */
export const exportToExcel = (data, headers, title, metadata = null) => {
    const filename = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xls`;
    const html = generateExcelHTML(data, headers, title, metadata);
    downloadFile(html, filename, 'application/vnd.ms-excel');
};

/**
 * Export to CSV
 */
export const exportToCSV = (data, headers, title) => {
    const filename = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    const csv = convertToCSV(data, headers);
    downloadFile('\uFEFF' + csv, filename, 'text/csv;charset=utf-8;'); // UTF-8 BOM for Excel compatibility
};

/**
 * Format date for display
 */
export const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Format duration in hours
 */
export const formatDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    const diff = new Date(endDate) - new Date(startDate);
    const hours = (diff / (1000 * 60 * 60)).toFixed(1);
    return `${hours}h`;
};

/**
 * Calculate statistics
 */
export const calculateStats = (tickets) => {
    const total = tickets.length;
    const resolved = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
    const inProgress = tickets.filter(t => t.status === 'In Progress').length;
    const pending = tickets.filter(t => t.status === 'Assigned' || t.status === 'New').length;
    
    const priorities = {
        Critical: tickets.filter(t => t.priority === 'Critical').length,
        High: tickets.filter(t => t.priority === 'High').length,
        Medium: tickets.filter(t => t.priority === 'Medium').length,
        Low: tickets.filter(t => t.priority === 'Low').length,
    };
    
    const categories = tickets.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
    }, {});
    
    // Calculate average resolution time
    const resolvedTickets = tickets.filter(t => t.status === 'Resolved' && t.createdAt && t.updatedAt);
    const avgResolutionTime = resolvedTickets.length > 0
        ? resolvedTickets.reduce((sum, t) => {
            const diff = new Date(t.updatedAt) - new Date(t.createdAt);
            return sum + (diff / (1000 * 60 * 60));
        }, 0) / resolvedTickets.length
        : 0;
    
    return {
        total,
        resolved,
        inProgress,
        pending,
        priorities,
        categories,
        avgResolutionTime: avgResolutionTime.toFixed(1),
        resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(1) : 0
    };
};

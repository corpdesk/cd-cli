import Table from 'cli-table3'; // Import cli-table3 package

// Utility function to wrap text and display it in a table format
export function printTable(headers: string[], rows: any[]) {
  const table = new Table({
    head: headers,
    colWidths: [30, 70], // Adjust column widths as needed
    wordWrap: true, // Enable word wrapping
  });

  // Add rows to the table
  rows.forEach((row) => {
    table.push(row);
  });

  // Print the table
  console.log(table.toString());
}

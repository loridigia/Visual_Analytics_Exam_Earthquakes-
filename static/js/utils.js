function read_file_string_to_date(dateString){
    // Extract the date and time components
    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);

    // Extract milliseconds
    const millisecondStr = timePart.split('.')[1];
    const milliseconds = parseInt(millisecondStr, 10) || 0;

    // Create a Date object
    const dateObj = new Date(Date.UTC(year, month - 1, day, hour, minute, second, milliseconds));
    return dateObj
}
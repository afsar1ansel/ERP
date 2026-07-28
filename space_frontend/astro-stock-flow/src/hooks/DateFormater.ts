export const formatDateDDMMYYYY = (dateInput: string | number | Date) => {
  // Use the provided date or default to the current date
  const date = dateInput ? new Date(dateInput) : new Date();

  // Get day, month (0-indexed), and year
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Add 1 to month
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

export const formatDateTime = (dateInput: string | number | Date) => {
  if (!dateInput) return "N/A";
  const date = new Date(dateInput);

  // Use UTC methods to display server time as-is
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();

  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

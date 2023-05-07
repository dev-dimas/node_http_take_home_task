/**
 * Membuat ID berdasarkan UNIX epoch.
 * @returns {string} - ID yang dihasilkan dari total milisecond UNIX epoch.
 */
const generateId = () => {
  return new Date().getTime().toString();
};

module.exports = {
  generateId,
};

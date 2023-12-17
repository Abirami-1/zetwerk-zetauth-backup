/**
 * Covert a string in various formats to space-separated title case.
 * @function convertToTitleCase
 * @param {String} input - The input string in camel case, pascal case, or kebab case.
 * @return {String} - String formatted in space-separated title case.
 */
function convertToTitleCase(input) {
    if (typeof input !== 'string' || input === '') {
        return '';
    }
    
    // Convert Kebab Case to Title Case
    if (/^[a-z]+(-[a-z]+)*$/.test(input)) {
        return input
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    // Convert Camel Case to Title Case
    if (/^[a-z][a-zA-Z]*$/.test(input)) {
        return input
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/^./, str => str.toUpperCase());
    }
    
    // Convert Pascal Case to Title Case
    if (/^[A-Z][a-zA-Z]*$/.test(input)) {
        return input
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    }
    
    // If the format is not recognized, convert to sentence case.
    return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}

module.exports = { convertToTitleCase };

  
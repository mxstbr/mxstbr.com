/**
 * Remove common leading whitespace from template literals
 * while preserving newlines.
 * 
 * @param strings Template strings array
 * @param values Values to interpolate
 * @returns Dedented string
 */
export function dedent(strings: TemplateStringsArray, ...values: any[]): string {
  // If it's a regular string, not a template literal, return it directly
  if (typeof strings === 'string') {
    return strings;
  }

  let result = '';
  
  // Combine the strings and values
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += values[i];
    }
  }

  // Split by newlines to process each line
  const lines = result.split('\n');
  
  // Find minimum indentation across all lines (skip empty lines)
  let minIndent = Infinity;
  for (const line of lines) {
    const trimStart = line.length - line.trimStart().length;
    if (trimStart > 0 && trimStart < minIndent) {
      minIndent = trimStart;
    }
  }

  // Reset if we didn't find any indentation
  if (minIndent === Infinity) {
    minIndent = 0;
  }

  // Remove the common indentation from each line
  return lines
    .map(line => {
      if (line.trim() === '') {
        return '';
      }
      return line.slice(Math.min(minIndent, line.length - line.trimStart().length));
    })
    .join('\n');
} 
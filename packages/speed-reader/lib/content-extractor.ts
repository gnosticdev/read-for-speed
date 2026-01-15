/**
 * Content cleanup utilities for the RSVP reader.
 * Extraction should happen upstream (e.g. Readability in the content script).
 */

export function extractContent(input: string): string {
  // Normalize whitespace to keep RSVP display consistent.
  let text = input.replace(/\s+/g, " ").trim()

  // Remove common HTML artifacts if the input looks like markup.
  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(text)
  if (looksLikeHtml) {
    text = text.replace(/<[^>]*>/g, " ")
  }
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  // Clean up multiple spaces
  text = text.replace(/\s+/g, " ").trim()

  return text
}

/**
 * Calculate estimated reading time
 */
export function estimateReadingTime(wordCount: number, wpm: number): string {
  const minutes = wordCount / wpm
  if (minutes < 1) {
    return `${Math.round(minutes * 60)} seconds`
  }
  return `${Math.round(minutes)} minute${minutes >= 2 ? "s" : ""}`
}

/**
 * Split text into optimal chunks for display
 */
export function chunkText(text: string, chunkSize: number): string[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0)
  const chunks: string[] = []

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "))
  }

  return chunks
}

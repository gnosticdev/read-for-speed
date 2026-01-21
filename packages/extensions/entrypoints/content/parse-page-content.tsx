import { Readability } from '@mozilla/readability'

interface ParseSuccess {
  textContent: string
  title: string
  error: false
}
interface ParseError {
  textContent: null
  title: null
  error: true
  message: string
}
type ParseResult = ParseSuccess | ParseError

/**
 * Parse web page content using the Readability JS library.
 * @param docClone - The document to parse.
 * @returns The parsed content or an error if the page is not reader mode compatible.
 */
export function parseWebPageContent(docClone: Document): ParseResult {
  const docParser = new Readability(docClone)
  const article = docParser.parse() // returns { textContent, ... }

  if (article === null || !article.textContent) {
    return {
      textContent: null,
      title: null,
      error: true,
      message: 'No readable text found on this page.',
    }
  }

  return {
    textContent: article.textContent,
    title: article.title ?? docClone.title,
    error: false,
  }
}

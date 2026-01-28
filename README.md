# Read for Speed: Speed Reading with the RSVP Technique

Speed read at 300-1000 words per minute using the RSVP (Rapid Serial Visual Presentation) technique. Perfect for books, articles, or any long form content.

## Features

- Responsive design
- Chrome & Firefox extensions
- Safari extension (WIP)
- Customizable settings for font size, font family, reading speed, and more
- Reading progress bar and stats
- Word display with control panel
- Read in chunks of 1-5 words (WIP)

## Monorepo Structure

```sh
.
└── packages
    ├── extensions # Chrome, Firefox
    ├── speed-reader # RSVP Reader component
    └── ui # Shared UI components
```

## RSVP Reader Component

The main reader component that takes in content and displays it in RSVP format.

> **NOTE:** To parse content, [Readability JS](https://github.com/mozilla/readability) library is recommended.

## Extensions

### Building

#### Chrome & Firefox

- built with [WXT](https://wxt.dev/).

#### Safari (WIP)

- built by using the [Safari Extension Converter](https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari).

## Roadmap

- [x] Chrome extension
- [x] Settings panel
- [x] Reading stats
- [x] Word display with control panel
 -[x] SPeed control from 50 - 1000 WPM
 -[x] Word skip size control from 1 - 10 words
 -[x] Progress bar
 -[x] Panel for reading stats
 -[x] Panel for settings
 -[x] Control panel for playback, skip, reset, etc.
 -[ ] Panel for help / documentation
- [x] Allow for reading chunks of 1-3 words
- [x] Check for readerability before parsing page content
- [x] Make sure parsing doesnt block the main thread
- [x] Make sure errors from parsing don't break the page
- [ ] Test on different sites like Reddit, Hacker News, etc.
- [ ] Add epub support for native reading experience

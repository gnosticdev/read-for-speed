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

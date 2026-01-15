import { browser } from 'wxt/browser';

export default defineContentScript({
  matches: ['<all_urls>'],
  world: 'ISOLATED',

  main() {
    // Provide readable page content to the popup on demand.

    browser.runtime.onMessage.addListener((message) => {
      if (message?.type !== 'RSVP_GET_PAGE_TEXT') return;

      return Promise.resolve({
        text: document.body?.innerText ?? '',
        title: document.title ?? '',
      });
    });
  },
});


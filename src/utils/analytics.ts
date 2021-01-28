export const logEvent = (eventName: string, eventParams: any ) => {
  if (eventName) {
    window?.gtag('event', eventName, eventParams);
  }
};
export const logEvent = (eventName: string, eventParams: any ) => {
  if (eventName) {
    console.log('event emitted:', eventName);
    window?.gtag('event', eventName, eventParams);
  }
};
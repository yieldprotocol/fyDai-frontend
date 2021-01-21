import ReactGA from 'react-ga';
import { IAnalytics } from '../types';

export const initGA = () => {
  // console.log('GA init', process.env.GOOGLE_ANALYTICS)
  ReactGA.initialize(process.env.GOOGLE_ANALYTICS as string);
};

export const logPageView = () => {
  // console.log(`Logging pageview for ${window.location.pathname}`)
  ReactGA.set({ page: window.location.pathname });
  ReactGA.pageview(window.location.pathname);
};

export const logEvent = (object: IAnalytics ) => {
  if (object) {
    window?.gtag('send', 'page_view', object);
  }
};

export const logException = (description = '', fatal = false) => {
  if (description) {
    ReactGA.exception({ description, fatal });
  }
};

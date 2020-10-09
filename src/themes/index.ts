import { css } from 'styled-components';

export const yieldTheme = {
  name: 'yieldTheme',
  rounding: 'xsmall',
  spacing: 20,
  pad: 'small',
  defaultMode: 'light',
  global: {
    elevation: {
      dark: {
        none: 'none',
        xsmall: '0px 2px 2px rgba(255, 255, 255, 0.5)',
        small: '0px 4px 4px rgba(255, 255, 255, 0.5)',
        medium: '0px 6px 8px rgba(255, 255, 255, 0.5)',
        large: '0px 8px 16px rgba(255, 255, 255, 0.5)',
        xlarge: '0px 12px 24px rgba(255, 255, 255, 0.5)',
      },
    },
    colors: {
      brand: {
        dark: '#005792',
        light: '#000000',
      },
      'brand-transparent': {
        dark: '#0057921A',
        light: '#0000001A',
        
      },
      'brand-light': {
        dark: '#FFFFFF',
        light: '#AEA3B0',
      },
      secondary: {
        dark: '#627EEA',
        light: '#627EEA',
      },
      'secondary-transparent': {
        dark: '#627EEA1A',
        light: '#627EEA1A',
      },
      background: {
        dark: '#111111',
        light: '#f8f8f8',
      },
      'background-back': {
        dark: '#111111',
        light:'#f1f1f1'
      },
      'background-mid': {
        dark: 'dark-1',
        light:'#f1f1f1'
      },
      'background-front': {
        dark: '#222222',
        light:'#f8f8f8'
      },
      'background-contrast': {
        dark: '#FFFFFF11',
        light: '#11111111',
      },
      text: {
        dark: '#EEEEEE',
        light: '#222222',
      },
      'text-strong': {
        dark: '#FFFFFF',
        light: '#000000',
      },
      'text-weak': {
        dark: '#CCCCCC',
        light: '#555555',
      },
      'text-xweak': {
        dark: '#999999',
        light: '#5f767e96',
      },
      border: {
        dark: 'rgba(0, 0, 0, 0.08)',
        light: 'rgba(0, 0, 0, 0.08)',
      },
      focus: 'none',
      placeholder: 'weak-text',
      control: 'brand',
      'active-background': 'background-contrast',
      'active-text': 'text-strong',
      'selected-background': 'brand',
      'selected-text': 'text-strong',
      'status-critical': '#FF4040',
      'status-warning': '#FFAA15',
      'status-ok': '#00C781',
      'status-unknown': '#CCCCCC',
      'status-disabled': '#CCCCCC',
    },

    'font': {
      'family': '"Sora"',
      'face': "/* latin-ext */\n@font-face {\n  font-family: 'Sora';\n  font-style: normal;\n  font-weight: 400;\n  src: url(https://fonts.gstatic.com/s/sora/v1/xMQOuFFYT72X5wkB_18qmnndmSdSnk-DKQRDA8i1P4xdNw.woff) format('woff');\n  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;\n}\n/* latin */\n@font-face {\n  font-family: 'Sora';\n  font-style: normal;\n  font-weight: 400;\n  src: url(https://fonts.gstatic.com/s/sora/v1/xMQOuFFYT72X5wkB_18qmnndmSdSnk-NKQRDA8i1P4w.woff) format('woff');\n  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;\n}\n\n/* latin-ext */\n@font-face {\n  font-family: 'Sora';\n  font-style: normal;\n  font-weight: 400;\n  src: url(https://fonts.gstatic.com/s/sora/v1/xMQOuFFYT72X5wkB_18qmnndmSdSnk-DKQRDA8i1P4xdNw.woff) format('woff');\n  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;\n}\n/* latin */\n@font-face {\n  font-family: 'Sora';\n  font-style: normal;\n  font-weight: 400;\n  src: url(https://fonts.gstatic.com/s/sora/v1/xMQOuFFYT72X5wkB_18qmnndmSdSnk-NKQRDA8i1P4w.woff) format('woff');\n  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;\n}\n",
      'size': '15px',
      'height': '20px',
      'maxWidth': '300px'
    },

    active: {
      background: 'active-background',
      color: 'active-text',
    },
    hover: {
      background: 'active-background',
      color: 'active-text',
    },
    selected: {
      background: 'selected-background',
      color: 'selected-text',
    },
    borderSize: {
      xsmall: '1px',
      small: '2px',
      medium: '3px',
      large: '10px',
      xlarge: '20px',
    },
    breakpoints: {
      small: {
        value: 640,
        borderSize: {
          xsmall: '1px',
          small: '2px',
          medium: '3px',
          large: '5px',
          xlarge: '10px',
        },
        edgeSize: {
          none: '0px',
          hair: '1px',
          xxsmall: '2px',
          xsmall: '3px',
          small: '5px',
          medium: '10px',
          large: '20px',
          xlarge: '40px',
        },
        size: {
          xxsmall: '20px',
          xsmall: '40px',
          small: '80px',
          medium: '160px',
          large: '320px',
          xlarge: '640px',
          full: '100%',
        },
      },
      medium: {
        value: 1280,
      },
      large: {},
    },
    edgeSize: {
      none: '0px',
      hair: '1px',
      xxsmall: '3px',
      xsmall: '5px',
      small: '10px',
      medium: '20px',
      large: '40px',
      xlarge: '80px',
      responsiveBreakpoint: 'small',
    },
    input: {
      padding: { vertical: 'xsmall', horizontal: 'small' },
      weight: 100,
      extend: () => css`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type='number'] {
          -moz-appearance: textfield;
        }
      `,
    },
    spacing: '20px',
    size: {
      xxsmall: '40px',
      xsmall: '80px',
      small: '160px',
      medium: '320px',
      large: '640px',
      xlarge: '960px',
      xxlarge: '1280px',
      full: '100%',
    },
  },
  grommet: {
    // @ts-ignore
    extend: () => css`
      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type='number'] {
        -moz-appearance: textfield;
      }
      overflow: auto;
      -ms-overflow-style: none;
      scrollbar-width: none;
      ::-webkit-scrollbar {
        display: none;
      }
    `,
  },
  TextInput: {
    color: 'red',
    // @ts-ignore
    extend: () => css`
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type='number'] {
          -moz-appearance: textfield;
        }
        overflow: auto;
        -ms-overflow-style: none;
        scrollbar-width: none;
        ::-webkit-scrollbar {
          display: none;
        }
      `,
  },
  collapsible: {
    minSpeed: '300',
  },
  meter: {},
  anchor: {
    hover: {
      extend: {
        opacity: '0.5',
      },
    },
  },
  button: {
    border: {
      width: '1px',
      radius: '20px',
    },
    padding: {
      vertical: '0px',
      horizontal: '8px',
    },
    // @ts-ignore
    extend: () => css`
        white-space: nowrap
      `
  },
  checkBox: {
    check: {
      radius: '24px',
    },
    toggle: {
      radius: '20px',
      size: '40px',
    },
    size: '20px',
  },
  radioButton: {
    size: '20px',
  },
  formField: {
    border: {
      color: 'border',
      error: {
        color: {
          dark: 'white',
          light: 'status-critical',
        },
      },
      position: 'inner',
    },
    content: {
      pad: 'small',
    },
    disabled: {
      background: {
        // 'color': 'status-disabled',
        // 'opacity': 'medium'
      },
    },
    error: {
      color: 'status-critical',
      margin: {
        vertical: 'xsmall',
        horizontal: 'xsmall',
      },
      size: 'xsmall',
    },
    help: {
      color: 'dark-3',
      margin: {
        start: 'small',
        horizontal: 'xsmall',
        vertical: 'xsmall',
      },
      size: 'xsmall',
      weight: 'normal',
    },
    info: {
      color: 'text-xweak',
      margin: {
        vertical: 'xsmall',
        horizontal: 'small',
      },
    },
    label: {
      margin: {
        vertical: 'xsmall',
        horizontal: 'xsmall',
      },
      size: 'xsmall',
    },
    margin: {
      bottom: 'small',
    },
    round: '24px',
  },

  heading: {
    level: {
      '1': {
        small: {
          size: '22px',
          height: '27px',
          maxWidth: '433px',
        },
        medium: {
          size: '28px',
          height: '33px',
          maxWidth: '567px',
        },
        large: {
          size: '42px',
          height: '47px',
          maxWidth: '833px',
        },
        xlarge: {
          size: '55px',
          height: '60px',
          maxWidth: '1100px',
        },
      },
      '2': {
        small: {
          size: '20px',
          height: '25px',
          maxWidth: '400px',
        },
        medium: {
          size: '25px',
          height: '30px',
          maxWidth: '500px',
        },
        large: {
          size: '30px',
          height: '35px',
          maxWidth: '600px',
        },
        xlarge: {
          size: '35px',
          height: '40px',
          maxWidth: '700px',
        },
      },
      '3': {
        small: {
          size: '18px',
          height: '23px',
          maxWidth: '367px',
        },
        medium: {
          size: '22px',
          height: '27px',
          maxWidth: '433px',
        },
        large: {
          size: '25px',
          height: '30px',
          maxWidth: '500px',
        },
        xlarge: {
          size: '28px',
          height: '33px',
          maxWidth: '567px',
        },
      },
      '4': {
        small: {
          size: '17px',
          height: '22px',
          maxWidth: '333px',
        },
        medium: {
          size: '18px',
          height: '23px',
          maxWidth: '367px',
        },
        large: {
          size: '20px',
          height: '25px',
          maxWidth: '400px',
        },
        xlarge: {
          size: '22px',
          height: '27px',
          maxWidth: '433px',
        },
      },
      '5': {
        small: {
          size: '14px',
          height: '19px',
          maxWidth: '283px',
        },
        medium: {
          size: '14px',
          height: '19px',
          maxWidth: '283px',
        },
        large: {
          size: '14px',
          height: '19px',
          maxWidth: '283px',
        },
        xlarge: {
          size: '14px',
          height: '19px',
          maxWidth: '283px',
        },
      },
      '6': {
        small: {
          size: '13px',
          height: '18px',
          maxWidth: '267px',
        },
        medium: {
          size: '13px',
          height: '18px',
          maxWidth: '267px',
        },
        large: {
          size: '13px',
          height: '18px',
          maxWidth: '267px',
        },
        xlarge: {
          size: '13px',
          height: '18px',
          maxWidth: '267px',
        },
      },
    },
  },

  text: {
    xxxsmall: {
      size: '8px',
      height: '14px',
      maxWidth: '220px',
    },
    xxsmall: {
      size: '10px',
      height: '15px',
      maxWidth: '243px',
    },
    xsmall: {
      size: '13px',
      height: '18px',
      maxWidth: '267px',
    },
    small: {
      size: '14px',
      height: '19px',
      maxWidth: '283px',
    },
    medium: {
      size: '15px',
      height: '20px',
      maxWidth: '300px',
    },
    large: {
      size: '17px',
      height: '22px',
      maxWidth: '333px',
    },
    xlarge: {
      size: '18px',
      height: '23px',
      maxWidth: '367px',
    },
    xxlarge: {
      size: '22px',
      height: '27px',
      maxWidth: '433px',
    },
  },
  scale: 0.5,
  layer: {
    background: {
      dark: '#11111100',
      light: '#FFFFFF00',
    },
    container: {
      zIndex: '20',
    },
    zIndex: '15',
    overlay: {
      background: '#000000A6', // 60%
    },
  },

  table: {
    focus: 'brand',
  },

  tab: {
    margin: { horizontal: 'none', vertical: 'xxsmall' },
    color: 'active-text',
    active: {
      // @ts-ignore
      extend: ({ theme }) => css`
        font-weight: 'bold';
      `,
    },
    hover: {
      background: 'background-front',
    },

    border: {
      side: 'all',
      size: 'xsmall',
      color: 'background-front',
      edgeSize: 'xlarge',
      hover: {
        color: 'brand',
      },
      active: {
        color: 'brand',
      },
    },
    pad: 'small',
    // @ts-ignore
    extend: ({ theme }) => css`
      border-radius: ${theme.global.edgeSize.xsmall};
      positon: fixed;
    `,
  },
  tabs: {
    gap: 'small',
    header: {
      pad: 'large',
      gap: 'none',
      // // @ts-ignore
      // extend: ({ theme }) => css`
      // position: fixed;
      // `
    },
    panel: {
      //   // @ts-ignore
      //   extend: ({ theme }) => css`
      //   overflow: auto;
      //   -ms-overflow-style: none;
      //   scrollbar-width: none;
      //   ::-webkit-scrollbar { display:none; }
      // `
    },
    // @ts-ignore
    extend: ({ theme }) => css`
      flex: ${theme.global.edgeSize.small};
      radius: ${theme.global.edgeSize.large};
    `,
  },
  rangeInput: {
    track: {
      height: 'small',
      extend: () => 'border-radius: 10px',
    },
    thumb: {
      color: 'brand',
    },
  },
};

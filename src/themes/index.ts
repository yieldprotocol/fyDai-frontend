import { css } from 'styled-components';

export const yieldTheme = {
  'name': 'yieldTheme',
  'rounding': 24,
  'spacing': 20,
  'pad': 'xlarge',
  'defaultMode': 'light',
  'global': {
    'elevation': {
      'dark': {
        'none': 'none',
        'xsmall': '0px 2px 2px rgba(255, 255, 255, 0.10)',
        'small': '0px 4px 4px rgba(255, 255, 255, 0.10)',
        'medium': '0px 6px 8px rgba(255, 255, 255, 0.10)',
        'large': '0px 8px 16px rgba(255, 255, 255, 0.10)',
        'xlarge': '0px 12px 24px rgba(255, 255, 255, 0.10)',
      },
    },
    'colors': {
      'brand': {
        'dark': '#78F029',
        'light': '#49E303'
      },
      'background': {
        // 'dark': '#111111',
        // 'light': '#FFFFFF'
        'dark': 'linear-gradient(135deg, rgba(138,5,12,1) 0%, rgba(17,17,17,1) 33%, rgba(17,17,17,1) 100%)',
        'light': 'linear-gradient(45deg, rgba(120,240,41,0.30) 0%, rgba(255,255,255,0) 33%, rgba(255,255,255,0) 100%)',
      },
      'background-back': {
        'dark': '#111111',
        'light': '#EEEEEE'
      },
      'background-frontheader': {
        'dark': 'linear-gradient(135deg, rgba(138,5,12,1) 0%, rgba(17,17,17,1) 33%, rgba(17,17,17,1) 100%)',
        'light': 'linear-gradient(45deg, rgba(120,240,41,0.30) 0%, #EEEEEE 33%, #EEEEEE 100%)'
        // 'dark': 'dark-2',
        // 'light': 'light-3'
      },
      'background-front': {
        'dark': '#222222',
        // 'dark': 'dark-1',
        'light': 'light-1'
      },
      'background-contrast': {
        'dark': '#FFFFFF11',
        'light': '#11111111'
      },
      'text': {
        'dark': '#EEEEEE',
        'light': '#333333'
      },
      'text-strong': {
        'dark': '#FFFFFF',
        'light': '#000000'
      },
      'text-weak': {
        'dark': '#CCCCCC',
        'light': '#444444'
      },
      'text-xweak': {
        'dark': '#999999',
        'light': '#666666'
      },
      'border': {
        'dark': '#444444',
        'light': '#CCCCCC'
      },
      'focus': 'none',
      'control': 'brand',
      'active-background': 'background-contrast',
      'active-text': 'text-strong',
      'selected-background': 'brand',
      'selected-text': 'text-strong',
      'status-critical': '#FF4040',
      'status-warning': '#FFAA15',
      'status-ok': '#00C781',
      'status-unknown': '#CCCCCC',
      'status-disabled': '#CCCCCC',
      'graph-0': 'brand',
      'graph-1': {
        'light': 'darkorange',
        'dark': 'orange'
      }
    },
    'font': {
      'family': '"Jost"',
      'size': '15px',
      'height': '20px',
      'maxWidth': '300px',
      'face': "/* cyrillic */\n@font-face {\n  font-family: 'Jost';\n  font-style: normal;\n  font-weight: 400;\n  src: url(https://fonts.gstatic.com/s/jost/v1/92z8tBhPNqw79Ij1C9z1vBQv7mxrZh9NHHnUBkLNPUtGwv1mORTOmqVU7ialrkw.woff) format('woff');\n  unicode-range: U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;\n}\n/* latin-ext */\n@font-face {\n  font-family: 'Jost';\n  font-style: normal;\n  font-weight: 400;\n  src: url(https://fonts.gstatic.com/s/jost/v1/92z8tBhPNqw79Ij1C9z1vBQv7mxrZh9NHHnUBkLNPUtGwv1mMxTOmqVU7ialrkw.woff) format('woff');\n  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;\n}\n/* latin */\n@font-face {\n  font-family: 'Jost';\n  font-style: normal;\n  font-weight: 400;\n  src: url(https://fonts.gstatic.com/s/jost/v1/92z8tBhPNqw79Ij1C9z1vBQv7mxrZh9NHHnUBkLNPUtGwv1mPRTOmqVU7ial.woff) format('woff');\n  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;\n}\n\n/* latin-ext */\n@font-face {\n  font-family: 'Lato';\n  font-style: normal;\n  font-weight: 400;\n  src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v16/S6uyw4BMUTPHjxAwXiWtFCfQ7A.woff2) format('woff2');\n  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;\n}\n/* latin */\n@font-face {\n  font-family: 'Lato';\n  font-style: normal;\n  font-weight: 400;\n  src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v16/S6uyw4BMUTPHjx4wXiWtFCc.woff2) format('woff2');\n  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;\n}\n\n/* latin-ext */\n@font-face {\n  font-family: 'Lato';\n  font-style: normal;\n  font-weight: 400;\n  src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v16/S6uyw4BMUTPHjxAwXiWtFCfQ7A.woff2) format('woff2');\n  unicode-range: U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF;\n}\n/* latin */\n@font-face {\n  font-family: 'Lato';\n  font-style: normal;\n  font-weight: 400;\n  src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v16/S6uyw4BMUTPHjx4wXiWtFCc.woff2) format('woff2');\n  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;\n}\n"
    },
    'active': {
      // 'background': 'active-background',
      'color': 'active-text'
    },
    'hover': {
      'background': 'active-background',
      'color': 'active-text'
    },
    'selected': {
      'background': 'selected-background',
      'color': 'selected-text'
    },
    'control': {
      'border': {
        'radius': '24px'
      }
    },
    'drop': {
      'border': {
        'radius': '24px'
      }
    },
    'borderSize': {
      'xsmall': '1px',
      'small': '2px',
      'medium': '3px',
      'large': '10px',
      'xlarge': '20px'
    },
    'breakpoints': {
      'small': {
        'value': 640,
        'borderSize': {
          'xsmall': '1px',
          'small': '2px',
          'medium': '3px',
          'large': '5px',
          'xlarge': '10px'
        },
        'edgeSize': {
          'none': '0px',
          'hair': '1px',
          'xxsmall': '2px',
          'xsmall': '3px',
          'small': '5px',
          'medium': '10px',
          'large': '20px',
          'xlarge': '40px'
        },
        'size': {
          'xxsmall': '20px',
          'xsmall': '40px',
          'small': '80px',
          'medium': '160px',
          'large': '320px',
          'xlarge': '640px',
          'full': '100%'
        }
      },
      'medium': {
        'value': 1280
      },
      'large': {}
    },
    'edgeSize': {
      'none': '0px',
      'hair': '1px',
      'xxsmall': '3px',
      'xsmall': '5px',
      'small': '10px',
      'medium': '20px',
      'large': '40px',
      'xlarge': '80px',
      'responsiveBreakpoint': 'small'
    },
    'input': {
      'padding': { 'vertical': 'xsmall', 'horizontal':'small' },
      'weight': 100,
    },
    'spacing': '20px',
    'size': {
      'xxsmall': '40px',
      'xsmall': '80px',
      'small': '160px',
      'medium': '320px',
      'large': '640px',
      'xlarge': '960px',
      'xxlarge': '1280px',
      'full': '100%'
    }
  },
  'chart': {},
  'diagram': {
    'line': {}
  },
  'TextInput': {

  },

  'meter': {},
  'button': {
    'border': {
      'width': '1px',
      'radius': '15px'
    },
    'padding': {
      'vertical': '3px',
      'horizontal': '18px'
    }
  },
  'checkBox': {
    'check': {
      'radius': '24px'
    },
    'toggle': {
      'radius': '20px',
      'size': '40px'
    },
    'size': '20px'
  },
  'radioButton': {
    'size': '20px'
  },
  'formField': {
    'border': {
      'color': 'border',
      'error': {
        'color': {
          'dark': 'white',
          'light': 'status-critical'
        }
      },
      'position': 'inner',
      // 'side': 'bottom',
      // 'style': 'dotted'
    },
    'content': {
      'pad': 'small'
    },
    'disabled': {
      'background': {
        // 'color': 'status-disabled',
        // 'opacity': 'medium'
      }
    },
    'error': {
      'color': 'status-critical',
      'margin': {
        'vertical': 'xsmall',
        'horizontal': 'xsmall'
      },
      'size': 'xsmall'
    },
    'help': {
      'color': 'dark-3',
      'margin': {
        'start': 'small',
        'horizontal': 'xsmall',
        'vertical': 'xsmall'
      },
      'size': 'xsmall',
      'weight': 'normal'
    },
    'info': {
      'color': 'text-xweak',
      'margin': {
        'vertical': 'xsmall',
        'horizontal': 'small'
      }
    },
    'label': {
      'margin': {
        'vertical': 'xsmall',
        'horizontal': 'xsmall'
      },
      'size': 'xsmall',
    },
    'margin': {
      'bottom': 'small'
    },
    'round': '24px'
  },
  'calendar': {
    'small': {
      'fontSize': '13.333333333333334px',
      'lineHeight': 1.375,
      'daySize': '22.86px'
    },
    'medium': {
      'fontSize': '15px',
      'lineHeight': 1.45,
      'daySize': '45.71px'
    },
    'large': {
      'fontSize': '20px',
      'lineHeight': 1.11,
      'daySize': '91.43px'
    }
  },
  'clock': {
    'analog': {
      'hour': {
        'width': '7px',
        'size': '20px'
      },
      'minute': {
        'width': '3px',
        'size': '10px'
      },
      'second': {
        'width': '3px',
        'size': '8px'
      },
      'size': {
        'small': '60px',
        'medium': '80px',
        'large': '120px',
        'xlarge': '180px',
        'huge': '240px'
      }
    },
    'digital': {
      'text': {
        'xsmall': {
          'size': '11.666666666666666px',
          'height': 1.5
        },
        'small': {
          'size': '13.333333333333334px',
          'height': 1.43
        },
        'medium': {
          'size': '15px',
          'height': 1.375
        },
        'large': {
          'size': '16.666666666666668px',
          'height': 1.167
        },
        'xlarge': {
          'size': '18.333333333333332px',
          'height': 1.1875
        },
        'xxlarge': {
          'size': '21.666666666666668px',
          'height': 1.125
        }
      }
    }
  },
  'heading': {
    'level': {
      '1': {
        'small': {
          'size': '22px',
          'height': '27px',
          'maxWidth': '433px'
        },
        'medium': {
          'size': '28px',
          'height': '33px',
          'maxWidth': '567px'
        },
        'large': {
          'size': '42px',
          'height': '47px',
          'maxWidth': '833px'
        },
        'xlarge': {
          'size': '55px',
          'height': '60px',
          'maxWidth': '1100px'
        }
      },
      '2': {
        'small': {
          'size': '20px',
          'height': '25px',
          'maxWidth': '400px'
        },
        'medium': {
          'size': '25px',
          'height': '30px',
          'maxWidth': '500px'
        },
        'large': {
          'size': '30px',
          'height': '35px',
          'maxWidth': '600px'
        },
        'xlarge': {
          'size': '35px',
          'height': '40px',
          'maxWidth': '700px'
        }
      },
      '3': {
        'small': {
          'size': '18px',
          'height': '23px',
          'maxWidth': '367px'
        },
        'medium': {
          'size': '22px',
          'height': '27px',
          'maxWidth': '433px'
        },
        'large': {
          'size': '25px',
          'height': '30px',
          'maxWidth': '500px'
        },
        'xlarge': {
          'size': '28px',
          'height': '33px',
          'maxWidth': '567px'
        }
      },
      '4': {
        'small': {
          'size': '17px',
          'height': '22px',
          'maxWidth': '333px'
        },
        'medium': {
          'size': '18px',
          'height': '23px',
          'maxWidth': '367px'
        },
        'large': {
          'size': '20px',
          'height': '25px',
          'maxWidth': '400px'
        },
        'xlarge': {
          'size': '22px',
          'height': '27px',
          'maxWidth': '433px'
        }
      },
      '5': {
        'small': {
          'size': '14px',
          'height': '19px',
          'maxWidth': '283px'
        },
        'medium': {
          'size': '14px',
          'height': '19px',
          'maxWidth': '283px'
        },
        'large': {
          'size': '14px',
          'height': '19px',
          'maxWidth': '283px'
        },
        'xlarge': {
          'size': '14px',
          'height': '19px',
          'maxWidth': '283px'
        }
      },
      '6': {
        'small': {
          'size': '13px',
          'height': '18px',
          'maxWidth': '267px'
        },
        'medium': {
          'size': '13px',
          'height': '18px',
          'maxWidth': '267px'
        },
        'large': {
          'size': '13px',
          'height': '18px',
          'maxWidth': '267px'
        },
        'xlarge': {
          'size': '13px',
          'height': '18px',
          'maxWidth': '267px'
        }
      }
    }
  },
  'paragraph': {
    'small': {
      'size': '14px',
      'height': '19px',
      'maxWidth': '283px'
    },
    'medium': {
      'size': '15px',
      'height': '20px',
      'maxWidth': '300px'
    },
    'large': {
      'size': '17px',
      'height': '22px',
      'maxWidth': '333px'
    },
    'xlarge': {
      'size': '18px',
      'height': '23px',
      'maxWidth': '367px'
    },
    'xxlarge': {
      'size': '22px',
      'height': '27px',
      'maxWidth': '433px'
    }
  },
  'text': {
    'xsmall': {
      'size': '13px',
      'height': '18px',
      'maxWidth': '267px'
    },
    'small': {
      'size': '14px',
      'height': '19px',
      'maxWidth': '283px'
    },
    'medium': {
      'size': '15px',
      'height': '20px',
      'maxWidth': '300px'
    },
    'large': {
      'size': '17px',
      'height': '22px',
      'maxWidth': '333px'
    },
    'xlarge': {
      'size': '18px',
      'height': '23px',
      'maxWidth': '367px'
    },
    'xxlarge': {
      'size': '22px',
      'height': '27px',
      'maxWidth': '433px'
    }
  },
  'scale': 0.5,
  'layer': {
    'background': {
      'dark': '#11111100',
      'light': '#FFFFFF00',
    },
    'overlay' : {
      'background': '#000000BF'
    }
  },

  'table' : {
    'focus': 'brand'
  }, 

  'tab': {
    'margin' : { 'horizontal':'none', 'vertical': 'xxsmall' },
    'color': 'active-text',
    'active': {
      'background': 'background-front',
      // @ts-ignore
      // extend: ({ theme }) => css`
      // font-weight: 'bold';
      // `
    },
    'border': { 
      'side': 'all',
      'size': 'xsmall',
      'color' : 'background-front',
      'edgeSize':'xlarge',
      'hover': { 
        'color': 'brand'
      },
      'active' : {
        'color': 'background-front'
      }
    },
    'pad': 'small',
    // @ts-ignore
    extend: ({ theme }) => css`
    border-radius: ${theme.global.edgeSize.large};
    width: ${theme.global.edgeSize.xlarge};
    `,
  },

  'tabs': {
    'gap': 'small',
    // 'pad': 'xsmall',
    'header': {
      'pad': 'large',
      'gap' : 'none', 
    },
    // @ts-ignore
    extend: ({ theme }) => css`
      flex: ${theme.global.edgeSize.small};
      radius: ${theme.global.edgeSize.small};
      `
  }

};
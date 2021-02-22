import React, { useContext, useState } from 'react';
import { Box, ThemeContext, ResponsiveContext, Collapsible, Stack } from 'grommet';
import styled, { css } from 'styled-components';

import { modColor } from '../utils';

const StyledBox = styled(Box)`
border-radius: 25px;

${(props:any) => props.disabled && css`
    background: ${ props.background };
    box-shadow:  0px 0px 0px ${modColor(props.background, 0)}, -0px -0px 0px ${modColor(props.background, 0)};
    -webkit-transition: transform 0.3s ease, box-shadow 0.3s ease-out; 
    -moz-transition: transform 0.3s ease, box-shadow 0.3s ease-out; 
    transition: transform 0.3s ease, box-shadow 0.3s ease-out;
`}

${(props:any) => props.background && css`
    background: ${ props.background };
    box-shadow:  6px 6px 11px ${modColor(props.background, -20)}, -6px -6px 11px ${modColor(props.background, 10)};
    :active:hover {
      box-shadow:  0px 0px 0px ${modColor(props.background, -20)}, -0px -0px 0px ${modColor(props.background, 10)};
      -webkit-transition: transform 0.3s ease, box-shadow 0.3s ease-out; 
      -moz-transition: transform 0.3s ease, box-shadow 0.3s ease-out; 
      transition: transform 0.3s ease, box-shadow 0.3s ease-out;
    }
    :hover {
    transform: scale(1.02);
    -webkit-transition: transform 0.3s ease, box-shadow 0.3s ease-out; 
    -moz-transition: transform 0.3s ease, box-shadow 0.3s ease-out; 
    transition: transform 0.3s ease, box-shadow 0.3s ease-out;
    box-shadow:  8px 8px 11px ${modColor(props.background, -20)}, -8px -8px 11px ${modColor(props.background, 10)};
}
`}
`;

interface ISelectorProps {
  items: any[];
  selectedIndex: number;
  selectItemCallback: any;
  flat?: boolean;
}

const Selector = ( { 
  
  items, 
  selectedIndex : _selectedIndex, 
  selectItemCallback,
  flat 

}:ISelectorProps ) =>  {

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  const theme:any = useContext(ThemeContext);
  const themeBackground = theme.global.colors.background;
  const defaultBackground = theme.dark === true ? themeBackground.dark: themeBackground.light;

  /* local state */
  const [ selectorOpen, setSelectorOpen ] = useState<boolean>();
  const [ selectedIndex, setSelectedIndex ] = useState<number>(_selectedIndex);

  const makeSelection = (_index:number) => {
    setSelectedIndex(_index); 
    selectItemCallback(_index);
  };

  return (
    <Stack fill='horizontal' alignSelf='start'>
      <Box />
      <Box
        round={selectorOpen? 'small': 'large'}
        onClick={()=>setSelectorOpen(!selectorOpen)}
        border={selectorOpen ? 'all': undefined}
        background={defaultBackground}
      >
        {
        !flat ?
          <StyledBox background={selectorOpen? undefined : defaultBackground}>
            { items[ selectedIndex ] }
          </StyledBox> :
          <Box>
            { items[ selectedIndex ] }  
          </Box>        
        }

        <Collapsible open={selectorOpen}>
          <Box gap='small' pad={{ top:'small' }}>
            { 
              items?.map( (x:any, i:number) => (
                i !== selectedIndex && 
                  <Box
                    key={i}
                    onClick={()=> makeSelection(i)} 
                    hoverIndicator={modColor(defaultBackground, -10)}
                  >
                    {x}
                  </Box>
              ))
              }
          </Box>
        </Collapsible>
      </Box>
    </Stack>
  );
};

Selector.defaultProps={ flat:false };

export default Selector;

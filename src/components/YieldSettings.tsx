import React, { useEffect, useState, useContext } from 'react';
import styled, { css } from 'styled-components';
import { Box, Text, ThemeContext } from 'grommet';

import { UserContext } from '../contexts/UserContext';
import FlatButton from './FlatButton';
import { modColor } from '../utils';

const StyledBox = styled(Box)`
  border-radius: 25px;
  transition: all 0.3s ease-in-out;

  ${(props:any) => !(props.border) && css`
  background: ${ props.background };
  border-color: ${ props.background };
  box-shadow: 0px 0px 0px ${modColor(props.background, -15)}, -0px -0px 0px ${modColor(props.background, 10)};
  :active:hover {
    transform: scale(1);
    box-shadow: inset 6px 6px 11px ${modColor(props.background, -15)}, inset -6px -6px 11px ${modColor(props.background, 10)};
    }
  :hover {
    transform: scale(1.02);
    box-shadow:  6px 6px 11px ${modColor(props.background, -15)}, -6px -6px 11px ${modColor(props.background, 10)};
    }
  `}
  ${(props:any) => (props.border) && css`
  background: ${ props.background };
  border-color: ${ props.background };
  box-shadow:  inset 6px 6px 11px ${modColor(props.background, -15)},  
    inset -6px -6px 11px ${modColor(props.background, 10)};
  :active:hover {
    box-shadow:  0px 0px 0px ${modColor(props.background, -15)}, 
        -0px -0px 0px ${modColor(props.background, 10)};
    }
  :hover {
    /* transform: scale(1.01); */
    }
  `}
  ${(props:any) => (props.disabled) && css`
  box-shadow:  0px 0px 0px ${modColor(props.background, -15)}, 
    -0px -0px 0px ${modColor(props.background, 10)};
  :active:hover {
    box-shadow:  0px 0px 0px ${modColor(props.background, -15)}, 
        -0px -0px 0px ${modColor(props.background, 10)};
    }
  :hover {
    transform: scale(1);
    }
  `}
`;

const slippageList = [0.001, 0.005, 0.01];

const YieldSettings = () => {

  const { state: { preferences }, actions: { updatePreferences } } = useContext(UserContext);
  const [ useTxApproval, setUseTxApproval] = useState<boolean>(!preferences.useTxApproval);
  
  const theme:any = React.useContext(ThemeContext);
  const themeBackground = theme.global.colors.background;
  const defaultBackground = theme.dark === true ? themeBackground.dark: themeBackground.light;

  useEffect(()=>{
    setUseTxApproval(!preferences.useTxApproval);
  }, [preferences.useTxApproval]);

  return (
    <>
      <Box pad="small" gap="small">
        <Box direction='row' justify='between'>
          <Text alignSelf='start' size='large' weight='bold'>Settings</Text> 
          <Box round>
            <FlatButton
              disabled
              // eslint-disable-next-line no-console
              onClick={()=>console.log('STILL TO DO!')}
              label={<Text size='xsmall'>More settings</Text>}
            /> 
          </Box>
        </Box> 

        <Box
          pad={{ vertical:'small' }}
          justify="between"
          gap='small'
          direction='row'
          align='center'
        >
          <Text size='xsmall'>Slippage tolerance:  </Text>

          { slippageList.map( (x:any, i:number) => (
            <Box gap='small' align='center' key={x}>
              <StyledBox
                pad={{ horizontal: 'large', vertical: 'xsmall' }}
                onClick={() => updatePreferences({ slippage: slippageList[i] })}
                border={slippageList.indexOf(preferences.slippage)!== i ? undefined : 'all'}
                background={defaultBackground}
              >
                <Text size="xxsmall">
                  {x*100} %
                </Text>
              </StyledBox>
            </Box>)
          )}   
        </Box> 

        <Box
          pad={{ vertical:'small' }}
          justify="between"
          gap='small'
          direction='row'
          align='center'
        >
          <Text size='xsmall'>Authorisation strategy: </Text>

          <Box gap='small' align='center'>
            <StyledBox
              pad={{ horizontal: 'large', vertical: 'xsmall' }}
              onClick={() => updatePreferences({ useTxApproval: false })}
              border={useTxApproval? 'all':undefined}
              background={defaultBackground}
            >
              <Text size="xxsmall">
                Sign permits
              </Text>
            </StyledBox>
          </Box>

          <Box gap='small' align='center'>
            <StyledBox
              pad={{ horizontal: 'small', vertical: 'xsmall' }}
              onClick={() => updatePreferences({ useTxApproval: true })}
              border={useTxApproval?undefined:'all'}
              background={defaultBackground}
            >
              <Text size="xxsmall">
                Approval transactions
              </Text>
            </StyledBox>
          </Box>
        </Box>
      </Box>
    </>
       
  );
};

export default YieldSettings;
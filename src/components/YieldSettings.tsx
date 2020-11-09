import React, { useEffect, useState, useContext } from 'react';
import styled, { css } from 'styled-components';
import { Box, Text } from 'grommet';

import { UserContext } from '../contexts/UserContext';
import FlatButton from './FlatButton';

const StyledBox = styled(Box)`
  background: #f8f8f8;
  border-radius: 25px;
  border-color: #f8f8f8;
  transition: all 0.3s ease-in-out;
  ${(props:any) => !(props.border) && css`
  box-shadow: 0px 0px 0px #dfdfdf, -0px -0px 0px #ffffff;
  :active:hover {
    transform: scale(1);
    box-shadow: inset 6px 6px 11px #dfdfdf, inset -6px -6px 11px #ffffff;
    }
  :hover {
    transform: scale(1.02);
    box-shadow:  6px 6px 11px #dfdfdf, -6px -6px 11px #ffffff;
    }
  `}
  ${(props:any) => (props.border) && css`
  box-shadow:  inset 6px 6px 11px #dfdfdf,  
    inset -6px -6px 11px #ffffff;
  :active:hover {
    box-shadow:  0px 0px 0px #dfdfdf, 
        -0px -0px 0px #ffffff;
    }
  :hover {
    /* transform: scale(1.01); */
    }
  `}
  ${(props:any) => (props.disabled) && css`
  box-shadow:  0px 0px 0px #dfdfdf, 
    -0px -0px 0px #ffffff;
  :active:hover {
    box-shadow:  0px 0px 0px #dfdfdf, 
        -0px -0px 0px #ffffff;
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
import React, { useEffect, useState, useContext } from 'react';
import { Box, Text, ThemeContext } from 'grommet';

import { UserContext } from '../contexts/UserContext';
import FlatButton from './FlatButton';
import StickyButton from './StickyButton';

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
          <Text alignSelf='start' size='medium' weight='bold'>Settings</Text> 
          <Box round>
            <FlatButton
              disabled
              onClick={()=>null}
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
          <Text size='xxsmall'>Slippage tolerance:  </Text>

          { slippageList.map( (x:any, i:number) => (
            <Box gap='small' align='center' key={x}>
              <StickyButton        
                onClick={() => updatePreferences({ slippage: slippageList[i] })}
                background={defaultBackground}
                selected={slippageList.indexOf(preferences.slippage)!== i ? undefined : 'all'}
              >
                <Box pad={{ horizontal: 'large', vertical: 'xsmall' }}>
                  <Text size="xxsmall">
                    {x*100} %
                  </Text>
                </Box>
              </StickyButton>
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
          <Text size='xxsmall'>Authorization strategy: </Text>

          <Box gap='small' align='center'>
            <StickyButton
              onClick={() => updatePreferences({ useTxApproval: false })}
              background={defaultBackground}
              selected={useTxApproval? 'all':undefined}
            >
              <Box pad={{ horizontal: 'large', vertical: 'xsmall' }}>
                <Text size="xxsmall">
                  Sign permits
                </Text>
              </Box>
            </StickyButton>
          </Box>

          <Box gap='small' align='center'>
            <StickyButton
              onClick={() => updatePreferences({ useTxApproval: true })}
              background={defaultBackground}
              selected={useTxApproval?undefined:'all'}
            >
              <Box pad={{ horizontal: 'large', vertical: 'xsmall' }}>
                <Text size="xxsmall">
                  Approval transactions
                </Text>
              </Box>
            </StickyButton>
          </Box>
        </Box>
      </Box>
    </>
       
  );
};

export default YieldSettings;
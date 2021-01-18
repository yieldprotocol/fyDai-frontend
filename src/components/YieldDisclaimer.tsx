import React, { useContext, useState, useEffect } from 'react';
import { Anchor, Layer, Box, Text, CheckBox, ResponsiveContext } from 'grommet';

import { UserContext } from '../contexts/UserContext';
import { YieldContext } from '../contexts/YieldContext';

import FlatButton from './FlatButton';

const YieldDisclaimer = ({ forceShow=false, closeCallback }:any) =>  {

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const  { state: { yieldLoading } }  = useContext<any>(YieldContext);
  const  { state: { preferences }, actions: { updatePreferences } }  = useContext<any>(UserContext);
  const [ silenceDisclaimerChecked, setSilenceDisclaimerChecked] = useState<boolean>(false);

  const [showDisclaimer, setShowDisclaimer] = useState<boolean>(false);

  useEffect(() => {
    !yieldLoading && setShowDisclaimer(preferences.showDisclaimer);
  }, [yieldLoading, preferences.showDisclaimer]);

  return (
    <> 
      {
      (showDisclaimer || forceShow) &&
        <Layer
          modal={true}
          onEsc={()=>{ 
            setShowDisclaimer(false);     
          }}
          responsive={false}
          full={mobile?true:undefined}
        >
          <Box
            fill
            align="center"
            gap="large"
            round={mobile?undefined:'small'}
            elevation="medium"
            pad={!mobile? { vertical: 'large', horizontal: 'large' }: 'small'}
            background='background'
            width={!mobile?{ min:'620px', max:'620px' }: undefined}
          >
            <Text size='large' weight='bold'> Disclaimer </Text>
            <Text size='xxsmall'>
              The Yield app and the underlying smart contracts are provided on an “as is” and “as available” basis as described in the open source licenses on the <Anchor href='https://github.com/yieldprotocol' target='_blank' rel='noreferrer'>Yield Github</Anchor>. 
              While these smart contracts have been audited, Yield introduces a new primitive that may allow for unexpected behavior, 
              and you should only experiment with capital you are willing to lose completely.
            </Text>
            
            <Box fill='horizontal' direction='row-responsive' justify='between' gap='large' align='center'>
              <Box>
                <CheckBox 
                  label={<Text size='xxsmall'>In future, do not show this disclaimer.</Text>}
                  onChange={(e)=>setSilenceDisclaimerChecked(e.target.checked)}
                /> 
              </Box>

              <Box>
                <FlatButton 
                  label='Accept and continue'
                  onClick={() => {
                    silenceDisclaimerChecked && updatePreferences({ showDisclaimer: false });
                    setShowDisclaimer(false);
                  }}
                />
              </Box>
            </Box>

          </Box>
        </Layer>
      }
    </>
  );
}; 

export default YieldDisclaimer;
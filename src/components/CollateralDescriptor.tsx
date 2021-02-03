import React, { useContext } from 'react';
import { Box, Text, ResponsiveContext, ThemeContext } from 'grommet';

import RaisedButton from './RaisedButton';

interface ICollateralDescriptorProps {
  backToBorrow:any;
  children?:any;
}

function CollateralDescriptor( { backToBorrow, children }: ICollateralDescriptorProps ) {

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const theme:any = React.useContext(ThemeContext);

  return (
    <Box
      alignSelf="center"
      fill
      round='small'
      pad={{ top:'small', bottom:'large', horizontal:'small' }}
      gap='small'
      background="linear-gradient(to bottom right, #f0817f, #ff86c8, #82d4bb, #6ab6f1, #cb90c9, #aed175, #add8e6, #add8e6, #add8e6, #add8e6, #add8e6, #add8e6, #ffdc5c, #ffbf81, #95a4db)"
      margin={{ bottom:'-16px' }}
    >
      {
      !mobile && 
      <Box
        direction='row-responsive'
        fill='horizontal'
        gap='small'
        align='center'
        pad={{ horizontal:'large', vertical:'medium' }}
        justify='between'
      >
        <Text size='large' weight='bold' color={theme.global.colors.text.light}> 
          Manage ETH Collateral 
        </Text>

        <RaisedButton
          background='#add8e6'
          label={
            <Box align='center' direction='row' gap='small' pad='xsmall'>
              <Text size='xsmall' color={theme.global.colors.text.light}>
                Back to Borrow           
              </Text>
            </Box>
          }
          onClick={()=>backToBorrow()}
        />
      </Box>
      }     
      <Box pad={{ horizontal:'small' }}>
        { children }
      </Box>
    </Box>
  );
}

CollateralDescriptor.defaultProps={ children:null };

export default CollateralDescriptor; 

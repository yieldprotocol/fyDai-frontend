import React, { useContext } from 'react';
import { Box, Text, Collapsible, ResponsiveContext } from 'grommet';

import { SeriesContext } from '../contexts/SeriesContext';

import RaisedButton from './RaisedButton';

interface ICollateralDescriptorProps {
  backToBorrow:any;
  children?:any;
}

function CollateralDescriptor( { backToBorrow, children }: ICollateralDescriptorProps ) {

  const { state: seriesState } = useContext(SeriesContext);
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  return (
    <Box
      alignSelf="center"
      fill
      round='small'
      pad='small'
      gap='small'
      background="linear-gradient(to bottom right, #f0817f, #ff86c8, #82d4bb, #6ab6f1, #cb90c9, #aed175, #add8e6, #add8e6, #add8e6, #add8e6, #add8e6, #add8e6, #ffdc5c, #ffbf81, #95a4db)"
      margin={{ bottom:'-16px' }}
    >
      {!mobile && 
        <Box
          direction='row-responsive'
          fill='horizontal'
          gap='small'
          align='center'
          pad={{ horizontal:'large', vertical:'medium' }}
          justify='between'
        >
          <Text size='large' weight='bold'> 
            Manage ETH Collateral 
          </Text>

          <RaisedButton
            background='#add8e6'
            label={
              <Box align='center' direction='row' gap='small' pad='xsmall'>
                <Text size='xsmall'>
                  Back to Borrow           
                </Text>
              </Box>
          }
            onClick={()=>backToBorrow()}
          />
        </Box>}
        
      <Box pad={{ horizontal:'small' }}>
        <Collapsible open={!seriesState.seriesLoading}>
          { children }
        </Collapsible>
      </Box>
    </Box>
  );
}

CollateralDescriptor.defaultProps={ children:null };

export default CollateralDescriptor; 

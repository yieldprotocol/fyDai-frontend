import React, { useState, useContext } from 'react';
import { Box, Text, Collapsible, ResponsiveContext } from 'grommet';

import { SeriesContext } from '../contexts/SeriesContext';

import RaisedButton from './RaisedButton';

interface ICollateralDescriptorProps {
  backToBorrow:any;
  children?:any;
}

function CollateralDescriptor( props: ICollateralDescriptorProps ) {

  const { backToBorrow, children } = props;
  const { state: seriesState } = useContext(SeriesContext);
  const [ delegated ] = useState<boolean>(true);
  
  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  return (
    <>
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
          <Box 
            direction='row' 
            gap='small'
            align='center'
          >
            <Text size='large' weight='bold' color='brand'> 
              Manage ETH Collateral 
            </Text>
          </Box>

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
        
        <Box
          pad={!delegated? { horizontal:'medium' }: { horizontal:'medium', bottom:'medium' }}
        >
          <Collapsible open={!seriesState.seriesLoading}>
            { children }
          </Collapsible>
        </Box>
      </Box>
    </>
  );
}

CollateralDescriptor.defaultProps={ children:null };

export default CollateralDescriptor; 

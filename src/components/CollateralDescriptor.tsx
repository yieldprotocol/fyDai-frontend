import React, { useState, useContext, useEffect } from 'react';
import { Box, Text, ThemeContext, ResponsiveContext, Image, Collapsible } from 'grommet';


import { SeriesContext } from '../contexts/SeriesContext';

import logoDark from '../assets/images/logo.svg';
import logoLight from '../assets/images/logo_light.svg';

import SeriesSelector from './SeriesSelector';
import AprBadge from './AprBadge';
import Authorization from './Authorization';
import Loading from './Loading';
import RaisedButton from './RaisedButton';
import { modColor } from '../utils';
import EthMark from './logos/EthMark';

interface ICollateralDescriptorProps {
  backToBorrow:any;
  children?:any;
}

function CollateralDescriptor( props: ICollateralDescriptorProps ) {

  const { backToBorrow, children } = props;
  const theme = useContext<any>(ThemeContext);
  const screenSize = useContext(ResponsiveContext);

  const { state: seriesState } = useContext(SeriesContext);
  const [ selectorOpen, setSelectorOpen ] = useState<boolean>(false);
  const [ delegated, setDelegated ] = useState<boolean>(true);

  return (
    <>
      <Box
        alignSelf="center"
        fill
        round='small'
        pad='small'
        gap='small'
        background="linear-gradient(to bottom right, #f0817f, #ff86c8, #82d4bb, #6ab6f1, #cb90c9, #aed175, #add8e6, #add8e6, #add8e6, #add8e6, #add8e6, #add8e6, #ffdc5c, #ffbf81, #95a4db)" // ['#ff86c8', '#82d4bb', '#6ab6f1', '#cb90c9', '#aed175', '#f0817f', '#ffbf81', '#95a4db', '#ffdc5c']
        margin={{ bottom:'-16px' }}
      >
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
              <Box align='center' direction='row' gap='small'>
                <Text size='xsmall'>
                  Back to Borrow           
                </Text>
              </Box>
          }
            onClick={()=>backToBorrow()}
          />
        </Box>
        
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

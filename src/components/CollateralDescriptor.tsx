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

interface ICollateralDescriptorProps {
  children?:any;
}

function CollateralDescriptor( props: ICollateralDescriptorProps ) {

  const { children } = props;
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
        // background=${modColor( activeSeries?.seriesColor, 30)}
        background="linear-gradient(to bottom right, #82d4bb, #ffa3a5, #ffbf81, #ffdc5e, #a2c5ac, #ff86c8 )"
        margin={{ bottom:'-16px' }}
      >

        {/* <Text alignSelf='start' size='xlarge' color='text' weight='bold'>Selected series</Text> */}
        <Box
          direction='row-responsive'
          fill='horizontal'
          gap='small'
          align='center'
        >
          <Box 
            round='xsmall'
            // background='background-mid'
            // border='all'
            onClick={()=>setSelectorOpen(true)}
            direction='row'
            fill
            pad='small'
            flex
            justify='between'
          >

            <Box 
              direction='row' 
              gap='small'
              align='center'
            >             
              {/* <AprBadge activeView={activeView} series={activeSeries} animate /> */}
              <Box height='60%'>
                <Image src={theme.dark ? logoLight : logoDark} fit="contain" />
              </Box>

              <Text size='large' weight='bold' color='brand'> 
                Collateral 
              </Text>
            </Box>

            {/* <RaisedButton
              background='#ff86c8'
              label={(screenSize !== 'small' ) ?        
                <Box align='center' direction='row' gap='small'>
                  <Text size='xsmall' color='brand'> <ChangeSeries /> </Text>
                  <Text size='xsmall' color='brand'>
                    Change Series              
                  </Text>
                </Box>
                : 
                <Box align='center'>
                  <ChangeSeries />
                </Box>}
              onClick={()=>setSelectorOpen(true)}
            /> */}
          </Box>
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

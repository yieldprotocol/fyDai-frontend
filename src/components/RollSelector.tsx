import React, { useContext, useState, useEffect } from 'react';
import { Box, ThemeContext, Text, ResponsiveContext, Collapsible, Stack } from 'grommet';
import styled, { css } from 'styled-components';

import { 
  FiCheckCircle as Check,
  FiChevronDown as ChevronDown,
  FiLayers as ChangeSeries
} from 'react-icons/fi';

import { IYieldSeries } from '../types';

import AprBadge from './AprBadge';
import { SeriesContext } from '../contexts/SeriesContext';
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


const  RollSelector = ( props:any ) =>  {

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );

  const theme:any = useContext(ThemeContext);
  // const defaultColor = theme.dark? theme?.global?.colors['text'].dark: theme?.global?.colors['text'].light;
  const themeBackground = theme.global.colors.background;
  const defaultBackground = theme.dark === true ? themeBackground.dark: themeBackground.light;
  
  /* state from context */
  const { state: { activeSeriesId, seriesData } } = useContext(SeriesContext);
  const activeSeries = seriesData.get(activeSeriesId);

  /* local state */
  const [ selectorOpen, setSelectorOpen ] = useState<boolean>();
  const [ seriesArr, setSeriesArr ] = useState<IYieldSeries[]>();
  const [ destinationSeries, setDestinationSeries ] = useState<IYieldSeries>();

  const makeSelection = (_series:IYieldSeries) => {
    setDestinationSeries(_series);
    props.changeDestination(_series);
  };

  /* get seriesData into an array and filter out the active series and mature series */
  useEffect(()=>{

    const arr = [...seriesData].map(([ ,value]) => (value));
    const filteredArr = arr.filter((x:IYieldSeries) => !x.isMature() && x.maturity !== activeSeries.maturity );
    setSeriesArr(filteredArr);
    setDestinationSeries(filteredArr[0]);

  }, [ activeSeries ]);

  const Item = (_props:any) => (
    <Box direction='row' gap='xsmall' align='center' pad={{ left:'large', vertical:'xsmall' }} >
      {_props.series && <AprBadge activeView='Borrow' series={_props.series} animate={_props.animate || false} />}
      <Text size='small'>
        { mobile? _props.series?.displayNameMobile : _props.series?.displayName }
      </Text>
    </Box>
  );

  return (
    <Stack fill='horizontal' alignSelf='start'>
      <Box />
      <Box
        round={selectorOpen? 'small': 'large'}
        onClick={()=>setSelectorOpen(!selectorOpen)}
        border
        background={defaultBackground}
        margin={{ top:'-10px' }}
      >

        <StyledBox background={selectorOpen? undefined : defaultBackground}>
          <Item series={destinationSeries} />
        </StyledBox>

        <Collapsible open={selectorOpen}>
          <Box gap='small' pad={{ top:'small' }} >
            { 
              seriesArr?.filter((x:IYieldSeries) => x.maturity !== destinationSeries?.maturity)
                .map( (x:IYieldSeries) => (
                  <Box 
                    key={x.maturity}
                    onClick={()=> makeSelection(x)} 
                    hoverIndicator={ modColor(defaultBackground, -10) }
                  >
                    <Item series={x} animate={true} />
                  </Box>
                ))
              }
          </Box>
        </Collapsible>
      </Box>
    </Stack>
  );
};

RollSelector.defaultProps = { color:null };

export default RollSelector;




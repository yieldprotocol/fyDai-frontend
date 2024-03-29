import React, { useEffect, useState, useContext } from 'react';
import styled, { css } from 'styled-components';
import { useLocation, useHistory } from 'react-router-dom';
import { Text, Box, Layer, ResponsiveContext, ThemeContext, Button } from 'grommet';
import { 
  FiArrowLeft as ArrowLeft,
  FiCheck as Check,
} from 'react-icons/fi';

import { analyticsLogEvent, modColor  } from '../utils';

import { SeriesContext } from '../contexts/SeriesContext';

import AprBadge from './AprBadge';
import Loading from './Loading';
import FlatButton from './FlatButton';
import RaisedButton from './RaisedButton';
import YieldMobileNav from './YieldMobileNav';
import StickyButton from './StickyButton';
import { IYieldSeries } from '../types';

const InsetBox = styled(Box)`
  border-radius: 8px;
    ${(props:any) => props.background && 
      css`
      background: ${props.background}; 
      box-shadow: inset 6px 6px 11px ${modColor(props.background, -20)}, inset -6px -6px 11px ${modColor(props.background, 10)};
  `}`;

interface ISeriesSelectorProps {
  activeView:string;
  close:any;
}

const SeriesSelector = ({ close, activeView }:ISeriesSelectorProps) => {

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const { pathname } = useLocation();
  const navHistory = useHistory();

  const theme:any = React.useContext(ThemeContext);
  const themeBackground = theme.global.colors.background;
  const defaultBackground = theme.dark === true ? themeBackground.dark: themeBackground.light;
  
  const { state: { seriesLoading, activeSeriesId, seriesData }, actions: seriesActions } = useContext(SeriesContext);
  const activeSeries = seriesData.get(activeSeriesId);
  const { setActiveSeries } = seriesActions;

  const [sortedList, setSortedList] = useState<any>(seriesData);
  const [ hasSelected, setHasSelected ] = useState<boolean>(false);

  const viewMap = new Map([
    ['BORROW', { head: 'DEBT', field: 'ethDebtFYDai_' }],
    ['LEND', { head: 'BALANCE', field: 'fyDaiBalance_' }],
    ['POOL', { head: 'POOL PERCENTAGE', field: 'poolPercent' }],
  ]);



  const handleSelectSeries = (seriesMaturity: number) => {
    setActiveSeries(seriesMaturity);   
    analyticsLogEvent('change_series', {
      from: activeSeries.maturity,
      to: seriesMaturity,
    });

    navHistory.push(`/${pathname.split('/')[1]}/${seriesMaturity}`);
    close();
  };

  /* filter by isMature, then sort by maturity date  */
  useEffect(()=>{
    const sortedActive = new Map([...seriesData.entries()]
      .filter((x:any)=> !(x[1].isMature()) )
      .sort()
    );
    const sortedMature = new Map([...seriesData.entries()]
      .filter((x:any)=> x[1].isMature() )
      .sort(
        (a:any, b:any)=>{
          return ( a[0]>b[0] ? 0:-1 );
        }
      )
    );
    const mergedMap = new Map([...sortedActive, ...sortedMature]);
    setSortedList(mergedMap);
  }, [seriesData]);

  return (
    <Layer
      onClickOutside={()=>close()}
      onEsc={()=>close()}
      responsive={true}
      animation='slide' 
      style={{ zIndex:1000 }}
    >
      <Box
        round='small'
        fill
        background='background'
        pad={{ horizontal: 'medium', vertical:'large' }}
        gap='small'
        width={!mobile?{ min:'500px', max:'500px' }: undefined}
      >
        <Box direction='row' gap='small' align='center' pad='small'>
          { mobile && <Box onClick={() => close()}><ArrowLeft /></Box>}
          <Text weight='bold' size={mobile?'small':'large'}> Choose a Series</Text>
        </Box>

        <Box 
          direction='row'
          pad='small'
          fill='horizontal'
          justify='between'
          gap='small'
        >
          <Box basis={mobile?'30%':'30%'}>
            <Text alignSelf='start' size='small' color='text-weak' weight='bold'>APR</Text>
          </Box>
          <Box fill='horizontal' direction='row' justify='between' gap='small'>
            <Box fill align={mobile?'end':undefined}>
              <Text size={mobile? 'xsmall':'small'} color='text-weak' weight='bold'>{mobile? 'SERIES' : 'SERIES MATURITY'}</Text>
            </Box>
            <Box fill align='end'>
              <Text size={mobile? 'xsmall':'small'} color='text-weak' weight='bold'>
                { viewMap.get(activeView.toUpperCase())?.head }         
              </Text>
            </Box>
          </Box>
        </Box>

        <Loading condition={seriesLoading} size='large'>
          { !seriesLoading && [...sortedList.values() ].map((x:any, i:any) => {       
            const _key = i;
            const field = viewMap.get(activeView.toUpperCase())?.field || '';
            return (       
              <StickyButton
                key={_key}
                direction='row' 
                justify='between'
                onClick={()=>handleSelectSeries(x.maturity)}
                onMouseDown={()=>setHasSelected(true)}
                fill='horizontal'
                pad='small'
                gap='small'
                selected={!hasSelected && activeSeries.maturity === x.maturity}
                align='center'
              >
                <Box basis={mobile?'30%':'30%'} align='center'>
                  <Box direction='row' alignSelf='start'>
                    <AprBadge activeView={activeView} series={x} />
                  </Box>
                </Box>

                <Box fill='horizontal' direction='row' gap='small'>
                  <Box fill>
                    <Text size='xsmall'>
                      { mobile? x.displayNameMobile : x.displayName }
                    </Text>
                  </Box>
                  <Box fill align='end'>
                    <Text size='xsmall'>
                      {x[field]}
                    </Text>
                  </Box>                 
                </Box>
              </StickyButton>
            );     
          })}
        </Loading>

        {
        !mobile &&
        <Box alignSelf='start' margin={{ top:'medium' }}>
          <FlatButton 
            onClick={()=>close()}
            label={
              <Box direction='row' gap='medium' align='center'>
                <ArrowLeft color='text-weak' />
                <Text size='xsmall' color='text-weak'> go back </Text>
              </Box>
            }
          />
        </Box>
        }
      </Box>

      {
      mobile && 
        <YieldMobileNav noMenu={true}>
          <Box direction='row' gap='small' onClick={()=>close()}>
            <Text size='xxsmall' color='text-weak'><ArrowLeft /></Text>
            <Text size='xxsmall' color='text-weak'> go back </Text>
          </Box>
        </YieldMobileNav>
      }
    </Layer>
  );
};

export default SeriesSelector;

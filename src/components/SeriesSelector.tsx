import React from 'react';
import { Anchor, Text, Box, Layer, Header, ResponsiveContext, Button } from 'grommet';
import { 
  FiInfo as Info,
  FiArrowLeft as ArrowLeft,
  FiCheck as Check,
} from 'react-icons/fi';

import { IYieldSeries } from '../types';
import { YieldContext } from '../contexts/YieldContext';

import { SeriesContext } from '../contexts/SeriesContext';

import YieldSeriesSummary from './YieldSeriesSummary';
// import YieldSeries from '../../components/YieldSeries';

import AprBadge from './AprBadge';
import Loading from './Loading';

interface ISeriesSelectorProps {
  activeView:string;
  close:any;
}

const SeriesSelector = ({ close, activeView }:ISeriesSelectorProps) => {

  const [showMore, setShowMore] = React.useState<boolean>(false);
  const [openIndex, setOpenIndex] = React.useState<number | null >(null);
  // const [seriesList, setSeriesList] = React.useState<IYieldSeries[]>([]);
  const screenSize = React.useContext(ResponsiveContext);
  
  // const refsArray = React.useRef([]);
  // const elementsRef = React.useRef(seriesList.map(() => createRef()));
  // TODO: convert to reducer if get more

  // const { state } = React.useContext( YieldContext );

  const { state: seriesState, actions: seriesActions } = React.useContext( SeriesContext );

  const { isLoading, activeSeries, seriesData } = seriesState; 
  const { setActiveSeries } = seriesActions;

  const handleSelectSeries = (seriesMaturity: number) => {
    setActiveSeries(seriesMaturity);
    close();
  };

  return (
    <Layer
      onClickOutside={()=>close()}
      onEsc={()=>close()}
      responsive={true}
      animation='slide'  
    >
      <Box
        round='small'
        fill
        background='background-front'
        pad={{ horizontal: 'medium', vertical:'large' }}
        gap='medium'
        width={screenSize !== 'small'? { max:'750px', min:'640px' }: {}}
      >

        <Box gap='medium'>
          <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Choose a series</Text>
          <Text alignSelf='start' size='medium' color='text-weak'>Select a series from the list below</Text>
        </Box>

        <Box 
          gap='none'
        >
          <Box 
            direction='row'
            pad='medium'
            fill='horizontal'
            justify='between'
            gap='small'
          >
            <Box basis='20%'>
              <Text size='small' color='text-weak'>APR</Text>
            </Box>

            <Box fill='horizontal' direction='row' justify='between' gap='small'>

              <Box fill align={screenSize==='small'?'end':undefined}>
                <Text size='small' color='text-weak'>SERIES NAME</Text>
              </Box>

              <Box fill align={screenSize==='small'?'end':undefined}>
                <Text size='small' color='text-weak'>
                  { activeView.toUpperCase() === 'BORROW'? 'DAI DEBT' : 'BALANCE' }               
                </Text>
              </Box>

            </Box>

            { screenSize !== 'small' && 
              <Box direction='row' justify='end' basis='25%'>
                <Text size='small' color='text-weak'> </Text>
              </Box>}
          </Box>

          <Loading condition={isLoading} size='large'>
            { [...seriesData.values() ].map((x:any, i:any) => {       
              const _key = i;
              return ( 
                <Box
                  key={_key}
                  direction='row' 
                  justify='between'
                  onClick={()=>handleSelectSeries(x.maturity)}
                  hoverIndicator='background-mid'
                  border='top'
                  fill='horizontal'
                  pad='medium'
                  gap='small'
                >
                  <Box basis='20%' justify='center'>
                    <Box direction='row'>
                      <AprBadge activeView={activeView} series={x} />
                    </Box>
                  </Box>

                  <Box fill='horizontal' direction='row' justify='between' gap='small'>
                    <Box fill align={screenSize==='small'?'end':undefined}>
                      <Text size='medium' color='brand'>
                        {x.displayName}
                      </Text>
                    </Box>

                    <Box fill align={screenSize==='small'?'end':undefined}>
                      <Text size='medium' color='brand'>
                        {activeView.toUpperCase() === 'BORROW'? 
                          x.ethDebtYDai_.toFixed(2) :
                          x.yDaiBalance_.toFixed(2)}
                      </Text>
                    </Box>
                  </Box>

                  { screenSize !== 'small' && 
                  <Box basis='25%' direction='row' justify='end'>
                    { activeSeries && activeSeries.maturity === x.maturity ? 
                      <Button 
                        primary
                        label='Selected'
                        icon={<Check />}
                      /> : 
                      <Button 
                        secondary
                        label='Select'
                      />}
                  </Box>}
                </Box>
              );     
            })}

          </Loading>        
        </Box>

        <Box alignSelf='start'>
          <Box
            round
            onClick={()=>close()}
            hoverIndicator='brand-transparent'
          // border='all'
            pad={{ horizontal:'small', vertical:'small' }}
            justify='center'
          >
            <Box direction='row' gap='small' align='center'>
              <ArrowLeft color='text-weak' />
              <Text size='xsmall' color='text-weak'> go back </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </Layer>
  );
};

export default SeriesSelector;

import React from 'react';
import { Anchor, Text, Box, Layer, Header } from 'grommet';
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

interface ISeriesSelectorProps {
  activeView:string;
  close:any;
}


const SeriesSelector = ({ close, activeView }:ISeriesSelectorProps) => {

  const [showMore, setShowMore] = React.useState<boolean>(false);
  const [openIndex, setOpenIndex] = React.useState<number | null >(null);
  const [seriesList, setSeriesList] = React.useState<IYieldSeries[]>([]);
  
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

  React.useEffect(() => {
    !isLoading && setSeriesList(seriesData);
  }, [ seriesState ]);

  // React.useEffect(() => {
  //   !state.isLoading && setSeriesList(state.deployedSeries);
  // }, [ state.isLoading ]);

  return (
    <Layer
      onClickOutside={()=>close()}
      onEsc={()=>close()}
    >
      <Box
        round='medium'
        fill='horizontal'
        background='background-front'
        pad={{ horizontal: 'medium', vertical:'large' }}
        gap='medium'
        width={{ max:'750px', min:'600px' }}
      >
        <Box gap='medium'>
          <Text alignSelf='start' size='xlarge' color='brand' weight='bold'>Choose a series</Text>
          <Text alignSelf='start' size='medium' color='text-weak'>Select a series from the list below</Text>
        </Box>

        <Box 
          gap='none'
        >
          <Box direction='row' justify='between' pad='medium'>
            <Box>
              <Text alignSelf='start' size='medium' color='text-weak'>APR</Text>
            </Box>
            <Box>
              <Text alignSelf='start' size='medium' color='text-weak'>SERIES NAME</Text>
            </Box>
            <Box>
              <Text alignSelf='start' size='medium' color='text-weak'>
                { activeView.toUpperCase() === 'BORROW'? 'DEBT' : 'BALANCE' }               
              </Text>
            </Box>
            <Box>
              <Text alignSelf='start' size='medium' color='text-weak'>SELECT</Text>
            </Box>
          </Box>

          {isLoading && 'Loading'}
          {activeSeries && 

          <Box
            direction='row' 
            justify='between'
            onClick={()=>handleSelectSeries(activeSeries.maturity)}
            hoverIndicator='background-mid'
            border='top'
            fill
            pad='medium'
          >

            {  ( activeSeries && activeSeries.yieldAPR_ === Infinity ) ? 
              <Box 
                round 
                border='all'
                direction='row'
                pad={{ horizontal:'small' }}
                align='center'
                background='orange'
              >
                <Text size='xxsmall'>
                  { activeView.toUpperCase() === 'BORROW'? 'Limited Liquidity': 'Not Available' }         
                </Text>
              </Box>
              :
              <Box>
                <Text alignSelf='start' size='medium' color='brand'>
                  {activeSeries.yieldAPR_}%
                </Text>
              </Box>}

            <Box>
              <Text alignSelf='start' size='medium' color='brand'>
                {activeSeries.displayName}
              </Text>
            </Box>
            <Box>
              <Text alignSelf='start' size='medium' color='brand'>
                {activeView.toUpperCase() === 'BORROW'? 
                  activeSeries.ethDebtYDai_.toFixed(2) :
                  activeSeries.yDaiBalance_.toFixed(2)} Dai
              </Text>
            </Box>
            <Box>
              <Box 
                round
                background='brand'
                pad={{ horizontal:'medium', vertical:'xsmall' }}
                direction='row'
                gap='xsmall'
                align='center'
              >
                <Text> Selected </Text>
                <Check />
              </Box>
            </Box>
          </Box>}
        </Box>

        {/* {seriesData.forEach((x:any, i:number) => {
          console.log(x)
          return (
            <Box
              key={x.name}
              id={x.name}
              ref={(el:any) => {refs.current[i] = el;}}
            >
              <Box 
                direction='row' 
                justify='between'
                gap='xsmall'
                onClick={()=>console.log(x)}
                hoverIndicator='background-mid'
              >
                <Box> {x.yieldPercent_}</Box>
                <Box> {x.displayName} </Box>
                <Box> {x.wethDebtDai_} </Box>
                <Box> 'ACTION'</Box>
              </Box>
            </Box>
          );
        })} */}
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

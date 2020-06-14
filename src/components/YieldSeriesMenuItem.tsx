import React from 'react';
import { Box, Image, Text, Drop, Button, Collapsible } from 'grommet';
import moment from 'moment';

import {
  FiEye as EyeOpen,
  FiEyeOff as EyeClosed,
  FiStar as Star,
} from 'react-icons/fi';


import { IYieldSeries } from '../types';

type YieldSeriesProps = {
  series: IYieldSeries;
  seriesAction: any;
  children?: any;
  selected?: boolean;
};

const YieldSeriesMenuItem = ({ 
  series, 
  seriesAction, 
  children, 
  selected }: YieldSeriesProps) => {

  const {
    name,
    maturity_p,
    yDaiBalance_p,
    currentValue,
    seriesColor,
  } = series;

  const [over, setOver] = React.useState<boolean>();
  const tooltipColor = { color: 'background-frontheader', opacity: 1 };
  const ref = React.useRef<any>();

  const getBalanceColor = (_bal:string, _selected:boolean ):string => {
    if (parseInt(_bal, 10) > 0) {
      return _selected? 'brand' : 'brandTransparent';
    } if (parseInt(_bal, 10) > 0) {
      return _selected? 'secondary': 'secondaryTransparent';
    } 
    return _selected? 'text': 'border';
  };

  return (
    <Box
      // margin={{ left: 'small', vertical:'small' }}
      margin={{ left: 'small', vertical:'none' }}
      align="start"
      justify="between"
        // hoverIndicator={{ color: 'background-frontheader' }}
      background={selected? 'background-front': {}}
      // border={selected? { color:'brand' } : { color:'border' }}
      // round={selected? { size: 'small' }: { size: 'small', corner: 'left' }}
      ref={ref}
      onMouseOver={() => setOver(true)}
      onMouseLeave={() => setOver(false)}
      onFocus={() => setOver(false)}
      onBlur={() => setOver(false)}
      hoverIndicator={tooltipColor}
      onClick={() => seriesAction()}
      round={{ size:'medium', corner:'left' }}
    >

      <Box 
        direction='row'
        gap='small'
        align='center'
        pad='small'
        justify='between'
        fill='horizontal'
      >
        <Box 
          direction='row'
          gap='small'
        >
          <Box
            round='xlarge'
            width='xxsmall'
            height='xxsmall'
            background={seriesColor}
            align='center'
            justify='center'
          >
            <Text size="xxsmall" weight={selected ? 'bold': 'normal'}>3.45%</Text>
          </Box>

          <Box>
            <Text size="small" weight={selected ? 'bold': 'normal'}>{moment(maturity_p).format('MMMM Y')}</Text>
            <Text 
              size="xsmall" 
              color={getBalanceColor(yDaiBalance_p, !!selected)}
            >
              Balance: {yDaiBalance_p} yDai
            </Text> 
          </Box>
        </Box>

        <Box direction='row'>
          <Box justify='end'>
            <Text color={parseInt(yDaiBalance_p, 10) === 0 ? 'border': seriesColor}> 
              <Star />
            </Text>
          </Box>
        </Box>

      </Box>

      {/* <Collapsible open={ref.current && over && !selected}>
        <Box
          animation="slideRight"
          pad="small"
          background={tooltipColor}
          round={{ size: 'large', corner: 'right' }}
        >
          <Box direction="column" align='end'>
            <Box direction="row" gap="xsmall">
              <Text size="xsmall">Matures</Text>
              <Text size="xsmall">
                { moment(maturity).toNow() }
              </Text>
            </Box>
            <Box direction="row" gap="xsmall">
              <Text size="xsmall">Current value:</Text>{' '}
              <Text size="xsmall" weight="bold">{`${currentValue} DAI`}</Text>
            </Box>
          </Box>
        </Box>
      </Collapsible> */}

      {ref.current && over && !selected && (
        <Drop align={{ left: 'right' }} target={ref.current} plain>
          <Box
            animation="slideRight"
            pad="small"
            background={tooltipColor}
            round={{ size: 'medium', corner: 'right' }}
          >
            <Box direction="column" align='center'>
              <Box direction="row" gap="xsmall">
                <Text size="xsmall">Matures: </Text>
                <Text size="xsmall" weight="bold">
                  { moment(maturity_p).format('MMM YYYY') }
                </Text>
              </Box>
              <Box direction="row" gap="xsmall">
                <Text size="xsmall">Current value:</Text>{' '}
                <Text size="xsmall" weight="bold">{`${currentValue} DAI`}</Text>
              </Box>
            </Box>
          </Box>
        </Drop>
      )}
    </Box>
  );
};

export default YieldSeriesMenuItem;

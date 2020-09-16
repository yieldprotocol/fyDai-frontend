import React, { useEffect, useState, useContext } from 'react';
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
    maturity_,
    eDaiBalance_,
    currentValue,
    seriesColor,
  } = series;

  const [over, setOver] = useState<boolean>();
  const tooltipColor = { color: 'background-mid', opacity: 1 };
  const ref = React.useRef<any>();

  const getBalanceColor = (_bal:number, _selected:boolean ):string => {
    if (_bal > 0) {
      return _selected? 'brand' : 'brand-transparent';
    } if (_bal > 0) {
      return _selected? 'secondary': 'secondary-transparent';
    } 
    return _selected? 'text': 'border';
  };

  return (
    <Box
      // margin={{ left: 'small', vertical:'small' }}
      margin={{ left: 'small', vertical:'none' }}
      align="start"
      justify="between"
      background={selected? ('background-mid'): {}}
      // background={selected? ( seriesColor || 'background-front'): {}}
      ref={ref}
      onMouseOver={() => setOver(true)}
      onMouseLeave={() => setOver(false)}
      onFocus={() => setOver(false)}
      onBlur={() => setOver(false)}
      hoverIndicator={tooltipColor}
      onClick={() => seriesAction()}
      round={over&&!selected?{ size:'medium', corner:'left' }: { size:'medium' }}
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
            round='small'
            width='xxsmall'
            height='xxsmall'
            background={seriesColor}
            align='center'
            justify='center'
          >
            <Text size="xxsmall" weight={selected ? 'bold': 'normal'}>3.45%</Text>
          </Box>

          <Box>
            <Text size="small" weight={selected ? 'bold': 'normal'}>{moment(maturity_).format('MMMM Y')}</Text>
            <Text 
              size="xsmall" 
              // color={getBalanceColor(eDaiBalance_, !!selected)}
            >
              Balance: {eDaiBalance_} eDai
            </Text> 
          </Box>
        </Box>

        <Box direction='row'>
          <Box justify='end'>
            <Text color={eDaiBalance_ === 0 ? 'border': seriesColor}> 
              <Star />
            </Text>
          </Box>
        </Box>

      </Box>

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
                  { moment(maturity_).format('MMM YYYY') }
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

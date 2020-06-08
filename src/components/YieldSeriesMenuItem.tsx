import React from 'react';
import { Box, Image, Text, Drop, Button, Collapsible } from 'grommet';
import moment from 'moment';

import { IoIosRadioButtonOn, IoIosRadioButtonOff } from 'react-icons/io';
import { RiCoinLine } from 'react-icons/ri';
// import coin from '../assets/images/coin.svg';



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
    maturity,
    rate,
    currentValue,
  } = series;

  const [over, setOver] = React.useState<boolean>();
  const tooltipColor = { color: 'background-frontheader', opacity: 0.9 };
  const ref = React.useRef<any>();

  return (
    <Box
      // margin={{ left: 'small', vertical:'small' }}
      margin={{ left: 'small', vertical:'none' }}
      align="center"
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
      round={{size:'small', corner:'left'}}
      // elevation={selected ? 'small':'none'}
    >
      <Box 
        direction='row'
        gap='small'
        align='center'
        pad='small'
      > 
        {/* <Box width='15px' height='15px'>
            {!selected? <IoIosRadioButtonOff />:<IoIosRadioButtonOn />}
            <Image src={coin} fit="contain" />
          </Box> */}
        <Box>
          <Text size="xsmall" weight={selected ? 'bold': 'normal'}>{name}</Text>
          <Box
            round
            align="center"
            pad={{ horizontal: 'small', vertical: 'none' }}
            background={selected ? 'brand':'none'}
            border='all'
          >
            <Text size="xsmall" color={!selected? 'border': 'text'}> {rate?.toString()}% </Text>
          </Box>
        </Box>
      </Box>

      <Collapsible open={ref.current && over && !selected}>
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
      </Collapsible>
      {/* {ref.current && over && !selected && (
        <Drop align={{ left: 'right' }} target={ref.current} plain>
          <Box
            animation="slideRight"
            pad="small"
            background={tooltipColor}
            round={{ size: 'large', corner: 'right' }}
          >
            <Box direction="column" align='end'>
              <Box direction="row" gap="xsmall">
                <Text size="xsmall">Matures: </Text>
                <Text size="xsmall" weight="bold">
                  { moment(maturity).format('MMM YYYY') }
                </Text>
              </Box>
              <Box direction="row" gap="xsmall">
                <Text size="xsmall">Current value:</Text>{' '}
                <Text size="xsmall" weight="bold">{`${currentValue} DAI`}</Text>
              </Box>
            </Box>
          </Box>
        </Drop>
      )} */}
    </Box>
  );
};

export default YieldSeriesMenuItem;

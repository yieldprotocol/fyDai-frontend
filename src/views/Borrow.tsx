import React from 'react';
import moment from 'moment';
import { Box, Button, Heading, Text } from 'grommet';

import RotateLoader from 'react-spinners/RotateLoader';

import { FiCheckCircle as CheckCircle } from 'react-icons/fi';
import { YieldContext } from '../contexts/YieldContext';
import { SeriesContext } from '../contexts/SeriesContext';

import DepositAction from '../components/DepositAction';
import BorrowAction from '../components/BorrowAction';
import RepayAction from '../components/RepayAction';
import PageHeader from '../components/PageHeader';

interface BorrowProps {
  setShowSeriesLayer?: any;
  activeView?: string;
}

const Borrow = ({
  setShowSeriesLayer,
  activeView: viewFromProp,
}: BorrowProps) => {
  const { state: yieldState, actions: yieldActions } = React.useContext(
    YieldContext
  );
  const { state: seriesState, actions: seriesActions } = React.useContext(
    SeriesContext
  );
  const [activeView, setActiveView] = React.useState<string>(
    viewFromProp || 'collateral'
  );
  const [activePosition, setActivePosition] = React.useState<any>(null);
  const [borrowRepayActive, setBorrowRepayActive] = React.useState<boolean>(
    true
  );
  const [depositWithdrawActive, setDepositWithdrawActive] = React.useState<
  boolean
  >(false);
  const { isLoading: positionsLoading, seriesData, activeSeries } = seriesState;
  const {
    isLoading: yieldLoading,
    userData,
    deployedSeries,
    deployedContracts,
    yieldData,
    makerData,
  } = yieldState;

  return (
    <Box
      gap="small"
      pad={{ vertical: 'large', horizontal: 'small' }}
      fill="horizontal"
      justify="between"
    >
      <Box
        direction="row"
        fill="horizontal"
        pad={{ bottom: 'large', horizontal: 'none' }}
        justify="between"
        align="center"
      >
        <PageHeader
          title="Borrow"
          subtitle="Description of borrowing"
          tipPrimary="Tip: Convert your Maker vault"
          tipSecondary="View more tips"
        />
      </Box>

      <Box 
        background="brand-transparent"
        round='medium'
      >

        <Box
          direction="row"
          pad={{ horizontal:'medium', vertical :'medium' }}
          alignSelf="center"
          width={{ max: '750px' }}
          fill="horizontal"
        >
          <Box
            round="medium"
            direction="row"
            // background="brand-transparent"
          // pad="xxsmall"
            gap="small"
            fill="horizontal"
            justify='between'
          >
            <Box
              round="medium"
              pad={{ horizontal: 'large', vertical: 'small' }}
              background={
              activeView === 'collateral' ? 'background-front' : undefined
            }
              elevation={activeView === 'collateral' ? 'small' : undefined}
              onClick={() => setActiveView('collateral')}
              direction="row"
              justify="between"
              gap="small"
            >
              <Text size="xsmall" weight="bold">
                1. Add Collateral
              </Text>
              {true && <CheckCircle color="green" />}
            </Box>


            <Box
              round="medium"
              pad={{ horizontal: 'large', vertical: 'small' }}
              background={
              activeView === 'borrow' ? 'background-front' : undefined
            }
              elevation={activeView === 'borrow' ? 'small' : undefined}
              onClick={() => setActiveView('borrow')}
            >
              <Text size="xsmall" weight="bold">
                2. Borrow Dai
              </Text>
            </Box>

            <Box
              round="medium"
              pad={{ horizontal: 'large', vertical: 'small' }}
              background={activeView === 'repay' ? 'background-front' : undefined}
              elevation={activeView === 'repay' ? 'small' : undefined}
              onClick={() => setActiveView('repay')}
            >
              <Text size="xsmall" weight="bold">
                3. Repay Dai Debt
              </Text>
            </Box>


          </Box>
        </Box>

        <Box
          width={{ max: '750px' }}
          alignSelf="center"
          fill="horizontal"
          background="background-front"
          round="medium"
          pad="large"
        >
          {activeView === 'collateral' && <DepositAction />}
          {activeView === 'borrow' && (
          <BorrowAction maxValue={12} borrowFn={(x: any) => console.log(x)} />
          )}
          {activeView === 'repay' && (
          <RepayAction maxValue={12} repayFn={(x: any) => console.log(x)} />
          )}
        </Box>

      </Box>
      
    </Box>
  );
};

Borrow.defaultProps = {
  setShowSeriesLayer: null,
  activeView: null,
};

export default Borrow;

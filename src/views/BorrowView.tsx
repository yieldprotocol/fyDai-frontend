import React from 'react';
import { Box, Text } from 'grommet';
import { FiCheckCircle as CheckCircle } from 'react-icons/fi';

import Deposit from '../containers/Deposit';
import Borrow from '../containers/Borrow';
import Repay from '../containers/Repay';

import PageHeader from '../components/PageHeader';

interface BorrowProps {
  activeView?: string;
}

const BorrowView = ({
  activeView: activeViewFromProps,
}: BorrowProps) => {

  const [ activeView, setActiveView ] = React.useState<string>( activeViewFromProps || 'collateral' );

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
        alignSelf="center"
        width={{ max: '750px' }}
        fill
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
          {activeView === 'collateral' && <Deposit />}
          {activeView === 'borrow' && (
          <Borrow maxValue={12} borrowFn={(x: any) => console.log(x)} />
          )}
          {activeView === 'repay' && (
          <Repay maxValue={12} repayFn={(x: any) => console.log(x)} />
          )}
        </Box>
      </Box>    
    </Box>
  );
};

BorrowView.defaultProps = {
  activeView: null,
};

export default BorrowView;

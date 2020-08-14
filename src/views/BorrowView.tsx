import React from 'react';
import { Box, Text } from 'grommet';
import { FiCheckCircle as CheckCircle } from 'react-icons/fi';

import Deposit from '../containers/Deposit';
import Borrow from '../containers/Borrow';
import Repay from '../containers/Repay';

import { UserContext } from '../contexts/UserContext';

import PageHeader from '../components/PageHeader';

interface BorrowProps {
  activeView?: string;
}

const BorrowView = ({
  activeView: activeViewFromProps,
}: BorrowProps) => {
  
  const { state: { position }, } = React.useContext(UserContext);

  const [ activeView, setActiveView ] = React.useState<string>( 
    activeViewFromProps || 'COLLATERAL'
  );

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
        round='small'
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
            round='small'
            direction="row"
            // background="brand-transparent"
          // pad="xxsmall"
            gap="small"
            fill="horizontal"
            justify='between'
          >
            <Box
              round='small'
              pad={{ horizontal: 'large', vertical: 'small' }}
              background={
              activeView === 'COLLATERAL' ? 'background-front' : undefined
            }
              elevation={activeView === 'COLLATERAL' ? 'small' : undefined}
              onClick={() => setActiveView('COLLATERAL')}
              direction="row"
              justify="between"
              gap="small"
            >
              <Text size="xsmall" weight="bold">
                1. Add Collateral
              </Text>
              {position.ethPosted>0 && <CheckCircle color="green" />}
            </Box>


            <Box
              round='small'
              pad={{ horizontal: 'large', vertical: 'small' }}
              background={
              activeView === 'BORROW' ? 'background-front' : undefined
            }
              elevation={activeView === 'BORROW' ? 'small' : undefined}
              onClick={() => setActiveView('BORROW')}
            >
              <Text size="xsmall" weight="bold">
                2. Borrow Dai
              </Text>
            </Box>

            <Box
              round='small'
              pad={{ horizontal: 'large', vertical: 'small' }}
              background={activeView === 'REPAY' ? 'background-front' : undefined}
              elevation={activeView === 'REPAY' ? 'small' : undefined}
              onClick={() => setActiveView('REPAY')}
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
          fill
          background="background-front"
          round='small'
          pad="large"
        >
          {activeView === 'COLLATERAL' && <Deposit setActiveView={(x:string)=>setActiveView(x.toUpperCase())} />}
          {activeView === 'BORROW' && (
          <Borrow />
          )}
          {activeView === 'REPAY' && (
          <Repay />
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

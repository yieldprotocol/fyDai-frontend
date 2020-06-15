import React from 'react';
import { Avatar, Box, Button, CheckBox, Menu, TextInput, DropButton, Stack, Text, Collapsible, Image } from 'grommet';
import moment from 'moment';

import {
  FaEthereum as EthLogo, 
  FaCaretDown as CaretDown, 
  FaCaretUp as CaretUp,
  FaWeightHanging as  Debt,
  FaTimes as Close,
  FaExchangeAlt as Exchange,
  // FaEllipsisV as Exchange,
} from 'react-icons/fa';

import RepayAction from './RepayAction';
import BorrowAction from './BorrowAction';
import SellAction from './x_SellAction';
import BuyAction from './x_BuyAction';
import ActionMenu from './ActionMenu';
import WithdrawAction from './WithdrawAction';
import DepositAction from './DepositAction';

function YieldPosition({ position, header }: any) {
  // const [open, setOpen] = React.useState<boolean>(false);
  const [menuOpen, setMenuOpen] = React.useState<boolean>(false);
  // const [summaryOpen, setSummaryOpen] = React.useState<boolean>(false);
  // const [inputValue, setInputValue]= React.useState<any>();

  const [actionsOpen, setActionsOpen] = React.useState<string | null>(null);

  const [balanceGroupActions, setBalanceGroupActions] = React.useState<string>('BORROW');
  const [debtGroupActions, setDebtGroupActions] = React.useState<string>('PAYBACK');
  const [collateralGroupActions, setCollateralGroupActions] = React.useState<string>('DEPOSIT');

  // const [actionsVisible, setActionsVisible] = React.useState<any>([]);

  const handleActionView = (action:string) =>{
    actionsOpen === action ? setActionsOpen(null) : setActionsOpen(action);
    action !== null && setMenuOpen(false);
    // action === 'CANCEL' && handleMenuToggle();
  };

  const handleMenuToggle= () => {
    setActionsOpen(null);
    setMenuOpen(!menuOpen);
  };

  return (
    <Box
      elevation={menuOpen || actionsOpen ?'xsmall':'none'}
      round='small'
      margin={{ top:'small' }}
      border={{ color:'background-frontheader' }}
      fill
    >
      { header && 
      <Box
        background='background-front'
        round={{ size: 'small', corner: 'top' }}
        pad='small'
        justify='between'
        direction='row'
      >
        <Text size='small'>yDai-20-05-30</Text>
        <Text size='small'>Matures in 3 months</Text>
      </Box>}

      <Box
        direction='row'
        hoverIndicator='background-frontheader'
        onClick={()=>handleMenuToggle()}
        round={header?{ size: 'small', corner: 'bottom' }:'small'}
      >

        <Box style={{ borderRadius:'24px 0px 0px 24px' }} direction='row' align='center' pad='small'>
          <EthLogo />
        </Box>
        <Box 
          direction='row-responsive'
          justify='between'
          align='center'
          gap='none'
          flex
        >
          <Box round>
            <Stack anchor='top'>
              <Box pad='small' direction='row'>
                <Box 
                  margin='xsmall' 
                  pad={{ vertical:'none', horizontal:'xsmall' }} 
                  gap='xsmall' 
                  direction='row'
                  onClick={(e:any) => {e.stopPropagation(); handleActionView('COLLATERALGROUP');}}
                  hoverIndicator='background'
                  round
                  style={{ zIndex:25 }}
                >
                  <Text>{position.value}</Text>
                  <Text>{position.type}</Text>
                </Box>
              </Box>
              <Box margin={{ bottom:'xsmall' }}>
                <Text size='10px'>Deposited</Text>
              </Box>
            </Stack>
          </Box>
          
          <Box direction='row' justify='center'>
            <Box round>
              <Stack anchor='top'>
                <Box pad='small' direction='row'>
                  <Box 
                    margin='xsmall'
                    pad={{ vertical:'none', horizontal:'xsmall' }}
                    gap='xsmall'
                    direction='row'
                    round
                    onClick={(e:any) => {e.stopPropagation(); handleActionView('DEBTGROUP');}}
                    hoverIndicator='pink'
                    // background='pink'
                    border={{ color:'pink' }}
                    style={{ zIndex:25 }}
                  >
                    {position.debt}
                    yDai
                  </Box>
                </Box>
                <Box margin={{ bottom:'xsmall' }}>
                  <Text size='10px'>Debt</Text>
                </Box>
              </Stack>
            </Box>

            <Box round>
              <Stack anchor='top'>
                <Box align='center' pad='small' direction='row'>
                  <Box 
                    margin='xsmall'
                    pad={{ vertical:'none', horizontal:'xsmall' }}
                    gap='xsmall'
                    direction='row'
                    round
                    // background='lightgreen'
                    onClick={(e:any) => {e.stopPropagation(); handleActionView('BALANCEGROUP');}} 
                    hoverIndicator='lightgreen'
                    border={{ color:'lightgreen' }}
                  >
                    {position.balance}
                    yDai
                  </Box>
                </Box>
                <Box margin={{ bottom:'xsmall' }}>
                  <Text size='10px'>Balance</Text>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Box>
        <Box direction='row' align='center' pad='small'>
          {/* { summaryOpen || menuOpen? */}
          { actionsOpen !== null ?
            <CaretUp color="grey" />
            :
            <Exchange color="grey" />}
        </Box>
      </Box>


      <Collapsible open={actionsOpen !== null}>
        <Box
          elevation='none'
          style={{ borderRadius:'0px 0px 24px 24px' }}
          gap='small'
          direction='column'
          margin='small'
        >
          { actionsOpen === 'BORROW' && <BorrowAction close={()=>setActionsOpen(null)} /> }
          { actionsOpen === 'PAYBACK' && <RepayAction close={()=>setActionsOpen(null)} /> }
          { actionsOpen === 'SELL' && <SellAction close={()=>setActionsOpen(null)} /> }
          { actionsOpen === 'BUY' && <BuyAction close={()=>setActionsOpen(null)} /> }
          { actionsOpen === 'WITHDRAW' && <WithdrawAction close={()=>setActionsOpen(null)} /> }
          { actionsOpen === 'DEPOSIT' && <DepositAction close={()=>setActionsOpen(null)} /> }

          { actionsOpen === 'BALANCEGROUP' &&
          <Box pad='small'>
            <Box direction='row' fill='horizontal' justify='between' align='baseline' margin={{ bottom:'medium' }}>
              <Text> I would like to: </Text>
              <Box direction='row'>
                <Button 
                  primary={balanceGroupActions === 'BORROW'}
                  label='Borrow'
                  hoverIndicator='brand'
                  color='brand'
                  style={{ borderRadius:'24px 0px 0px 24px' }}
                  onClick={()=>setBalanceGroupActions('BORROW')}
                />
                <Button 
                  primary={balanceGroupActions === 'SELL'}
                  label='Sell'
                  style={{ borderRadius:'0px 0px 0px 0px' }}
                  hoverIndicator='brand'
                  color='brand'
                  onClick={()=>setBalanceGroupActions('SELL')}
                />
                <Button 
                  primary={balanceGroupActions === 'BUY'}
                  label='Buy'
                  hoverIndicator='brand'
                  color='brand'
                  style={{ borderRadius:'0px 24px 24px 0px' }}
                  onClick={()=>setBalanceGroupActions('BUY')}
                />
              </Box>
              <Box pad='xsmall' round hoverIndicator='background-front' onClick={()=>handleMenuToggle()}> 
                <Text size='10px'> Do something else. </Text>
              </Box>
            </Box>
              { balanceGroupActions === 'BUY' && <BuyAction close={()=>setActionsOpen(null)} /> }
              { balanceGroupActions === 'SELL' && <SellAction close={()=>setActionsOpen(null)} /> }
              { balanceGroupActions === 'BORROW' && <BorrowAction close={()=>setActionsOpen(null)} /> }
          </Box>}

          { actionsOpen === 'DEBTGROUP' &&
          <Box pad='small'>
            <Box direction='row' fill='horizontal' justify='between' align='baseline' margin={{ bottom:'medium' }}>
              <Text> I would like to: </Text>
              <Box direction='row'>
                <Button 
                  primary={debtGroupActions === 'PAYBACK'}
                  label='Payback debt'
                  style={{ borderRadius:'24px 0px 0px 24px' }}
                  hoverIndicator='brand'
                  color='brand'
                  onClick={()=>setDebtGroupActions('PAYBACK')}
                />
                <Button 
                  primary={debtGroupActions === 'BORROW'}
                  label='Borrow yDai'
                  hoverIndicator='brand'
                  color='brand'
                  style={{ borderRadius:'0px 24px 24px 0px' }}
                  onClick={()=>setDebtGroupActions('BORROW')}
                />
              </Box>
              <Box pad='xsmall' round hoverIndicator='background-front' onClick={()=>handleMenuToggle()}> 
                <Text size='10px'> Do something else. </Text>
              </Box>
            </Box>
              { debtGroupActions === 'PAYBACK' && <RepayAction close={()=>setActionsOpen(null)} /> }
              { debtGroupActions === 'BORROW' && <BorrowAction close={()=>setActionsOpen(null)} /> }
          </Box>}

          { actionsOpen === 'COLLATERALGROUP' &&
          <Box pad='small'>
            <Box direction='row' fill='horizontal' justify='between' align='baseline' margin={{ bottom:'medium' }}>
              <Text> I would like to: </Text>
              <Box direction='row'>
                <Button 
                  primary={collateralGroupActions === 'DEPOSIT'}
                  label='Deposit'
                  style={{ borderRadius:'24px 0px 0px 24px' }}
                  hoverIndicator='brand'
                  color='brand'
                  onClick={()=>setCollateralGroupActions('DEPOSIT')}
                />
                <Button 
                  primary={collateralGroupActions === 'WITHDRAW'}
                  label='Withdraw'
                  hoverIndicator='brand'
                  color='brand'
                  style={{ borderRadius:'0px 24px 24px 0px' }}
                  onClick={()=>setCollateralGroupActions('WITHDRAW')}
                />
              </Box>
              <Box pad='xsmall' round hoverIndicator='background-front' onClick={()=>handleMenuToggle()}> 
                <Text size='10px'> Do something else. </Text>
              </Box>
            </Box>
            { collateralGroupActions === 'DEPOSIT' && <DepositAction close={()=>setActionsOpen(null)} />}
            { collateralGroupActions === 'WITHDRAW' &&<WithdrawAction close={()=>setActionsOpen(null)} />}
          </Box>}

        </Box>
      </Collapsible>

      <Collapsible open={menuOpen}>
        <ActionMenu handleSelectAction={handleActionView} />
      </Collapsible>
    </Box>

  );
}

export default YieldPosition;

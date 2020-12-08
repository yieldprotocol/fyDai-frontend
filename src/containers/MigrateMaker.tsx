import React, { useState, useContext, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Box, Keyboard, TextInput, Text, ResponsiveContext, Collapsible } from 'grommet';
import ethers from 'ethers';

import { 
  FiArrowLeft as ArrowLeft,
  FiInfo as Info,
} from 'react-icons/fi';

import { cleanValue } from '../utils';

import { UserContext } from '../contexts/UserContext';
import { SeriesContext } from '../contexts/SeriesContext';

import { useDebounce, useIsLol } from '../hooks/appHooks';
import { useMath } from '../hooks/mathHooks';
import { useTxActive } from '../hooks/txHooks';
import { useBorrowProxy } from '../hooks/borrowProxyHook';

import InfoGrid from '../components/InfoGrid';
import InputWrap from '../components/InputWrap';
import RaisedButton from '../components/RaisedButton';
import ActionButton from '../components/ActionButton';
import FlatButton from '../components/FlatButton';
import EthMark from '../components/logos/EthMark';
import YieldMobileNav from '../components/YieldMobileNav';

import { logEvent } from '../utils/analytics';
import Loading from '../components/Loading';
import MakerMark from '../components/logos/MakerMark';
import { useExportProxy } from '../hooks/exportProxyHook';
import { useImportProxy } from '../hooks/importProxyHook';
import DaiMark from '../components/logos/DaiMark';

interface IMigrateMakerProps {
  close?: any;
}

const MigrateMaker = ({ close }:IMigrateMakerProps) => {

  const mobile:boolean = ( useContext<any>(ResponsiveContext) === 'small' );
  const { state: { position }, actions: userActions } = useContext(UserContext);
  const {
    ethPosted,
    ethLocked,
    collateralPercent_,
    debtValue,
    debtValue_,
  } = position;

  const { state: { seriesLoading, activeSeriesId, seriesData }, actions: seriesActions } = useContext(SeriesContext);
  const activeSeries = seriesData.get(activeSeriesId);

  const { withdrawEth } = useBorrowProxy();

  const { importPosition, importVault } = useImportProxy();
  const { exportPosition } = useExportProxy();
  const { estCollRatio: estimateRatio } = useMath();
  const [ txActive ] = useTxActive(['WITHDRAW']);

  const [ collInputValue, setCollInputValue ] = useState<any>();
  const [ debtInputValue, setDebtInputValue ] = useState<any>();
  const [ inputDirty, setInputDirty ] = useState<boolean>(false);

  const debouncedCollInput = useDebounce(collInputValue, 500);
  const debouncedDebtInput = useDebounce(debtInputValue, 500);
  
  const [collInputRef, setCollInputRef] = useState<any>(null);
  const [debtInputRef, setDebtInputRef] = useState<any>(null);

  const [ estRatio, setEstRatio ] = useState<any>();
  const [ maxWithdraw, setMaxWithdraw ] = useState<string>();

  const [ importDisabled, setImportDisabled ] = useState<boolean>(true);
  const [ exportDisabled, setExportDisabled ] = useState<boolean>(true);

  const [ warningMsg, setWarningMsg] = useState<string|null>(null);
  const [ errorMsg, setErrorMsg] = useState<string|null>(null);

  const isCollLol = useIsLol(collInputValue);
  const isDebtLol = useIsLol(debtInputValue);

  const importProcedure = async () => {
    if (collInputValue || debtInputValue && !importDisabled) {
      await importPosition(activeSeries, collInputValue, debtInputValue);
      setCollInputValue(undefined);
      setDebtInputValue(undefined);
    }
  };

  const importAllProcedure = async () => {
    if (!collInputValue || !debtInputValue && !importDisabled) {
      await importVault(activeSeries);
    }
  };

  useEffect(()=>{
    (collInputValue || debtInputValue) && setInputDirty(true);
  }, [collInputValue, debtInputValue]);

  return (
    <Keyboard 
      onEsc={() => { 
        if (collInputValue || debtInputValue) {
          document.activeElement === collInputRef && setCollInputValue(undefined);
          document.activeElement === debtInputRef && setDebtInputValue(undefined);
        } else close();
      }}
      onEnter={()=> importProcedure()}
      // onBackspace={()=> {
      //   collInputValue &&
      //   (document.activeElement !== collInputRef) && 
      //   setCollInputValue(debouncedCollInput.toString().slice(0, -1));
      // }}
      target='document'
    >
      { !txActive &&
      <Box 
        width={!mobile?{ min:'620px', max:'620px' }: undefined}
        alignSelf='center'
        fill
        background='background'
        round='small'
        pad='large'
        gap='medium'
        justify='between'
      >    
        {/* <Box direction='row-responsive' justify='between' align='center' fill>
          <Text color='text' weight='bold' size='large'> Import Maker Vault: </Text>
          <Text color='text'> ETH-A #2344432</Text>
          <RaisedButton 
            label={ 
              <Box pad='small'>
                <Text size='xxsmall'>Import the entire <MakerMark /> vault </Text>
              </Box>
                }
            onClick={()=>console.log('vault migrated')}
          />
        </Box>     */}
 
        <Box direction='row' gap='small' align='center'>
          <Text size='large' color='text' weight='bold'>Import Maker Vault:</Text>
        </Box> 

        <Box round='3px' border pad='xxsmall'>
          <Text color='text'> ETH-A #2344432</Text>

          <InfoGrid entries={[
            {
              label: 'Collateral Locked',
              visible: true,
              active: true,
              loading: false, 
              value: '1000 ETH',
              valuePrefix: null,
              valueExtra: null, 
            },
            {
              label: 'Dai Debt',
              visible: true,
              active: true,
              loading: false,           
              value: '1000 Dai',
              valuePrefix: null,
              valueExtra: null,
            },
            {
              label: null,
              visible: true,
              active: true,
              loading: false,           
              value: null,
              valuePrefix: null,
              valueExtra: ()=> (
                <Box>
                  <RaisedButton 
                    label={ 
                      <Box pad='small'>
                        <Text size='xxsmall'>Import the entire <MakerMark /> vault</Text>
                      </Box>
                }
                    onClick={()=>console.log('vault migrated')}
                  />
                </Box>
              ),
            },
          ]}
          />
        </Box>
        {/* <Box direction='row' gap='small'>
          <Info /> 
          <Text size='xxsmall'> You can now easily move debt and/or collateral from Maker into the Yield protocol </Text> 
        </Box> */}

        {/* <Box>
          <RaisedButton 
            label={ 
              <Box pad='small'>
                <Text size='small'>Import the entire <MakerMark /> vault</Text>
              </Box>
          }
            onClick={()=>console.log('vault migrated')}
          />
        </Box> */}

        <Box direction='row'>
          <Box basis='50%' justify='center'>
            Debt to Import: 
          </Box>
          <InputWrap errorMsg={errorMsg} warningMsg={warningMsg}>
            <TextInput
              // ref={(el1:any) => {el1 && !mobile && el1.focus(); setDebtInputRef(el1);}} 
              ref={debtInputRef}
              type='number'
              placeholder='DAI'
              value={debtInputValue || ''}
              plain
              onChange={(event:any) => setDebtInputValue(cleanValue(event.target.value))}
              icon={isDebtLol ? <span role='img' aria-label='lol'>😂</span> : <DaiMark />}
            />
            <FlatButton
              label='max debt'
              onClick={()=>maxWithdraw && setCollInputValue(cleanValue(maxWithdraw))}
            />
          </InputWrap>
        </Box>
        
        <Box direction='row'>
          <Box basis='50%' justify='center'>
            Collateral to Import: 
          </Box>
          <InputWrap errorMsg={errorMsg} warningMsg={warningMsg}>
            <TextInput
              // ref={(el1:any) => {el1 && !mobile && el1.focus(); setCollInputRef(el1);}} 
              ref={collInputRef}
              type='number'
              placeholder='ETH'
              value={collInputValue || ''}
              plain
              onChange={(event:any) => setCollInputValue(cleanValue(event.target.value))}
              icon={isCollLol ? <span role='img' aria-label='lol'>😂</span> : <EthMark />}
            />
            { 
            debtInputValue && 
            <FlatButton 
              label='use suggested collateral'
              onClick={()=>maxWithdraw && setCollInputValue(cleanValue(maxWithdraw))}
            />
            }
          </InputWrap>
        </Box>

        <Box fill>
          <Collapsible open={!!debtInputValue&&debtInputValue>0}>
            <InfoGrid entries={[
              {
                label: 'Fixed Rate',
                visible: !!debtInputValue,
                active: true,
                loading: false, 
                value: 'x.xx%',
                valuePrefix: null,
                valueExtra: null, 
              },
              {
                label: 'Suggested Collateral',
                visible: !!debtInputValue,
                active: true,
                loading: false,           
                value: ' x Eth',
                valuePrefix: '~',
                valueExtra: null,
              },
            ]}
            />
          </Collapsible>
        </Box>

        <ActionButton
          onClick={() => importAllProcedure()}
          label={`Withdraw ${collInputValue || ''} Eth`}
          disabled={importDisabled}
          hasPoolDelegatedProxy={true}
          clearInput={()=>setCollInputValue(undefined)}
        />

        <Box direction='row' fill justify='between'>
          <Box alignSelf='start' margin={{ top:'medium' }}>
            <FlatButton 
              onClick={()=>close()}
              label={
                <Box direction='row' gap='medium' align='center'>
                  <ArrowLeft color='text-weak' />
                  <Text size='small' color='text-weak'> cancel, and go back. </Text>
                </Box>
                }
            />
          </Box>  

          { 
          !mobile &&
          <Box alignSelf='end' margin={{ top:'medium' }}>
            {
                  // exportTxActive ?
                  false ?
                    <Box direction='row' gap='small'>
                      <Text size='xsmall' color='text-weak'>
                        <Text weight='bold' color={activeSeries?.seriesColor}>repay</Text> pending
                      </Text>
                      <Loading condition={true} size='xxsmall'>.</Loading>
                    </Box>
                    : 
                    <FlatButton 
                      onClick={()=>console.log('Exporting Yield to Maker')}
                      label={
                        <Box direction='row' gap='small' align='center'>
                          <Text size='xsmall' color='text-weak'>
                            <Text weight='bold' color={activeSeries?.seriesColor}>Export</Text> Yield series debt to Maker
                          </Text>
                        </Box>
                    }
                    />                
                  }
          </Box>
        }
        </Box>
                    
      </Box>}

      {mobile && 
        <YieldMobileNav noMenu={true}>
          <NavLink 
            to="/post"
            style={{ textDecoration: 'none' }}
          >
            <Box direction='row' gap='small'>
              <Text size='xxsmall' color='text-weak'><ArrowLeft /></Text>
              <Text size='xxsmall' color='text-weak'>back</Text>
            </Box>
          </NavLink>
        </YieldMobileNav>}

    </Keyboard>
  );
};

MigrateMaker.defaultProps={ close:null };

export default MigrateMaker;

import React from 'react';
import { Box, Layer } from 'grommet';


import { NotifyContext } from '../contexts/NotifyContext';

interface IAuthorizationProps {
  authsList?: any[];
}

const Authorization = ({ authsList }:IAuthorizationProps) => { 
  const { state: { requestedSigs } } = React.useContext(NotifyContext);
  return (
    requestedSigs.map((x:any, i:number)=> {
      const iKey = i;
      return (
        <Layer key={iKey}> 
          <Box>
            {x.id}
            {x.desc}
            {x.signed}
          </Box>
        </Layer>
      );
    })
  );
};
export default Authorization;

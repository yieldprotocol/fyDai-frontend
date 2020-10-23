import React, { useState, useEffect } from 'react';
import { Box } from 'grommet';
import { 
  FiCheckCircle as Check,
  FiCopy as Copy,
} from 'react-icons/fi';
import { copyToClipboard } from '../utils';


const HashWrap = ({ children, hash } : any) => {

  const [copied, setCopied] = useState<boolean>(false);

  const copy = (e:any) => {
    e.stopPropagation();
    setCopied(true);
    copyToClipboard(hash);
  };

  useEffect(()=>{
    copied && (async () => setTimeout(
      ()=> setCopied(false),
      5000
    ))();
    // return () => setCopied(false);
  }, [copied]);

  return (
    <Box direction='row' gap='small' align='center'>
      {children} 
      <Box
        onClick={(e:any)=> copy(e)}
      >
        {copied? <Check /> : <Copy /> }
      </Box>
    </Box>
  );
};

export default HashWrap;
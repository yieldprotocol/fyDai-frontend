import React, { useEffect } from "react";
import { useWeb3React } from "@web3-react/core";
import { Image, Button, Box } from "grommet";

import { useConnectorImage } from "../hooks/connectionFns";

const ProfileButton = (props: any) => {
  const { account } = useWeb3React();
  const { action } = props;
  const connectorImage = useConnectorImage();
  return (
    <Button
      icon={
        <Box height="15px" width="15px">
          <Image src={connectorImage} fit="contain" />
        </Box>
      }
      label={`${account?.substring(0, 6)}...${account?.substring(
        account.length - 4
      )}`}
      onClick={() => action && action()}
      // style={{ minWidth:'150px' }}
    />
  );
};

export default ProfileButton;

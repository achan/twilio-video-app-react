import React, { ChangeEvent, FormEvent, useState, useEffect } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import TextField from '@material-ui/core/TextField';
import ToggleFullscreenButton from './ToggleFullScreenButton/ToggleFullScreenButton';
import Toolbar from '@material-ui/core/Toolbar';
import Menu from './Menu/Menu';

import { useAppState } from '../../state';
import { useParams } from 'react-router-dom';
import useRoomState from '../../hooks/useRoomState/useRoomState';
import useVideoContext from '../../hooks/useVideoContext/useVideoContext';
import { Typography } from '@material-ui/core';
import FlipCameraButton from './FlipCameraButton/FlipCameraButton';
import { DeviceSelector } from './DeviceSelector/DeviceSelector';
import axios from 'axios';

interface StartVideoResponse {
  token: string;
  room: string;
  roomUuid: string;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      backgroundColor: theme.palette.background.default,
    },
    toolbar: {
      [theme.breakpoints.down('xs')]: {
        padding: 0,
      },
    },
    rightButtonContainer: {
      display: 'flex',
      alignItems: 'center',
      marginLeft: 'auto',
    },
    form: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      [theme.breakpoints.up('md')]: {
        marginLeft: '2.2em',
      },
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      maxWidth: 200,
    },
    loadingSpinner: {
      marginLeft: '1em',
    },
    displayName: {
      margin: '1.1em 0.6em',
      minWidth: '200px',
      fontWeight: 600,
    },
    joinButton: {
      margin: '1em',
    },
  })
);

export default function MenuBar() {
  const classes = useStyles();
  const { URLRoomName } = useParams();
  const { user, getToken, isFetching } = useAppState();
  const { isConnecting, connect } = useVideoContext();
  const roomState = useRoomState();

  const [name, setName] = useState<string>(user?.displayName || '');
  const [roomName, setRoomName] = useState<string>('');
  const [patientToken, setPatientToken] = useState<string>('');

  const isHost = !URLRoomName;

  useEffect(() => {
    if (URLRoomName) {
      setRoomName(URLRoomName);
    }
    console.log({ URLRoomName });
  }, [URLRoomName]);

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handlePatientTokenChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPatientToken(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // If this app is deployed as a twilio function, don't change the URL because routing isn't supported.
    if (isHost) {
      const response = await axios.get<StartVideoResponse>(
        `${process.env.REACT_APP_API_URL}/v1/accounts/video/start/6527f806-3601-4841-80a6-74636fb32215`,
        {
          headers: {
            Accept: 'application/json',
            'Api-Token': 'TY27s2ybsnzejNjL782LWSXE',
            Authorization:
              'Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwiZXhwIjoxNTk0MDY0OTQ4fQ.5i4lz861Id98QWPlPfe7o4yEzJtttqWpcQyP5m0EwWE',
            verify: false,
          },
        }
      );

      connect(response.data.token);
      window.history.replaceState(null, '', window.encodeURI(`/room/${response.data.room}`));
      console.log({ roomUuid: response.data.roomUuid });
    } else {
      connect(patientToken);
    }
  };

  return (
    <AppBar className={classes.container} position="static">
      <Toolbar className={classes.toolbar}>
        {roomState === 'disconnected' ? (
          <form className={classes.form} onSubmit={handleSubmit}>
            {!isHost ? (
              <>
                <TextField
                  id="menu-token"
                  label="Token"
                  className={classes.textField}
                  value={patientToken}
                  onChange={handlePatientTokenChange}
                  margin="dense"
                />
              </>
            ) : (
              <Typography className={classes.displayName} variant="body1"></Typography>
            )}
            <Button
              className={classes.joinButton}
              type="submit"
              color="primary"
              variant="contained"
              disabled={isConnecting || isFetching}
            >
              {isHost ? 'Start an instant video session' : 'Join session'}
            </Button>
            {(isConnecting || isFetching) && <CircularProgress className={classes.loadingSpinner} />}
          </form>
        ) : (
          <h3>{roomName}</h3>
        )}
        <div className={classes.rightButtonContainer}>
          <FlipCameraButton />
          <DeviceSelector />
          <ToggleFullscreenButton />
          <Menu />
        </div>
      </Toolbar>
    </AppBar>
  );
}

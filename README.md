# subdeploy

Subdeploy is a tool for deploying a service to multiple instances via subscription.

> WIP

## Installation

```bash
npm install -g subdeploy
```

### Configuration

Configure following environment variables:

- `SUBDEPLOY_PORT`: port to listen on core server
- `SUBDEPLOY_HOST`: host of the core server
- `SUBDEPLOY_KEY`: key to authorize requests

> Environment variables can also be set on `.env` file of pwd.

Create deploy script files inside deploy-scripts directory.

#### Sample script

```bash
#!/bin/sh
cd "$(dirname "$0")"
cd ../
echo Hello World
```

Make sure to make the script executable.

```bash
chmod +x deploy-scripts/update
```

### Running subdeploy core server

```bash
subdeploy start core
```

### Running subdeploy client

```bash
subdeploy start client
```

### Check logs

```bash
subdeploy log core
subdeploy log client
```

### Stopping core server or client

```bash
subdeploy stop core
subdeploy stop client
```

### Invoke each clients to execute deploy scripts

Make a POST request to following URL

```
POST http://localhost:3000/exec?command=update&key=$SUBDEPLOY_KEY
```

> Fill $SUBDEPLOY_KEY with your own SUBDEPLOY_KEY.

# subdeploy

Subdeploy is a tool for deploying a service to multiple instances via subscription.

### Installation

```bash
$ npm install -g subdeploy
$ subdeploy --help
```

### Architecture

![](https://i.imgur.com/Fh3GQQa.png)

Subdeploy provides two type of instances.

- Core: The core instance opens up a webserver with an API endpoint and websocket.
- Client: The client instance connects to the core server with websocket.

After establishing the connection between the core and the clients, you can invoke every clients to perform a specific task by making a request to the core.

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

Make sure that the script is executable.

```bash
$ chmod +x deploy-scripts/update
```

### CLI

To read the help for CLI commands, run:

```bash
$ subdeploy --help
```

#### Starting an instance

```bash
$ subdeploy start core
$ subdeploy start client
```

#### Stopping an instance

```bash
$ subdeploy stop core
$ subdeploy stop client
```

#### Check status of the instances

```bash
$ subdeploy status
```

#### Check logs of the instance

```bash
$ subdeploy log core
$ subdeploy log client
```

#### Invoke deploy script

```bash
$ subdeploy invoke $scriptName
```

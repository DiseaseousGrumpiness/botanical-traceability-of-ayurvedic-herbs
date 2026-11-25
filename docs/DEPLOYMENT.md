# Deployment assessment and production configuration

## Current deployment status

The application is **not publicly deployed**. The verified endpoints are local to the Windows laptop: Vite on port 5174 and Express on port 3001. The backend's current Fabric connection uses the laptop-local peer endpoint `localhost:7051`. Docker Desktop is on context `desktop-linux`; the existing peer/orderer/CA containers and named ledger volumes are on that laptop.

No deployment target, domain, remote host, SSH target, cloud account, or hosting credential is configured in the repository or available in this session. No paid resource was created. The app cannot continue working after the laptop shuts down while the peer remains on that laptop.

The current Fabric test-network containers publish peer, orderer, and CA ports on all host interfaces. Docker Desktop also has an inbound allow rule for its backend on the Windows Public profile. I did not change firewall rules or recreate these containers. Do not use this setup on a public/untrusted network or expose these ports to the internet. The `-LanDemo` launcher now refuses to run on a Windows Public network profile.

## Recommended target architecture

Use one operator-controlled, always-on Linux host for the existing Fabric network and the application, with:

- the existing peer, orderer, CA identities, channel, chaincode definition, and ledger state preserved on persistent storage;
- the backend attached only to the existing private Fabric Docker network and using the peer DNS name plus the TLS hostname from its certificate;
- the backend API reachable only on the application Docker network;
- the static React frontend behind Caddy, with Caddy as the only public service on ports 80/443 and automatic HTTPS for a domain the operator controls;
- the existing MSP and peer TLS certificate mounted read-only into the backend container;
- no PostgreSQL or IPFS requirement for the currently deployed contract.

An app-only remote host is not sufficient: if it points back to `localhost:7051`, it will query itself; if it points back to the laptop's peer, the service stops when the laptop is off. The current test-network's exact volume and certificate migration procedure is not documented or tested here. Do not copy live peer volumes while running, run `network.sh down`, recreate the channel, regenerate identities, or start a replacement network. A network operator must first prepare and verify a supported backup/restore or migration plan for this exact Fabric deployment.

## Prepared app-container configuration

The following files provide a production app stack that **requires an already-running external Fabric Docker network**. The compose file declares that network as external; it will fail instead of creating a substitute network if it is missing. It publishes only the HTTPS proxy (80/443), keeps the backend un-published, and mounts the existing identity and TLS files read-only.

- `deploy/production.compose.yaml`
- `deploy/Caddyfile`
- `backend/Dockerfile` and `backend/.dockerignore`
- `frontend/Dockerfile.production`, `frontend/.dockerignore`, and `frontend/deploy/nginx.conf`
- `deploy/production.env.example`

The sample domain uses the reserved `.invalid` suffix and is not deployable. The sample auth map is empty, which leaves writes disabled. Do not copy the current Windows `.env` into a server container: its peer endpoint and filesystem paths are host-specific. Create `deploy/production.env` on the server from the example, set its private paths and existing Fabric network details, then configure tokens privately. `/deploy/production.env` is Git-ignored. Never print it, put it in source control, or bake it into an image.

The backend process uses a configured UID/GID so it can read the mounted MSP without running as root. On the server, make the existing MSP directory readable only to that service identity; mount it read-only. Do not widen private-key permissions to make container startup convenient. The peer certificate's hostname must match `FABRIC_PEER_HOST_ALIAS`.

## Deployment commands after the external target is ready

These commands are instructions only; they were **not run** because no target server or safe ledger migration is available:

```bash
cp deploy/production.env.example deploy/production.env
chmod 600 deploy/production.env
# Edit deploy/production.env securely on the server. Do not copy the local .env.

docker network inspect "$(sed -n 's/^FABRIC_NETWORK_NAME=//p' deploy/production.env)"
docker compose --env-file deploy/production.env -f deploy/production.compose.yaml config --quiet
docker compose --env-file deploy/production.env -f deploy/production.compose.yaml build
docker compose --env-file deploy/production.env -f deploy/production.compose.yaml up -d
docker compose --env-file deploy/production.env -f deploy/production.compose.yaml ps
```

Before `up`, an operator must verify the existing Fabric containers are running on that host, the external Docker network exists, the existing ledger volumes are mounted, and Fabric ports are not publicly published. If the current network is not on that server, stop here; this compose file intentionally does not create it.

After deployment, verify through the public TLS URL without printing credentials:

```bash
curl --fail --silent --show-error "https://${APP_DOMAIN}/health"
curl --fail --silent --show-error "https://${APP_DOMAIN}/api/batches"
```

The first response must report API `2.1.0` and `fabricConnected: true`; the batch request must return the actual ledger list. Do not call any write route during deployment verification. Back up the Fabric ledger volumes and Caddy's `/data` volume using a documented, tested operator process. The app compose stack does not manage or delete Fabric volumes.

## Public deployment gate

The current local bearer-token prototype has no expiry or revocation, quality changes do not record a human inspector, consumer APIs expose submitted batch fields including coordinates, and the Fabric test-network ports are currently wildcard-published. Those conditions are not acceptable for an unrestricted public deployment. HTTPS in the prepared Caddy stack does not resolve them. Keep public access blocked until authentication, data disclosure, and Fabric network isolation have been reviewed and approved.

The single external prerequisite for continuing deployment work is an authorized, always-on server target under the project owner's control that can host the existing Fabric ledger persistently and provide private Docker-network access, along with a DNS name controlled by the operator. No such target was available, so no public URL exists and no deployment was claimed.
